// frontend/src/pages/FareCalculator.jsx
import { useState, useMemo } from 'react';
import GlassCard from '../components/common/GlassCard';
import StationSelector from '../components/booking/StationSelector';
import { STATIONS } from '../constants/stations';
import { calculateFare } from '../utils/fareEngine';
import { formatCurrency } from '../utils/formatters';
import { calculateCO2Saved, formatCO2 } from '../utils/carbonCalc';

export default function FareCalculator() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);

  const result = useMemo(() => {
    if (!source || !destination) return null;
    const src = STATIONS.find(s => s.name === source);
    const dst = STATIONS.find(s => s.name === destination);
    if (!src || !dst) return null;
    const now = new Date();
    const peak = calculateFare(src, dst, 9, 1, passengers); // Peak: 9am Monday
    const offPeak = calculateFare(src, dst, 14, 1, passengers); // Off-peak: 2pm Monday
    const co2 = calculateCO2Saved(peak.distance, passengers);
    const cabCost = Math.round(peak.distance * 12 * passengers);
    return { peak, offPeak, co2, cabCost };
  }, [source, destination, passengers]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fare Calculator 🧮</h1>
        <p className="page-subtitle">Calculate fares, compare peak vs off-peak</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        <GlassCard style={{ padding: '28px' }}>
          <StationSelector label="From" value={source} onChange={setSource} excludeStation={destination} />
          <StationSelector label="To" value={destination} onChange={setDestination} excludeStation={source} />
          <div className="form-group">
            <label className="form-label">Passengers</label>
            <input type="number" className="form-input" value={passengers}
              onChange={(e) => setPassengers(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))} min={1} max={6} />
          </div>
        </GlassCard>

        {result && (
          <div>
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
              <GlassCard style={{ padding: '20px', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '4px' }}>⚡ Peak Hour</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatCurrency(result.peak.fare)}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCurrency(result.peak.perPassenger)}/person</p>
              </GlassCard>
              <GlassCard style={{ padding: '20px', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, marginBottom: '4px' }}>✨ Off-Peak</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatCurrency(result.offPeak.fare)}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCurrency(result.offPeak.perPassenger)}/person</p>
              </GlassCard>
            </div>

            <GlassCard style={{ padding: '20px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px' }}>Journey Details</h4>
              {[
                ['Distance', `${result.peak.distance} km`],
                ['Cab Fare (est.)', formatCurrency(result.cabCost)],
                ['Savings vs Cab', formatCurrency(result.cabCost - result.peak.fare)],
                ['CO₂ Saved', formatCO2(result.co2)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{l}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</span>
                </div>
              ))}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
