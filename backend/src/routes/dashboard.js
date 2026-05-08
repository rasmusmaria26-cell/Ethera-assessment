import { Router } from 'express';
import pool from '../db/pool.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

// ─── GET /api/projects/:id/dashboard ─────────────────────────────────────────
// Returns aggregate stats for a project. Any member may access.
// Uses two SQL queries (aggregates + per-user counts).

router.get('/:id/dashboard', requireRole('member'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify project exists
    const { rows: projectCheck } = await pool.query(
      'SELECT id FROM projects WHERE id = $1',
      [id]
    );
    if (projectCheck.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Query 1 — aggregate stats with conditional COUNT FILTER
    const { rows: statsRows } = await pool.query(
      `SELECT
        COUNT(*)                                               AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'todo')               AS todo,
        COUNT(*) FILTER (WHERE status = 'inprogress')         AS inprogress,
        COUNT(*) FILTER (WHERE status = 'done')               AS done,
        COUNT(*) FILTER (
          WHERE due_date < CURRENT_DATE AND status != 'done'
        )                                                      AS overdue_count
       FROM tasks
       WHERE project_id = $1`,
      [id]
    );

    const stats = statsRows[0];

    // Query 2 — task count per assigned user
    const { rows: byUser } = await pool.query(
      `SELECT
        u.id   AS user_id,
        u.name AS name,
        COUNT(t.id) AS task_count
       FROM tasks t
       JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1
       GROUP BY u.id, u.name
       ORDER BY task_count DESC`,
      [id]
    );

    return res.json({
      total_tasks:  parseInt(stats.total_tasks, 10),
      by_status: {
        todo:       parseInt(stats.todo, 10),
        inprogress: parseInt(stats.inprogress, 10),
        done:       parseInt(stats.done, 10),
      },
      overdue_count: parseInt(stats.overdue_count, 10),
      by_user: byUser.map((row) => ({
        user_id:    row.user_id,
        name:       row.name,
        task_count: parseInt(row.task_count, 10),
      })),
    });
  } catch (err) {
    console.error('GET /projects/:id/dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
