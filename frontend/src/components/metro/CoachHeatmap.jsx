// frontend/src/components/metro/CoachHeatmap.jsx
// Visual Coach-by-Coach Crowd Heatmap & Platform Boarding Helper
import { useState, useMemo } from 'react';

const MOCK_COACHES = [
  { id: 1, type: 'General', level: 'low', pct: 28, temp: '22°C', seatsLeft: 18, label: 'Coach 1 (Front)' },
  { id: 2, type: 'General', level: 'high', pct: 88, temp: '24°C', seatsLeft: 2, label: 'Coach 2' },
  { id: 3, type: 'General', level: 'med', pct: 62, temp: '23°C', seatsLeft: 8, label: 'Coach 3' },
  { id: 4, type: 'General', level: 'low', pct: 22, temp: '21°C', seatsLeft: 22, label: 'Coach 4 (Recommended)' },
  { id: 5, type: 'Women Only', level: 'low', pct: 35, temp: '22°C', seatsLeft: 15, label: 'Coach 5 (Reserved)' },
  { id: 6, type: 'General', level: 'med', pct: 54, temp: '23°C', seatsLeft: 10, label: 'Coach 6 (Rear)' },
];

const CROWD_STYLES = {
  low: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', status: 'Light' },
  med: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', status: 'Moderate' },
  high: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', status: 'Heavy' },
};

export default function CoachHeatmap({ stationName = 'Kalupur Railway Station' }) {
  const [selectedCoach, setSelectedCoach] = useState(MOCK_COACHES[3]); // Default to Coach 4

  const bestCoach = useMemo(() => {
    return [...MOCK_COACHES].sort((a, b) => a.pct - b.pct)[0];
  }, []);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '24px',
      padding: '20px 24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-primary)', fontSize: '20px' }}>
              directions_subway
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Train Coach Density Heatmap
            </h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Live platform boarding guide for {stationName.replace(' Railway Station', ' Ry.')}
          </p>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '9999px',
          background: 'rgba(16,185,129,0.1)', color: '#10B981',
          fontSize: '0.75rem', fontWeight: 600,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
          Live Sensors Active
        </div>
      </div>

      {/* Recommended Coach Alert Banner */}
      {bestCoach && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.08))',
          border: '1px solid rgba(79,70,229,0.2)',
          borderRadius: '16px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '18px', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined">psychology</span>
          </div>
          <div style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <strong>Smart Boarding Tip:</strong> Board at <strong>Platform Marker #{bestCoach.id}</strong> ({bestCoach.label}).
            Only <strong>{bestCoach.pct}% filled</strong> with approx <strong>{bestCoach.seatsLeft} open seats</strong>!
          </div>
        </div>
      )}

      {/* Visual Train Engine & Coaches Strip */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          overflowX: 'auto', paddingBottom: '10px',
          scrollbarWidth: 'thin',
        }}>
          {/* Train Front / Engine Icon */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 10px', borderRadius: '12px 4px 4px 12px',
            background: 'linear-gradient(135deg, #374151, #1F2937)',
            color: '#fff', flexShrink: 0, minWidth: '44px', height: '64px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>subway</span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em' }}>ENGINE</span>
          </div>

          {/* Individual Coaches */}
          {MOCK_COACHES.map((coach) => {
            const style = CROWD_STYLES[coach.level];
            const isSelected = selectedCoach.id === coach.id;
            const isBest = bestCoach.id === coach.id;

            return (
              <button
                key={coach.id}
                onClick={() => setSelectedCoach(coach)}
                style={{
                  flex: 1,
                  minWidth: '80px',
                  height: '64px',
                  borderRadius: '12px',
                  background: isSelected ? style.bg : 'var(--bg-tertiary)',
                  border: isSelected ? `2px solid ${style.color}` : '1.5px solid var(--border-color)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.2,0.8,0.2,1)',
                  position: 'relative',
                  outline: 'none',
                  boxShadow: isSelected ? `0 4px 14px ${style.color}33` : 'none',
                }}
              >
                {/* Best Coach Ribbon */}
                {isBest && (
                  <span style={{
                    position: 'absolute', top: '-8px', right: '6px',
                    background: '#10B981', color: '#fff', fontSize: '9px', fontWeight: 800,
                    padding: '1px 6px', borderRadius: '9999px', textTransform: 'uppercase',
                    boxShadow: '0 2px 6px rgba(16,185,129,0.4)',
                  }}>BEST</span>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    C{coach.id}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: style.color }}>
                    {coach.pct}%
                  </span>
                </div>

                {/* Progress bar inside coach */}
                <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${coach.pct}%`, height: '100%',
                    background: style.color, borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                <div style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'left' }}>
                  {coach.type === 'Women Only' ? '🚺 Reserved' : style.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Coach Detailed Specs */}
      {selectedCoach && (
        <div style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '16px',
          padding: '14px 18px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{selectedCoach.label}</span>
              {selectedCoach.type === 'Women Only' && (
                <span style={{ fontSize: '11px', background: '#EC4899', color: '#fff', padding: '2px 8px', borderRadius: '9999px' }}>
                  Women Only
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Target Boarding Spot: <strong>Platform Marker #{selectedCoach.id}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seats Left</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#10B981' }}>~{selectedCoach.seatsLeft}</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AC Temp</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedCoach.temp}</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Crowd Level</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: CROWD_STYLES[selectedCoach.level].color }}>
                {CROWD_STYLES[selectedCoach.level].status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
