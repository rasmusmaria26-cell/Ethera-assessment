import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/projects"
          className="font-serif text-xl text-ink tracking-tight hover:text-terracotta transition-colors"
        >
          Ethera
        </Link>

        {/* Right side */}
        {user && (
          <div className="flex items-center gap-4">
            {/* User name */}
            <span className="hidden sm:block text-sm text-ink/60 font-sans">
              {user.name}
            </span>

            {/* Avatar initial */}
            <div
              className="w-8 h-8 rounded-full bg-terracotta flex items-center justify-center
                         text-white text-sm font-medium font-sans flex-shrink-0"
              aria-hidden="true"
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>

            {/* Logout */}
            <button
              id="navbar-logout-btn"
              onClick={handleLogout}
              className="text-sm font-sans text-ink/50 hover:text-ink transition-colors px-2 py-1 rounded-input"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
