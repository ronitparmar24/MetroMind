// frontend/src/components/metro/LastMileConnect.jsx
import { useState, useEffect } from 'react';

export default function LastMileConnect({ destination = 'Apparel Park' }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking an API call to a ride-hailing aggregator
    const timer = setTimeout(() => {
      setOptions([
        {
          id: 1,
          type: 'Auto Rickshaw',
          icon: 'local_taxi',
          color: '#fbbf24',
          eta: '3 mins',
          price: '₹40 - ₹50',
          provider: 'Ola Auto'
        },
        {
          id: 2,
          type: 'Cab (Mini)',
          icon: 'directions_car',
          color: '#38bdf8',
          eta: '5 mins',
          price: '₹90 - ₹120',
          provider: 'Uber Go'
        },
        {
          id: 3,
          type: 'City Bus',
          icon: 'directions_bus',
          color: '#ef4444',
          eta: '12 mins',
          price: '₹15',
          provider: 'AMTS'
        }
      ]);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [destination]);

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
        <div style={{ background: 'var(--accent-primary)', color: '#fff', padding: '6px', borderRadius: '50%', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>route</span>
        </div>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Last-Mile Connect
        </h3>
      </div>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        Live transport options from <strong>{destination}</strong>
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div className="auth-spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {options.map((opt) => (
            <div key={opt.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px', borderRadius: '12px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer', transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: opt.color, display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{opt.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{opt.type}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{opt.provider}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{opt.price}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{opt.eta}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
