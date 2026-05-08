import { useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

// ─── Priority badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }) {
  const styles = {
    high:   'bg-priority-high-bg text-priority-high-text border-l-2 border-priority-high-text',
    medium: 'bg-priority-mid-bg  text-priority-mid-text  border-l-2 border-priority-mid-text',
    low:    'bg-priority-low-bg  text-priority-low-text  border-l-2 border-priority-low-text',
  };
  const label = { high: 'High', medium: 'Medium', low: 'Low' };

  return (
    <span
      className={`inline-block text-xs font-sans font-medium px-2 py-0.5 rounded-badge ${
        styles[priority] || styles.medium
      }`}
    >
      {label[priority] || priority}
    </span>
  );
}

// ─── Assignee chip ────────────────────────────────────────────────────────────

function AssigneeChip({ assignee }) {
  if (!assignee?.id) {
    return <span className="text-xs text-ink/40 font-sans">Unassigned</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-sans text-ink/70">
      <span className="w-5 h-5 rounded-full bg-terracotta/20 text-terracotta font-medium flex items-center justify-center text-[10px] flex-shrink-0">
        {assignee.name?.charAt(0).toUpperCase()}
      </span>
      {assignee.name}
    </span>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

export default function TaskCard({ task, isAdmin, currentUserId, onUpdated, onDeleted, members = [] }) {
  const { user: _user } = useAuth();
  const [statusLoading, setStatusLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const isMyTask = task.assigned_to?.id === currentUserId;
  const canChangeStatus = isAdmin || isMyTask;

  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setStatusLoading(true);
    try {
      const res = await api.put(`/api/tasks/${task.id}`, { status: newStatus });
      onUpdated(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onDeleted(task.id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <article
      className="bg-surface border border-border rounded-card p-4 shadow-card
                 hover:bg-sand transition-colors group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-sans font-medium text-ink leading-snug flex-1">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-ink/55 font-sans line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <AssigneeChip assignee={task.assigned_to} />
        {task.due_date && (
          <span
            className={`text-xs font-sans ${
              isOverdue ? 'text-red-600 font-medium' : 'text-ink/45'
            }`}
          >
            {isOverdue && '⚠ '}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2">
        {canChangeStatus ? (
          <select
            id={`task-status-${task.id}`}
            value={task.status}
            onChange={handleStatusChange}
            disabled={statusLoading}
            className="flex-1 text-xs font-sans border border-border rounded-input px-2 py-1
                       bg-cream text-ink focus:border-terracotta focus:ring-0 cursor-pointer
                       disabled:opacity-50"
          >
            <option value="todo">Todo</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
        ) : (
          <span className="flex-1 text-xs font-sans text-ink/50 capitalize">
            {task.status === 'inprogress' ? 'In Progress' : task.status}
          </span>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              id={`task-edit-${task.id}`}
              onClick={() => setShowEdit(true)}
              className="text-xs text-ink/50 hover:text-ink px-1.5 py-1 rounded transition-colors"
              title="Edit task"
            >
              Edit
            </button>
            <button
              id={`task-delete-${task.id}`}
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700 px-1.5 py-1 rounded transition-colors"
              title="Delete task"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Inline edit modal (lazy) */}
      {showEdit && isAdmin && (
        <InlineEditModal
          task={task}
          members={members}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setShowEdit(false);
          }}
        />
      )}
    </article>
  );
}

// ─── Inline edit modal for admin ─────────────────────────────────────────────

function InlineEditModal({ task, members, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || '',
    due_date:    task.due_date ? task.due_date.split('T')[0] : '',
    priority:    task.priority,
    status:      task.status,
    assigned_to: task.assigned_to?.id || '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        due_date:    form.due_date || null,
        priority:    form.priority,
        status:      form.status,
        assigned_to: form.assigned_to || null,
      };
      const res = await api.put(`/api/tasks/${task.id}`, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
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
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Edit Task</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Title *</label>
            <input
              id="edit-task-title"
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Description</label>
            <textarea
              id="edit-task-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Due Date</label>
              <input
                id="edit-task-due"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream"
              />
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Priority</label>
              <select
                id="edit-task-priority"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Status</label>
              <select
                id="edit-task-status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream"
              >
                <option value="todo">Todo</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-ink/60 mb-1">Assignee</label>
              <select
                id="edit-task-assignee"
                value={form.assigned_to}
                onChange={(e) => set('assigned_to', e.target.value)}
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm font-sans">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-sans text-ink/60 hover:text-ink border border-border rounded-input"
            >
              Cancel
            </button>
            <button
              id="edit-task-save-btn"
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input
                         hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
