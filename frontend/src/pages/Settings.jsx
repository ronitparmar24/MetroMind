// frontend/src/pages/Settings.jsx
import { useTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';
import GlassCard from '../components/common/GlassCard';
import { ACCESSIBILITY_FEATURES } from '../constants/stations';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'system', label: 'System', icon: '💻' },
];

export default function Settings() {
  const { theme, preference, setTheme } = useTheme();
  const { accessible, toggleAccessible } = useAccessibility();

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

        {/* ═══ ACCESSIBILITY SECTION ═══ */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ♿ Accessibility
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                GMRC metro accessibility features & routing preferences
              </p>
            </div>
          </div>

          {/* Toggle: Step-free / accessible routing */}
          <div
            onClick={toggleAccessible}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', marginBottom: '16px',
              background: accessible ? 'rgba(99, 102, 241, 0.06)' : 'var(--bg-tertiary)',
              border: accessible ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                I need step-free / accessible routing
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Shows ♿ badges on stations in Metro Map and Journey Planner
              </p>
            </div>
            {/* Toggle switch */}
            <div style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: accessible ? '#6366f1' : 'var(--border-color)',
              position: 'relative', flexShrink: 0,
              transition: 'background 0.2s ease',
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', position: 'absolute',
                top: '3px',
                left: accessible ? '23px' : '3px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </div>
          </div>

          {/* GMRC accessibility features list */}
          <p style={{
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
          }}>
            GMRC Station Accessibility Features
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ACCESSIBILITY_FEATURES.map(feature => (
              <div key={feature.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}>
                  {feature.icon}
                </span>
                <div>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {feature.name}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '2px' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
