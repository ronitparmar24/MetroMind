// frontend/src/components/metro/StationInfoModal.jsx
// "Know Your Station" detail panel — shows line info, facilities, neighbors
import { useMemo } from 'react';
import { STATIONS, LINES, STATION_FACILITIES, FACILITY_LABELS } from '../../constants/stations';
import { useAccessibility } from '../../hooks/useAccessibility';

const stationById = Object.fromEntries(STATIONS.map(s => [s.id, s]));

function getNeighbors(station) {
  const lineStations = STATIONS
    .filter(s => s.line === station.line)
    .sort((a, b) => a.order - b.order);
  const idx = lineStations.findIndex(s => s.id === station.id);
  return {
    prev: idx > 0 ? lineStations[idx - 1] : null,
    next: idx < lineStations.length - 1 ? lineStations[idx + 1] : null,
    totalOnLine: lineStations.length,
  };
}

export default function StationInfoModal({ station, onClose }) {
  if (!station) return null;

  const line = LINES[station.line];
  const { prev, next, totalOnLine } = useMemo(() => getNeighbors(station), [station]);
  const facilities = STATION_FACILITIES[station.id] || {};
  const { accessible } = useAccessibility();

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeInUp 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          maxWidth: '480px',
          width: '90vw',
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none', fontSize: '1.3rem',
            cursor: 'pointer', color: 'var(--text-muted)',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px',
            fontWeight: 600, color: line?.color || 'var(--text-muted)',
            marginBottom: '4px',
          }}>
            Know Your Station
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: '1.4rem',
            color: 'var(--text-primary)',
          }}>
            {station.name}
            {accessible && <span style={{ marginLeft: '8px', fontSize: '0.9rem' }}>♿</span>}
          </h2>
        </div>

        {/* Line info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '12px',
        }}>
          <span style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: line?.color || '#888',
            flexShrink: 0,
          }} />
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{line?.name || station.line}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Station {station.order} of {totalOnLine}
            </p>
          </div>
        </div>

        {/* Interchange info */}
        {station.interchange && station.interchange.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px',
            background: 'rgba(99, 102, 241, 0.06)',
            border: '1px solid rgba(99, 102, 241, 0.12)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '12px',
            fontSize: '0.85rem',
          }}>
            <span style={{ fontSize: '1rem' }}>⇄</span>
            <span>
              <strong>Interchange station</strong> — connects to{' '}
              {station.interchange.map(l => LINES[l]?.name || l).join(', ')}
            </span>
          </div>
        )}

        {/* Nearest stations */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px',
          }}>
            Nearest Stations
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {prev && (
              <div style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>← Previous</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{prev.name}</p>
              </div>
            )}
            {next && (
              <div style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Next →</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{next.name}</p>
              </div>
            )}
          </div>
          {!prev && !next && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              This is the only station on this line.
            </p>
          )}
        </div>

        {/* Facilities */}
        <div>
          <p style={{
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px',
          }}>
            Station Facilities
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(FACILITY_LABELS).map(([key, { label, icon }]) => {
              const available = facilities[key] !== false;
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 14px',
                  background: available ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  opacity: available ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: '0.85rem', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', color: available ? '#22c55e' : '#ef4444' }}>
                    {available ? '✓' : '✗'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
