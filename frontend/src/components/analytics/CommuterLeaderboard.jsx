// frontend/src/components/analytics/CommuterLeaderboard.jsx
export default function CommuterLeaderboard() {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '24px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ background: '#f59e0b', color: '#fff', padding: '6px', borderRadius: '50%', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>emoji_events</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Green Commuter Rank
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800
          }}>
            12
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Current Rank</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Top 5% this week</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10b981' }}>5 Days</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transit Streak 🔥</div>
        </div>
      </div>

      {/* Mini leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { rank: 11, name: 'Rahul D.', co2: '4.2 kg' },
          { rank: 12, name: 'You', co2: '4.1 kg', isUser: true },
          { rank: 13, name: 'Sneha P.', co2: '3.9 kg' }
        ].map((u) => (
          <div key={u.rank} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: '8px',
            background: u.isUser ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
            border: u.isUser ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
            fontWeight: u.isUser ? 700 : 500,
            color: u.isUser ? '#10b981' : 'var(--text-secondary)',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '20px', textAlign: 'center', opacity: 0.7 }}>#{u.rank}</span>
              <span>{u.name}</span>
            </div>
            <span>{u.co2}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
