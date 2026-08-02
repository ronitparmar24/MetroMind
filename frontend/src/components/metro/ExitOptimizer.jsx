// frontend/src/components/metro/ExitOptimizer.jsx
import { useState } from 'react';

export default function ExitOptimizer({ destination = 'Navrangpura' }) {
  const [selectedExit, setSelectedExit] = useState('North (Mall)');

  const exits = [
    { name: 'North (Mall)', coach: 1, door: 2, icon: 'shopping_bag' },
    { name: 'South (Offices)', coach: 6, door: 1, icon: 'business_center' },
    { name: 'East (Bus Stand)', coach: 3, door: 4, icon: 'directions_bus' },
  ];

  const currentOptimization = exits.find(e => e.name === selectedExit);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '24px',
      padding: '20px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ background: '#f43f5e', color: '#fff', padding: '6px', borderRadius: '50%', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>meeting_room</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Exit Optimizer
          </h3>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Destination: <strong>{destination}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {exits.map(exit => (
          <button
            key={exit.name}
            onClick={() => setSelectedExit(exit.name)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: `1px solid ${selectedExit === exit.name ? '#f43f5e' : 'var(--border-color)'}`,
              background: selectedExit === exit.name ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-primary)',
              color: selectedExit === exit.name ? '#f43f5e' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{exit.icon}</span>
            {exit.name}
          </button>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), rgba(244, 63, 94, 0.15))',
        borderRadius: '16px', padding: '16px',
        display: 'flex', alignItems: 'center', gap: '16px',
        border: '1px solid rgba(244, 63, 94, 0.2)'
      }}>
        <div style={{ textAlign: 'center', minWidth: '60px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', lineHeight: 1 }}>
            {currentOptimization.coach}
          </div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#f43f5e', letterSpacing: '0.05em' }}>
            Coach
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(244, 63, 94, 0.2)', height: '40px' }} />
        <div style={{ textAlign: 'center', minWidth: '60px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f43f5e', lineHeight: 1 }}>
            {currentOptimization.door}
          </div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#f43f5e', letterSpacing: '0.05em' }}>
            Door
          </div>
        </div>
        <div style={{ flex: 1, paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Fastest Exit Route
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Board here to step off directly in front of the {currentOptimization.name} escalator.
          </div>
        </div>
      </div>
    </div>
  );
}
