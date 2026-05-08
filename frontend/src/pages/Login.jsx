import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-card p-8 shadow-card animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-8 h-[2px] bg-terracotta rounded-full mx-auto mb-4"></div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Ethera</h1>
          <p className="font-sans text-ink/50 mt-2 text-sm">Welcome back. Sign in to your account.</p>
        </div>

        <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-sans font-medium text-ink/80 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans bg-cream text-ink focus:outline-none focus:border-terracotta transition-colors duration-150"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-sans font-medium text-ink/80 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-input px-3 py-2 text-sm font-sans bg-cream text-ink focus:outline-none focus:border-terracotta transition-colors duration-150"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs font-sans font-medium">{error}</p>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-white font-sans font-medium py-2.5 rounded-input hover:bg-terracotta/90 transition-colors mt-2 group flex justify-center items-center disabled:opacity-50"
          >
            {loading ? 'Signing in…' : (
              <>
                <span>Sign In</span>
                <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm font-sans text-ink/50">
          Don't have an account?{' '}
          <Link to="/signup" className="text-terracotta hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
