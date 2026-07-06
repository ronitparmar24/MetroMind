// frontend/src/pages/Settings.jsx
import { useTheme } from '../hooks/useTheme';
import GlassCard from '../components/common/GlassCard';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings ⚙️</h1>
        <p className="page-subtitle">Customize your MetroMind experience</p>
      </div>

      <GlassCard style={{ maxWidth: '600px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600 }}>Theme</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Switch between dark and light mode</p>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme} id="settings-theme-toggle">
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600 }}>Notifications</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Booking and wallet alerts</p>
          </div>
          <span className="badge badge-success">Enabled</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600 }}>Language</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interface language</p>
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>English</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <h4 style={{ fontWeight: 600 }}>App Version</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>MetroMind v1.0.0</p>
          </div>
          <span className="badge badge-info">Latest</span>
        </div>
      </GlassCard>
    </div>
  );
}
