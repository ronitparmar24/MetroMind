import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/admin.css';

import {
  Zap, LayoutDashboard, Users, Ticket, BarChart3, MessageSquare,
  LogOut, Menu, Activity, Database, Cpu, Train,
  TrendingUp, ShieldCheck, ChevronRight, Bell,
  Settings, Layers, X, AlertCircle, CheckCircle2,
} from 'lucide-react';

import AdminOverview      from './AdminOverview';
import AdminAnalytics     from './AdminAnalytics';
import AdminUsers         from './AdminUsers';
import AdminModels        from './AdminModels';
import AdminSupport       from './AdminSupport';
import AdminTicketsPage   from './AdminTicketsPage';
import AdminAnnouncements from './AdminAnnouncements';
import AdminSettings      from './AdminSettings';

// ── Particles ───────────────────────────────────────
function AdminParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${2 + Math.random() * 4}px`,
    duration: `${14 + Math.random() * 22}s`,
    delay: `${-Math.random() * 22}s`,
    opacity: 0.2 + Math.random() * 0.35,
  }));
  return (
    <div className="admin-particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          animationDuration: p.duration, animationDelay: p.delay,
          opacity: p.opacity,
          background: ['rgba(99,102,241,0.6)', 'rgba(34,211,238,0.5)', 'rgba(167,139,250,0.5)'][p.id % 3]
        }} />
      ))}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────
function AdminProgressBar({ progress }) {
  return (
    <div className="admin-progress-wrap">
      <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}

// ── Nav definition ───────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/admin',           label: 'Dashboard',  icon: <LayoutDashboard size={15} />, exact: true },
      { path: '/admin/analytics', label: 'Analytics',  icon: <BarChart3 size={15} />,       exact: false },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/admin/users',   label: 'Users',   icon: <Users size={15} />,          exact: false },
      { path: '/admin/tickets', label: 'Tickets', icon: <Ticket size={15} />,         exact: false },
      { path: '/admin/support', label: 'Support', icon: <MessageSquare size={15} />,  exact: false, badge: true },
    ],
  },
  {
    label: 'Control',
    items: [
      { path: '/admin/announcements', label: 'Announcements', icon: <Bell size={15} />,      exact: false },
      { path: '/admin/models',        label: 'ML Models',     icon: <Cpu size={15} />,        exact: false },
      { path: '/admin/settings',      label: 'Settings',      icon: <Settings size={15} />,   exact: false },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────
function AdminSidebarNew({ collapsed, onLogout, supportCount, user, onCloseMobile }) {
  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <style>{`
        @media (min-width: 769px) {
          .admin-mobile-close-btn { display: none !important; }
        }
      `}</style>
      {/* Logo */}
      <div className="admin-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="admin-logo-icon"><Zap size={20} color="white" fill="white" /></div>
          <div>
            <div className="admin-logo-text">MetroAdmin</div>
            <span className="admin-logo-sub">Command Center</span>
          </div>
        </div>
        <button className="admin-mobile-close-btn" onClick={onCloseMobile} style={{
          background: 'none', border: 'none', color: '#94a3b8', padding: 4, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="admin-nav-section">
            <div className="admin-nav-label">{group.label}</div>
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onCloseMobile}
                className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
              >
                <div className="admin-nav-icon">{item.icon}</div>
                {item.label}
                {item.badge && supportCount > 0 && (
                  <span className="admin-nav-badge">{supportCount}</span>
                )}
                <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.3 }} />
              </NavLink>
            ))}
          </div>
        ))}
        {/* Mobile Logout inside scrollable area */}
        <div className="admin-nav-section admin-mobile-logout-btn" style={{ padding: '0 8px', marginTop: 12 }}>
          <button className="admin-logout-btn" onClick={onLogout}>
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>

      {/* User + Logout */}
      <div className="admin-sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', marginBottom: 8,
          background: 'rgba(99,102,241,0.06)',
          borderRadius: 12,
          border: '1px solid rgba(99,102,241,0.12)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          }}>
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
              {user?.name || 'Admin'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#6366f1' }}>System Administrator</div>
          </div>
          <ShieldCheck size={14} color="#6366f1" style={{ marginLeft: 'auto' }} />
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ── Main Dashboard Shell ──────────────────────────────
export default function AdminDashboard() {
  const { logout, user } = useContext(AuthContext);
  const navigate         = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [countdown, setCountdown]   = useState(30);
  const [clock, setClock]           = useState('');
  const [supportCount, setSupportCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNotif, setShowNotif]   = useState(false);

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh progress (30s)
  useEffect(() => {
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += 0.5;
      const pct = (elapsed / 30) * 100;
      if (pct >= 100) {
        elapsed = 0;
        setRefreshKey(k => k + 1);
        setCountdown(30);
      } else {
        setProgress(pct);
        setCountdown(Math.ceil(30 - elapsed));
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  // Mobile collapse
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setCollapsed(e.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleRefreshNow = () => {
    setProgress(0);
    setCountdown(30);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="admin-root">
      {/* Animated background */}
      <div className="admin-bg">
        <div className="admin-blob admin-blob-1" />
        <div className="admin-blob admin-blob-2" />
        <div className="admin-blob admin-blob-3" />
        <AdminParticles />
      </div>

      <AdminProgressBar progress={progress} />

      <AdminSidebarNew
        collapsed={collapsed}
        onLogout={handleLogout}
        supportCount={supportCount}
        user={user}
        onCloseMobile={() => {
          if (window.innerWidth <= 768) setCollapsed(true);
        }}
      />

      <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-hamburger" onClick={() => setCollapsed(c => !c)}>
              <span /><span /><span />
            </button>
            <div>
              <div className="admin-header-title">Admin Control Center</div>
              <div className="admin-header-sub">MetroMind Real-time System Management</div>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="admin-clock">{clock}</div>
            <button
              className="admin-refresh-badge"
              onClick={handleRefreshNow}
              title="Click to refresh now"
            >
              <span className="admin-refresh-dot" />
              Refresh in {countdown}s
            </button>
            <div style={{ position: 'relative' }}>
              <button className="admin-bell-btn" onClick={() => setShowNotif(n => !n)}>
                <Bell size={15} color="#94a3b8" />
                {supportCount > 0 && <span className="admin-bell-dot" />}
              </button>
              {showNotif && (
                <div style={{
                  position: 'absolute', top: 44, right: 0, width: 280,
                  background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 200, padding: 16,
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                    Notifications
                  </div>
                  {supportCount > 0 ? (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(220,38,38,0.05)', borderRadius: 10, border: '1px solid rgba(220,38,38,0.12)' }}>
                      <AlertCircle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827' }}>{supportCount} pending support items</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 2 }}>Feedback & Lost+Found need review</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px' }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>All clear — no pending items</span>
                    </div>
                  )}
                  <button onClick={() => setShowNotif(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Routes */}
        <div className="admin-content admin-fade-in">
          <Routes>
            <Route path="/"              element={<AdminOverview refreshKey={refreshKey} setSupportCount={setSupportCount} />} />
            <Route path="/analytics"     element={<AdminAnalytics refreshKey={refreshKey} />} />
            <Route path="/users"         element={<AdminUsers />} />
            <Route path="/tickets"       element={<AdminTicketsPage />} />
            <Route path="/models"        element={<AdminModels />} />
            <Route path="/support"       element={<AdminSupport setSupportCount={setSupportCount} />} />
            <Route path="/announcements" element={<AdminAnnouncements />} />
            <Route path="/settings"      element={<AdminSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
