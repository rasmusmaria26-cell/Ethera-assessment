import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import MemberList from '../components/MemberList.jsx';
import TaskCard from '../components/TaskCard.jsx';
import TaskModal from '../components/TaskModal.jsx';

// ─── Column header pill ───────────────────────────────────────────────────────

function StatusPill({ status }) {
  const styles = {
    todo:       'bg-gray-100 text-gray-600',
    inprogress: 'bg-terracotta/10 text-terracotta',
    done:       'bg-green-50 text-green-700',
  };
  const labels = { todo: 'Todo', inprogress: 'In Progress', done: 'Done' };
  return (
    <span className={`text-xs font-sans font-medium px-2.5 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, isAdmin, currentUserId, members, onUpdated, onDeleted }) {
  return (
    <div className="flex flex-col gap-3 bg-sand/60 p-4 rounded-card min-h-[500px]">
      <div className="flex items-center justify-between mb-2">
        <StatusPill status={status} />
        <span className="text-xs font-sans font-medium text-ink/40 bg-white/50 px-2 py-0.5 rounded-full">{tasks.length} tasks</span>
      </div>
      <div className="kanban-col flex flex-col gap-3">
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-sans text-ink/30 italic">Empty</p>
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
            members={members}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}

// ─── ProjectDetail page ───────────────────────────────────────────────────────

export default function ProjectDetail() {
  const { id }        = useParams();
  const { user }      = useAuth();

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

  // Task CRUD callbacks
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

  // Group tasks by status
  const byStatus = {
    todo:       tasks.filter((t) => t.status === 'todo'),
    inprogress: tasks.filter((t) => t.status === 'inprogress'),
    done:       tasks.filter((t) => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <span className="text-ink/40 font-sans text-sm">Loading project…</span>
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

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-sans text-ink/40 mb-6">
          <Link to="/projects" className="hover:text-ink transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-ink">{project?.name}</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink mb-1">{project?.name}</h1>
            {project?.description && (
              <p className="text-sm font-sans text-ink/55 max-w-xl">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to={`/projects/${id}/dashboard`}
              id="view-dashboard-link"
              className="text-sm font-sans text-ink/60 hover:text-ink border border-border
                         rounded-input px-3 py-2 transition-colors"
            >
              Dashboard
            </Link>
            {isAdmin && (
              <button
                id="open-create-task-btn"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-terracotta text-white text-sm font-sans
                           font-medium px-4 py-2 rounded-input hover:bg-terracotta/90 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                New Task
              </button>
            )}
          </div>
        </div>

        {/* Two-column layout: members left, kanban right */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Members sidebar */}
          <div className="lg:self-start">
            <MemberList
              members={project?.members || []}
              isAdmin={isAdmin}
              projectId={id}
              currentUserId={user?.id}
              onMembersChanged={fetchData}
            />
          </div>

          {/* Kanban board */}
          <div>
            {tasks.length === 0 && !isAdmin && (
              <div className="text-center py-16">
                <p className="text-ink/35 font-sans text-base">No tasks yet</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(['todo', 'inprogress', 'done']).map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={byStatus[status]}
                  isAdmin={isAdmin}
                  currentUserId={user?.id}
                  members={project?.members || []}
                  onUpdated={handleTaskUpdated}
                  onDeleted={handleTaskDeleted}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Task create modal (admin only) */}
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
