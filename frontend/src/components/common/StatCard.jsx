// frontend/src/components/common/StatCard.jsx
// Dashboard stat card with icon, value, label, and optional trend indicator
export default function StatCard({ icon, value, label, trend, color = 'var(--accent-primary)' }) {
  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            {label}
          </p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {value}
          </h3>
          {trend && (
            <p style={{
              fontSize: '0.8rem',
              marginTop: '4px',
              color: trend > 0 ? 'var(--success)' : 'var(--danger)',
              fontWeight: 500,
            }}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
