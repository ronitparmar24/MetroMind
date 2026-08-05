// frontend/src/pages/Settings.jsx
import { useTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';
import GlassCard from '../components/common/GlassCard';
import { ACCESSIBILITY_FEATURES } from '../constants/stations';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { theme, preference, setTheme } = useTheme();
  const { accessible, toggleAccessible } = useAccessibility();
  const { t, i18n } = useTranslation();

  const THEME_OPTIONS = [
    { value: 'light', label: t('settings.theme_light'), icon: '☀️' },
    { value: 'dark', label: t('settings.theme_dark'), icon: '🌙' },
    { value: 'system', label: t('settings.theme_system'), icon: '💻' },
  ];

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', maxWidth: '1000px', alignItems: 'start' }}>
        {/* LEFT COLUMN: Main Settings */}
        <GlassCard style={{ padding: '28px' }}>
          {/* Theme Selection */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '12px' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.theme_title')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t('settings.theme_subtitle')}
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
            {t('settings.theme_current')} <strong style={{ color: 'var(--text-primary)' }}>{theme}</strong> {t('settings.theme_mode')}
            {preference === 'system' && ` ${t('settings.theme_system_pref')}`}
          </p>
        </div>

        {/* Notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.notifications_title')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('settings.notifications_subtitle')}</p>
          </div>
          <span className="badge badge-success">{t('settings.enabled')}</span>
        </div>

        {/* Language */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.language_title')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('settings.language_subtitle')}</p>
          </div>
          <select 
            value={i18n.language || 'en'} 
            onChange={handleLanguageChange}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
          </select>
        </div>

        {/* Keyboard Shortcuts */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Keyboard Shortcuts
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                Quick navigation keys
              </p>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>
              ⌨️
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Go to Dashboard', key: 'H' },
              { label: 'Book Ticket', key: 'B' },
              { label: 'My Tickets', key: 'T' },
              { label: 'Wallet', key: 'W' },
              { label: 'Close Sidebar / Escape', key: 'Esc' },
              { label: 'Skip to Content', key: 'Tab' },
            ].map((shortcut) => (
              <div key={shortcut.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{shortcut.label}</span>
                <kbd style={{ background: '#1e293b', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.1)' }}>{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        </div>

        {/* App Version */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.app_version_title')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('settings.app_version_subtitle')}</p>
          </div>
          <span className="badge badge-info">{t('settings.latest')}</span>
        </div>
        </GlassCard>

        {/* RIGHT COLUMN: Accessibility */}
        <GlassCard style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}>
              ♿
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>{t('settings.accessibility_title')}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{t('settings.accessibility_subtitle')}</p>
            </div>
          </div>

          {/* Toggle: Step-free / accessible routing */}
          <div
            onClick={toggleAccessible}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', marginBottom: '20px',
              background: accessible ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
              border: accessible ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {t('settings.step_free_title')}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('settings.step_free_desc')}
              </p>
            </div>
            {/* Toggle switch */}
            <div style={{
              width: '50px', height: '28px', borderRadius: '14px',
              background: accessible ? '#6366f1' : 'var(--border-color)',
              position: 'relative', flexShrink: 0,
              transition: 'background 0.2s ease',
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#fff', position: 'absolute',
                top: '3px',
                left: accessible ? '25px' : '3px',
                transition: 'left 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {/* GMRC accessibility features list */}
          <p style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px',
          }}>
            {t('settings.gmrc_features_title')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ACCESSIBILITY_FEATURES.map(feature => (
              <div key={feature.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '16px',
                padding: '14px 18px',
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                  {feature.icon}
                </span>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {feature.name}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '4px' }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
