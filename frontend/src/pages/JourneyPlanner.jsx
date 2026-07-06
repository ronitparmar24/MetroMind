// frontend/src/pages/JourneyPlanner.jsx
import { useState, useMemo } from 'react';
import GlassCard from '../components/common/GlassCard';
import StationSelector from '../components/booking/StationSelector';
import { STATIONS } from '../constants/stations';
import { calculateFare } from '../utils/fareEngine';
import { formatCurrency } from '../utils/formatters';

export default function JourneyPlanner() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  const result = useMemo(() => {
    if (!source || !destination) return null;
    const src = STATIONS.find(s => s.name === source);
    const dst = STATIONS.find(s => s.name === destination);
    if (!src || !dst) return null;
    const now = new Date();
    const fare = calculateFare(src, dst, now.getHours(), now.getDay(), 1);
    const estTime = Math.round(fare.distance * 2.5); // ~2.5 min per km avg metro speed
    return { ...fare, estimatedMinutes: estTime };
  }, [source, destination]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Journey Planner 🗺️</h1>
        <p className="page-subtitle">Plan your metro route and estimate travel time</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        <GlassCard style={{ padding: '28px' }}>
          <StationSelector label="From" value={source} onChange={setSource} excludeStation={destination} />
          <StationSelector label="To" value={destination} onChange={setDestination} excludeStation={source} />
          <button className="btn btn-secondary" style={{ width: '100%' }}
            onClick={() => { const tmp = source; setSource(destination); setDestination(tmp); }}>
            🔄 Swap Stations
          </button>
        </GlassCard>

        {result && (
          <GlassCard style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '20px' }}>Journey Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Distance</span>
                <span style={{ fontWeight: 600 }}>{result.distance} km</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Est. Time</span>
                <span style={{ fontWeight: 600 }}>{result.estimatedMinutes} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fare</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{formatCurrency(result.perPassenger)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Peak Status</span>
                <span className={`badge ${result.isPeak ? 'badge-warning' : 'badge-success'}`}>
                  {result.isPeak ? '⚡ Peak' : '✨ Off-Peak'}
                </span>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
