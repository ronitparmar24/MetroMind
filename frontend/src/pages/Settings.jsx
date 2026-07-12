// frontend/src/pages/Settings.jsx
import { useTheme } from '../hooks/useTheme';
import GlassCard from '../components/common/GlassCard';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export default function Settings() {
  const { theme, preference, setTheme } = useTheme();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings ⚙️</h1>
        <p className="page-subtitle">Customize your MetroMind experience</p>
      </div>

      <GlassCard style={{ maxWidth: '600px', padding: '28px' }}>
        {/* Theme Selection */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Theme</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Choose your preferred appearance
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`btn ${preference === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTheme(opt.value)}
                id={`theme-${opt.value}`}
                style={{ flex: 1 }}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
            Currently showing: <strong style={{ color: 'var(--text-primary)' }}>{theme}</strong> mode
            {preference === 'system' && ' (from system preference)'}
          </p>
        </div>

        {/* Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Booking and wallet alerts</p>
          </div>
          <span className="badge badge-success">Enabled</span>
        </div>

        {/* Language */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Language</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Interface language</p>
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>English</span>
        </div>

        {/* App Version */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>App Version</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>MetroMind v1.0.0</p>
          </div>
          <span className="badge badge-info">Latest</span>
        </div>
      </GlassCard>
    </div>
  );
}
