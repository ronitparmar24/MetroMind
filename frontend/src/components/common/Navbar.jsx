// frontend/src/components/common/Navbar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import QuickSearch from './QuickSearch';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => { setAvatarError(false); }, [user?.avatar]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const avatarUrl = user?.avatar?.includes('googleusercontent.com')
    ? user.avatar.replace(/=s\d+-c/, '=s400-c').replace(/\?sz=\d+/, '?sz=200')
    : `https://api.dicebear.com/9.x/${user?.avatarStyle || 'notionists'}/svg?seed=${encodeURIComponent(user?.email || 'default')}`;
  const hasAvatar = avatarUrl && !avatarError;

  // Shared touch-target style for icon buttons
  const iconBtnStyle = {
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    fontSize: '1.1rem',
    borderRadius: 'var(--radius-md)',
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, cursor: 'pointer',
  };

  return (
    <>
      <nav className="glass-navbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--navbar-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        zIndex: 'var(--z-navbar)',
        gap: '8px',
      }}>
        {/* Left: Hamburger + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px', flexShrink: 0 }}>
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'none', border: 'none', color: 'var(--text-primary)',
              fontSize: '1.3rem', cursor: 'pointer',
              width: '44px', height: '44px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
            }}
            id="sidebar-toggle"
            aria-label="Toggle sidebar"
          >☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}>🚇</span>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 700,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>MetroMind</h1>
          </div>
        </div>

        {/* Center: Quick Search — hidden on mobile */}
        {!isMobile && (
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '12px', padding: '7px 16px',
              cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '0.85rem', fontFamily: "'Inter', sans-serif",
              fontWeight: 500, transition: 'all 0.2s',
              minWidth: '220px', backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Quick Search (Ctrl+K)"
            id="quick-search-btn"
          >
            <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>🔍</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Quick search...</span>
            <kbd style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '5px', padding: '1px 7px',
              fontSize: '0.68rem', color: '#a5b4fc',
              fontFamily: 'monospace', letterSpacing: '0.02em',
            }}>⌘K</kbd>
          </button>
        )}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>
          {/* Search icon on mobile */}
          {isMobile && (
            <button
              onClick={() => setSearchOpen(true)}
              style={iconBtnStyle}
              aria-label="Search"
              id="quick-search-btn-mobile"
            >🔍</button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={iconBtnStyle}
            id="theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px' }}>
              {/* Avatar */}
              <div
                onClick={() => navigate('/profile')}
                title="View profile"
                style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                  border: '2px solid transparent',
                  backgroundImage: 'var(--gradient-primary)',
                  backgroundOrigin: 'border-box',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)'; }}
              >
                {hasAvatar ? (
                  <img
                    src={avatarUrl} alt={user.name}
                    referrerPolicy="no-referrer" crossOrigin="anonymous"
                    onError={() => setAvatarError(true)}
                    fetchPriority="high" loading="eager" decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Logout — hidden on mobile (accessible via sidebar or profile) */}
              {!isMobile && (
                <button
                  onClick={() => navigate('/goodbye')}
                  className="btn btn-sm btn-secondary"
                  id="logout-btn"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Quick Search Modal */}
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
