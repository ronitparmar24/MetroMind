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
        padding: '24px 0',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        height: 'calc(100vh - var(--navbar-height))',
        position: 'sticky',
        top: 'var(--navbar-height)',
        zIndex: 40,
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          padding: '8px 24px 12px',
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
              gap: '16px',
              padding: '12px 24px',
              margin: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.95rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderLeft: isActive ? '4px solid #818cf8' : '4px solid transparent',
              textShadow: isActive ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
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
