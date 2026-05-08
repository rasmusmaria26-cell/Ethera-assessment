import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', {
        email:    form.email.trim(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
          <p className="text-sm font-sans text-ink/50">Sign in to your workspace</p>
        </div>

        <div className="bg-surface border border-border rounded-card shadow-card p-8">
          <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Email
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className="block text-xs font-sans font-medium text-ink/60 mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border rounded-input px-3 py-2.5 text-sm font-sans
                           text-ink bg-cream placeholder:text-ink/30"
                required
              />
            </div>

            {error && (
              <p id="login-error" className="text-red-600 text-sm font-sans">
                {error}
              </p>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white font-sans text-sm font-medium
                         rounded-input py-2.5 hover:bg-terracotta/90 disabled:opacity-50
                         transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm font-sans text-ink/50">
          Don't have an account?{' '}
          <Link to="/signup" className="text-terracotta hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
