// frontend/src/components/common/Navbar.jsx
import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);

  // Reset error state if avatar URL changes (e.g., after re-login)
  useEffect(() => { setAvatarError(false); }, [user?.avatar]);

  const avatarUrl = user?.avatar?.includes('googleusercontent.com')
    ? user.avatar.replace(/=s\d+-c/, '=s400-c').replace(/\?sz=\d+/, '?sz=200')
    : user?.avatar;
  const hasAvatar = avatarUrl && !avatarError;


  return (
    <nav className="glass-navbar" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--navbar-height)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', zIndex: 'var(--z-navbar)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}
          id="sidebar-toggle"
        >☰</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚇</span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MetroMind</h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={toggleTheme}
          className="btn-icon"
          style={{
            background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
            border: '1px solid var(--border-color)', fontSize: '1.1rem',
            borderRadius: 'var(--radius-md)',
          }}
          id="theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Avatar — Google photo or gradient initial */}
            <div
              onClick={() => navigate('/profile')}
              title="View profile"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
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
                  src={avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setAvatarError(true)}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
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

            <button
              onClick={() => navigate('/goodbye')}
              className="btn btn-sm btn-secondary"
              id="logout-btn"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
