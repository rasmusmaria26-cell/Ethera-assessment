import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Navbar from '../components/Navbar.jsx';
import MemberList from '../components/MemberList.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { SkeletonTaskCard } from '../components/Skeleton.jsx';

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, isAdmin, currentUserId, members, onUpdated, onDeleted, loading }) {
  const styles = {
    todo:       { borderTop: 'border-t-[#d1d5db]', dot: 'bg-gray-400', label: 'Todo' },
    inprogress: { borderTop: 'border-t-terracotta/60', dot: 'bg-terracotta', label: 'In Progress' },
    done:       { borderTop: 'border-t-[#22c55e]/60', dot: 'bg-green-600', label: 'Done' },
  };
  const style = styles[status] || styles.todo;

  return (
    <div className={`flex flex-col gap-3 bg-sand/60 p-4 rounded-card min-h-[500px] border-t-2 ${style.borderTop}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
          <span className="text-sm font-sans font-medium text-ink">{style.label}</span>
        </div>
        {!loading && (
          <span className="text-xs font-sans font-medium text-ink/50 bg-white border border-border px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        )}
      </div>
      <div className="kanban-col flex flex-col gap-3">
        {loading ? (
          <>
            <SkeletonTaskCard />
            <SkeletonTaskCard />
          </>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-sans text-ink/30 italic">Empty</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              members={members}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── ProjectDetail page ───────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const { addToast }  = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdmin = project?.currentUserRole === 'admin';

  function handleTaskCreated(newTask) {
    setTasks((prev) => [newTask, ...prev]);
    setShowModal(false);
  }

  function handleTaskUpdated(updatedTask) {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }

  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const byStatus = {
    todo:       tasks.filter((t) => t.status === 'todo'),
    inprogress: tasks.filter((t) => t.status === 'inprogress'),
    done:       tasks.filter((t) => t.status === 'done'),
  };

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

  return (
    <div className={`min-h-screen bg-cream ${showModal ? 'drawer-open' : ''}`}>
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-sans text-ink/40 mb-6">
          <Link to="/projects" className="hover:text-ink transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-ink">{project?.name || 'Loading...'}</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            {loading ? (
              <>
                <div className="shimmer rounded-[4px] w-64 h-8 mb-2"></div>
                <div className="shimmer rounded-[4px] w-96 h-4"></div>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl text-ink mb-1">{project?.name}</h1>
                {project?.description && (
                  <p className="text-sm font-sans text-ink/55 max-w-xl">{project.description}</p>
                )}
              </>
            )}
          </div>
          
          {!loading && (
            <div className="flex items-center gap-3 flex-shrink-0 animate-fade-in">
              <Link
                to={`/projects/${id}/dashboard`}
                id="view-dashboard-link"
                className="text-sm font-sans text-ink/60 hover:text-ink border border-border bg-surface shadow-sm rounded-input px-3 py-2 transition-colors"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <button
                  id="open-create-task-btn"
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-terracotta text-white text-sm font-sans font-medium px-4 py-2 rounded-input hover:bg-terracotta/90 transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                  New Task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Kanban board */}
          <div className="order-2 lg:order-1">
            {!loading && tasks.length === 0 && !isAdmin && (
              <div className="text-center py-16 bg-sand/30 border border-border rounded-card">
                <p className="text-ink/40 font-sans text-sm">No tasks assigned yet</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(['todo', 'inprogress', 'done']).map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={loading ? [] : byStatus[status]}
                  loading={loading}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  members={project?.members || []}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                />
              ))}
            </div>
          </div>

          {/* Members sidebar */}
          <div className="order-1 lg:order-2 lg:self-start">
            {!loading && (
              <MemberList
                members={project?.members || []}
                isAdmin={isAdmin}
                projectId={id}
                currentUserId={user?.id}
                onMembersChanged={fetchData}
              />
            )}
          </div>
        </div>
      </main>

      {showModal && isAdmin && (
        <TaskModal
          projectId={id}
          members={project?.members || []}
          onCreated={handleTaskCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
