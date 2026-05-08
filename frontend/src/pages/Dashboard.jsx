import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';
import { SkeletonStatCard } from '../components/Skeleton.jsx';

export default function Dashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get(`/api/projects/${id}/dashboard`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [id]);

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

  // Calculate completion percentage safely
  const completed = data?.by_status.done || 0;
  const total = data?.total_tasks || 0;
  const completionPercentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-sans text-ink/40 mb-6">
          <Link to="/projects" className="hover:text-ink transition-colors">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${id}`} className="hover:text-ink transition-colors">Project</Link>
          <span>/</span>
          <span className="text-ink">Dashboard</span>
        </nav>

        <h1 className="font-serif text-3xl text-ink mb-8">Project Analytics</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              <StatCard label="Total Tasks" value={data.total_tasks} />
              <StatCard label="To Do" value={data.by_status.todo} leftAccentColor="#d1d5db" />
              <StatCard label="In Progress" value={data.by_status.inprogress} leftAccentColor="#c2643f" />
              <StatCard label="Done" value={data.by_status.done} leftAccentColor="#22c55e" />
              <StatCard label="Overdue" value={data.overdue_count} leftAccentColor="#c0604a" />
            </div>

            {/* Main Visualizations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Progress Panel */}
              <div className="bg-surface rounded-card p-6 border border-border shadow-card animate-slide-up">
                <h3 className="font-serif text-lg text-ink mb-4">Overall Completion</h3>
                <div className="flex items-end gap-3 mb-3">
                  <span className="font-sans text-4xl font-medium text-ink">{completionPercentage}%</span>
                  <span className="font-sans text-sm text-ink/50 mb-1">
                    {completed} of {total} tasks
                  </span>
                </div>
                {/* Progress bar container */}
                <div className="h-3 w-full bg-sand rounded-full overflow-hidden">
                  <div
                    className="h-full bg-terracotta transition-all duration-1000 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Workload / Productivity Panel */}
              <div className="bg-surface rounded-card p-6 border border-border shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
                <h3 className="font-serif text-lg text-ink mb-4">Member Workload</h3>
                
                {data.by_user.length === 0 ? (
                  <p className="text-sm font-sans text-ink/40 italic">No tasks assigned yet.</p>
                ) : (
                  <div className="space-y-4">
                    {data.by_user.map((m) => {
                      const mTotal = m.task_count;
                      const percentage = total === 0 ? 0 : (mTotal / total) * 100;

                      return (
                        <div key={m.user_id}>
                          <div className="flex justify-between text-xs font-sans text-ink/70 mb-1">
                            <span>{m.name}</span>
                            <span>{mTotal} tasks</span>
                          </div>
                          <div className="h-2 w-full bg-sand rounded-full flex overflow-hidden">
                            <div className="bg-ink/40 transition-all duration-700" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
