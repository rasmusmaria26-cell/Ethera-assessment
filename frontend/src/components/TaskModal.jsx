import { useState } from 'react';
import api from '../api/client.js';
import PriorityPicker from './PriorityPicker.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function TaskModal({ projectId, members, onCreated, onClose }) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]       = useState('medium');
  const [dueDate, setDueDate]         = useState('');
  const [assignedTo, setAssignedTo]   = useState('');
  const [saving, setSaving]           = useState(false);
  const { addToast }                  = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/api/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
      });
      addToast({ message: 'Task created', type: 'success' });
      onCreated(res.data);
    } catch (err) {
      addToast({ message: err.response?.data?.error || 'Failed to create task', type: 'error' });
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/20 backdrop-blur-sm transition-opacity">
      <div
        className="fixed inset-0"
        onClick={onClose}
      ></div>
      
      <div className="relative h-full w-full max-w-md bg-surface shadow-[-8px_0_40px_rgba(26,26,26,0.12)] animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-serif text-xl text-ink">New Task</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream placeholder:text-ink/30 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add details, links, or notes…"
                className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream placeholder:text-ink/30 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150"
              />
            </div>
            
            <div>
              <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Priority</label>
              <PriorityPicker value={priority} onChange={setPriority} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Assign To</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full border border-border rounded-input px-2 py-2 text-sm font-sans text-ink bg-cream focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-sans font-medium text-ink/70 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans text-ink bg-cream focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors duration-150"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-sans font-medium text-ink/60 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input hover:bg-terracotta/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
