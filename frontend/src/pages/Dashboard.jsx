// frontend/src/pages/Dashboard.jsx
// MetroMind — Personal commute command center
// Signature element: "My Line Right Now" crowd strip
// Layout: asymmetric, importance-driven (not 4 equal stat cards)
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useTickets } from '../hooks/useTickets';
import { predictCrowd } from '../api/predict.api';
import { formatCurrency } from '../utils/formatters';
import QRModal from '../components/common/QRModal';

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

/* ─── Inline styles (scoped to dashboard, no external CSS) ─── */
const S = {
  // Page wrapper
  page: {
    padding: 'var(--space-xl)',
    maxWidth: '960px',
    animation: 'fadeInUp 0.4s ease',
  },

  // Compact header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: '24px', flexWrap: 'wrap', gap: '8px',
  },
  greeting: {
    fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
  },
  headerMeta: {
    fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500,
    display: 'flex', gap: '12px', alignItems: 'center',
  },

  // Card shell
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cardPad: {
    padding: '20px 24px',
  },

  // My Line strip
  lineHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
  },
  lineTitle: {
    fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
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
  stationRow: {
    display: 'grid', gridTemplateColumns: '140px 1fr 60px 56px',
    alignItems: 'center', gap: '12px',
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.875rem',
  },
  stationName: {
    fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  barTrack: {
    height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px',
    overflow: 'hidden',
  },
  suggestion: {
    padding: '14px 24px',
    background: 'var(--bg-tertiary)',
    fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5,
    display: 'flex', gap: '8px', alignItems: 'flex-start',
  },

  // Two-column row
  twoCol: {
    display: 'grid', gridTemplateColumns: '1fr 1.5fr',
    gap: '16px', marginBottom: '16px',
  },

  // Wallet
  walletBalance: {
    fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', lineHeight: 1.2, marginBottom: '4px',
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
  },
  qrBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '10px 20px', borderRadius: 'var(--radius-md)',
    background: '#0B7DC3', color: '#fff', border: 'none',
    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
    transition: 'all 150ms ease',
  },

  // Quick rebook + action row
  actionsRow: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
    gap: '12px', marginBottom: '16px',
  },
  rebookBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '14px 20px', borderRadius: 'var(--radius-md)',
    background: '#0B7DC3', color: '#fff', border: 'none',
    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
    textDecoration: 'none', transition: 'all 150ms ease',
    width: '100%',
  },
  actionLink: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '6px',
    padding: '16px 12px',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
    textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500,
    transition: 'all 150ms ease',
  },

  // Stats row
  statsRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '24px', flexWrap: 'wrap',
    padding: '16px 0',
    fontSize: '0.8125rem', color: 'var(--text-muted)',
  },
  statItem: {
    display: 'flex', alignItems: 'center', gap: '6px',
    textDecoration: 'none', color: 'inherit',
    transition: 'color 150ms ease',
  },
  statValue: {
    fontWeight: 600, color: 'var(--text-secondary)',
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

  // Disruption banner
  disruptionBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', marginBottom: '16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.8125rem', fontWeight: 500,
  },
  allClear: {
    background: 'rgba(21,128,61,0.06)',
    color: '#15803D',
    border: '1px solid rgba(21,128,61,0.12)',
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

  if (loading) {
    return (
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div style={S.lineHeader}>
          <span style={S.lineTitle}>{corridor.line}</span>
          <span style={S.liveBadge}><span style={S.liveDot} /> Live</span>
        </div>
        <div style={S.cardPad}>
          {corridor.stations.slice(0, 4).map((_, i) => (
            <div key={i} style={{ ...S.stationRow, borderBottom: i < 3 ? S.stationRow.borderBottom : 'none' }}>
              <div style={{ ...S.skeleton, width: '80px', height: '14px' }} />
              <div style={{ ...S.skeleton, height: '6px' }} />
              <div style={{ ...S.skeleton, width: '40px', height: '14px' }} />
              <div style={{ ...S.skeleton, width: '48px', height: '14px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.card, marginBottom: '16px' }}>
      <div style={S.lineHeader}>
        <div>
          <span style={S.lineTitle}>{corridor.line}</span>
          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          )}
        </div>
        <span style={S.liveBadge}><span style={S.liveDot} /> Live</span>
      </div>

      <div>
        {corridor.stations.map((station, i) => {
          const data = crowdData?.[station] || { level: 'low', pct: 30 };
          const crowd = CROWD_COLORS[data.level];
          const isDestination = station === userDestination;

          return (
            <div
              key={station}
              style={{
                ...S.stationRow,
                borderBottom: i < corridor.stations.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: isDestination ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={S.stationName}>{station.replace(' Railway Station', ' Ry.')}</span>
                {isDestination && (
                  <span style={{
                    fontSize: '0.625rem', fontWeight: 600, color: '#0B7DC3',
                    background: 'rgba(11,125,195,0.08)', padding: '2px 6px',
                    borderRadius: '4px', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  }}>
                    YOUR STOP
                  </span>
                )}
              </div>

              <div style={S.barTrack}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  background: crowd.color,
                  width: `${data.pct}%`,
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>

              <span style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: crowd.color, textAlign: 'right',
              }}>
                {crowd.label}
              </span>

              <span style={{
                fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right',
              }}>
                {getEstimatedTime(i)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Smart suggestion */}
      {suggestion && (
        <div style={S.suggestion}>
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
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { tickets } = useTickets();
  const navigate = useNavigate();
  const [qrTicket, setQrTicket] = useState(null);

  // Derive usual route from ticket history
  const usualRoute = useMemo(() => deriveUsualRoute(tickets), [tickets]);

  // Corridor for the crowd strip
  const corridor = useMemo(() => {
    if (!usualRoute) return DEFAULT_CORRIDOR;
    // Use default corridor but note the user's destination
    return DEFAULT_CORRIDOR;
  }, [usualRoute]);

  const userDestination = usualRoute?.destination || 'Kalupur Railway Station';

  // Computed stats
  const totalTrips = tickets.length;
  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const streakDays = user?.streakDays || 0;

  // Most recent active ticket
  const activeTicket = useMemo(() => {
    return tickets.find(t =>
      t.status === 'active' || t.status === 'confirmed' || t.status === 'booked'
    ) || null;
  }, [tickets]);

  // Wallet health
  const walletWarning = wallet.balance < 20 ? 'critical' : wallet.balance < 50 ? 'low' : null;

  return (
    <div style={S.page}>
      {/* Inline keyframes */}
      <style>{`
        @keyframes dashPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes dashSkeleton {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @media (max-width: 768px) {
          .dash-two-col { grid-template-columns: 1fr !important; }
          .dash-actions-row { grid-template-columns: 1fr !important; }
          .dash-station-row { grid-template-columns: 100px 1fr 48px 48px !important; gap: 8px !important; padding: 10px 16px !important; }
          .dash-line-header { padding: 14px 16px !important; }
          .dash-card-pad { padding: 16px !important; }
          .dash-suggestion { padding: 12px 16px !important; }
          .dash-stats-row { gap: 16px !important; }
        }
        @media (max-width: 576px) {
          .dash-station-row { grid-template-columns: 80px 1fr 44px !important; }
          .dash-hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ═══ COMPACT HEADER ═══ */}
      <div style={S.header}>
        <h1 style={S.greeting}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <div style={S.headerMeta}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {formatCurrency(wallet.balance)}
          </span>
          <span style={S.separator} />
          <span>{totalTrips} ride{totalTrips !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ═══ DISRUPTION BANNER ═══ */}
      <div style={{ ...S.disruptionBanner, ...S.allClear }}>
        <i className="fas fa-check-circle" />
        All lines operating normally
      </div>

      {/* ═══ MY LINE RIGHT NOW ═══ */}
      <MyLineStrip corridor={corridor} userDestination={userDestination} />

      {/* ═══ WALLET + ACTIVE TICKET ═══ */}
      <div className="dash-two-col" style={S.twoCol}>
        {/* Wallet */}
        <div style={S.card}>
          <div className="dash-card-pad" style={S.cardPad}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Wallet Balance
            </div>
            <div style={{
              ...S.walletBalance,
              color: walletWarning === 'critical' ? '#E8283B' : walletWarning === 'low' ? '#D97706' : 'var(--text-primary)',
            }}>
              {formatCurrency(wallet.balance)}
            </div>
            {walletWarning && (
              <div style={{
                fontSize: '0.75rem', fontWeight: 500, marginTop: '4px',
                color: walletWarning === 'critical' ? '#E8283B' : '#D97706',
              }}>
                {walletWarning === 'critical'
                  ? 'Critical — top up before your next ride'
                  : 'Low balance — consider topping up'}
              </div>
            )}
            <Link to="/wallet" style={S.topUpBtn}>
              <i className="fas fa-plus" style={{ fontSize: '0.75rem' }} />
              Top Up
            </Link>
          </div>
        </div>

        {/* Active Ticket */}
        <div style={S.card}>
          <div className="dash-card-pad" style={S.cardPad}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Active Ticket
            </div>

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
      </div>

      {/* ═══ QUICK REBOOK + SHORTCUTS ═══ */}
      <div className="dash-actions-row" style={S.actionsRow}>
        {/* Quick Rebook */}
        {usualRoute ? (
          <Link
            to={`/book?from=${encodeURIComponent(usualRoute.source)}&to=${encodeURIComponent(usualRoute.destination)}`}
            style={S.rebookBtn}
          >
            <i className="fas fa-redo" />
            Rebook: {usualRoute.source.replace(' Railway Station', ' Ry.')} → {usualRoute.destination.replace(' Railway Station', ' Ry.')}
          </Link>
        ) : (
          <Link to="/book" style={S.rebookBtn}>
            <i className="fas fa-ticket-alt" />
            Book Your First Ride
          </Link>
        )}

        <Link to="/live-trains" style={S.actionLink}>
          <i className="fas fa-train" style={{ fontSize: '1.1rem', color: '#0B7DC3' }} />
          <span>Live Trains</span>
        </Link>

        <Link to="/journey-planner" style={S.actionLink}>
          <i className="fas fa-route" style={{ fontSize: '1.1rem', color: '#0B7DC3' }} />
          <span>Plan Route</span>
        </Link>
      </div>

      {/* ═══ STATS ROW (compact, low-priority) ═══ */}
      <div className="dash-stats-row" style={S.statsRow}>
        <Link to="/analytics" style={S.statItem}>
          <i className="fas fa-chart-bar" style={{ fontSize: '0.75rem' }} />
          <span style={S.statValue}>{totalTrips}</span> rides
        </Link>
        <span style={S.separator} />
        <Link to="/carbon-passport" style={S.statItem}>
          <i className="fas fa-leaf" style={{ fontSize: '0.75rem', color: '#15803D' }} />
          <span style={S.statValue}>{totalCO2.toFixed(1)} kg</span> CO₂ saved
        </Link>
        <span style={S.separator} />
        <Link to="/achievements" style={S.statItem}>
          <i className="fas fa-fire" style={{ fontSize: '0.75rem', color: '#D97706' }} />
          <span style={S.statValue}>{streakDays}</span> day streak
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
    </div>
  );
}
