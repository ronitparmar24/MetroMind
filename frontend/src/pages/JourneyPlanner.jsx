// frontend/src/pages/JourneyPlanner.jsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import StationSelector from '../components/booking/StationSelector';
import CrowdBadge from '../components/booking/CrowdBadge';
import { STATIONS } from '../constants/stations';
import { compareRoutes } from '../api/analytics.api';
import { formatCurrency } from '../utils/formatters';

const CROWD_ICON = { Low: '🟢', Medium: '🟡', High: '🔴' };

export default function JourneyPlanner() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const canCompare = source && destination && source !== destination;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setLoading(true);
    setError('');
    setRoutes([]);
    try {
      const res = await compareRoutes(source, destination);
      setRoutes(res.data.routes || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare routes');
    } finally {
      setLoading(false);
    }
  }, [source, destination, canCompare]);

  const handleSelectRoute = (route) => {
    navigate('/book', {
      state: {
        source: route.source,
        destination: route.destination,
        viaStation: route.viaStation || null,
      },
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Journey Planner 🗺️</h1>
        <p className="page-subtitle">Compare route options and pick the smartest path</p>
      </div>

      {/* Station selection */}
      <GlassCard style={{ padding: '28px', maxWidth: '700px', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', alignItems: 'end' }}>
          <StationSelector label="From" value={source} onChange={(v) => { setSource(v); setRoutes([]); }} excludeStation={destination} />
          <StationSelector label="To" value={destination} onChange={(v) => { setDestination(v); setRoutes([]); }} excludeStation={source} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-lg)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => { const tmp = source; setSource(destination); setDestination(tmp); setRoutes([]); }}
            disabled={!source || !destination}
          >
            🔄 Swap
          </button>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
            onClick={handleCompare}
            disabled={!canCompare || loading}
            id="compare-routes-btn"
          >
            {loading ? 'Comparing...' : '📊 Compare Routes'}
          </button>
        </div>
      </GlassCard>

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 20px',
          background: 'var(--danger-bg)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card" style={{ padding: '28px' }}>
              <div className="skeleton" style={{ width: '60%', height: '20px', borderRadius: '8px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '100%', height: '14px', borderRadius: '6px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '80%', height: '14px', borderRadius: '6px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: '6px', marginBottom: '20px' }} />
              <div className="skeleton" style={{ width: '100%', height: '38px', borderRadius: '12px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Route cards */}
      {routes.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(routes.length, 3)}, 1fr)`,
          gap: 'var(--space-lg)',
        }}>
          {routes.map((route, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                border: route.isRecommended
                  ? '1.5px solid #f59e0b'
                  : '1px solid var(--border-color)',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Recommended badge */}
              {route.isRecommended && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                }}>
                  ⭐ Best Choice
                </div>
              )}

              {/* Route label */}
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '4px',
                color: 'var(--text-primary)',
                paddingRight: route.isRecommended ? '90px' : 0,
              }}>
                {route.label}
              </h3>

              {/* Via station badge */}
              {route.viaStation && (
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: 'var(--info-bg)',
                  color: 'var(--info)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}>
                  via {route.viaStation}
                </span>
              )}

              {/* Stats */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: route.viaStation ? '0' : '16px',
                marginBottom: '20px',
              }}>
                {/* Fare */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>💰 Fare</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                    {formatCurrency(route.fare)}
                  </span>
                </div>

                {/* Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>⏱️ Time</span>
                  <span style={{ fontWeight: 600 }}>{route.estimatedMinutes} min</span>
                </div>

                {/* Distance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📏 Distance</span>
                  <span style={{ fontWeight: 600 }}>{route.distance} km</span>
                </div>

                {/* Crowd */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👥 Crowd</span>
                  <CrowdBadge level={route.crowdBucket} />
                </div>

                {/* CO2 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🌿 CO₂ Saved</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>{route.co2Saved} kg</span>
                </div>

                {/* Peak */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🕐 Status</span>
                  <span className={`badge ${route.isPeak ? 'badge-warning' : 'badge-success'}`}>
                    {route.isPeak ? '⚡ Peak' : '✨ Off-Peak'}
                  </span>
                </div>
              </div>

              {/* Select button */}
              <button
                className={`btn ${route.isRecommended ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                style={{ width: '100%' }}
                onClick={() => handleSelectRoute(route)}
                id={`select-route-${idx}`}
              >
                {route.isRecommended ? '🎯 Select Best Route' : 'Select This Route'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && routes.length === 0 && canCompare && !error && (
        <GlassCard style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Select stations above and click <strong>Compare Routes</strong> to see your options
          </p>
        </GlassCard>
      )}
    </div>
  );
}
