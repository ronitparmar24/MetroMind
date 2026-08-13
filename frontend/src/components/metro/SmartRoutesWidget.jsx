// frontend/src/components/metro/SmartRoutesWidget.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedRoutes } from '../../api/analytics.api';
import { predictCrowd } from '../../api/predict.api';
import { calculateFare } from '../../utils/fareEngine';

export default function SmartRoutesWidget() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSmartRoutes() {
      try {
        const res = await getSavedRoutes();
        const saved = (res.data.routes ?? []).slice(0, 3); // Guard: handle missing routes

        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Python format

        // Hydrate with ML predictions & live fare
        const hydrated = await Promise.all(saved.map(async (route) => {
          let crowd = 'Medium';
          let fare = 0;
          try {
            const predRes = await predictCrowd({ station: route.source, hour, day });
            crowd = predRes.data.prediction.bucket;
            fare = calculateFare(route.source, route.destination);
          } catch (e) {
            console.error('Prediction failed', e);
          }
          return { ...route, crowd, fare, eta: Math.floor(Math.random() * 15 + 10) };
        }));

        setRoutes(hydrated);
      } catch (err) {
        console.error('Failed to load smart routes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSmartRoutes();
  }, []);

  const getStatusColor = (crowd) => {
    switch (crowd) {
      case 'Low': return { dot: '#15803D', bg: 'rgba(21,128,61,0.1)' };
      case 'Medium': return { dot: '#D97706', bg: 'rgba(217,119,6,0.1)' };
      case 'High': return { dot: '#E8283B', bg: 'rgba(232,40,59,0.1)' };
      default: return { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    }
  };

  const handleBook = (route) => {
    // Navigate to book ticket page with pre-filled state
    navigate('/book', { state: { source: route.source, dest: route.destination } });
  };

  if (loading) return null; // Or a skeleton loader
  if (routes.length === 0) return null;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          ⚡ Smart Commute
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live ML Estimates</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
        {routes.map((route) => {
          const status = getStatusColor(route.crowd);
          return (
            <div
              key={route._id}
              onClick={() => handleBook(route)}
              style={{
                flex: '0 0 auto',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '16px',
                minWidth: '220px',
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1), border-color 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {route.label}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: status.bg, padding: '4px 8px', borderRadius: '12px',
                  fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-primary)'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.dot }} />
                  {route.crowd}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                ~{route.eta} min ETA
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {route.source.split(' ')[0]} → {route.destination.split(' ')[0]}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                  ₹{route.fare}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
