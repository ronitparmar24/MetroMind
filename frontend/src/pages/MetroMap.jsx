// frontend/src/pages/MetroMap.jsx
import GlassCard from '../components/common/GlassCard';
import { BLUE_LINE_STATIONS, RED_LINE_STATIONS } from '../constants/stations';

export default function MetroMap() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Metro Map 🗾</h1>
        <p className="page-subtitle">Ahmedabad Metro Rail network — Blue & Red lines</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px', color: '#3b82f6' }}>
            🔵 Blue Line (North-South)
          </h3>
          <div style={{ position: 'relative', paddingLeft: '28px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '3px', background: '#3b82f6', borderRadius: '2px' }} />
            {BLUE_LINE_STATIONS.map((s, i) => (
              <div key={s.name} className="stagger-item" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', left: '-22px', width: '12px', height: '12px',
                  borderRadius: '50%', background: '#3b82f6', border: '2px solid var(--bg-primary)',
                  zIndex: 1,
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: i === 0 || i === BLUE_LINE_STATIONS.length - 1 ? 600 : 400 }}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>
            🔴 Red Line (East-West)
          </h3>
          <div style={{ position: 'relative', paddingLeft: '28px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '3px', background: '#ef4444', borderRadius: '2px' }} />
            {RED_LINE_STATIONS.map((s, i) => (
              <div key={s.name} className="stagger-item" style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', left: '-22px', width: '12px', height: '12px',
                  borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-primary)',
                  zIndex: 1,
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: i === 0 || i === RED_LINE_STATIONS.length - 1 ? 600 : 400 }}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
