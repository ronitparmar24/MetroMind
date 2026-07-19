// frontend/src/components/common/PersonalityCard.jsx
import { useState, useEffect } from 'react';
import { getPersonalityProfile } from '../../api/predict.api';

const TYPE_META = {
  'Early Bird':        { icon: '🌅', color: '#f59e0b' },
  'Rush Hour Warrior': { icon: '⚡', color: '#ef4444' },
  'Weekend Explorer':  { icon: '🧭', color: '#6366f1' },
  'Smart Commuter':    { icon: '🧠', color: '#22c55e' },
  'Balanced Traveler': { icon: '⚖️', color: '#0B7DC3' },
};

const RATIO_LABELS = [
  { key: 'earlyMorningRatio', label: 'Early Morning', color: '#f59e0b' },
  { key: 'peakHourRatio', label: 'Peak Hour', color: '#ef4444' },
  { key: 'weekendRatio', label: 'Weekend', color: '#6366f1' },
  { key: 'lowCrowdRatio', label: 'Low Crowd', color: '#22c55e' },
  { key: 'highCrowdRatio', label: 'High Crowd', color: '#E8283B' },
];

export default function PersonalityCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalityProfile()
      .then((res) => {
        const p = res.data.personality;
        if (p && p.totalTrips >= 5) setData(p);
        else setData(null);
      })
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

  const meta = TYPE_META[data.personality] || TYPE_META['Balanced Traveler'];
  const ratios = data.ratios || {};

  return (
    <div
      className="glass-card"
      style={{
        padding: '28px',
        marginBottom: '24px',
        maxWidth: '600px',
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
        background: 'var(--gradient-primary)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        {/* Large icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--gradient-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          flexShrink: 0,
          boxShadow: 'var(--shadow-glow)',
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Personality name */}
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.15rem',
            fontWeight: 700,
            marginBottom: '4px',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {data.personality}
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

      {/* Ratio breakdown bars — powered by Django ML ratios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {RATIO_LABELS.map(({ key, label, color }) => {
          const value = ratios[key] || 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                width: '88px',
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

        {/* Unique stations stat */}
        {ratios.uniqueStations && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'right' }}>
            {ratios.uniqueStations} unique stations visited across {data.totalTrips} trips
          </p>
        )}
      </div>
    </div>
  );
}
