import React from 'react';
import { NavLink } from 'react-router-dom';

const ADMIN_ROUTES = [
  { path: '/admin', label: 'Overview', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/models', label: 'Model Performance', icon: '🤖' },
  { path: '/admin/support', label: 'Support Queue', icon: '🎫' },
];

export default function AdminSidebar() {
  return (
    <aside
      className="glass-sidebar"
      style={{
        width: 'var(--sidebar-width)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        height: 'calc(100vh - var(--navbar-height))',
        position: 'sticky',
        top: 'var(--navbar-height)',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          padding: '8px 20px 4px',
        }}>
          Admin Panel
        </p>
        {ADMIN_ROUTES.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
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
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
