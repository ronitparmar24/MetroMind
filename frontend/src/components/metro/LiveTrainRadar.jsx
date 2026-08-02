// frontend/src/components/metro/LiveTrainRadar.jsx
import { useState, useEffect } from 'react';

export default function LiveTrainRadar({ homeStation = 'Thaltej' }) {
  // Simulating live train positions
  const [trains, setTrains] = useState([
    { id: 1, pos: 20, direction: 'eastbound' },
    { id: 2, pos: 60, direction: 'westbound' }
  ]);

  useEffect(() => {
    const id = setInterval(() => {
      setTrains(prev => prev.map(t => {
        let newPos = t.direction === 'eastbound' ? t.pos + 2 : t.pos - 2;
        if (newPos > 100) newPos = 0;
        if (newPos < 0) newPos = 100;
        return { ...t, pos: newPos };
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      background: '#0f172a', // Sleek dark mode
      borderRadius: '24px',
      padding: '24px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden',
      color: '#f8fafc'
    }}>
      {/* Radar sweep background */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.1) 100%)',
        animation: 'radarSweep 4s linear infinite',
        transformOrigin: 'center',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes radarPing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#10b981' }}>radar</span>
            Live Train Radar
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#94a3b8' }}>
            Monitoring trains approaching <strong>{homeStation}</strong>
          </p>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
          LIVE
        </div>
      </div>

      {/* The Track */}
      <div style={{ position: 'relative', height: '4px', background: '#334155', borderRadius: '2px', zIndex: 2, marginTop: '20px', marginBottom: '20px' }}>
        {/* Stations */}
        <div style={{ position: 'absolute', top: '-6px', left: '0%', width: '16px', height: '16px', borderRadius: '50%', background: '#475569', border: '3px solid #0f172a' }} title="Vastral Gam" />
        <div style={{ position: 'absolute', top: '-6px', left: '50%', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: '3px solid #0f172a', transform: 'translateX(-50%)', boxShadow: '0 0 10px #10b981' }} title={homeStation} />
        <div style={{ position: 'absolute', top: '-6px', right: '0%', width: '16px', height: '16px', borderRadius: '50%', background: '#475569', border: '3px solid #0f172a' }} title="Thaltej Gam" />

        {/* Trains */}
        {trains.map(t => (
          <div key={t.id} style={{
            position: 'absolute', top: '-4px', left: `${t.pos}%`,
            width: '12px', height: '12px', borderRadius: '50%',
            background: '#38bdf8',
            transition: 'left 2s linear',
            transform: 'translateX(-50%)',
            zIndex: 3
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: '50%', border: '2px solid #38bdf8',
              animation: 'radarPing 1.5s ease-out infinite'
            }} />
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
        <span>East Corridor</span>
        <span style={{ color: '#f8fafc', fontWeight: 600 }}>2 Trains Active</span>
        <span>West Corridor</span>
      </div>
    </div>
  );
}
