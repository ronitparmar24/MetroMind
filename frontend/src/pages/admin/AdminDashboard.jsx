import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/admin.css';

// ── Icon imports (lucide-react) ──────────────────────────────────
import {
  Zap, LayoutDashboard, Users, Ticket, BarChart3, MessageSquare,
  LogOut, Menu, RefreshCw, Activity, Database, Cpu, Train,
  CreditCard, TrendingUp, ShieldCheck, ChevronRight, Bell,
  Settings, Award, Layers
} from 'lucide-react';

// ── Sub-page imports ──────────────────────────────────────────────
import AdminOverview from './AdminOverview';
import AdminUsers    from './AdminUsers';
import AdminModels   from './AdminModels';
import AdminSupport  from './AdminSupport';
import AdminTicketsPage from './AdminTicketsPage';
import AdminAnnouncements from './AdminAnnouncements';

// ════════════════════════════════════════════════════════════════════
// PARTICLES
// ════════════════════════════════════════════════════════════════════
function AdminParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${3 + Math.random() * 5}px`,
    duration: `${12 + Math.random() * 20}s`,
    delay: `${-Math.random() * 20}s`,
    opacity: 0.3 + Math.random() * 0.4,
  }));
  return (
    <div className="admin-particles">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          animationDuration: p.duration, animationDelay: p.delay,
          opacity: p.opacity,
          background: ['rgba(99,102,241,0.5)', 'rgba(139,92,246,0.4)', 'rgba(16,185,129,0.4)'][p.id % 3]
        }} />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PROGRESS BAR
// ════════════════════════════════════════════════════════════════════
function AdminProgressBar({ progress }) {
  return (
    <div className="admin-progress-wrap">
      <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} />, exact: true },
      { path: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={16} />, exact: false },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/admin/users',   label: 'Users',       icon: <Users size={16} />,   exact: false },
      { path: '/admin/tickets', label: 'Tickets',     icon: <Ticket size={16} />,  exact: false },
      { path: '/admin/support', label: 'Support',     icon: <MessageSquare size={16} />, exact: false, badge: true },
    ],
  },
  {
    label: 'Control',
    items: [
      { path: '/admin/announcements', label: 'Announcements', icon: <Bell size={16} />, exact: false },
      { path: '/admin/models',   label: 'ML Models',  icon: <Cpu size={16} />,      exact: false },
      { path: '/admin/settings', label: 'Settings',   icon: <Settings size={16} />, exact: false },
    ],
  },
];

function AdminSidebarNew({ collapsed, onLogout, supportCount }) {
  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="admin-logo">
        <div className="admin-logo-icon"><Zap size={20} color="white" fill="white" /></div>
        <div>
          <div className="admin-logo-text">MetroAdmin</div>
          <span className="admin-logo-sub">Control Center</span>
        </div>
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
                className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}
              >
                <div className="admin-nav-icon">{item.icon}</div>
                {item.label}
                {item.badge && supportCount > 0 && (
                  <span className="admin-nav-badge">{supportCount}</span>
                )}
                <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.35 }} />
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User + Logout */}
      <div className="admin-sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', marginBottom: '8px',
          background: 'rgba(99,102,241,0.05)', borderRadius: '10px',
          border: '1px solid rgba(99,102,241,0.1)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
          }}>A</div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Admin</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>System Administrator</div>
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

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD SHELL
// ════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const navigate   = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [countdown, setCountdown]   = useState(30);
  const [clock, setClock]           = useState('');
  const [supportCount, setSupportCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Live clock ─────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // ── Auto-refresh progress (30s) ────────────────────────────────
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

  // ── Mobile: collapse sidebar on small screens ──────────────────
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
    // Force light mode regardless of global theme
    <div className="admin-root" data-theme="light" style={{ colorScheme: 'light' }}>
      {/* Animated background */}
      <div className="admin-bg">
        <div className="admin-blob admin-blob-1" />
        <div className="admin-blob admin-blob-2" />
        <div className="admin-blob admin-blob-3" />
        <AdminParticles />
      </div>

      {/* Top progress bar */}
      <AdminProgressBar progress={progress} />

      {/* Sidebar */}
      <AdminSidebarNew
        collapsed={collapsed}
        onLogout={handleLogout}
        supportCount={supportCount}
      />

      {/* Main area */}
      <div className={`admin-main ${collapsed ? 'admin-main-collapsed' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-hamburger" onClick={() => setCollapsed(c => !c)}>
              <span /><span /><span />
            </button>
            <div>
              <div className="admin-header-title">Admin Control Center</div>
              <div className="admin-header-sub">Real-time Metro System Management</div>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="admin-clock">{clock}</div>
            <button
              className="admin-refresh-badge"
              onClick={handleRefreshNow}
              style={{ cursor: 'pointer', border: 'none' }}
              title="Click to refresh now"
            >
              <span className="admin-refresh-dot" />
              Refresh in {countdown}s
            </button>
            <button style={{
              width: 36, height: 36,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={16} color="#6366f1" />
            </button>
          </div>
        </header>

        {/* Routes */}
        <div className="admin-content admin-fade-in">
          <Routes>
            <Route path="/"         element={<AdminOverview refreshKey={refreshKey} setSupportCount={setSupportCount} />} />
            <Route path="/analytics" element={<AdminOverview refreshKey={refreshKey} setSupportCount={setSupportCount} />} />
            <Route path="/users"    element={<AdminUsers />} />
            <Route path="/tickets"  element={<AdminTicketsPage />} />
            <Route path="/models"   element={<AdminModels />} />
            <Route path="/support"  element={<AdminSupport />} />
            <Route path="/announcements" element={<AdminAnnouncements />} />
            <Route path="/settings" element={<AdminSettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ── Placeholder: Settings page ────────────────────────────────────
function AdminSettingsPage() {
  return (
    <div className="glass-card admin-fade-in" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
      <Settings size={52} style={{ opacity: 0.25, marginBottom: 16 }} color="#6366f1" />
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>System Settings</div>
      <div style={{ fontSize: '0.875rem' }}>Advanced configuration panel coming soon.</div>
    </div>
  );
}

