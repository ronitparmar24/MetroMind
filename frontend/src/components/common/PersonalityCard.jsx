// frontend/src/components/common/PersonalityCard.jsx
import { useState, useEffect } from 'react';
import { getPersonality } from '../../api/analytics.api';

const ICON_MAP = {
  sunrise: '🌅',
  zap: '⚡',
  compass: '🧭',
  brain: '🧠',
  scale: '⚖️',
  lock: '🔒',
};

const STAT_LABELS = [
  { key: 'earlyBirdRatio', label: 'Early Bird', color: '#f59e0b' },
  { key: 'rushHourRatio', label: 'Rush Hour', color: '#ef4444' },
  { key: 'weekendRatio', label: 'Weekend', color: '#6366f1' },
  { key: 'smartRatio', label: 'Smart', color: '#22c55e' },
];

export default function PersonalityCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonality()
      .then((res) => setData(res.data.personality))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="skeleton" style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '8px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '300px', height: '14px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isNewcomer = data.type === 'Newcomer';

  return (
    <div
      className="glass-card"
      style={{
        padding: '28px',
        marginBottom: '24px',
        maxWidth: '600px',
        opacity: isNewcomer ? 0.75 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient accent stripe */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: isNewcomer
          ? 'var(--border-color)'
          : 'var(--gradient-primary)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: isNewcomer ? '16px' : '20px' }}>
        {/* Large icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-lg)',
          background: isNewcomer ? 'var(--bg-tertiary)' : 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          flexShrink: 0,
          boxShadow: isNewcomer ? 'none' : 'var(--shadow-glow)',
        }}>
          {ICON_MAP[data.icon] || '🚇'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Personality name */}
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '4px',
            ...(isNewcomer ? { color: 'var(--text-muted)' } : {
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }),
          }}>
            {data.type}
          </h3>

          {/* Description */}
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: 1.4,
          }}>
            {data.description}
          </p>
        </div>
      </div>

      {/* Newcomer: progress bar */}
      {isNewcomer && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}>
            <span>{data.message}</span>
            <span>{data.tripsCompleted}/{data.tripsRequired}</span>
          </div>
          <div style={{
            height: '6px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(data.tripsCompleted / data.tripsRequired) * 100}%`,
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Unlocked: stat bars */}
      {!isNewcomer && data.stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STAT_LABELS.map(({ key, label, color }) => {
            const value = data.stats[key] || 0;
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  width: '72px',
                  flexShrink: 0,
                  textAlign: 'right',
                }}>
                  {label}
                </span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${value * 100}%`,
                    background: color,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  width: '36px',
                  fontWeight: 600,
                }}>
                  {Math.round(value * 100)}%
                </span>
              </div>
            );
          })}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
            Based on {data.totalTrips} completed trips
          </p>
        </div>
      )}
    </div>
  );
}
