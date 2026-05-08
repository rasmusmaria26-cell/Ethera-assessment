import { useState, useEffect } from 'react';
import api from '../api/client.js';

/**
 * TaskModal — slide-in panel for creating a new task.
 * Rendered only for admins (parent should gate rendering).
 */
export default function TaskModal({ projectId, members = [], onCreated, onClose }) {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    due_date:    '',
    priority:    'medium',
    assigned_to: '',
  });
  const [error, setSaveError] = useState('');
  const [saving, setSaving]   = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setSaveError('Task title is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        due_date:    form.due_date || undefined,
        priority:    form.priority,
        assigned_to: form.assigned_to || undefined,
      };
      const res = await api.post(`/api/projects/${projectId}/tasks`, payload);
      onCreated(res.data);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-card shadow-modal w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">New Task</h2>
          <button
            id="task-modal-close"
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form id="task-create-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-sans font-medium text-ink/60 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                         text-ink bg-cream placeholder:text-ink/30"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-xs font-sans font-medium text-ink/60 mb-1">
              Description
            </label>
            <textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Optional details…"
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                         text-ink bg-cream placeholder:text-ink/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due date */}
            <div>
              <label htmlFor="task-due" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Due Date
              </label>
              <input
                id="task-due"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                           text-ink bg-cream"
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="task-priority" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                           text-ink bg-cream"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label htmlFor="task-assignee" className="block text-xs font-sans font-medium text-ink/60 mb-1">
              Assignee
            </label>
            <select
              id="task-assignee"
              value={form.assigned_to}
              onChange={(e) => set('assigned_to', e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                         text-ink bg-cream"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm font-sans">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-sans text-ink/60 hover:text-ink
                         border border-border rounded-input transition-colors"
            >
              Cancel
            </button>
            <button
              id="task-create-submit"
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input
                         hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
