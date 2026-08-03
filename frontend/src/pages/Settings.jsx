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

      <GlassCard style={{ maxWidth: '600px', padding: '28px' }}>
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

        {/* ═══ ACCESSIBILITY SECTION ═══ */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t('settings.accessibility_title')}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
                {t('settings.accessibility_subtitle')}
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
                {t('settings.step_free_title')}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t('settings.step_free_desc')}
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
            {t('settings.gmrc_features_title')}
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
            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('settings.app_version_title')}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('settings.app_version_subtitle')}</p>
          </div>
          <span className="badge badge-info">{t('settings.latest')}</span>
        </div>
      </GlassCard>
    </div>
  );
}
