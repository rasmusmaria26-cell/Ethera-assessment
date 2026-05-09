import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ACCENT_COLORS = [
  '#c2643f', // terracotta
  '#5c7a6b', // sage
  '#7b6ba8', // lavender
  '#b07d3a', // amber
  '#3a6b8a', // steel
  '#8a3a5c', // rose
];

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
  const [projects, setProjects]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showCreate, setShowCreate]         = useState(false);
  const [selectedId, setSelectedId]         = useState(null);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  
  const cache       = useRef({});
  const hoverTimer  = useRef(null);
  const { addToast } = useToast();
  const navigate    = useNavigate();

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

  const fetchProjectDetail = async (id) => {
    if (cache.current[id]) {
      setHoveredProject(cache.current[id]);
      return;
    }

    setLoadingDetail(true);
    try {
      const [detailRes, statsRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/dashboard`),
      ]);
      const combined = { ...detailRes.data, stats: statsRes.data };
      cache.current[id] = combined;
      setHoveredProject(combined);
    } catch (err) {
      console.error('Failed to fetch project detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleHover = (id) => {
    if (selectedId === id) return;
    setSelectedId(id);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    
    hoverTimer.current = setTimeout(() => {
      fetchProjectDetail(id);
    }, 120);
  };

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowCreate(false);
    setSelectedId(newProject.id);
    fetchProjectDetail(newProject.id);
  };

  const getAccentColor = (id) => {
    if (!id) return ACCENT_COLORS[0];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ACCENT_COLORS[hash % ACCENT_COLORS.length];
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-terracotta/10">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)] min-h-[600px]">
          
          {/* LEFT PANEL: PROJECT LIST (35%) */}
          <section className="w-full lg:w-[35%] flex flex-col border border-border rounded-card bg-surface overflow-hidden shadow-card">
            <div className="p-5 border-b border-border flex items-center justify-between bg-sand/30">
              <h2 className="font-serif text-lg text-ink font-bold">Your Projects</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-terracotta text-white text-[11px] uppercase tracking-widest font-sans font-bold px-3 py-2 rounded-badge hover:bg-terracotta/90 transition-all hover:shadow-md"
              >
                + New Project
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-smooth relative custom-scrollbar">
              {loading ? (
                <div className="p-6 space-y-4 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-16 bg-cream rounded-card" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="font-sans text-sm text-ink/40 italic">No projects found.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {projects.map((p) => {
                    const isSelected = selectedId === p.id;
                    const accent = getAccentColor(p.id);
                    return (
                      <li
                        key={p.id}
                        onMouseEnter={() => handleHover(p.id)}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className={`group cursor-pointer transition-all duration-150 relative ${
                          isSelected ? 'bg-sand/20' : 'hover:bg-cream/50'
                        }`}
                      >
                        {/* Selector Indicator */}
                        {isSelected && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-[3px]" 
                            style={{ backgroundColor: accent }}
                          />
                        )}
                        
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                            <h3 className={`text-[16px] font-sans font-medium transition-colors ${
                              isSelected ? 'text-ink' : 'text-ink/70 group-hover:text-ink'
                            }`}>
                              {p.name}
                            </h3>
                            <span className="text-[9px] font-bold uppercase tracking-tighter bg-sand px-1.5 py-0.5 rounded-badge text-ink/40">
                              {p.role}
                            </span>
                          </div>
                          <p className="text-[12px] font-sans text-ink/40 pl-5">
                            {p.task_count || '0'} tasks
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {/* Bottom Fade Mask */}
              <div className="sticky bottom-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
            </div>
          </section>

          {/* RIGHT PANEL: SPOTLIGHT (65%) */}
          <section className="hidden lg:flex flex-1 border border-border rounded-card bg-surface shadow-card overflow-hidden relative">
            {!selectedId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <h2 className="font-serif text-[48px] text-ink/15 mb-2 select-none animate-slide-up">Select a project</h2>
                <p className="font-sans text-[13px] text-ink/30 uppercase tracking-widest animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Hover over a project in the list to preview details.
                </p>
              </div>
            ) : (
              <div className={`flex-1 p-12 relative flex flex-col transition-all duration-200 ${loadingDetail ? 'opacity-50 grayscale-[0.5]' : 'opacity-100'}`}>
                {/* Decorative Accent Circle */}
                <div 
                  className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[80px] pointer-events-none opacity-[0.12]"
                  style={{ backgroundColor: hoveredProject ? getAccentColor(hoveredProject.id) : 'transparent' }}
                />

                {hoveredProject && (
                  <div className="relative animate-fade-in">
                    {/* TOP SECTION */}
                    <div className="mb-12 border-l-4 pl-6" style={{ borderColor: getAccentColor(hoveredProject.id) }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-terracotta">
                          Project Detail
                        </span>
                        <span className="px-2 py-0.5 bg-sand rounded-badge text-[10px] font-bold text-ink/50 uppercase">
                          {hoveredProject.currentUserRole || hoveredProject.role}
                        </span>
                      </div>
                      <h1 className="font-serif text-[42px] leading-tight text-ink font-bold mb-4">
                        {hoveredProject.name}
                      </h1>
                      <p className="font-sans text-[15px] text-ink/60 max-w-xl leading-relaxed line-clamp-3 mb-6">
                        {hoveredProject.description || 'No description provided for this project.'}
                      </p>
                      <Link 
                        to={`/projects/${hoveredProject.id}`}
                        className="inline-flex items-center text-terracotta font-sans font-bold text-sm group"
                      >
                        Open Project 
                        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>

                    {/* STATS STRIP */}
                    <div className="grid grid-cols-3 gap-12 mb-12 py-8 border-y border-border/50">
                      <div>
                        <div className="font-serif text-[32px] text-ink mb-1">
                          {hoveredProject.stats?.total_tasks || 0}
                        </div>
                        <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink/40">
                          Total Tasks
                        </div>
                      </div>
                      <div className="border-x border-border/50 px-12">
                        <div className="font-serif text-[32px] text-ink mb-1">
                          {hoveredProject.members?.length || 0}
                        </div>
                        <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink/40">
                          Team Members
                        </div>
                      </div>
                      <div>
                        <div className="font-serif text-[32px] text-ink mb-1">
                          {new Date(hoveredProject.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-ink/40">
                          Created
                        </div>
                      </div>
                    </div>

                    {/* TEAM SECTION */}
                    <div className="mb-10">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 mb-4">Team</h3>
                      <div className="flex -space-x-3 overflow-hidden">
                        {hoveredProject.members?.slice(0, 6).map((m, i) => (
                          <div 
                            key={m.id}
                            title={m.name}
                            className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-[11px] font-bold text-white shadow-sm ring-1 ring-border/50"
                            style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {hoveredProject.members?.length > 6 && (
                          <div className="w-8 h-8 rounded-full bg-sand border-2 border-surface flex items-center justify-center text-[10px] font-bold text-ink/40 ring-1 ring-border/50">
                            +{hoveredProject.members.length - 6}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PROGRESS SECTION */}
                    <div className="mb-12">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-ink/40 mb-4">Progress</h3>
                      {hoveredProject.stats?.total_tasks > 0 ? (
                        <div className="space-y-4">
                          <div className="h-2 w-full bg-sand rounded-full flex overflow-hidden">
                            <div 
                              className="h-full bg-ink/10 transition-all duration-500" 
                              style={{ width: `${(hoveredProject.stats.by_status.todo / hoveredProject.stats.total_tasks) * 100}%` }} 
                            />
                            <div 
                              className="h-full bg-terracotta transition-all duration-500" 
                              style={{ width: `${(hoveredProject.stats.by_status.inprogress / hoveredProject.stats.total_tasks) * 100}%` }} 
                            />
                            <div 
                              className="h-full bg-[#166534]/60 transition-all duration-500" 
                              style={{ width: `${(hoveredProject.stats.by_status.done / hoveredProject.stats.total_tasks) * 100}%` }} 
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-sans font-medium text-ink/50 uppercase tracking-tighter">
                            <span>Todo: {Math.round((hoveredProject.stats.by_status.todo / hoveredProject.stats.total_tasks) * 100)}%</span>
                            <span>In Progress: {Math.round((hoveredProject.stats.by_status.inprogress / hoveredProject.stats.total_tasks) * 100)}%</span>
                            <span>Done: {Math.round((hoveredProject.stats.by_status.done / hoveredProject.stats.total_tasks) * 100)}%</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-ink/30 italic font-sans">No tasks created yet.</p>
                      )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-border/40">
                      <Link to={`/projects/${hoveredProject.id}`} className="text-ink/40 hover:text-ink text-xs font-sans transition-colors flex items-center group">
                        View Full Dashboard <span className="ml-1 text-[10px] transition-transform group-hover:translate-x-0.5">↗</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Loading Shimmer Overlay */}
                {loadingDetail && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/40 backdrop-blur-[1px]">
                    <div className="w-12 h-12 border-2 border-sand border-t-terracotta rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleProjectCreated}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e8e0d0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c2643f44;
        }
      `}} />
    </div>
  );
}
