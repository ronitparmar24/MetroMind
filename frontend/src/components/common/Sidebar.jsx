// frontend/src/components/common/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { NAV_ROUTES } from '../../constants/routes';

export default function Sidebar({ isOpen }) {
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
              {section.section}
            </p>
            {section.items.map((item) => (
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
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
