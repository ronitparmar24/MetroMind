// frontend/src/components/common/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

// Nav items that carry live data — show pulsing dot
const LIVE_PATHS = new Set(['/dashboard', '/live-trains']);

export default function Sidebar({ isOpen }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <aside
      className="glass-sidebar"
      style={{
        position: 'fixed',
        top: 'var(--navbar-height)',
        left: 0,
        bottom: 0,
        width: isOpen ? 'var(--sidebar-width)' : '0px',
        overflow: 'hidden',
        transition: 'width var(--transition-base)',
        zIndex: 'var(--z-sidebar)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        width: 'var(--sidebar-width)',
        padding: '16px 0',
        overflowY: 'auto',
        flex: 1,
      }}>
        {NAV_ROUTES.map((section) => (
          <div key={section.section} style={{ marginBottom: '8px' }}>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              padding: '8px 20px 4px',
            }}>
              {t(`nav.${section.section.toLowerCase()}`, section.section)}
            </p>
            {section.items.map((item) => {
              // Generate translation key from path, e.g. "/metro-card" -> "metro_card"
              const itemKey = item.path.replace('/', '').replace('-', '_');
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    margin: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                  })}
                >
                  <span style={{ fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{t(`nav.${itemKey}`, item.label)}</span>
                {LIVE_PATHS.has(item.path) && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#E8283B',
                      animation: 'dashPulse 1.5s ease-in-out infinite',
                      marginLeft: 'auto',
                      flexShrink: 0,
                    }}
                    title="Live data"
                  />
                )}
              </NavLink>
              );
            })}
          </div>
        ))}

        {user && user.role === 'admin' && (
          <div style={{ marginTop: 'auto', marginBottom: '8px' }}>
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              padding: '8px 20px 4px',
            }}>
              Administration
            </p>
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 20px',
                margin: '2px 8px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              })}
            >
              <span style={{ fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>
                🛡️
              </span>
              <span>Admin Panel</span>
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
