import { Router } from 'express';
import pool from '../db/pool.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// ─── GET /api/projects ────────────────────────────────────────────────────────
// List all projects the authenticated user is a member of (with their role)

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.description, p.created_by, p.created_at, pm.role
       FROM projects p
       JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error('GET /projects error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/projects ───────────────────────────────────────────────────────
// Create a project and auto-add creator as admin (atomic transaction)

router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: projectRows } = await client.query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, created_by, created_at`,
      [name.trim(), description?.trim() || null, req.user.id]
    );
    const project = projectRows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'admin')`,
      [project.id, req.user.id]
    );

    await client.query('COMMIT');

    return res.status(201).json({ ...project, role: 'admin' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /projects error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ─── GET /api/projects/:id ────────────────────────────────────────────────────
// Project detail + members list. User must be a member.

router.get('/:id', requireRole('member'), async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: projectRows } = await pool.query(
      `SELECT id, name, description, created_by, created_at
       FROM projects WHERE id = $1`,
      [id]
    );
    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectRows[0];

    const { rows: members } = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at ASC`,
      [id]
    );

    return res.json({ ...project, members, currentUserRole: req.membership.role });
  } catch (err) {
    console.error('GET /projects/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/projects/:id/members ───────────────────────────────────────────
// Add a member by email (admin only)

router.post('/:id/members', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const normalizedRole = role === 'admin' ? 'admin' : 'member';

    // Find user by email
    const { rows: userRows } = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }
    const targetUser = userRows[0];

    // Check if already a member
    const { rows: existing } = await pool.query(
      'SELECT user_id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, targetUser.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This user is already a member of the project' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [id, targetUser.id, normalizedRole]
    );

    return res.status(201).json({ user_id: targetUser.id, name: targetUser.name, email: targetUser.email, role: normalizedRole });
  } catch (err) {
    console.error('POST /projects/:id/members error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/projects/:id/members/:userId ─────────────────────────────────
// Remove a member (admin only). Cannot remove the last admin.

router.delete('/:id/members/:userId', requireRole('admin'), async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Verify the target is a member
    const { rows: memberRows } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberRows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this project' });
    }

    // Prevent removing the last admin
    if (memberRows[0].role === 'admin') {
      const { rows: adminCount } = await pool.query(
        `SELECT COUNT(*) AS count FROM project_members
         WHERE project_id = $1 AND role = 'admin'`,
        [id]
      );
      if (parseInt(adminCount[0].count, 10) <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin from the project' });
      }
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    return res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('DELETE /projects/:id/members/:userId error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
