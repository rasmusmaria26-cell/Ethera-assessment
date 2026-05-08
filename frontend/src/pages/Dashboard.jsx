import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';

export default function Dashboard() {
  const { id }          = useParams();
  const [stats, setStats]       = useState(null);
  const [projectName, setName]  = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/projects/${id}/dashboard`),
      api.get(`/api/projects/${id}`),
    ])
      .then(([dashRes, projRes]) => {
        setStats(dashRes.data);
        setName(projRes.data.name);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <span className="text-ink/40 font-sans text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-red-600 font-sans text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const completionRate =
    stats.total_tasks > 0
      ? Math.round((stats.by_status.done / stats.total_tasks) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-sans text-ink/40 mb-6">
          <Link to="/projects" className="hover:text-ink transition-colors">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${id}`} className="hover:text-ink transition-colors">{projectName}</Link>
          <span>/</span>
          <span className="text-ink">Dashboard</span>
        </nav>

        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink mb-1">Dashboard</h1>
            <p className="text-sm font-sans text-ink/50">{projectName}</p>
          </div>
          <Link
            to={`/projects/${id}`}
            id="back-to-project-link"
            className="text-sm font-sans text-ink/60 hover:text-ink border border-border
                       rounded-input px-3 py-2 transition-colors"
          >
            ← Back to Board
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tasks"  value={stats.total_tasks} />
          <StatCard label="Todo"         value={stats.by_status.todo} />
          <StatCard label="In Progress"  value={stats.by_status.inprogress} accent="text-terracotta" />
          <StatCard label="Done"         value={stats.by_status.done}       accent="text-green-700" />
        </div>

        {/* Overdue + Completion row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Overdue */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <span className={`text-3xl font-serif font-semibold ${stats.overdue_count > 0 ? 'text-red-600' : 'text-ink'}`}>
              {stats.overdue_count}
            </span>
            <p className="text-xs font-sans text-ink/55 uppercase tracking-wide mt-1">Overdue</p>
            {stats.overdue_count > 0 && (
              <p className="text-xs font-sans text-red-500 mt-2">
                {stats.overdue_count} task{stats.overdue_count !== 1 ? 's' : ''} past due date
              </p>
            )}
          </div>

          {/* Completion */}
          <div className="bg-surface border border-border rounded-card p-5 shadow-card">
            <span className="text-3xl font-serif font-semibold text-ink">{completionRate}%</span>
            <p className="text-xs font-sans text-ink/55 uppercase tracking-wide mt-1">Completion Rate</p>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Per-user task table */}
        {stats.by_user.length > 0 && (
          <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-base text-ink">Tasks by Team Member</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-sans font-medium text-ink/50 px-5 py-3 uppercase tracking-wide">
                    Member
                  </th>
                  <th className="text-right text-xs font-sans font-medium text-ink/50 px-5 py-3 uppercase tracking-wide">
                    Assigned Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.by_user.map((u) => (
                  <tr key={u.user_id} className="hover:bg-sand transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full bg-terracotta/15 text-terracotta font-medium
                                     flex items-center justify-center text-xs font-sans flex-shrink-0"
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-sans text-ink">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-sans font-medium text-ink">
                        {u.task_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats.by_user.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink/35 font-sans text-sm">No tasks assigned to team members yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
