// frontend/src/pages/Dashboard.jsx
// MetroMind — Personal commute command center
// Signature element: "My Line Right Now" crowd strip
// Layout: asymmetric, importance-driven (not 4 equal stat cards)
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useTickets } from '../hooks/useTickets';
import { predictCrowd, checkAnomaly, getBestDeparture, getPersonalityProfile } from '../api/predict.api';
import { formatCurrency } from '../utils/formatters';
import { getNetworkPulse } from '../api/analytics.api';
import QRModal from '../components/common/QRModal';
import CoachHeatmap from '../components/metro/CoachHeatmap';
import VoiceAssistantModal from '../components/common/VoiceAssistantModal';
import CommunityPulseModal from '../components/metro/CommunityPulseModal';
import SOSButton from '../components/common/SOSButton';
import SmartRoutesWidget from '../components/metro/SmartRoutesWidget';
import CarbonTreeWidget from '../components/metro/CarbonTreeWidget';
import PersonalityBadge from '../components/analytics/PersonalityBadge';
import AccessibilityToggle from '../components/common/AccessibilityToggle';
import ActiveRidePass from '../components/metro/ActiveRidePass';
import LastMileConnect from '../components/metro/LastMileConnect';
import LiveTrainRadar from '../components/metro/LiveTrainRadar';
import ExitOptimizer from '../components/metro/ExitOptimizer';
import TimeToLeaveWidget from '../components/metro/TimeToLeaveWidget';
import GiftRideWidget from '../components/metro/GiftRideWidget';
import CommuterLeaderboard from '../components/analytics/CommuterLeaderboard';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_CORRIDOR = {
  line: 'Blue Line',
  stations: ['Thaltej', 'Gujarat University', 'Kalupur Railway Station', 'Old High Court', 'Sabarmati'],
};

const CROWD_COLORS = {
  low:  { color: '#15803D', bg: 'rgba(21,128,61,0.08)', label: 'Low' },
  med:  { color: '#D97706', bg: 'rgba(217,119,6,0.08)', label: 'Medium' },
  high: { color: '#E8283B', bg: 'rgba(232,40,59,0.08)', label: 'High' },
};

// Mock crowd data as fallback when API is unavailable
const MOCK_CROWD = {
  'Thaltej': { level: 'low', pct: 28 },
  'Gujarat University': { level: 'med', pct: 58 },
  'Kalupur Railway Station': { level: 'high', pct: 88 },
  'Old High Court': { level: 'low', pct: 22 },
  'Sabarmati': { level: 'med', pct: 52 },
};

/* ─── Inline styles (scoped to dashboard — Stitch Design Language) ─── */
const S = {
  // Page wrapper
  page: {
    padding: 'var(--space-lg)',
    maxWidth: '1200px',
    margin: '0 auto',
    animation: 'fadeInUp 0.4s ease',
    position: 'relative',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  // ── Hero Card ──────────────────────────────────────────────
  heroCard: {
    borderRadius: '24px',
    padding: '24px 28px',
    marginBottom: '24px',
    overflow: 'hidden',
    position: 'relative',
  },
  heroClear: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },
  heroClearDark: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  heroGreeting: {
    fontSize: '40px', fontWeight: 700, lineHeight: '48px', letterSpacing: '-0.02em',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  heroClock: {
    fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-display)',
  },
  heroNumber: {
    fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums',
    lineHeight: 1, letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 500,
    marginTop: '6px',
  },
  heroStatus: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '0.8125rem', fontWeight: 500, marginTop: '16px',
    color: '#15803D',
  },
  heroChip: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '5px 14px', borderRadius: 'var(--radius-full)',
    fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums', textDecoration: 'none',
    transition: 'background 150ms ease',
  },

  // Quick Actions (Stitch pill chips)
  quickActions: {
    display: 'flex', justifyContent: 'center', gap: '32px',
    margin: '4px 0 32px', flexWrap: 'wrap',
  },
  quickAction: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0,
  },
  quickCircle: {
    width: '56px', height: '56px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.25rem', transition: 'transform 150ms ease, box-shadow 150ms ease',
  },
  quickLabel: {
    fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)',
    textAlign: 'center',
  },

  // ── Card shell (elevated — Stitch rounded-[24px]) ─────────────────
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s cubic-bezier(0.2,0.8,0.2,1)',
  },
  liveCard: {
    borderLeft: '3px solid var(--accent-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04), 0 0 12px var(--accent-glow)',
  },
  cardPad: {
    padding: '16px 20px',
  },

  // ── My Line (transit line visualization) ───────────────────
  lineHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid var(--border-color)',
  },
  lineTitle: {
    fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
  },
  lineBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px', borderRadius: 'var(--radius-full)',
    color: '#fff', fontWeight: 700, fontSize: '0.75rem',
    letterSpacing: '0.02em',
  },
  liveBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em',
    color: '#E8283B', textTransform: 'uppercase',
  },
  liveDot: {
    width: '6px', height: '6px', borderRadius: '50%', background: '#E8283B',
    animation: 'dashPulse 1.5s ease-in-out infinite',
  },
  transitStation: {
    position: 'relative',
    paddingLeft: '40px', paddingRight: '20px',
    paddingTop: '14px', paddingBottom: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums',
  },
  stationName: {
    fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  suggestion: {
    padding: '10px 20px',
    background: 'var(--bg-tertiary)',
    fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5,
    display: 'flex', gap: '8px', alignItems: 'flex-start',
  },

  // Two-column row (Stitch 8+4 grid)
  twoCol: {
    display: 'grid', gridTemplateColumns: '1fr 1.5fr',
    gap: '24px', marginBottom: '24px',
  },

  // Wallet
  walletBalance: {
    fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: '4px',
    fontVariantNumeric: 'tabular-nums',
  },
  topUpBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    marginTop: '12px', padding: '8px 16px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'transparent',
    color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none',
    transition: 'all 150ms ease',
  },

  // Active ticket
  ticketRoute: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '8px',
  },
  ticketStation: {
    fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
  },
  ticketArrow: {
    color: 'var(--text-muted)', fontSize: '0.75rem',
  },
  ticketMeta: {
    fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px',
    fontVariantNumeric: 'tabular-nums',
  },
  qrBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 20px', borderRadius: '9999px',
    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
    transition: 'all 200ms ease',
  },

  // Stats row
  statsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '24px', flexWrap: 'wrap',
    padding: '12px 0',
    fontSize: '0.8125rem', color: 'var(--text-muted)',
  },
  statItem: {
    display: 'flex', alignItems: 'center', gap: '6px',
    textDecoration: 'none', color: 'inherit',
    transition: 'color 150ms ease',
  },
  statValue: {
    fontWeight: 600, color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums',
  },
  separator: {
    width: '3px', height: '3px', borderRadius: '50%',
    background: 'var(--text-muted)', opacity: 0.5,
  },

  // Empty state
  emptyState: {
    textAlign: 'center', padding: '32px 20px',
  },
  emptyIcon: {
    fontSize: '2rem', marginBottom: '8px', display: 'block',
  },
  emptyTitle: {
    fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px',
    color: 'var(--text-primary)',
  },
  emptyDesc: {
    fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px',
  },

  // Disruption banner (still used by AnomalyWhisper)
  disruptionBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 14px', marginBottom: '12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', fontWeight: 500,
  },
  anomalyAmber: {
    background: 'rgba(217,119,6,0.06)',
    color: '#B45309',
    border: '1px solid rgba(217,119,6,0.12)',
  },

  // Section label
  label: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
  },

  // Ghost button
  ghostBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'transparent',
    color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600,
    cursor: 'pointer', transition: 'all 150ms ease',
  },

  // Skeleton
  skeleton: {
    background: 'var(--bg-tertiary)',
    borderRadius: '4px',
    animation: 'dashSkeleton 1.2s ease-in-out infinite',
  },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function classifyCrowd(level) {
  if (!level) return 'low';
  const l = String(level).toLowerCase();
  if (l === 'high' || l === 'crowded') return 'high';
  if (l === 'medium' || l === 'moderate' || l === 'med') return 'med';
  return 'low';
}

function getEstimatedTime(index) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + index * 3);
  return now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function deriveUsualRoute(tickets) {
  if (!tickets || tickets.length === 0) return null;
  const routeCounts = {};
  tickets.forEach(t => {
    if (t.source && t.destination) {
      const key = `${t.source}→${t.destination}`;
      routeCounts[key] = (routeCounts[key] || 0) + 1;
    }
  });
  const sorted = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  const [route] = sorted[0];
  const [source, destination] = route.split('→');
  return { source, destination };
}

/* ═══════════════════════════════════════════════════════════
   CROWD STRIP COMPONENT — "My Line Right Now"
   ═══════════════════════════════════════════════════════════ */
function MyLineStrip({ corridor, userDestination }) {
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchCrowdData = useCallback(async () => {
    setLoading(true);
    const hour = new Date().getHours();
    const day = new Date().getDay();

    try {
      const results = await Promise.all(
        corridor.stations.map(station =>
          predictCrowd({ station, hour, day, passengers: 1 })
            .then(res => ({
              station,
              level: classifyCrowd(res.data.prediction?.crowdLevel || res.data.prediction?.level),
              pct: res.data.prediction?.percentage || res.data.prediction?.crowdPercentage || 50,
            }))
            .catch(() => null)
        )
      );

      const successResults = results.filter(Boolean);
      if (successResults.length > 0) {
        const data = {};
        successResults.forEach(r => { data[r.station] = { level: r.level, pct: r.pct }; });
        // Fill in any failed stations with mock data
        corridor.stations.forEach(s => {
          if (!data[s]) data[s] = MOCK_CROWD[s] || { level: 'low', pct: 30 };
        });
        setCrowdData(data);
        setLastUpdated(new Date());
      } else {
        // All API calls failed — use mock
        setCrowdData(MOCK_CROWD);
        setLastUpdated(null);
      }
    } catch {
      setCrowdData(MOCK_CROWD);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [corridor.stations]);

  useEffect(() => {
    fetchCrowdData();
    const interval = setInterval(fetchCrowdData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchCrowdData]);

  // Smart suggestion: if destination is HIGH, suggest adjacent LOW station
  const suggestion = useMemo(() => {
    if (!crowdData || !userDestination) return null;
    const destData = crowdData[userDestination];
    if (!destData || destData.level !== 'high') return null;

    const destIdx = corridor.stations.indexOf(userDestination);
    if (destIdx < 0) return null;

    // Check adjacent stations for a lower-crowd alternative
    const adjacent = [destIdx - 1, destIdx + 1]
      .filter(i => i >= 0 && i < corridor.stations.length)
      .map(i => ({ name: corridor.stations[i], ...crowdData[corridor.stations[i]] }))
      .filter(s => s.level !== 'high')
      .sort((a, b) => a.pct - b.pct);

    if (adjacent.length === 0) return null;
    return adjacent[0];
  }, [crowdData, userDestination, corridor.stations]);

  const lineColor = corridor.line.toLowerCase().includes('blue') ? '#3b82f6' : '#ef4444';

  if (loading) {
    return (
      <div style={{ ...S.card, ...S.liveCard, marginBottom: '12px' }}>
        <div className="dash-line-header" style={S.lineHeader}>
          <span style={S.lineBadge}>Pulse</span>
          <span>Network Pulse (TESTING VITE)</span>
          <span style={S.liveBadge}><span style={S.liveDot} /> Live</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          {corridor.stations.slice(0, 4).map((_, i) => (
            <div key={i} style={S.transitStation}>
              <div style={{ ...S.skeleton, width: '100px', height: '14px' }} />
              <div style={{ ...S.skeleton, width: '48px', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.card, ...S.liveCard, marginBottom: '12px' }}>
      {/* Header: line badge + updated time + LIVE */}
      <div className="dash-line-header" style={S.lineHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...S.lineBadge, background: lineColor }}>{corridor.line}</span>
          {lastUpdated && (
            <span className="mm-num" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {lastUpdated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          )}
        </div>
        <span style={S.liveBadge}><span style={S.liveDot} /> Live</span>
      </div>

      {/* Station list with vertical connector */}
      <div style={{ position: 'relative', padding: '4px 0' }}>
        {/* Full-height vertical line */}
        <div style={{
          position: 'absolute', left: '18px',
          top: '28px', bottom: '28px',
          width: '2px', background: 'var(--border-color)',
          borderRadius: '1px',
        }} />

        {corridor.stations.map((station, i) => {
          const data = crowdData?.[station] || { level: 'low', pct: 30 };
          const crowd = CROWD_COLORS[data.level];
          const isDestination = station === userDestination;

          return (
            <div
              key={station}
              className="dash-station-row"
              style={{
                ...S.transitStation,
                background: isDestination ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              {/* Crowd-colored dot on the line */}
              <div style={{
                position: 'absolute', left: '13px', top: '50%',
                transform: 'translateY(-50%)',
                width: '12px', height: '12px', borderRadius: '50%',
                background: crowd.color,
                border: '2.5px solid var(--bg-secondary)',
                zIndex: 1,
                boxShadow: `0 0 0 1px ${crowd.color}33`,
              }} />

              {/* Station info — left side */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <span style={S.stationName}>
                  {station.replace(' Railway Station', ' Ry.')}
                </span>
                {isDestination && (
                  <span style={{
                    fontSize: '0.5625rem', fontWeight: 700, color: '#fff',
                    background: '#0B7DC3', padding: '2px 7px',
                    borderRadius: '3px', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}>
                    📍 YOUR STOP
                  </span>
                )}
              </div>

              {/* Right side: crowd pct + label + ETA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span className="mm-num" style={{
                  fontSize: '0.75rem', fontWeight: 700, color: crowd.color,
                  minWidth: '32px', textAlign: 'right',
                }}>
                  {data.pct}%
                </span>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600, color: crowd.color,
                  minWidth: '48px',
                }}>
                  {crowd.label}
                </span>
                <span className="mm-num dash-hide-mobile" style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                  minWidth: '64px', textAlign: 'right',
                }}>
                  {getEstimatedTime(i)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart suggestion */}
      {suggestion && (
        <div className="dash-suggestion" style={S.suggestion}>
          <i className="fas fa-lightbulb" style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
          <span>
            <strong>{userDestination.replace(' Railway Station', ' Ry.')}</strong> is crowded now. Consider boarding at{' '}
            <strong>{suggestion.name}</strong> ({suggestion.level === 'low' ? 'Low' : 'Medium'} crowd) to avoid the peak.
          </span>
        </div>
      )}

      {!lastUpdated && (
        <div style={{ ...S.suggestion, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <i className="fas fa-info-circle" style={{ marginTop: '1px', flexShrink: 0 }} />
          <span>Showing estimated crowd levels. Live data will update when the prediction server is available.</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANOMALY WHISPER — renders nothing unless a real anomaly exists
   ═══════════════════════════════════════════════════════════ */
function AnomalyWhisper({ station, hour, dayOfWeek, predictedCrowd }) {
  const [anomaly, setAnomaly] = useState(null);

  useEffect(() => {
    if (!station || hour === undefined || dayOfWeek === undefined || !predictedCrowd) return;
    checkAnomaly({ station, hour, dayOfWeek, actualCrowd: predictedCrowd })
      .then(res => {
        if (res.data.anomaly?.isAnomaly) setAnomaly(res.data.anomaly);
      })
      .catch(() => {});
  }, [station, hour, dayOfWeek, predictedCrowd]);

  if (!anomaly) return null;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayName = dayNames[dayOfWeek] || 'today';
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <div style={{ ...S.disruptionBanner, ...S.anomalyAmber, animation: 'fadeInUp 0.4s ease' }}>
      <span style={{ ...S.liveBadge, color: '#D97706' }}><span style={{ ...S.liveDot, background: '#D97706' }} /> Alert</span>
      Heads up — {station} is unusually busy for a {dayName} {timeOfDay}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BEST DEPARTURE CARD — only renders if usualRoute exists
   ═══════════════════════════════════════════════════════════ */
function BestDepartureCard({ usualRoute }) {
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!usualRoute) return;
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const pyDay = day === 0 ? 6 : day - 1;
    getBestDeparture({ station: usualRoute.source, targetHour: hour, dayOfWeek: pyDay })
      .then(res => setResult(res.data.bestDeparture))
      .catch(() => {});
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [usualRoute]);

  if (!usualRoute || !result) return null;

  const currentHour = new Date().getHours();
  const isBestAlready = result.deltaPct === 0 || result.bestHour === currentHour;

  const handleRemind = () => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(perm => {
      if (perm !== 'granted') return;
      const delayMs = Math.max(0, (result.bestHour - currentHour) * 60 * 60 * 1000 - 15 * 60 * 1000);
      timerRef.current = setTimeout(() => {
        new Notification('MetroMind', {
          body: `Time to head to ${usualRoute.source} — ${result.bestHour}:00 is your best departure window`,
        });
      }, delayMs);
    });
  };

  return (
    <div style={{ ...S.card, ...S.liveCard, marginBottom: '12px', animation: 'fadeInUp 0.4s ease' }}>
      <div className="dash-card-pad" style={S.cardPad}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={S.label}>Smarter Timing</div>
          <span style={{ ...S.liveBadge, color: 'var(--accent-primary)' }}><span style={{ ...S.liveDot, background: 'var(--accent-primary)' }} /> Updated</span>
        </div>
        {isBestAlready ? (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <i className="fas fa-check" style={{ color: '#15803D', marginRight: '6px' }} />
            You're traveling at a good time
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '10px' }}>
              Leave for <strong>{result.bestHour}:00</strong> instead — <strong>{result.deltaPct}% less crowded</strong> than now
            </div>
            <button style={S.ghostBtn} onClick={handleRemind}>
              <i className="fas fa-bell" style={{ fontSize: '0.7rem' }} />
              Remind me
            </button>
          </>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   NETWORK PULSE — accepts props from parent (pulse lifted)
   ═══════════════════════════════════════════════════════════ */
function NetworkPulsePanel({ pulseLoading, riders, avgWait, busiest, quietest, healthScore, healthColor, healthLabel, arcCircumference, arcOffset }) {
  if (pulseLoading) {
    return (
      <div style={{ ...S.card, ...S.liveCard, marginBottom: '12px' }}>
        <div style={{ ...S.cardPad, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ ...S.skeleton, width: '100px', height: '14px' }} />
            <div style={{ ...S.skeleton, width: '48px', height: '12px' }} />
          </div>
        </div>
        <div className="dash-pulse-stats" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px',
          background: 'var(--border-color)',
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--bg-secondary)', padding: '12px 16px' }}>
              <div style={{ ...S.skeleton, width: '48px', height: '20px', marginBottom: '4px' }} />
              <div style={{ ...S.skeleton, width: '64px', height: '10px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.card, ...S.liveCard, marginBottom: '12px' }}>
      {/* Header row: title + health arc + LIVE badge */}
      <div style={{
        ...S.cardPad,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: '0',
      }}>
        <span style={S.lineTitle}>Network Pulse</span>

        {/* Compact health arc */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ position: 'relative', width: '60px', height: '48px' }}>
            <svg width="60" height="48" viewBox="0 0 60 48" style={{ display: 'block' }}>
              <path d="M 8 44 A 26 26 0 1 1 52 44" fill="none" stroke="var(--bg-tertiary)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 8 44 A 26 26 0 1 1 52 44" fill="none" stroke={healthColor} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={arcCircumference} strokeDashoffset={arcOffset}
                style={{ animation: 'dashArcIn 0.8s ease-out', opacity: 0.9 }}
              />
            </svg>
            <div className="mm-num" style={{
              position: 'absolute', top: '12px', left: 0, right: 0,
              textAlign: 'center', fontSize: '0.9375rem', fontWeight: 700,
              color: healthColor, fontFamily: 'var(--font-display)',
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            }}>
              {healthScore}
            </div>
          </div>
          <div style={{
            fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            textAlign: 'center', lineHeight: 1.2,
          }}>
            Network Health
            <span style={{ display: 'block', color: healthColor, fontWeight: 700, fontSize: '0.5625rem' }}>
              {healthLabel}
            </span>
          </div>
        </div>

        <span style={S.liveBadge}><span style={S.liveDot} /> Live</span>
      </div>

      {/* 4-column dense stat strip */}
      <div className="dash-pulse-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px',
        background: 'var(--border-color)', margin: '10px 0 0 0',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px' }}>
          <div className="mm-num" style={{
            fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', lineHeight: 1.2,
          }}>
            {riders.toLocaleString()}
          </div>
          <div style={{
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px',
          }}>Active Riders</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px' }}>
          <div className="mm-num" style={{
            fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)', lineHeight: 1.2,
          }}>
            {avgWait} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>min</span>
          </div>
          <div style={{
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px',
          }}>Avg Wait</div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px' }}>
          <div style={{
            fontSize: '0.875rem', fontWeight: 700, color: '#E8283B',
            lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {busiest.name?.replace(' Railway Station', ' Ry.')}
          </div>
          <div style={{
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            Busiest
            <span className="mm-num" style={{ color: '#E8283B', fontWeight: 700 }}>{busiest.pct}%</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '12px 16px' }}>
          <div style={{
            fontSize: '0.875rem', fontWeight: 700, color: '#15803D',
            lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {quietest.name?.replace(' Railway Station', ' Ry.')}
          </div>
          <div style={{
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            Quietest
            <span className="mm-num" style={{ color: '#15803D', fontWeight: 700 }}>{quietest.pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { tickets } = useTickets();
  const navigate = useNavigate();
  const [qrTicket, setQrTicket] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);

  // ── Lifted pulse state (shared between hero + NetworkPulsePanel) ──
  const [pulse, setPulse] = useState(null);
  const [pulseLoading, setPulseLoading] = useState(true);
  const [displayRiders, setDisplayRiders] = useState(null);
  const baseRidersRef = useRef(null);

  // Live clock — updates every second for hero card
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch pulse data on mount + every 45 seconds
  const fetchPulse = useCallback(async () => {
    try {
      const res = await getNetworkPulse();
      if (res.data.fallback) {
        setPulse(null);
      } else {
        setPulse(res.data.pulse);
        baseRidersRef.current = res.data.pulse.estimatedRiders || 1240;
        setDisplayRiders(baseRidersRef.current);
      }
    } catch {
      setPulse(null);
    } finally {
      setPulseLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 45000);
    return () => clearInterval(interval);
  }, [fetchPulse]);

  // Rider count jitter — small ±1-3 every 4-6 seconds for "alive" feel
  useEffect(() => {
    if (baseRidersRef.current === null) return;
    const jitter = () => {
      const delta = Math.floor(Math.random() * 3) + 1;
      const sign = Math.random() > 0.5 ? 1 : -1;
      setDisplayRiders(Math.max(0, baseRidersRef.current + sign * delta));
    };
    const ms = 4000 + Math.floor(Math.random() * 2000);
    const id = setInterval(jitter, ms);
    return () => clearInterval(id);
  }, [pulse]);

  // ── Derived data (unchanged) ──
  const usualRoute = useMemo(() => deriveUsualRoute(tickets), [tickets]);
  const corridor = useMemo(() => {
    if (!usualRoute) return DEFAULT_CORRIDOR;
    return DEFAULT_CORRIDOR;
  }, [usualRoute]);
  const userDestination = usualRoute?.destination || 'Kalupur Railway Station';

  const totalTrips = tickets.length;
  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const streakDays = user?.streakDays || 0;

  const activeTicket = useMemo(() => {
    return tickets.find(t =>
      t.status === 'active' || t.status === 'confirmed' || t.status === 'booked'
    ) || null;
  }, [tickets]);

  const walletWarning = wallet.balance < 20 ? 'critical' : wallet.balance < 50 ? 'low' : null;

  // ── Hero card computed data ──
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const pulseData = pulse || {};
  const healthScore = pulseData.networkHealthScore ?? 72;
  const healthColor = healthScore >= 80 ? '#15803D' : healthScore >= 50 ? '#D97706' : '#E8283B';
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Congested';
  const arcCircumference = 163;
  const arcOffset = arcCircumference - (arcCircumference * healthScore / 100);

  const minutesToDeparture = activeTicket?.travelDate
    ? Math.max(0, Math.round((new Date(activeTicket.travelDate) - clock) / 60000))
    : null;
  const showCountdown = minutesToDeparture !== null && minutesToDeparture < 120;

  // ── Pulse panel derived numbers ──
  const riders = displayRiders ?? pulseData.estimatedRiders ?? 1240;
  const avgWait = pulseData.avgWaitMinutes ?? 4;
  const busiest = pulseData.busiest || { name: 'Kalupur Ry.', pct: 82 };
  const quietest = pulseData.quietest || { name: 'GNLU', pct: 18 };

  // ── Quick action items ──
  const quickActionItems = [
    usualRoute
      ? { to: `/book?from=${encodeURIComponent(usualRoute.source)}&to=${encodeURIComponent(usualRoute.destination)}`, icon: 'fas fa-redo', label: 'Rebook', bg: 'rgba(99,102,241,0.10)', color: '#6366f1', title: `${usualRoute.source.replace(' Railway Station', ' Ry.')} → ${usualRoute.destination.replace(' Railway Station', ' Ry.')}` }
      : { to: '/book', icon: 'fas fa-ticket-alt', label: 'Book Ticket', bg: 'rgba(99,102,241,0.10)', color: '#6366f1' },
    { onClick: () => setIsVoiceOpen(true), icon: 'fas fa-microphone', label: 'Voice AI', bg: 'rgba(124,58,237,0.12)', color: '#7c3aed' },
    { onClick: () => setIsPulseOpen(true), icon: 'fas fa-users', label: 'Pulse', bg: 'rgba(16,185,129,0.10)', color: '#10b981' },
    { to: '/live-trains', icon: 'fas fa-train', label: 'Live Trains', bg: 'rgba(59,130,246,0.10)', color: '#3b82f6' },
    { to: '/wallet', icon: 'fas fa-plus-circle', label: 'Top Up', bg: 'rgba(34,197,94,0.10)', color: '#22c55e' },
  ];

  return (
    <div className="dash-page" style={S.page}>
      <style>{`
        .dash-page::before {
          content: '';
          position: fixed;
          top: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.04), transparent 70%);
          pointer-events: none;
          z-index: -1;
        }
        [data-theme="dark"] .dash-page::before {
          background: radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%);
        }
        .dash-quick-action:hover .dash-quick-circle {
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .dash-two-col { grid-template-columns: 1fr !important; }
          .dash-quick-actions { gap: 20px !important; }
          .dash-pulse-stats { grid-template-columns: 1fr 1fr !important; }
          .dash-card-pad { padding: 16px !important; }
          .dash-suggestion { padding: 12px 16px !important; }
          .dash-stats-row { gap: 16px !important; }
          .dash-line-header { padding: 14px 16px !important; }
        }
        @media (max-width: 576px) {
          .dash-station-row { padding-left: 36px !important; }
          .dash-hide-mobile { display: none !important; }
          .dash-quick-actions { gap: 16px !important; }
        }
        /* ── Bento Box Grid ── */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          align-items: start;
        }
        .bento-grid > * {
          animation: bentoFadeIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          width: 100%;
        }
        @keyframes bentoFadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .bento-grid > *:nth-child(1) { animation-delay: 0.1s; }
        .bento-grid > *:nth-child(2) { animation-delay: 0.15s; }
        .bento-grid > *:nth-child(3) { animation-delay: 0.2s; }
        .bento-grid > *:nth-child(4) { animation-delay: 0.25s; }
        .bento-grid > *:nth-child(5) { animation-delay: 0.3s; }
        .bento-grid > *:nth-child(6) { animation-delay: 0.35s; }
        .bento-grid > *:nth-child(7) { animation-delay: 0.4s; }
        .bento-grid > *:nth-child(8) { animation-delay: 0.45s; }
        .bento-grid > *:nth-child(9) { animation-delay: 0.5s; }
        .bento-grid > *:nth-child(10) { animation-delay: 0.55s; }
        .bento-grid > *:nth-child(11) { animation-delay: 0.6s; }
        .bento-grid > *:nth-child(12) { animation-delay: 0.65s; }
        .bento-grid > *:nth-child(n+13) { animation-delay: 0.7s; }
        
        .bento-span-2 {
          grid-column: span 2;
        }
        @media (max-width: 768px) {
          .bento-span-2 { grid-column: span 1; }
        }
      `}</style>

      {/* ═══ 1. HERO SECTION (Stitch-style greeting or Active Pass) ═══ */}
      {activeTicket ? (
        <ActiveRidePass ticket={activeTicket} />
      ) : (
        <div style={{
          ...S.heroCard,
          ...(isDark ? S.heroClearDark : S.heroClear),
        }}>
        {/* Decorative blur circle */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(79, 70, 229, 0.03)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top row: greeting + weather/status pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={S.heroGreeting}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
              </h1>
              {/* Weather + City pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '9999px',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '14px', fontWeight: 600,
              }}>
                <span>Ahmedabad ·</span>
                <span style={{ color: '#F59E0B' }}>☀️</span>
                <span>28°C</span>
              </div>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: 0 }}>
              {showCountdown
                ? <>Your train departs in <strong style={{ color: '#4F46E5' }}>{minutesToDeparture} min</strong> to {activeTicket?.destination?.replace(' Railway Station', ' Ry.')}</>
                : "It's a clear day — perfect for your commute."
              }
            </p>
          </div>

          {/* Status + Service pills row */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Service status pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '9999px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              fontSize: '14px', fontWeight: 600,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#F59E0B' }}>sunny</span>
              <span>Ahmedabad · 28°C</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)', margin: '0 4px' }} />
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10B981',
                animation: 'dashPulse 2s infinite cubic-bezier(0.4,0,0.6,1)',
              }} />
              <span>Normal Service</span>
            </div>

            {/* Wallet + rides chips */}
            <Link to="/wallet" style={{
              ...S.heroChip,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}>
              💰 <span className="mm-num">{formatCurrency(wallet.balance)}</span>
            </Link>
            <Link to="/analytics" style={{
              ...S.heroChip,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            }}>
              🎫 <span className="mm-num">{totalTrips}</span> ride{totalTrips !== 1 ? 's' : ''}
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* ═══ 2. QUICK ACTIONS (circular, Google Pay style) ═══ */}
      <div className="dash-quick-actions" style={S.quickActions}>
        {quickActionItems.map((action, idx) => (
          action.to ? (
            <Link
              key={action.to}
              to={action.to}
              className="dash-quick-action"
              style={S.quickAction}
              title={action.title || action.label}
            >
              <div className="dash-quick-circle" style={{ ...S.quickCircle, background: action.bg }}>
                <i className={action.icon} style={{ color: action.color }} />
              </div>
              <span style={S.quickLabel}>{action.label}</span>
            </Link>
          ) : (
            <button
              key={idx}
              onClick={action.onClick}
              className="dash-quick-action"
              style={{ ...S.quickAction, border: 'none', background: 'none' }}
              title={action.label}
            >
              <div className="dash-quick-circle" style={{ ...S.quickCircle, background: action.bg }}>
                <i className={action.icon} style={{ color: action.color }} />
              </div>
              <span style={S.quickLabel}>{action.label}</span>
            </button>
          )
        ))}
      </div>

      {/* ═══ 2.5 AI COMMUTE ASSISTANT BANNER ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1))',
        border: '1px solid rgba(79,70,229,0.2)',
        borderRadius: '20px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        animation: 'fadeInUp 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '20px', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}>
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              MetroMind AI Coach
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              IPL Match at Stadium Station today 🏏 · Peak crowd expected 5:30 - 8:00 PM. Book your return ticket early!
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsVoiceOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '9999px',
            background: '#4F46E5', color: '#fff', border: 'none',
            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mic</span>
          Ask Voice AI
        </button>
      </div>

      {/* Gift a Ride (Epic Phase 4) */}
      <GiftRideWidget />

      {/* ═══ BENTO BOX GRID LAYOUT ═══ */}
      <div className="bento-grid">
        <div className="bento-span-2">
          {/* ═══ 3. NETWORK PULSE ═══ */}
      <NetworkPulsePanel
        pulseLoading={pulseLoading}
        riders={riders}
        avgWait={avgWait}
        busiest={busiest}
        quietest={quietest}
        healthScore={healthScore}
        healthColor={healthColor}
        healthLabel={healthLabel}
        arcCircumference={arcCircumference}
        arcOffset={arcOffset}
      />

        </div>

        <div className="bento-span-2">
          {/* ═══ 4. MY LINE RIGHT NOW ═══ */}
          <MyLineStrip corridor={corridor} userDestination={userDestination} />
        </div>

        {/* ═══ 4.5 TRAIN COACH DENSITY HEATMAP ═══ */}
        <div className="bento-span-2">
          <CoachHeatmap stationName={userDestination} />
        </div>

        {/* ═══ 5. ANOMALY WHISPER ═══ */}
        {anomaly && (
          <div className="bento-span-2">
            <AnomalyWhisper
              station={userDestination}
              hour={new Date().getHours()}
              dayOfWeek={new Date().getDay() === 0 ? 6 : new Date().getDay() - 1}
              predictedCrowd={85}
            />
          </div>
        )}

        {/* ═══ 6. BEST DEPARTURE CARD ═══ */}
        <BestDepartureCard usualRoute={usualRoute} />

        {/* ═══ 7. WALLET ═══ */}
        {/* Wallet — Stitch dark gradient card */}
        <div style={{
          borderRadius: '24px', overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #151c27, #1e293b)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {/* Decorative blur circles */}
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.15)', filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-30px', left: '-20px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(124, 58, 237, 0.1)', filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
          <div className="dash-card-pad" style={{ ...S.cardPad, position: 'relative', zIndex: 1, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet Balance</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.3)' }}>account_balance_wallet</span>
            </div>
            <div className="mm-num" style={{
              fontSize: '32px', fontWeight: 700, color: '#ffffff',
              fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.2, marginBottom: '4px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatCurrency(wallet.balance)}
            </div>
            {walletWarning && (
              <div style={{
                fontSize: '12px', fontWeight: 500, marginTop: '4px',
                color: walletWarning === 'critical' ? '#fca5a5' : '#fde68a',
              }}>
                {walletWarning === 'critical'
                  ? 'Critical — top up before your next ride'
                  : 'Low balance — consider topping up'}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Link to="/wallet" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '9999px',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', border: 'none',
                boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                transition: 'transform 0.2s ease',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                Top Up
              </Link>
              <Link to="/wallet" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600,
                textDecoration: 'none', transition: 'background 0.2s ease',
              }}>
                Passes
              </Link>
            </div>
          </div>
        </div>

        {/* Active Ticket */}
        <div style={S.card}>
          <div className="dash-card-pad" style={S.cardPad}>
            <div style={S.label}>Active Ticket</div>
            {activeTicket ? (
              <>
                <div style={S.ticketRoute}>
                  <span style={S.ticketStation}>{activeTicket.source}</span>
                  <i className="fas fa-arrow-right" style={S.ticketArrow} />
                  <span style={S.ticketStation}>{activeTicket.destination}</span>
                </div>
                <div style={S.ticketMeta}>
                  {new Date(activeTicket.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' · '}
                  {formatCurrency(activeTicket.fare)}
                  {activeTicket.passengers?.length > 1 && ` · ${activeTicket.passengers.length} passengers`}
                </div>
                <button style={S.qrBtn} onClick={() => setQrTicket(activeTicket)}>
                  <i className="fas fa-qrcode" />
                  Show QR
                </button>
              </>
            ) : (
              <div style={S.emptyState}>
                <span style={S.emptyIcon}>🎫</span>
                <div style={S.emptyTitle}>No upcoming rides</div>
                <div style={S.emptyDesc}>Book a ticket to get started</div>
                <Link to="/book" style={{ ...S.qrBtn, textDecoration: 'none', display: 'inline-flex' }}>
                  Book Now
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ═══ EPIC WIDGETS (Bento Grid) ═══ */}
        <LiveTrainRadar homeStation={corridor.stations[0] || 'Thaltej'} />
        <SmartRoutesWidget />
        {userDestination && <ExitOptimizer destination={userDestination} />}
        <TimeToLeaveWidget />
        <CarbonTreeWidget />
        <CommuterLeaderboard />
        <LastMileConnect destination={userDestination} />
        
        <div className="bento-span-2">
          {/* Smart Fare Optimizer Banner */}
          <div style={{
            background: 'linear-gradient(90deg, var(--bg-secondary), rgba(167, 139, 250, 0.15))',
            borderLeft: '4px solid #a78bfa',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ background: '#a78bfa', color: '#fff', padding: '8px', borderRadius: '50%', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>savings</span>
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Smart-Fare Optimizer
              </h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Delay your trip by <strong>15 mins</strong> to travel off-peak and save <strong>₹10</strong> on your fare!
              </p>
            </div>
          </div>
        </div>

      </div> {/* END BENTO GRID */}

      {/* ═══ 8. STATS ROW (compact, low-priority) ═══ */}
      <div className="dash-stats-row" style={S.statsRow}>
        <Link to="/analytics" style={S.statItem}>
          <i className="fas fa-chart-bar" style={{ fontSize: '0.75rem' }} />
          <span className="mm-num" style={S.statValue}>{totalTrips}</span> rides
        </Link>
        <span style={S.separator} />
        <Link to="/carbon-passport" style={S.statItem}>
          <i className="fas fa-leaf" style={{ fontSize: '0.75rem', color: '#15803D' }} />
          <span className="mm-num" style={S.statValue}>{totalCO2.toFixed(1)} kg</span> CO₂ saved
        </Link>
        <span style={S.separator} />
        <Link to="/achievements" style={S.statItem}>
          <i className="fas fa-fire" style={{ fontSize: '0.75rem', color: '#D97706' }} />
          <span className="mm-num" style={S.statValue}>{streakDays}</span> day streak
        </Link>
      </div>

      {/* QR Modal */}
      {qrTicket && (
        <QRModal
          isOpen={!!qrTicket}
          onClose={() => setQrTicket(null)}
          ticket={qrTicket}
        />
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        walletBalance={wallet.balance}
      />

      {/* Commuter Pulse Modal */}
      <CommunityPulseModal
        isOpen={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
      />
      
      {/* Emergency SOS Button */}
      <SOSButton />
      
      {/* Universal Accessibility Toggle */}
      <AccessibilityToggle />
    </div>
  );
}





