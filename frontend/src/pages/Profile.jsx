// frontend/src/pages/Profile.jsx
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/common/GlassCard';
import { formatDate } from '../utils/formatters';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const fields = [
    { label: 'Full Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phone || 'Not set' },
    { label: 'Loyalty Points', value: user.loyaltyPoints || 0 },
    { label: 'Travel Streak', value: `${user.streakDays || 0} days` },
    { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : 'N/A' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Profile 👤</h1>
        <p className="page-subtitle">Your MetroMind account details</p>
      </div>

      <GlassCard style={{ maxWidth: '600px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: 'var(--radius-full)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 700,
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem' }}>{user.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {fields.map((f) => (
            <div key={f.label} style={{
              display: 'flex', justifyContent: 'space-between', padding: '14px',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.label}</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{f.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
