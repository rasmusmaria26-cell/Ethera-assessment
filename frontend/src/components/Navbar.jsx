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
    <header className="border-b border-border bg-surface sticky top-0 z-40 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-serif text-xl font-bold tracking-tight text-ink">
            Ethera
          </Link>
          <nav>
            <Link to="/projects" className="text-sm font-sans text-ink/50 hover:text-ink transition-colors">
              Projects
            </Link>
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-sans text-ink/60">{user.name}</span>
              <div
                className="w-8 h-8 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center font-sans font-medium text-sm"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <button
              id="navbar-logout-btn"
              onClick={handleLogout}
              className="text-sm font-sans text-ink/40 hover:text-ink transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-terracotta/60">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
