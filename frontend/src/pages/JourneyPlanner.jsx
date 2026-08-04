// frontend/src/pages/JourneyPlanner.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import StationSelector from '../components/booking/StationSelector';
import CrowdBadge from '../components/booking/CrowdBadge';
import { STATIONS } from '../constants/stations';
import { compareRoutes } from '../api/analytics.api';
import { fetchWeather } from '../api/weather.api';
import { geocodeLocation } from '../api/geocode.api';
import { haversine } from '../utils/haversine';
import { formatCurrency } from '../utils/formatters';

const CROWD_ICON = { Low: '🟢', Medium: '🟡', High: '🔴' };

// Walking speed: 5 km/h  ≈ 1 min per 83 m
const WALK_SPEED_KMH = 5;

// ── Nearest-station engine (pure client-side after geocode) ───────────────
function findNearestStations(userLat, userLng, count = 3) {
  return STATIONS
    .filter(s => s.lat && s.lng)
    .map(s => ({
      ...s,
      distanceKm: haversine(userLat, userLng, s.lat, s.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

// Walking minutes from km distance
function walkMinutes(km) {
  return Math.ceil((km / WALK_SPEED_KMH) * 60);
}

// Will I Make It? — given distance to station and minutes until departure
function willMakeIt(distKm, minsUntilTrain) {
  const walkMins = walkMinutes(distKm);
  const buffer   = minsUntilTrain - walkMins;
  return { walkMins, buffer, canMakeIt: buffer >= 2 }; // 2-min platform buffer
}

const LINE_COLORS = {
  blue:   '#2563EB',
  red:    '#DC2626',
  yellow: '#EAB308',
  pink:   '#EC4899',
  purple: '#7C3AED',
};

export default function JourneyPlanner() {
  // ── Route comparison state ───────────────────────────────────────────
  const [source,      setSource]      = useState('');
  const [destination, setDestination] = useState('');
  const [routes,      setRoutes]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const navigate = useNavigate();

  // ── Nearest Station / Will I Make It? state ──────────────────────────
  const [locationQuery,   setLocationQuery]   = useState('');
  const [geoLoading,      setGeoLoading]      = useState(false);

  // ── Weather (for night safety banner) ───────────────────────────────────
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .catch(() => setWeather({ isDark: false, fallback: true }));
  }, []);
  const [geoError,        setGeoError]        = useState('');
  const [resolvedAddr,    setResolvedAddr]     = useState(null);   // { lat, lng, displayName }
  const [nearestResults,  setNearestResults]   = useState([]);     // top 3 stations

  // "Will I Make It?" extra inputs
  const [minsUntilTrain,  setMinsUntilTrain]  = useState('');
  const [makeItResults,   setMakeItResults]   = useState([]);

  // ── Route comparison handlers ─────────────────────────────────────────
  const canCompare = source && destination && source !== destination;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setLoading(true); setError(''); setRoutes([]);
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
        source:     route.source,
        destination: route.destination,
        viaStation: route.viaStation || null,
      },
    });
  };

  // ── Geocode + nearest station handler ────────────────────────────────
  const handleFindNearest = async () => {
    const q = locationQuery.trim();
    if (!q) return;
    setGeoLoading(true);
    setGeoError('');
    setResolvedAddr(null);
    setNearestResults([]);
    setMakeItResults([]);

    try {
      const geo = await geocodeLocation(q);
      setResolvedAddr(geo);
      const nearest = findNearestStations(geo.lat, geo.lng, 3);
      setNearestResults(nearest);
    } catch (err) {
      if (err.response?.status === 404) {
        setGeoError(
          `Location "${q}" not found in Ahmedabad. Try a nearby landmark, area name, or road (e.g. "Bopal", "SG Highway", "Shela Cross Road").`
        );
      } else {
        setGeoError('Geocoding service temporarily unavailable. Try again in a moment.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  // ── Will I Make It? handler ───────────────────────────────────────────
  const handleWillIMakeIt = () => {
    const mins = parseInt(minsUntilTrain, 10);
    if (!nearestResults.length || isNaN(mins) || mins <= 0) return;
    setMakeItResults(
      nearestResults.map(s => ({
        ...s,
        ...willMakeIt(s.distanceKm, mins),
      }))
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Journey Planner 🗺️</h1>
        <p className="page-subtitle">Compare route options, find nearby stations, and check if you'll make it</p>
      </div>

      {/* ── SECTION 1: Route Comparison ───────────────────────────────── */}
      <GlassCard style={{ padding: '28px', maxWidth: '700px', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '18px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          📊 Route Comparison
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', alignItems: 'end' }}>
          <StationSelector label="From" value={source}      onChange={(v) => { setSource(v);      setRoutes([]); }} excludeStation={destination} />
          <StationSelector label="To"   value={destination} onChange={(v) => { setDestination(v); setRoutes([]); }} excludeStation={source} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-lg)' }}>
          <button className="btn btn-secondary" onClick={() => { const t = source; setSource(destination); setDestination(t); setRoutes([]); }} disabled={!source || !destination}>
            🔄 Swap
          </button>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleCompare} disabled={!canCompare || loading} id="compare-routes-btn">
            {loading ? 'Comparing…' : '📊 Compare Routes'}
          </button>
        </div>
      </GlassCard>

      {error && (
        <div style={{ padding: '12px 20px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

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

      {routes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(routes.length, 3)}, 1fr)`, gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {routes.map((route, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', border: route.isRecommended ? '1.5px solid #f59e0b' : '1px solid var(--border-color)', transition: 'all 0.3s ease' }}>
              {route.isRecommended && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                  ⭐ Best Choice
                </div>
              )}
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)', paddingRight: route.isRecommended ? '90px' : 0 }}>
                {route.label}
              </h3>
              {route.viaStation && (
                <span style={{ display: 'inline-block', padding: '3px 10px', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px' }}>
                  via {route.viaStation}
                </span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: route.viaStation ? '0' : '16px', marginBottom: '20px' }}>
                {[
                  { label: '💰 Fare',     value: formatCurrency(route.fare),          bold: true, color: 'var(--accent-primary)' },
                  { label: '⏱️ Time',     value: `${route.estimatedMinutes} min` },
                  { label: '📏 Distance', value: `${route.distance} km` },
                  { label: '👥 Crowd',    value: <CrowdBadge level={route.crowdBucket} /> },
                  { label: '🌿 CO₂ Saved', value: `${route.co2Saved} kg`, color: 'var(--success)' },
                  { label: '🕐 Status',   value: <span className={`badge ${route.isPeak ? 'badge-warning' : 'badge-success'}`}>{route.isPeak ? '⚡ Peak' : '✨ Off-Peak'}</span> },
                ].map(({ label, value, bold, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</span>
                    <span style={{ fontWeight: bold ? 700 : 600, fontSize: bold ? '1.1rem' : undefined, color: color || 'inherit' }}>{value}</span>
                  </div>
                ))}
              </div>
              <button className={`btn ${route.isRecommended ? 'btn-primary' : 'btn-secondary'} btn-lg`} style={{ width: '100%' }} onClick={() => handleSelectRoute(route)} id={`select-route-${idx}`}>
                {route.isRecommended ? '🎯 Select Best Route' : 'Select This Route'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && routes.length === 0 && canCompare && !error && (
        <GlassCard style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto var(--space-xl)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</p>
          <p style={{ color: 'var(--text-secondary)' }}>Select stations above and click <strong>Compare Routes</strong> to see your options</p>
        </GlassCard>
      )}

      {/* Night safety banner — shown when routes are visible and it's dark outside */}
      {routes.length > 0 && weather?.isDark && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px', marginBottom: 'var(--space-xl)', borderRadius: '14px',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(139,92,246,0.3)',
          animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>🌙</span>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '2px' }}>Travelling after dark — stay safe</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>Old High Court</strong> &amp; <strong>Kalupur</strong> stations have well-lit exits and 24 h CCTV security.
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: Nearest Station Finder ────────────────────────── */}
      <GlassCard style={{ padding: '28px', maxWidth: '700px', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          📍 Find Nearest Station
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Enter any Ahmedabad location — area, landmark, or road name
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              id="location-query-input"
              type="text"
              value={locationQuery}
              onChange={e => { setLocationQuery(e.target.value); setGeoError(''); setResolvedAddr(null); setNearestResults([]); setMakeItResults([]); }}
              onKeyDown={e => e.key === 'Enter' && handleFindNearest()}
              placeholder="e.g. Bopal, SG Highway, Shela, Science City…"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: geoError ? '1.5px solid var(--danger)' : '1.5px solid var(--border-color)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleFindNearest}
            disabled={!locationQuery.trim() || geoLoading}
            id="find-nearest-btn"
            style={{ whiteSpace: 'nowrap', minWidth: '120px' }}
          >
            {geoLoading ? '⏳ Searching…' : '🔍 Find'}
          </button>
        </div>

        {/* Error state */}
        {geoError && (
          <div style={{
            marginTop: '12px', padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)', color: 'var(--danger)',
            fontSize: '0.875rem', lineHeight: 1.5, display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0, fontSize: '1rem' }}>⚠️</span>
            <span>{geoError}</span>
          </div>
        )}

        {/* Resolved address confirmation */}
        {resolvedAddr && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📌 <strong>Resolved:</strong> {resolvedAddr.displayName?.split(',').slice(0, 3).join(',')}
          </div>
        )}

        {/* Nearest stations results */}
        {nearestResults.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nearest Metro Stations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nearestResults.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  background: i === 0 ? 'rgba(79,70,229,0.06)' : 'var(--bg-secondary)',
                  border: i === 0 ? '1.5px solid rgba(79,70,229,0.2)' : '1px solid var(--border-color)',
                  gap: '12px', flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      background: LINE_COLORS[s.line] || '#888',
                      boxShadow: `0 0 6px ${LINE_COLORS[s.line] || '#888'}`,
                    }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {i === 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4F46E5', marginRight: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closest</span>}
                        {s.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>
                        {s.line} line
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{(s.distanceKm * 1000).toFixed(0)} m</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>~{walkMinutes(s.distanceKm)} min walk</div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => { setSource(s.name); }}
                      id={`use-station-${s.id}`}
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Will I Make It? sub-section ──────────────────────── */}
            <div style={{ marginTop: '20px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                ⏱️ Will I Make It?
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                How many minutes until your train departs?
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  id="mins-until-train"
                  type="number"
                  min="1"
                  max="120"
                  value={minsUntilTrain}
                  onChange={e => { setMinsUntilTrain(e.target.value); setMakeItResults([]); }}
                  onKeyDown={e => e.key === 'Enter' && handleWillIMakeIt()}
                  placeholder="e.g. 12"
                  style={{
                    width: '100px', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border-color)', background: 'var(--bg-card)',
                    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none',
                  }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>minutes</span>
                <button
                  className="btn btn-primary"
                  onClick={handleWillIMakeIt}
                  disabled={!minsUntilTrain || parseInt(minsUntilTrain, 10) <= 0}
                  id="will-i-make-it-btn"
                  style={{ marginLeft: 'auto' }}
                >
                  Check
                </button>
              </div>

              {makeItResults.length > 0 && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {makeItResults.map(s => (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 'var(--radius-md)', flexWrap: 'wrap', gap: '8px',
                      background: s.canMakeIt ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${s.canMakeIt ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {(s.distanceKm * 1000).toFixed(0)} m · {s.walkMins} min walk
                          {s.canMakeIt
                            ? ` · ${s.buffer} min to spare`
                            : ` · ${Math.abs(s.buffer)} min too slow`}
                        </div>
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.82rem',
                        background: s.canMakeIt ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: s.canMakeIt ? '#16a34a' : '#dc2626',
                      }}>
                        {s.canMakeIt ? '✅ Yes, you can!' : '❌ Too far'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
