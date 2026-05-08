import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { SkeletonCard } from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';

function CreateProjectModal({ onClose, onCreated }) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading]         = useState(false);
  const { addToast }                  = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/projects', {
        name: name.trim(),
        description: description.trim() || null,
      });
      addToast({ message: 'Project created successfully', type: 'success' });
      onCreated(res.data);
    } catch (err) {
      addToast({ message: err.response?.data?.error || 'Failed to create project', type: 'error' });
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-card w-full max-w-md shadow-modal animate-fade-in">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">New Project</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl leading-none">&times;</button>
        </div>
        <form id="create-project-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              rows={3}
              placeholder="What is this project about?"
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150 resize-none overflow-hidden"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-sans font-medium text-ink/60 hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const { addToast }                  = useToast();

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data);
      } catch (err) {
        addToast({ message: 'Failed to load projects', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [addToast]);

  function handleProjectCreated(newProject) {
    setProjects([newProject, ...projects]);
    setShowCreate(false);
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-ink">Projects</h1>
          <button
            id="open-create-project-btn"
            onClick={() => setShowCreate(true)}
            className="bg-terracotta text-white text-sm font-sans font-medium px-4 py-2 rounded-input hover:bg-terracotta/90 transition-colors"
          >
            New Project
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border rounded-card">
            <svg className="mx-auto h-12 w-12 text-terracotta/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 className="font-serif text-xl text-ink">No projects yet</h2>
            <p className="font-sans text-sm text-ink/45 mt-1 mb-6">Create your first project and invite your team</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm font-sans font-medium text-terracotta hover:text-terracotta/80 transition-colors"
            >
              Create a project &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((p, index) => {
              const delayStyle = { animationDelay: `${Math.min(index * 60, 400)}ms` };
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="group bg-surface border border-border rounded-card p-5 shadow-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col h-full min-h-[160px] animate-fade-in"
                  style={delayStyle}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-serif text-xl text-ink group-hover:text-terracotta transition-colors line-clamp-1">
                      {p.name}
                    </h2>
                    <span className="text-[10px] font-sans uppercase tracking-wider bg-sand px-2 py-1 rounded-badge text-ink/50 ml-2 flex-shrink-0">
                      {p.role}
                    </span>
                  </div>
                  
                  <p className="text-sm font-sans text-ink/60 line-clamp-2 mb-auto">
                    {p.description || <span className="italic text-ink/30">No description</span>}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-xs font-sans text-ink/40">
                      Created {new Date(p.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-sans font-medium text-terracotta opacity-0 group-hover:opacity-100 transition-opacity">
                      Open &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
