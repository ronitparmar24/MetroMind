// frontend/src/components/common/Sidebar.jsx
// MetroMind — Upgraded sidebar with glow active states, icon scale, collapsed sections
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

const LIVE_PATHS = new Set(['/dashboard', '/live-trains']);

const SECTION_COLORS = {
  Main:     '#6366f1',
  Finance:  '#22c55e',
  Travel:   '#3b82f6',
  Insights: '#f59e0b',
  Account:  '#a855f7',
  Support:  '#ef4444',
};

export default function Sidebar({ isOpen }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside
      className="glass-sidebar"
      style={{
        position: 'fixed', top: 'var(--navbar-height)', left: 0, bottom: 0,
        width: isOpen ? 'var(--sidebar-width)' : '0px',
        overflow: 'hidden',
        transition: 'width var(--transition-base)',
        zIndex: 'var(--z-sidebar)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <style>{`
        .sidebar-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 20px; margin: 2px 8px;
          border-radius: 12px; font-size: 0.875rem; font-weight: 500;
          text-decoration: none; color: var(--text-secondary);
          transition: all 0.2s cubic-bezier(0.2,0.8,0.2,1);
          position: relative; white-space: nowrap; overflow: hidden;
          border: 1px solid transparent;
        }
        .sidebar-nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          transform: translateX(2px);
          border-color: var(--border-color);
        }
        .sidebar-nav-item.active {
          color: var(--text-primary);
          font-weight: 700;
        }
        .sidebar-nav-item .sidebar-icon {
          font-size: 1.05rem; width: 24px; text-align: center;
          flex-shrink: 0;
          transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1);
        }
        .sidebar-nav-item:hover .sidebar-icon {
          transform: scale(1.2);
        }
        .sidebar-nav-item.active .sidebar-icon {
          transform: scale(1.15);
        }
        .sidebar-section-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 20px 4px; cursor: pointer;
          background: none; border: none; width: 100%; text-align: left;
        }
        .sidebar-section-toggle:hover { opacity: 0.8; }
        @keyframes sidebarFadeIn { from{opacity:0;transform:translateX(-8px);} to{opacity:1;transform:translateX(0);} }
      `}</style>

      <div style={{ width: 'var(--sidebar-width)', padding: '12px 0 24px', overflowY: 'auto', flex: 1, overflowX: 'hidden' }}>
        {NAV_ROUTES.map((section, sIdx) => {
          const sectionColor = SECTION_COLORS[section.section] || '#6366f1';
          const isCollapsed = collapsed[section.section];
          return (
            <div key={section.section} style={{ marginBottom: '4px', animation: `sidebarFadeIn 0.3s ease ${sIdx * 0.05}s both` }}>
              {/* Section header */}
              <button
                className="sidebar-section-toggle"
                onClick={() => toggleSection(section.section)}
              >
                <p style={{
                  fontSize: '0.65rem', fontWeight: 800,
                  color: isCollapsed ? 'var(--text-muted)' : sectionColor,
                  textTransform: 'uppercase', letterSpacing: '1.2px',
                  transition: 'color 0.2s ease',
                }}>
                  {t(`nav.${section.section.toLowerCase()}`, section.section)}
                </p>
                <span style={{
                  fontSize: '0.6rem', color: 'var(--text-muted)',
                  transition: 'transform 0.3s ease',
                  display: 'inline-block',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}>▾</span>
              </button>

              {/* Nav items */}
              {!isCollapsed && section.items.map((item) => {
                const itemKey = item.path.replace('/', '').replace(/-/g, '_');
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                    style={({ isActive }) => ({
                      background: isActive
                        ? `linear-gradient(135deg, ${sectionColor}14 0%, ${sectionColor}08 100%)`
                        : undefined,
                      borderColor: isActive ? `${sectionColor}28` : undefined,
                      color: isActive ? 'var(--text-primary)' : undefined,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active left bar */}
                        {isActive && (
                          <div style={{
                            position: 'absolute', left: 0, top: '20%', bottom: '20%',
                            width: '3px', borderRadius: '0 3px 3px 0',
                            background: sectionColor,
                            boxShadow: `0 0 8px ${sectionColor}60`,
                          }} />
                        )}
                        <span className="sidebar-icon">{item.icon}</span>
                        <span style={{ flex: 1, letterSpacing: isActive ? '0.01em' : '0' }}>
                          {t(`nav.${itemKey}`, item.label)}
                        </span>
                        {LIVE_PATHS.has(item.path) && (
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: '#E8283B',
                            animation: 'dashPulse 1.5s ease-in-out infinite',
                            marginLeft: 'auto', flexShrink: 0,
                          }} title="Live data" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '8px 20px 4px' }}>
              Administration
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              style={({ isActive }) => ({
                background: isActive ? 'rgba(239,68,68,0.08)' : undefined,
                borderColor: isActive ? 'rgba(239,68,68,0.2)' : undefined,
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', borderRadius: '0 3px 3px 0', background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />}
                  <span className="sidebar-icon">🛡️</span>
                  <span>Admin Panel</span>
                </>
              )}
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
