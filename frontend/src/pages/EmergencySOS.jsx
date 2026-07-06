// frontend/src/pages/EmergencySOS.jsx
import GlassCard from '../components/common/GlassCard';

const CONTACTS = [
  { label: 'Metro Control Room', number: '079-2657-2900', icon: '🚇' },
  { label: 'Police', number: '100', icon: '🚔' },
  { label: 'Ambulance', number: '108', icon: '🚑' },
  { label: 'Fire Brigade', number: '101', icon: '🚒' },
  { label: 'Women Helpline', number: '1091', icon: '👩' },
];

export default function EmergencySOS() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Emergency SOS 🆘</h1>
        <p className="page-subtitle">Quick access to emergency contacts</p>
      </div>

      <GlassCard style={{
        maxWidth: '500px', padding: '24px', marginBottom: 'var(--space-xl)',
        background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)',
      }}>
        <h3 style={{ color: 'var(--danger)', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px' }}>
          🚨 In case of emergency
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Use the emergency intercom on the metro platform or call any of the numbers below.
          Stay calm and provide your location (station name or train number).
        </p>
      </GlassCard>

      <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CONTACTS.map((c) => (
          <GlassCard key={c.label} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{c.label}</h4>
                  <p style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>
                    {c.number}
                  </p>
                </div>
              </div>
              <a href={`tel:${c.number}`} className="btn btn-primary btn-sm">📞 Call</a>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
