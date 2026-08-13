// frontend/src/pages/JourneyPlanner.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StationSelector from '../components/booking/StationSelector';
import CrowdBadge from '../components/booking/CrowdBadge';
import { STATIONS } from '../constants/stations';
import { compareRoutes } from '../api/analytics.api';
import { fetchWeather } from '../api/weather.api';
import { geocodeLocationRouting, getNearestStationsRouting, getShortestPath } from '../api/routing.api';
import { haversine } from '../utils/haversine';
import { formatCurrency } from '../utils/formatters';

// ── Constants ──────────────────────────────────────────────────────────────
const WALK_SPEED_KMH = 5;
// Urban correction: actual road walking is ~1.3× straight-line (Ahmedabad road pattern)
const URBAN_DETOUR = 1.3;
// Platform buffer: 3 min needed to board after arriving at station
const PLATFORM_BUFFER_MINS = 3;
// Metro operational hours
const METRO_OPEN_H  = 6;
const METRO_CLOSE_H = 23;

// Popular quick-pick locations for Ahmedabad
const QUICK_PICKS = [
  'Bopal', 'SG Highway', 'Vastrapur', 'Science City',
  'Navrangpura', 'Maninagar', 'Motera', 'ISKCON',
  'Law Garden', 'Kankaria',
];

const LINE_COLORS = {
  blue: '#2563EB', red: '#DC2626', yellow: '#EAB308',
  pink: '#EC4899', purple: '#7C3AED',
};
const LINE_BG = {
  blue: 'rgba(37,99,235,0.12)', red: 'rgba(220,38,38,0.12)',
  yellow: 'rgba(234,179,8,0.12)', pink: 'rgba(236,72,153,0.12)',
  purple: 'rgba(124,58,237,0.12)',
};

// ── Nearest station engine ──────────────────────────────────────────────────
/**
 * Find nearest N stations.
 * Returns straight-line AND urban-corrected walking distance.
 */
function findNearestStations(userLat, userLng, count = 3) {
  // This is replaced by backend API getNearestStationsRouting
  // Keeping it as a fallback if needed, but the main logic will use the API directly.
  return [];
}

/** Compass bearing from user to station (0–360°) */
function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = d => d * Math.PI / 180;
  const dLon = toRad(lon2 - lon1);
  const x = Math.sin(dLon) * Math.cos(toRad(lat2));
  const y = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2))
          - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}

/** Convert bearing degrees to compass label */
function bearingLabel(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/** Walking minutes from km (already urban-corrected) */
function walkMinutes(km) {
  return Math.ceil((km / WALK_SPEED_KMH) * 60);
}

/** Check metro is currently running */
function metroStatus() {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const isOpen = h >= METRO_OPEN_H && h < METRO_CLOSE_H;
  const minsToOpen  = isOpen ? null : (
    h < METRO_OPEN_H
      ? (METRO_OPEN_H - h) * 60 - m
      : (24 - h + METRO_OPEN_H) * 60 - m
  );
  const minsToClose = isOpen ? (METRO_CLOSE_H - h) * 60 - m : null;
  return { isOpen, minsToOpen, minsToClose, h };
}

/** Estimate auto-rickshaw fare (Ahmedabad: ₹20 base + ₹15/km) */
function rickshawFare(km) {
  return Math.round(20 + 15 * km);
}

/** Will I Make It? — updated to use ORS real duration in minutes */
function willMakeIt(walkMins, minsUntilTrain) {
  const buffer   = minsUntilTrain - walkMins - PLATFORM_BUFFER_MINS;
  return { walkMins, buffer, canMakeIt: buffer >= 0 };
}

// ── Recent searches (localStorage) ─────────────────────────────────────────
const RECENT_KEY = 'mm_nearest_recent';
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(query) {
  const prev = loadRecent().filter(q => q.toLowerCase() !== query.toLowerCase());
  const next = [query, ...prev].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}


/* ── Route Card ── */
function RouteCard({ route, idx, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const colorMap = {
    0: { bg: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.05))', border: route.isRecommended ? '#f59e0b' : 'rgba(99,102,241,0.25)', accent: '#6366f1' },
    1: { bg: 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(20,184,166,0.04))',   border: 'rgba(34,197,94,0.25)',  accent: '#22c55e' },
    2: { bg: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(239,68,68,0.04))',   border: 'rgba(245,158,11,0.3)',  accent: '#f59e0b' },
  };
  const theme = colorMap[idx] || colorMap[0];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '24px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        background: theme.bg,
        border: `1.5px solid ${route.isRecommended ? '#f59e0b' : theme.border}`,
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 48px ${theme.accent}22` : '0 2px 12px rgba(0,0,0,0.06)',
        cursor: 'default',
      }}
    >
      {/* Best Choice badge */}
      {route.isRecommended && (
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: '#000', fontSize: '0.65rem', fontWeight: 800,
          padding: '4px 10px', borderRadius: '20px',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
        }}>
          ⭐ Best Choice
        </div>
      )}

      {/* Route type label */}
      <div style={{ paddingRight: route.isRecommended ? '90px' : 0, marginBottom: '6px' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{route.label}</div>
        {route.viaStation && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            marginTop: '4px', padding: '3px 10px',
            background: 'rgba(99,102,241,0.1)', color: '#6366f1',
            borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
          }}>
            🔀 via {route.viaStation}
          </div>
        )}
        {/* Dijkstra interchange stops: shown only on the Direct Route card */}
        {Array.isArray(route.interchangeStations) && route.interchangeStations.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {route.interchangeStations.map(name => (
              <div key={name} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px',
                background: 'rgba(245,158,11,0.1)', color: '#d97706',
                borderRadius: '20px', fontSize: '0.70rem', fontWeight: 700,
              }}>
                🔄 Change at {name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Big fare */}
      <div style={{ margin: '16px 0 18px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 900, color: theme.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(route.fare)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>total fare</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {[
          { icon: '⏱️', label: 'Journey Time', value: `${route.estimatedMinutes} min` },
          { icon: '📏', label: 'Distance', value: `${route.distance} km` },
          { icon: '👥', label: 'Crowd', value: <CrowdBadge level={route.crowdBucket} /> },
          { icon: '🌿', label: 'CO₂ Saved', value: `${route.co2Saved} kg`, green: true },
          { icon: '🕐', label: 'Status', value: (
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
              background: route.isPeak ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              color: route.isPeak ? '#d97706' : '#16a34a',
            }}>
              {route.isPeak ? '⚡ Peak' : '✨ Off-Peak'}
            </span>
          )},
        ].map(({ icon, label, value, green }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{icon}</span>{label}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: green ? '#22c55e' : 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={() => onSelect(route)}
        id={`select-route-${idx}`}
        style={{
          width: '100%', padding: '13px', borderRadius: '14px', border: 'none',
          background: route.isRecommended
            ? 'linear-gradient(135deg,#6366f1,#a855f7)'
            : `${theme.accent}22`,
          color: route.isRecommended ? 'white' : theme.accent,
          fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: route.isRecommended ? '0 6px 20px rgba(99,102,241,0.35)' : 'none',
        }}
        onMouseEnter={e => { if (route.isRecommended) e.target.style.transform = 'scale(1.01)'; }}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
      >
        {route.isRecommended ? '🎯 Select Best Route' : 'Select This Route'}
      </button>
    </div>
  );
}

/* ── Improved Station Distance Card ── */
function NearestCard({ s, i, onUse, minsUntilTrain }) {
  const [showSteps, setShowSteps] = useState(false);
  const makeIt = minsUntilTrain && !isNaN(parseInt(minsUntilTrain))
    ? willMakeIt(s.durationMinutes, parseInt(minsUntilTrain))
    : null;
  const fare = rickshawFare(s.distanceMeters / 1000);
  const direction = s.bearing != null ? bearingLabel(s.bearing) : null;
  const isInterchange = Array.isArray(s.interchange) && s.interchange.length > 0;

  return (
    <div style={{
      borderRadius: '18px', overflow: 'hidden',
      border: i === 0 ? '1.5px solid rgba(99,102,241,0.3)' : '1px solid var(--border-color)',
      background: i === 0 ? 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(168,85,247,0.03))' : 'var(--bg-secondary)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Line color bar */}
      <div style={{ height: '3px', background: LINE_COLORS[s.line] || '#888' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Rank badge */}
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: i === 0 ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, color: i === 0 ? 'white' : 'var(--text-muted)',
            }}>{i + 1}</div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {i === 0 && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Closest</span>
                )}
                {isInterchange && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px' }}
                    title={`Interchange: connects to ${s.interchange.join(', ')} line`}>
                    🔄 Interchange
                  </span>
                )}
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: LINE_COLORS[s.line] || '#888', boxShadow: `0 0 5px ${LINE_COLORS[s.line] || '#888'}` }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>{s.line} Line</span>
                </div>
                {isInterchange && s.interchange.map(l => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: LINE_COLORS[l] || '#888' }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Distance block */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {s.distanceMeters < 1000
                ? `${s.distanceMeters} m`
                : `${(s.distanceMeters / 1000).toFixed(2)} km`}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>
              🚶 {s.durationMinutes} min walk
            </div>
            {direction && (
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: LINE_COLORS[s.line] || 'var(--text-muted)', marginTop: '1px' }}>
                🧭 Head {direction}
              </div>
            )}
          </div>
        </div>

        {/* Info pills row */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {/* Straight-line note */}
          {s.straightDistKm && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)', fontWeight: 600 }}>
              {Math.round(s.straightDistKm * 1000)} m as-the-crow-flies
            </span>
          )}
          {/* Rickshaw fallback fare */}
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)', fontWeight: 600 }}>
            🚨 Auto ₹{fare}
          </span>
          {s.steps && s.steps.length > 0 && (
            <button onClick={() => setShowSteps(!showSteps)} style={{ fontSize: '0.65rem', color: '#6366f1', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {showSteps ? 'Hide Directions' : 'Show Directions'}
            </button>
          )}
        </div>

        {showSteps && s.steps && s.steps.length > 0 && (
          <div style={{ marginTop: '12px', padding: '10px', borderRadius: '10px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Walking Directions</div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {s.steps.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Will I Make It — inline */}
        {makeIt && (
          <div style={{
            marginTop: '12px', padding: '10px 12px', borderRadius: '12px',
            background: makeIt.canMakeIt ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
            border: `1px solid ${makeIt.canMakeIt ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>⏱️ {makeIt.walkMins} min walk + {PLATFORM_BUFFER_MINS} min platform</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {makeIt.canMakeIt
                    ? `✔️ ${makeIt.buffer} min buffer — you're good`
                    : `⚠️ ${Math.abs(makeIt.buffer)} min short — leave now or take auto`}
                </div>
              </div>
              <div style={{
                fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '10px', flexShrink: 0, marginLeft: '8px',
                background: makeIt.canMakeIt ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: makeIt.canMakeIt ? '#16a34a' : '#dc2626',
              }}>
                {makeIt.canMakeIt ? '✅ Make It' : '❌ Too Far'}
              </div>
            </div>
          </div>
        )}

        {/* Use button */}
        <button
          onClick={() => onUse(s.name)}
          id={`use-station-${s.id}`}
          style={{
            marginTop: '12px', width: '100%', padding: '8px 12px', borderRadius: '10px',
            border: `1px solid ${LINE_COLORS[s.line] || 'var(--border-color)'}`,
            background: LINE_BG[s.line] || 'var(--bg-tertiary)',
            color: LINE_COLORS[s.line] || 'var(--text-secondary)',
            fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          📍 Use as Starting Station → Route Planner
        </button>
      </div>
    </div>
  );
}

export default function JourneyPlanner() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [locationQuery, setLocationQuery] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [resolvedAddr, setResolvedAddr] = useState(null);
  const [nearestResults, setNearestResults] = useState([]);
  const [minsUntilTrain, setMinsUntilTrain] = useState('');
  const [recentSearches, setRecentSearches] = useState(loadRecent);
  const [metroStat] = useState(metroStatus);

  const [weather, setWeather] = useState(null);
  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => setWeather({ isDark: false, fallback: true }));
  }, []);

  const clearNearest = () => { setGeoError(''); setResolvedAddr(null); setNearestResults([]); };


  const canCompare = source && destination && source !== destination;

  const handleCompare = useCallback(async () => {
    if (!canCompare) return;
    setLoading(true); setError(''); setRoutes([]);
    try {
      // Find the station objects for both selections so we have their IDs
      const srcStation  = STATIONS.find(s => s.name === source);
      const destStation = STATIONS.find(s => s.name === destination);

      // Fire both requests in parallel:
      //   (1) full multi-route comparison (fare, crowd, CO₂)
      //   (2) Dijkstra shortest-path for the Direct Route card
      const [compareRes, dijkstraRes] = await Promise.allSettled([
        compareRoutes(source, destination),
        srcStation && destStation
          ? getShortestPath(srcStation.id, destStation.id)
          : Promise.resolve(null),
      ]);

      const fetchedRoutes = compareRes.status === 'fulfilled'
        ? (compareRes.value.data.routes || [])
        : [];

      if (compareRes.status === 'rejected') {
        throw compareRes.reason;
      }

      // Stitch the Dijkstra result into Route 1 ("Direct Route")
      if (
        dijkstraRes.status === 'fulfilled' &&
        dijkstraRes.value &&
        !dijkstraRes.value.error
      ) {
        const algoResult = dijkstraRes.value;
        const directIdx  = fetchedRoutes.findIndex(r => r.label === 'Direct Route');
        if (directIdx !== -1) {
          fetchedRoutes[directIdx] = {
            ...fetchedRoutes[directIdx],
            // Replace haversine estimate with real Dijkstra travel time
            estimatedMinutes: algoResult.totalMinutes,
            // Expose the interchange stations computed by the algorithm
            interchangeCount:    algoResult.interchangeCount,
            interchangeStations: algoResult.interchangeStations,
            // Full ordered path (for potential future step-by-step display)
            dijkstraPath: algoResult.stations,
          };
        }
      }

      setRoutes(fetchedRoutes);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare routes');
    } finally {
      setLoading(false);
    }
  }, [source, destination, canCompare]);

  const handleSelectRoute = (route) => {
    navigate('/book', {
      state: { source: route.source, destination: route.destination, viaStation: route.viaStation || null },
    });
  };

  const handleFindNearest = async () => {
    const q = locationQuery.trim();
    if (!q) return;
    setGeoLoading(true); setGeoError(''); setResolvedAddr(null); setNearestResults([]);
    try {
      const geo = await geocodeLocationRouting(q);
      setResolvedAddr({ ...geo, displayName: geo.label });
      const stations = await getNearestStationsRouting(geo.lat, geo.lng);
      setNearestResults(stations);
      
      saveRecent(q);
      setRecentSearches(loadRecent());
    } catch (err) {
      if (err.response?.status === 404 || err.message === 'Location not found') {
        setGeoError(`"${q}" not found. Try a landmark, area, or road name.`);
      } else {
        setGeoError('Location service unavailable. Please try again.');
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported by your browser.'); return; }
    setGeoLoading(true); setGeoError(''); setResolvedAddr(null); setNearestResults([]);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setResolvedAddr({ lat, lng, displayName: 'Your current GPS location' });
        try {
          const stations = await getNearestStationsRouting(lat, lng);
          setNearestResults(stations);
        } catch (e) {
          setGeoError('Failed to find nearest stations from GPS location.');
        }
        setGeoLoading(false);
      },
      (e) => {
        const msg = e.code === 1
          ? 'Location permission denied. Please allow access in browser settings.'
          : 'Could not determine your location. Try searching manually.';
        setGeoError(msg); setGeoLoading(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleQuickPick = (label) => {
    setLocationQuery(label);
    clearNearest();
    // trigger search immediately
    setTimeout(async () => {
      setGeoLoading(true);
      try {
        const geo = await geocodeLocationRouting(label);
        setResolvedAddr({ ...geo, displayName: geo.label });
        const stations = await getNearestStationsRouting(geo.lat, geo.lng);
        setNearestResults(stations);
        saveRecent(label);
        setRecentSearches(loadRecent());
      } catch (err) {
        if (err.response?.status === 404 || err.message === 'Location not found') {
          setGeoError(`"${label}" not found. Try a landmark, area, or road name.`);
        } else {
          setGeoError('Location service unavailable. Please try again.');
        }
      } finally {
        setGeoLoading(false);
      }
    }, 0);
  };

  return (
    <div className="page" style={{ maxWidth: '920px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
        @keyframes routeSkeleton { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
        .route-skeleton { animation: routeSkeleton 1.4s ease-in-out infinite; background: var(--bg-tertiary); border-radius: 10px; }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>Journey Planner 🗺️</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.9rem' }}>
          Compare routes, find nearby stations, and check if you'll make it in time
        </p>
      </div>

      {/* ══ SECTION 1: Route Comparison ══ */}
      <div style={{ borderRadius: '24px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', marginBottom: '28px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📊</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Route Comparison</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compare direct, scenic, and off-peak options</div>
          </div>
        </div>

        {/* Station selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end', marginBottom: '18px' }}>
          <StationSelector label="From" value={source} onChange={(v) => { setSource(v); setRoutes([]); }} excludeStation={destination} />

          {/* Swap button */}
          <button
            onClick={() => { const t = source; setSource(destination); setDestination(t); setRoutes([]); }}
            disabled={!source || !destination}
            style={{
              width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid var(--border-color)',
              background: 'var(--bg-tertiary)', cursor: source && destination ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
              transition: 'all 0.2s ease', flexShrink: 0, opacity: source && destination ? 1 : 0.4,
            }}
            onMouseEnter={e => { if (source && destination) e.target.style.transform = 'rotate(180deg)'; }}
            onMouseLeave={e => e.target.style.transform = 'rotate(0deg)'}
          >🔄</button>

          <StationSelector label="To" value={destination} onChange={(v) => { setDestination(v); setRoutes([]); }} excludeStation={source} />
        </div>

        {/* Compare button */}
        <button
          onClick={handleCompare}
          disabled={!canCompare || loading}
          id="compare-routes-btn"
          style={{
            width: '100%', padding: '14px', borderRadius: '16px', border: 'none',
            background: canCompare ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)',
            color: canCompare ? 'white' : 'var(--text-muted)',
            fontWeight: 800, fontSize: '1rem', cursor: canCompare ? 'pointer' : 'not-allowed',
            boxShadow: canCompare ? '0 8px 24px rgba(99,102,241,0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (canCompare && !loading) e.target.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? '⏳ Comparing routes…' : '📊 Compare Routes'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 18px', borderRadius: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.88rem', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ borderRadius: '24px', padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="route-skeleton" style={{ width: '55%', height: '18px', marginBottom: '14px' }} />
              <div className="route-skeleton" style={{ width: '40%', height: '36px', marginBottom: '18px' }} />
              {[85, 70, 60, 50, 75].map((w, j) => (
                <div key={j} className="route-skeleton" style={{ width: `${w}%`, height: '12px', marginBottom: '10px' }} />
              ))}
              <div className="route-skeleton" style={{ width: '100%', height: '40px', marginTop: '8px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Route cards */}
      {routes.length > 0 && (
        <>
          {/* Night safety banner */}
          {weather?.isDark && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 18px', marginBottom: '16px', borderRadius: '14px',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(139,92,246,0.25)',
            }}>
              <span style={{ fontSize: '1.2rem' }}>🌙</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6366f1' }}>Travelling after dark — stay safe</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '1px' }}>Old High Court & Kalupur stations have well-lit exits and 24h CCTV.</div>
              </div>
            </div>
          )}

          <div className="card-grid-3" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(routes.length, 3)}, 1fr)`, gap: '16px', marginBottom: '32px', animation: 'fadeInUp 0.4s ease' }}>
            {routes.map((route, idx) => (
              <RouteCard key={idx} route={route} idx={idx} onSelect={handleSelectRoute} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && routes.length === 0 && canCompare && !error && (
        <div style={{ textAlign: 'center', padding: '40px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📊</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click <strong>Compare Routes</strong> to see your options</p>
        </div>
      )}

      {/* ══ SECTION 2: Nearest Station Finder ══ */}
      <div style={{ borderRadius: '24px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>

        {/* Section header + Metro status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📍</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Find Nearest Station</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Walking distance · Direction · Will I make it?</div>
            </div>
          </div>
          {/* Live metro operational status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px',
            background: metroStat.isOpen ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.07)',
            border: '1px solid ' + (metroStat.isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'),
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: metroStat.isOpen ? '#22c55e' : '#ef4444' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: metroStat.isOpen ? '#16a34a' : '#dc2626' }}>
              {metroStat.isOpen ? 'Metro Open · Closes 23:00' : 'Metro Closed · Opens 06:00'}
            </span>
          </div>
        </div>

        {/* Quick picks */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Quick Pick</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {QUICK_PICKS.map(label => (
              <button key={label} onClick={() => handleQuickPick(label)} style={{
                padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.target.style.borderColor = '#22c55e'; e.target.style.color = '#16a34a'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Recent</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {recentSearches.map(q => (
                <button key={q} onClick={() => handleQuickPick(q)} style={{
                  padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                  background: 'rgba(99,102,241,0.06)', color: '#6366f1',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  🕐 {q}
                </button>
              ))}
              <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecentSearches([]); }} style={{
                padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer',
              }}>✕ Clear</button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
            <input
              id="location-query-input"
              type="text"
              value={locationQuery}
              onChange={e => { setLocationQuery(e.target.value); setGeoError(''); setResolvedAddr(null); setNearestResults([]); }}
              onKeyDown={e => e.key === 'Enter' && handleFindNearest()}
              placeholder="e.g. Bopal, SG Highway, Science City, Shela…"
              style={{
                width: '100%', padding: '12px 14px 12px 40px',
                borderRadius: '14px',
                border: `1.5px solid ${geoError ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`,
                background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = geoError ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}
            />
          </div>
          <button
            onClick={handleFindNearest}
            disabled={!locationQuery.trim() || geoLoading}
            id="find-nearest-btn"
            style={{
              padding: '12px 20px', borderRadius: '14px', border: 'none',
              background: locationQuery.trim() ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'var(--bg-tertiary)',
              color: locationQuery.trim() ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.9rem', cursor: locationQuery.trim() ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap', transition: 'all 0.15s ease',
              boxShadow: locationQuery.trim() ? '0 4px 14px rgba(34,197,94,0.3)' : 'none',
            }}
          >
            {geoLoading ? '⏳' : '🔍 Find'}
          </button>
          <button
            onClick={handleUseGPS}
            disabled={geoLoading}
            title="Use my current GPS location"
            style={{
              padding: '12px 16px', borderRadius: '14px', border: '1.5px solid var(--border-color)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#22c55e'; e.target.style.color = '#22c55e'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            📡 GPS
          </button>
        </div>

        {/* Error */}
        {geoError && (
          <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: '0.83rem', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span>⚠️</span><span>{geoError}</span>
          </div>
        )}

        {/* Resolved address */}
        {resolvedAddr && (
          <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📌</span>
            <span><strong>Found:</strong> {resolvedAddr.displayName?.split(',').slice(0, 3).join(',') || 'Current Location'}</span>
          </div>
        )}

        {/* Nearest stations */}
        {nearestResults.length > 0 && (
          <div style={{ animation: 'fadeInUp 0.35s ease' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Nearest Metro Stations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {nearestResults.map((s, i) => (
                <NearestCard
                  key={s.id}
                  s={s}
                  i={i}
                  onUse={(name) => setSource(name)}
                  minsUntilTrain={minsUntilTrain}
                />
              ))}
            </div>

            {/* Will I Make It — now inline in cards above, but keep the time input */}
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Will I Make It?</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Enter minutes until your train departs — results update instantly on each station card above.
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  id="mins-until-train"
                  type="number"
                  min="1"
                  max="120"
                  value={minsUntilTrain}
                  onChange={e => setMinsUntilTrain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                  placeholder="e.g. 12"
                  style={{
                    width: '110px', padding: '10px 14px', borderRadius: '12px',
                    border: '1.5px solid var(--border-color)', background: 'var(--bg-card)',
                    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>minutes until train</span>
                {minsUntilTrain && (
                  <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#f59e0b', fontWeight: 700 }}>
                    ↑ Results shown on cards above
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Initial state hint */}
        {!nearestResults.length && !geoError && !geoLoading && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📍</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Type your location above or use 📡 GPS to find the nearest metro stations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
