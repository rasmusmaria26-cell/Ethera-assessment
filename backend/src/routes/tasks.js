import { Router } from 'express';
import pool from '../db/pool.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['todo', 'inprogress', 'done'];

// ─── GET /api/projects/:projectId/tasks ───────────────────────────────────────
// List all tasks in a project. User must be a project member.

router.get('/projects/:projectId/tasks', requireRole('member'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigned_to } = req.query;

    let query = `
      SELECT
        t.id, t.title, t.description, t.due_date, t.priority, t.status,
        t.created_at, t.project_id,
        json_build_object('id', a.id, 'name', a.name, 'email', a.email) AS assigned_to,
        json_build_object('id', c.id, 'name', c.name) AS created_by
      FROM tasks t
      LEFT JOIN users a ON a.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1
    `;
    const params = [projectId];
    let idx = 2;

    if (status && VALID_STATUSES.includes(status)) {
      query += ` AND t.status = $${idx++}`;
      params.push(status);
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      query += ` AND t.priority = $${idx++}`;
      params.push(priority);
    }
    if (assigned_to) {
      query += ` AND t.assigned_to = $${idx++}`;
      params.push(assigned_to);
    }

    query += ' ORDER BY t.created_at DESC';

    const { rows } = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error('GET /projects/:projectId/tasks error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/projects/:projectId/tasks ──────────────────────────────────────
// Create a task (admin only)

router.post('/projects/:projectId/tasks', requireRole('admin'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, due_date, priority, assigned_to } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    // If assigned_to provided, verify they are a project member
    if (assigned_to) {
      const { rows: memberCheck } = await pool.query(
        'SELECT user_id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, assigned_to]
      );
      if (memberCheck.length === 0) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, project_id, title, description, due_date, priority, status, assigned_to, created_by, created_at`,
      [
        projectId,
        title.trim(),
        description?.trim() || null,
        due_date || null,
        priority || 'medium',
        assigned_to || null,
        req.user.id,
      ]
    );

    // Return with joined user objects
    const { rows: fullTask } = await pool.query(
      `SELECT
        t.id, t.title, t.description, t.due_date, t.priority, t.status,
        t.created_at, t.project_id,
        json_build_object('id', a.id, 'name', a.name, 'email', a.email) AS assigned_to,
        json_build_object('id', c.id, 'name', c.name) AS created_by
      FROM tasks t
      LEFT JOIN users a ON a.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1`,
      [rows[0].id]
    );

    return res.status(201).json(fullTask[0]);
  } catch (err) {
    console.error('POST /projects/:projectId/tasks error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/tasks/:id ───────────────────────────────────────────────────────
// Update a task. Field-level RBAC:
//   admin  → can update all fields
//   member → can only update status, and only if assigned to them

router.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch task and verify it exists + get its project
    const { rows: taskRows } = await pool.query(
      `SELECT t.*, t.assigned_to AS assigned_to_id
       FROM tasks t WHERE t.id = $1`,
      [id]
    );
    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskRows[0];

    // Verify user is a member of the task's project
    const { rows: memberRows } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, req.user.id]
    );
    if (memberRows.length === 0) {
      return res.status(403).json({ error: 'Not a project member' });
    }
    const { role } = memberRows[0];

    if (role === 'member') {
      // Member can only update status of tasks assigned to them
      if (task.assigned_to_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Only the status field may be updated by members' });
      }
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      const { rows: updated } = await pool.query(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      const { rows: fullTask } = await pool.query(
        `SELECT
          t.id, t.title, t.description, t.due_date, t.priority, t.status,
          t.created_at, t.project_id,
          json_build_object('id', a.id, 'name', a.name, 'email', a.email) AS assigned_to,
          json_build_object('id', c.id, 'name', c.name) AS created_by
        FROM tasks t
        LEFT JOIN users a ON a.id = t.assigned_to
        LEFT JOIN users c ON c.id = t.created_by
        WHERE t.id = $1`,
        [updated[0].id]
      );

      return res.json(fullTask[0]);
    }

    // Admin — can update all fields
    const { title, description, due_date, priority, status, assigned_to } = req.body;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (assigned_to) {
      const { rows: memberCheck } = await pool.query(
        'SELECT user_id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.project_id, assigned_to]
      );
      if (memberCheck.length === 0) {
        return res.status(400).json({ error: 'Assigned user is not a member of this project' });
      }
    }

    // Build dynamic update
    const fields = [];
    const vals = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); vals.push(title.trim()); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); vals.push(description?.trim() || null); }
    if (due_date !== undefined) { fields.push(`due_date = $${idx++}`); vals.push(due_date || null); }
    if (priority !== undefined) { fields.push(`priority = $${idx++}`); vals.push(priority); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); vals.push(status); }
    if (assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); vals.push(assigned_to || null); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    vals.push(id);
    await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}`, vals);

    const { rows: fullTask } = await pool.query(
      `SELECT
        t.id, t.title, t.description, t.due_date, t.priority, t.status,
        t.created_at, t.project_id,
        json_build_object('id', a.id, 'name', a.name, 'email', a.email) AS assigned_to,
        json_build_object('id', c.id, 'name', c.name) AS created_by
      FROM tasks t
      LEFT JOIN users a ON a.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1`,
      [id]
    );

    return res.json(fullTask[0]);
  } catch (err) {
    console.error('PUT /tasks/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
// Delete a task (admin only)

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch task
    const { rows: taskRows } = await pool.query(
      'SELECT project_id FROM tasks WHERE id = $1',
      [id]
    );
    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check admin role
    const { rows: memberRows } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [taskRows[0].project_id, req.user.id]
    );
    if (memberRows.length === 0) {
      return res.status(403).json({ error: 'Not a project member' });
    }
    if (memberRows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('DELETE /tasks/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
