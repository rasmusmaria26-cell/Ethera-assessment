import pool from '../db/pool.js';

/**
 * requireRole(requiredRole) → Express middleware factory
 *
 * Reads :projectId from req.params (must be present in the route).
 * Queries project_members for the authenticated user.
 * - If not a member → 403
 * - If requiredRole === 'admin' and user is not admin → 403
 * - Otherwise attaches req.membership = { role } and calls next()
 *
 * Usage:
 *   router.post('/:id/members', requireRole('admin'), handler)
 */
export function requireRole(requiredRole) {
  return async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID missing in request' });
    }

    try {
      const { rows } = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'Not a project member' });
      }

      const membership = rows[0];

      if (requiredRole === 'admin' && membership.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.membership = membership;
      next();
    } catch (err) {
      console.error('requireRole error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * requireMembership — like requireRole but accepts any member role
 */
export function requireMembership(req, res, next) {
  return requireRole('member')(req, res, next);
}
