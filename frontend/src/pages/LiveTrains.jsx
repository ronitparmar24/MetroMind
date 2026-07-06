// frontend/src/pages/LiveTrains.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { BLUE_LINE_STATIONS, RED_LINE_STATIONS } from '../constants/stations';

export default function LiveTrains() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate train positions based on current time
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
      delay: Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 1 : 0,
    };
  };

  const blueTrains = [0, 1, 2].map(i => ({ id: `BL-${i + 1}`, ...getTrainPosition('blue', i) }));
  const redTrains = [0, 1].map(i => ({ id: `RL-${i + 1}`, ...getTrainPosition('red', i) }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Live Trains 🚇</h1>
        <p className="page-subtitle">
          Real-time train positions · Updated {time.toLocaleTimeString('en-IN')}
        </p>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px', color: '#3b82f6' }}>
        🔵 Blue Line
      </h3>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {blueTrains.map(t => (
          <GlassCard key={t.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#3b82f6' }}>{t.id}</span>
              {t.delay > 0 ? <span className="badge badge-warning">+{t.delay} min</span>
                : <span className="badge badge-success">On Time</span>}
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
      <div className="grid grid-3">
        {redTrains.map(t => (
          <GlassCard key={t.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#ef4444' }}>{t.id}</span>
              {t.delay > 0 ? <span className="badge badge-warning">+{t.delay} min</span>
                : <span className="badge badge-success">On Time</span>}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>At: <strong style={{ color: 'var(--text-primary)' }}>{t.currentStation}</strong></p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Next: {t.nextStation}</p>
            <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${t.progress}%`, height: '100%', background: '#ef4444', borderRadius: 'var(--radius-full)', transition: 'width 5s linear' }} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
