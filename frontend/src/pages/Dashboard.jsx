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
import { fetchWeather } from '../api/weather.api';
import { requestFCMToken } from '../firebase';
import { registerFCMToken, scheduleReminder } from '../api/notifications.api';
import QRModal from '../components/common/QRModal';
import CoachHeatmap from '../components/metro/CoachHeatmap';
import VoiceAssistantModal from '../components/common/VoiceAssistantModal';
import CommunityPulseModal from '../components/metro/CommunityPulseModal';
import SOSButton from '../components/common/SOSButton';
import SmartRoutesWidget from '../components/metro/SmartRoutesWidget';
import CarbonTreeWidget from '../components/metro/CarbonTreeWidget';
import PersonalityBadge from '../components/analytics/PersonalityBadge';
import LiveTrainRadar from '../components/metro/LiveTrainRadar';

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
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    animation: 'fadeInUp 0.4s ease',
    position: 'relative',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },

  // ── Hero Card ──────────────────────────────────────────────
  heroCard: {
    borderRadius: '32px',
    padding: '32px 36px',
    marginBottom: '28px',
    overflow: 'hidden',
    position: 'relative',
    transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)',
  },
  heroClear: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 12px 40px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  heroClearDark: {
    background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.4) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  heroGreeting: {
    fontSize: '48px', fontWeight: 800, lineHeight: '56px', letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
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
    padding: '6px 16px', borderRadius: 'var(--radius-full)',
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums', textDecoration: 'none',
    transition: 'all 0.2s ease',
    border: '1px solid var(--border-color)',
    backdropFilter: 'blur(12px)',
  },

  // Quick Actions (Premium Glass Pills)
  quickActions: {
    display: 'flex', justifyContent: 'center', gap: '20px',
    margin: '12px 0 36px', flexWrap: 'wrap',
  },
  quickAction: {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    gap: '12px', textDecoration: 'none', cursor: 'pointer',
    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    padding: '12px 20px', borderRadius: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)',
    backdropFilter: 'blur(16px)',
  },
  quickCircle: {
    width: '36px', height: '36px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', transition: 'transform 0.3s ease',
    background: 'transparent',
  },
  quickLabel: {
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
  },

  // ── Card shell (elevated — Premium Glass) ─────────────────
  card: {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-color)',
    borderRadius: '28px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
    transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.4s cubic-bezier(0.2,0.8,0.2,1)',
  },
  liveCard: {
    border: '1px solid rgba(99,102,241,0.3)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.1), 0 0 20px var(--accent-glow)',
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
function SmarterTiming({ usualRoute }) {
  const [result, setResult] = useState(null);
  const [reminderState, setReminderState] = useState('idle');
  const [reminderError, setReminderError] = useState('');

  useEffect(() => {
    if (!usualRoute) return;
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const pyDay = day === 0 ? 6 : day - 1;
    getBestDeparture({ station: usualRoute.source, targetHour: hour, dayOfWeek: pyDay })
      .then(res => setResult(res.data.bestDeparture))
      .catch(() => {});
  }, [usualRoute]);

  if (!usualRoute || !result) return null;

  const currentHour = new Date().getHours();
  const isBestAlready = result.deltaPct === 0 || result.bestHour === currentHour;

  const handleRemind = async () => {
    setReminderState('loading');
    setReminderError('');
    try {
      const d = new Date();
      d.setHours(result.bestHour, 0, 0, 0);
      let leaveByDate = new Date(d.getTime() - 15 * 60 * 1000);
      
      // If time has already passed today, schedule it for tomorrow
      if (leaveByDate < new Date()) {
        leaveByDate.setDate(leaveByDate.getDate() + 1);
      }
      
      const msUntilLeave = leaveByDate - Date.now();

      const token = await requestFCMToken();
      if (token) {
        await registerFCMToken(token);
        await scheduleReminder({
          leaveByISO: leaveByDate.toISOString(),
          route: `Commute from ${usualRoute.source}`,
          walkMins: 15,
        });
        setReminderState('active');
        return;
      }

      if (!('Notification' in window)) throw new Error('Notifications not supported');
      const perm = await Notification.requestPermission();
      if (perm === 'granted' && msUntilLeave > 0) {
        setTimeout(() => {
          new Notification('MetroMind', {
            body: `Time to head to ${usualRoute.source} — ${result.bestHour}:00 is your best departure window`,
          });
        }, msUntilLeave);
        setReminderState('active');
      } else {
        throw new Error('Notifications blocked or time has passed');
      }
    } catch (err) {
      setReminderError(err.response?.data?.error || err.message || 'Could not set reminder');
      setReminderState('error');
    }
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
            {reminderState === 'idle' || reminderState === 'error' ? (
              <button style={S.ghostBtn} onClick={handleRemind}>
                <i className="fas fa-bell" style={{ fontSize: '0.7rem' }} />
                Remind me
              </button>
            ) : reminderState === 'loading' ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Setting up push…</span>
            ) : (
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: '12px' }}>
                ✅ Push reminder set
              </span>
            )}
            {reminderError && <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '6px' }}>⚠️ {reminderError}</div>}
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

  // ── Live weather state ──
  const [weather, setWeather] = useState(null); // null = loading

  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .catch(() => {
        // fallback — show a sensible default rather than crashing
        setWeather({ tempC: 31, emoji: '☀️', condition: 'Clear', isRaining: false, fallback: true });
      });
  }, []);

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
      t.status === 'upcoming' || t.status === 'active' || t.status === 'confirmed' || t.status === 'booked'
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
  const anomaly = pulseData.anomaly;

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
          .dash-main-cols { grid-template-columns: 1fr !important; }
          .dash-hero-bg { padding: 24px 16px 0 !important; }
          .dash-hero-content { flex-direction: column !important; }
          .dash-hero-content > div { width: 100% !important; min-width: 0 !important; }
          .dash-page { padding: 16px !important; box-sizing: border-box !important; width: 100% !important; min-width: 0 !important; }
        }
        @media (max-width: 576px) {
          .dash-station-row { padding-left: 36px !important; }
          .dash-hide-mobile { display: none !important; }
          .dash-quick-actions { gap: 16px !important; }
        }
        /* ── Bento Box Grid ── */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
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
          .dash-hero-title { font-size: 1.8rem !important; }
        }
      `}</style>

      {/* ═══ 1. HERO SECTION ═══ */}
      <div style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', marginBottom: '28px' }}>
          {/* Vivid gradient background */}
          <div className="dash-hero-bg" style={{
            background: 'linear-gradient(135deg, #312e81 0%, #4F46E5 40%, #7C3AED 70%, #9d174d 100%)',
            padding: '32px 36px 0',
            position: 'relative',
          }}>
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '0', left: '200px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

            {/* Content row */}
            <div className="dash-hero-content" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, width: '100%', minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MetroMind · Ahmedabad GMRC</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'dashPulse 2s infinite' }} />
                </div>
                <h1 className="dash-hero-title" style={{ fontSize: '2.4rem', fontWeight: 800, color: 'white', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋
                </h1>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 20px', lineHeight: 1.5 }}>
                  {showCountdown
                    ? <>Your train departs in <strong style={{ color: '#fde68a' }}>{minutesToDeparture} min</strong> to {activeTicket?.destination?.replace(' Railway Station', ' Ry.')}</>
                    : weather?.isRaining
                      ? "It's raining — consider the covered route via Old High Court 🌧️"
                      : "Great day for commuting — network is running smoothly."
                  }
                </p>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: weather?.isRaining ? '12px' : '24px' }}>
                  {/* Live weather pill */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>
                    {weather
                      ? <>{weather.emoji} {weather.tempC}°C &middot; Ahmedabad</>
                      : <span style={{ opacity: 0.6 }}>⏳ Loading weather...</span>
                    }
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(34,197,94,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.3)', fontSize: '0.82rem', fontWeight: 600, color: '#86efac' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                    Normal Service
                  </div>
                  <Link to="/wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)', textDecoration: 'none' }}>
                    💳 {formatCurrency(wallet.balance)}
                  </Link>
                  <Link to="/analytics" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.95)', textDecoration: 'none' }}>
                    🎫 {totalTrips} ride{totalTrips !== 1 ? 's' : ''}
                  </Link>
                </div>

                {/* Rain alert banner — contextual, only when raining */}
                {weather?.isRaining && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', marginBottom: '12px', borderRadius: '14px',
                    background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
                    backdropFilter: 'blur(8px)', animation: 'fadeInUp 0.3s ease',
                  }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>🌧️</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fde68a', marginBottom: '1px' }}>Rain Alert — {weather.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                        Consider the covered route via <strong style={{ color: '#fde68a' }}>Old High Court</strong> interchange.
                      </div>
                    </div>
                  </div>
                )}

                {/* Night safety banner — contextual, only after sunset */}
                {weather?.isDark && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', marginBottom: '20px', borderRadius: '14px',
                    background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(139,92,246,0.35)',
                    backdropFilter: 'blur(8px)', animation: 'fadeInUp 0.35s ease',
                  }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>🌙</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '1px' }}>Travelling after dark — stay safe</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                        <strong style={{ color: '#c4b5fd' }}>Old High Court</strong> &amp; <strong style={{ color: '#c4b5fd' }}>Kalupur</strong> have well-lit exits and 24 h security.
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingBottom: '28px' }}>
                  <Link
                    to="/book"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '20px', background: 'white', color: '#4F46E5', fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                  >
                    🎫 Book Ticket
                  </Link>
                  {usualRoute && (
                    <Link
                      to="/book"
                      state={{ source: usualRoute.source, destination: usualRoute.destination }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.25)', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                    >
                      🔄 Rebook Usual Route
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: stat card */}
              {!pulseLoading && (
                <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '24px', padding: '18px 20px', minWidth: '160px', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Network Live</div>
                  {[
                    ['🚇', riders.toLocaleString(), 'riders now'],
                    ['⏱️', `${avgWait}m`, 'avg wait'],
                    ['💚', `${healthScore}%`, healthLabel],
                  ].map(([icon, val, label]) => (
                    <div key={label} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px' }}>{icon}</span>
                        <span className="mm-num" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginLeft: '18px' }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Animated metro track strip at bottom */}
            <div style={{ overflow: 'hidden', height: '32px', position: 'relative', marginTop: '-4px' }}>
              <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ position: 'absolute', bottom: '6px', fontSize: '20px', animation: 'metroSlide 12s linear infinite', whiteSpace: 'nowrap' }}>🚇</div>
            </div>
          </div>

          {/* Glassmorphism bottom panel */}
          <div className="dash-hero-bg" style={{
            background: isDark ? 'rgba(10,14,26,0.5)' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            padding: '14px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
          }}>
            {[
              { icon: '🏆', value: `${streakDays}d`, label: 'Streak' },
              { icon: '🌿', value: `${Math.round(totalCO2)}g`, label: 'CO₂ saved' },
              { icon: '🎫', value: totalTrips, label: 'Total rides' },
              { icon: '💳', value: formatCurrency(wallet.balance), label: 'Wallet' },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <div>
                  <div className="mm-num" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <style>{`@keyframes metroSlide { from { transform: translateX(-60px); } to { transform: translateX(110vw); } }`}</style>
        </div>

      {/* ═══ 2. QUICK ACTIONS — Premium gradient pills ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <div className="quick-actions-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {quickActionItems.map((action, idx) => {
            const content = (
              <>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0, transition: 'transform 0.25s ease',
                }}>
                  <i className={action.icon} style={{ color: action.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{action.label}</div>
                  {action.title && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.title}</div>}
                </div>
              </>
            );
            const pillStyle = {
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 18px', borderRadius: '24px',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.25s cubic-bezier(0.2,0.8,0.2,1)',
              cursor: 'pointer', textDecoration: 'none',
            };
            return action.to ? (
              <Link key={action.to} to={action.to} style={pillStyle} title={action.title || action.label}
                state={action.state}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
              >{content}</Link>
            ) : (
              <button key={idx} type="button" onClick={action.onClick} style={{ ...pillStyle, border: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                onFocus={() => {}}
              >{content}</button>
            );
          })}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT — 2-column layout
          Left (2fr): transit intelligence
          Right (1fr): personal status
          ═══════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', marginBottom: '20px', alignItems: 'start' }}
        className="dash-main-cols">

        {/* ─── LEFT COLUMN ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Coach Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.08))',
            border: '1px solid rgba(79,70,229,0.18)',
            borderRadius: '20px', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fff' }}>auto_awesome</span>
            </div>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>MetroMind AI Coach</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                IPL Match at Stadium today 🏏 — Peak crowd 5:30–8 PM. Book your return early!
              </div>
            </div>
            <button onClick={() => setIsVoiceOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '20px', background: '#4F46E5', color: '#fff', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 3px 10px rgba(79,70,229,0.3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mic</span> Ask AI
            </button>
          </div>


          {/* Network Pulse */}
          <NetworkPulsePanel
            pulseLoading={pulseLoading} riders={riders} avgWait={avgWait}
            busiest={busiest} quietest={quietest} healthScore={healthScore}
            healthColor={healthColor} healthLabel={healthLabel}
            arcCircumference={arcCircumference} arcOffset={arcOffset}
          />

          {/* Smart Routes */}
          <SmartRoutesWidget />

          {/* Live Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <LiveTrainRadar homeStation={corridor.stations[0] || 'Thaltej'} />
            <CoachHeatmap stationName={userDestination} />
            {/* Commuter Personality — placed under Train Coach Density */}
            <PersonalityBadge />
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Wallet Card */}
          <div style={{ borderRadius: '22px', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #151c27, #1e293b)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(79,70,229,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />
            <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet Balance</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)' }}>account_balance_wallet</span>
              </div>
              <div className="mm-num" style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(wallet.balance)}
              </div>
              {walletWarning && (
                <div style={{ fontSize: '11px', color: walletWarning === 'critical' ? '#fca5a5' : '#fde68a', marginBottom: '8px' }}>
                  {walletWarning === 'critical' ? '⚠️ Critical — top up now' : '⚠️ Low balance'}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <Link to="/wallet" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px', borderRadius: '12px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 3px 10px rgba(79,70,229,0.35)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span> Top Up
                </Link>
                <Link to="/wallet" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '9px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                  Passes
                </Link>
              </div>
            </div>
          </div>

          {/* Active Ticket */}
          <div style={{ ...S.card }}>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>Active Ticket</div>
              {activeTicket ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{activeTicket.source}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>→</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{activeTicket.destination}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(activeTicket.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {formatCurrency(activeTicket.fare)}
                    {activeTicket.passengers?.length > 1 && ` · ${activeTicket.passengers.length} pax`}
                  </div>
                  <button style={S.qrBtn} onClick={() => setQrTicket(activeTicket)}>
                    <i className="fas fa-qrcode" /> Show QR
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎫</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '4px' }}>No upcoming rides</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Book a ticket to get started</div>
                  <Link to="/book" style={{ ...S.qrBtn, textDecoration: 'none', display: 'inline-flex' }}>Book Now</Link>
                </div>
              )}
            </div>
          </div>

          {/* Best Departure */}
          <SmarterTiming usualRoute={usualRoute} />

          {/* Metro Stats Card */}
          <div style={{
            borderRadius: '20px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Metro Stats</span>
            </div>

            {/* Stat Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total Trips', value: totalTrips, icon: '🚇', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
                { label: 'Day Streak', value: `${streakDays}🔥`, icon: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                { label: 'CO₂ Saved', value: `${totalCO2.toFixed(1)}kg`, icon: '🌿', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
                { label: 'Wallet', value: formatCurrency(wallet.balance), icon: '💳', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: stat.bg,
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  <span style={{ fontSize: '18px' }}>{stat.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: stat.color, lineHeight: 1 }}>{stat.value}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { label: 'Book Ticket', to: '/book', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff' },
                { label: 'Top Up', to: '/wallet', bg: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' },
              ].map(btn => (
                <Link key={btn.label} to={btn.to} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: btn.bg,
                  color: btn.color,
                  borderRadius: '10px',
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {btn.label}
                </Link>
              ))}
            </div>
          </div>

          <CarbonTreeWidget />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-main-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

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
        weatherData={weather}
      />

      {/* Commuter Pulse Modal */}
      <CommunityPulseModal
        isOpen={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
      />
      
      {/* Emergency SOS Button */}
      <SOSButton />
    </div>
  );
}





