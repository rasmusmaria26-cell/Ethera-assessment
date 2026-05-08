import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/signup', {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-ink tracking-tight mb-1">Ethera</h1>
          <p className="text-sm font-sans text-ink/50">Create your account</p>
        </div>

        <div className="bg-surface border border-border rounded-card shadow-card p-8">
          <form id="signup-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Maria Kovač"
                className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                           text-ink bg-cream placeholder:text-ink/30"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                           text-ink bg-cream placeholder:text-ink/30"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Password
                <span className="text-ink/35 ml-1 font-normal">(min 8 characters)</span>
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                           text-ink bg-cream placeholder:text-ink/30"
                required
              />
            </div>

            {error && (
              <p id="signup-error" className="text-red-600 text-sm font-sans">
                {error}
              </p>
            )}

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white font-sans text-sm font-medium
                         rounded-input py-2.5 hover:bg-terracotta/90 disabled:opacity-50
                         transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm font-sans text-ink/50">
          Already have an account?{' '}
          <Link to="/login" className="text-terracotta hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
