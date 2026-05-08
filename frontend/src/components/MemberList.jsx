import { useState } from 'react';
import api from '../api/client.js';

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`text-xs font-sans font-medium px-2 py-0.5 rounded-badge ${
        isAdmin
          ? 'bg-terracotta/10 text-terracotta'
          : 'bg-ink/8 text-ink/50'
      }`}
    >
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

// ─── MemberList ───────────────────────────────────────────────────────────────

export default function MemberList({ members = [], isAdmin, projectId, currentUserId, onMembersChanged }) {
  const [email, setEmail]       = useState('');
  const [role, setRole]         = useState('member');
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setSuccess] = useState('');

  async function handleAddMember(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setAddError('');
    setSuccess('');
    try {
      await api.post(`/api/projects/${projectId}/members`, {
        email: email.trim(),
        role,
      });
      setEmail('');
      setRole('member');
      setSuccess('Member added successfully');
      onMembersChanged();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(userId) {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/api/projects/${projectId}/members/${userId}`);
      onMembersChanged();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  }

  return (
    <section className="bg-sand/30 border border-border/60 rounded-card p-5">
      <h3 className="font-serif text-base text-ink mb-4">
        Members <span className="text-ink/40 font-sans text-sm font-normal">({members.length})</span>
      </h3>

      {/* Member rows */}
      <ul className="divide-y divide-border mb-4">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between py-3 group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full bg-terracotta/15 text-terracotta font-medium
                           flex items-center justify-center text-sm font-sans flex-shrink-0"
              >
                {m.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-sans font-medium text-ink leading-tight">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-ink/40">(you)</span>
                  )}
                </p>
                <p className="text-xs text-ink/45 font-sans">{m.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <RoleBadge role={m.role} />
              {isAdmin && m.id !== currentUserId && (
                <button
                  id={`remove-member-${m.id}`}
                  onClick={() => handleRemove(m.id)}
                  className="text-xs text-ink/30 hover:text-red-600 transition-colors
                             opacity-0 group-hover:opacity-100 px-1"
                  title="Remove member"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Add member (admin only) */}
      {isAdmin && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-sans font-medium text-ink/60 mb-2">Add member by email</p>
          <form id="add-member-form" onSubmit={handleAddMember} className="space-y-3">
            <input
              id="add-member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans
                         text-ink bg-cream placeholder:text-ink/30 focus:outline-none focus:border-terracotta"
              required
            />
            <div className="flex gap-2">
              <select
                id="add-member-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-[100px] border border-border rounded-input px-2 py-2 text-sm font-sans
                           text-ink bg-cream focus:outline-none focus:border-terracotta"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                id="add-member-submit"
                type="submit"
                disabled={adding}
                className="flex-1 px-4 py-2 text-sm font-sans bg-terracotta text-white rounded-input
                           hover:bg-terracotta/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {adding ? 'Adding…' : 'Add Member'}
              </button>
            </div>
            {(addError || addSuccess) && (
              <div className="pt-1">
                {addError  && <p className="text-xs text-red-600 font-sans">{addError}</p>}
                {addSuccess && <p className="text-xs text-green-700 font-sans">{addSuccess}</p>}
              </div>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
