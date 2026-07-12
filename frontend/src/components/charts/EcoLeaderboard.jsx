// frontend/src/components/charts/EcoLeaderboard.jsx
// Community CO2 leaderboard — shows top 5 eco commuters with anonymized names,
// medal icons for top 3, and the requesting user's own rank.

import { useState, useEffect } from 'react';
import { getLeaderboard } from '../../api/analytics.api';

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function EcoLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="skeleton" style={{ width: '200px', height: '22px', borderRadius: '8px', marginBottom: '16px' }} />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ flex: 1, height: '16px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '60px', height: '16px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || !data.top5?.length) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🌿</p>
        <p style={{ color: 'var(--text-secondary)' }}>No leaderboard data yet. Start taking trips to build the community board!</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
          🌍 Eco Leaderboard
        </h3>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          padding: '4px 10px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
        }}>
          {data.totalParticipants} commuter{data.totalParticipants !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Top 5 list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {data.top5.map((entry) => (
          <div
            key={entry.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: entry.isCurrentUser
                ? 'rgba(99, 102, 241, 0.12)'
                : 'var(--bg-tertiary)',
              border: entry.isCurrentUser
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Rank */}
            <span style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: entry.rank <= 3 ? '1.2rem' : '0.85rem',
              fontWeight: 700,
              color: entry.rank <= 3 ? undefined : 'var(--text-muted)',
              background: entry.rank > 3 ? 'var(--bg-secondary)' : 'transparent',
              borderRadius: 'var(--radius-full)',
            }}>
              {entry.rank <= 3 ? MEDAL_ICONS[entry.rank - 1] : `#${entry.rank}`}
            </span>

            {/* Leaf + Name */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem' }}>🌿</span>
              <span style={{
                fontWeight: entry.isCurrentUser ? 700 : 500,
                fontSize: '0.9rem',
                color: entry.isCurrentUser ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}>
                {entry.isCurrentUser ? 'You' : entry.name}
              </span>
              {entry.isCurrentUser && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  You
                </span>
              )}
            </div>

            {/* CO2 saved */}
            <span style={{
              fontWeight: 600,
              fontSize: '0.85rem',
              color: 'var(--success)',
              whiteSpace: 'nowrap',
            }}>
              {entry.totalCO2} kg
            </span>
          </div>
        ))}
      </div>

      {/* Current user's rank if not in top 5 */}
      {!data.isInTop5 && (
        <div style={{
          marginTop: '16px',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px dashed rgba(99, 102, 241, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              width: '32px',
              textAlign: 'center',
            }}>
              #{data.currentUserRank}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
              Your Rank
            </span>
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--success)' }}>
            {data.currentUserCO2} kg CO2
          </span>
        </div>
      )}

      <p style={{
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '12px',
      }}>
        Ranked by total CO2 saved across all trips
      </p>
    </div>
  );
}
