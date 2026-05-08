import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }) {
  const isAdmin = project.role === 'admin';
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-surface border border-border rounded-card p-5 shadow-card
                 hover:bg-sand transition-colors group"
      id={`project-card-${project.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="font-sans font-medium text-ink text-base leading-snug group-hover:text-terracotta transition-colors">
          {project.name}
        </h2>
        <span
          className={`flex-shrink-0 text-xs font-sans font-medium px-2 py-0.5 rounded-badge ${
            isAdmin
              ? 'bg-terracotta/10 text-terracotta'
              : 'bg-ink/8 text-ink/50'
          }`}
        >
          {isAdmin ? 'Admin' : 'Member'}
        </span>
      </div>
      {project.description ? (
        <p className="text-sm text-ink/55 font-sans line-clamp-2">{project.description}</p>
      ) : (
        <p className="text-sm text-ink/30 font-sans italic">No description</p>
      )}
      <div className="mt-3 text-xs text-ink/35 font-sans">
        Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </Link>
  );
}

// ─── Create Project Modal ─────────────────────────────────────────────────────

function CreateProjectModal({ onCreated, onClose }) {
  const [name, setName]             = useState('');
  const [description, setDesc]      = useState('');
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/api/projects', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-card shadow-modal w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">New Project</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl leading-none">×</button>
        </div>
        <form id="create-project-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-xs font-sans font-medium text-ink/60 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Website Redesign"
              className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                         text-ink bg-cream placeholder:text-ink/30"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="project-desc" className="block text-xs font-sans font-medium text-ink/60 mb-1">
              Description
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What's this project about?"
              className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                         text-ink bg-cream placeholder:text-ink/30 resize-none"
            />
          </div>
          {error && <p className="text-red-600 text-sm font-sans">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-sans text-ink/60 hover:text-ink border border-border rounded-input"
            >
              Cancel
            </button>
            <button
              id="create-project-submit"
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input
                         hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Projects page ────────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api
      .get('/api/projects')
      .then((res) => setProjects(res.data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(newProject) {
    setProjects((prev) => [newProject, ...prev]);
    setShowCreate(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink mb-1">Projects</h1>
            <p className="text-sm font-sans text-ink/50">Your workspaces and collaborations</p>
          </div>
          <button
            id="open-create-project-btn"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-terracotta text-white text-sm font-sans
                       font-medium px-4 py-2 rounded-input hover:bg-terracotta/90 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Project
          </button>
        </div>

        {/* State */}
        {loading && (
          <p className="text-ink/40 font-sans text-sm text-center py-16">Loading projects…</p>
        )}
        {!loading && error && (
          <p className="text-red-600 font-sans text-sm text-center py-8">{error}</p>
        )}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-ink/35 font-sans text-base mb-2">No projects yet</p>
            <p className="text-ink/25 font-sans text-sm">
              Create your first project to get started
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
