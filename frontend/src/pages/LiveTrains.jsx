// frontend/src/pages/LiveTrains.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import GlassCard from '../components/common/GlassCard';
import CrowdBadge from '../components/booking/CrowdBadge';
import StationSelector from '../components/booking/StationSelector';
import { getLiveTrains } from '../api/predict.api';
import { BLUE_LINE_STATIONS, RED_LINE_STATIONS } from '../constants/stations';

export default function LiveTrains() {
  const [time, setTime] = useState(new Date());
  const [selectedStation, setSelectedStation] = useState('');
  const [departures, setDepartures] = useState([]);
  const [stationLine, setStationLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch departures from API when station changes
  const fetchDepartures = useCallback(async () => {
    if (!selectedStation) return;
    setLoading(true);
    try {
      const res = await getLiveTrains(selectedStation);
      setDepartures(res.data.departures || []);
      setStationLine(res.data.line || '');
    } catch {
      setDepartures([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStation]);

  useEffect(() => { fetchDepartures(); }, [fetchDepartures]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!selectedStation) return;
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, [selectedStation, fetchDepartures]);

  // On-time performance stat
  const onTimeCount = useMemo(() => departures.filter(d => d.isOnTime).length, [departures]);
  const totalCount = departures.length;

  const lineColor = stationLine === 'red' ? '#ef4444' : '#3b82f6';

  // ── Simulated train positions (kept from original for the overview cards) ──
  const getTrainPosition = (line, index) => {
    const minute = time.getMinutes() + time.getSeconds() / 60;
    const stations = line === 'blue' ? BLUE_LINE_STATIONS : RED_LINE_STATIONS;
    const pos = (minute / 5 + index * 3) % stations.length;
    const stationIndex = Math.floor(pos);
    const progress = pos - stationIndex;
    return {
      currentStation: stations[stationIndex]?.name || 'Depot',
      nextStation: stations[(stationIndex + 1) % stations.length]?.name || 'Depot',
      progress: Math.round(progress * 100),
    };
  };

  const blueTrains = [0, 1, 2].map(i => ({ id: `BL-${i + 1}`, ...getTrainPosition('blue', i) }));
  const redTrains = [0, 1].map(i => ({ id: `RL-${i + 1}`, ...getTrainPosition('red', i) }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Live Trains 🚇</h1>
        <p className="page-subtitle">
          Real-time positions & ML-powered delay predictions · {time.toLocaleTimeString('en-IN')}
        </p>
      </div>

      {/* ── Train overview (Blue + Red lines) ── */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px', color: '#3b82f6' }}>
        🔵 Blue Line
      </h3>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {blueTrains.map(t => (
          <GlassCard key={t.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6' }}>{t.id}</span>
              <span className="badge badge-success">On Time</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>At: <strong style={{ color: 'var(--text-primary)' }}>{t.currentStation}</strong></p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Next: {t.nextStation}</p>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${t.progress}%`, height: '100%', background: '#3b82f6', borderRadius: 'var(--radius-full)', transition: 'width 5s linear' }} />
            </div>
          </GlassCard>
        ))}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px', color: '#ef4444' }}>
        🔴 Red Line
      </h3>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-2xl)' }}>
        {redTrains.map(t => (
          <GlassCard key={t.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#ef4444' }}>{t.id}</span>
              <span className="badge badge-success">On Time</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>At: <strong style={{ color: 'var(--text-primary)' }}>{t.currentStation}</strong></p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Next: {t.nextStation}</p>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${t.progress}%`, height: '100%', background: '#ef4444', borderRadius: 'var(--radius-full)', transition: 'width 5s linear' }} />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Station departure board ── */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        paddingTop: 'var(--space-xl)',
        marginTop: 'var(--space-lg)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.4rem',
          marginBottom: 'var(--space-lg)',
        }}>
          📋 Station Departure Board
        </h2>

        <GlassCard style={{ padding: '24px', maxWidth: '500px', marginBottom: 'var(--space-xl)' }}>
          <StationSelector
            label="Select Station"
            value={selectedStation}
            onChange={(v) => { setSelectedStation(v); setExpandedRow(null); }}
          />
        </GlassCard>

        {/* On-time performance stat */}
        {departures.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: onTimeCount === totalCount ? 'var(--success-bg)' : 'var(--warning-bg)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-lg)',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: onTimeCount === totalCount ? 'var(--success)' : 'var(--warning)',
          }}>
            <span style={{ fontSize: '1.1rem' }}>
              {onTimeCount === totalCount ? '✅' : '⚠️'}
            </span>
            {onTimeCount}/{totalCount} trains on time right now
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: '80px', height: '16px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ width: '120px', height: '16px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px', marginLeft: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Departure rows */}
        {!loading && departures.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '90px 100px 1fr 1fr 100px 100px',
              gap: '12px',
              padding: '10px 20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              <span>Train</span>
              <span>Departs</span>
              <span>Next Station</span>
              <span>Terminal</span>
              <span>Crowd</span>
              <span>Status</span>
            </div>

            {departures.map((dep, idx) => (
              <div key={dep.trainId}>
                {/* Main row */}
                <div
                  className="glass-card"
                  style={{
                    padding: '14px 20px',
                    borderRadius: dep.rippleWarning && expandedRow === idx
                      ? 'var(--radius-md) var(--radius-md) 0 0'
                      : 'var(--radius-md)',
                    cursor: dep.rippleWarning ? 'pointer' : 'default',
                    display: 'grid',
                    gridTemplateColumns: '90px 100px 1fr 1fr 100px 100px',
                    gap: '12px',
                    alignItems: 'center',
                    borderLeft: dep.delay > 0
                      ? '3px solid #f59e0b'
                      : `3px solid ${lineColor}`,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    if (dep.rippleWarning) {
                      setExpandedRow(expandedRow === idx ? null : idx);
                    }
                  }}
                >
                  {/* Train ID */}
                  <span style={{
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: lineColor,
                  }}>
                    {dep.trainId}
                  </span>

                  {/* Departure time with delay */}
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {dep.departureDisplay}
                    </span>
                    {dep.delay > 0 && (
                      <span style={{
                        color: '#f59e0b',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        marginLeft: '4px',
                      }}>
                        (+{dep.delay}m)
                      </span>
                    )}
                  </div>

                  {/* Next station */}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {dep.nextStation}
                  </span>

                  {/* Terminal */}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    → {dep.terminal}
                  </span>

                  {/* Crowd badge */}
                  <CrowdBadge level={dep.crowdBucket} />

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {dep.isOnTime ? (
                      <span className="badge badge-success">On Time</span>
                    ) : (
                      <span className="badge badge-warning">+{dep.delay} min</span>
                    )}
                    {dep.rippleWarning && (
                      <span style={{
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        transform: expandedRow === idx ? 'rotate(180deg)' : 'rotate(0)',
                      }}>
                        ▾
                      </span>
                    )}
                  </div>
                </div>

                {/* Ripple warning banner (expandable) */}
                {dep.rippleWarning && expandedRow === idx && (
                  <div style={{
                    padding: '12px 20px 12px 23px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderLeft: '3px solid #f59e0b',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'fadeInUp 0.2s ease',
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                    <div>
                      <p style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#f59e0b',
                        marginBottom: '2px',
                      }}>
                        Connection Warning
                      </p>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                      }}>
                        {dep.rippleWarning}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !selectedStation && (
          <GlassCard style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
            <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🚉</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Select a station above to see upcoming departures with ML-powered delay predictions
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
