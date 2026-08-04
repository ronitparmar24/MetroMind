// frontend/src/pages/Profile.jsx
// MetroMind — Full profile view with ML personality breakdown + station explorer
// Layout: same S-object / CSS-variable pattern as Dashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPersonalityProfile, getCommuterCluster } from '../api/predict.api';
import { getStationProfile } from '../api/analytics.api';
import { STATIONS } from '../constants/stations';
import { formatDate } from '../utils/formatters';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const TYPE_META = {
  'Early Bird':        { icon: '🌅', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  'Rush Hour Warrior': { icon: '⚡', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
  'Weekend Explorer':  { icon: '🧭', color: '#6366f1', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  'Smart Commuter':    { icon: '🧠', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
  'Balanced Traveler': { icon: '⚖️', color: '#0B7DC3', gradient: 'linear-gradient(135deg, #0B7DC3 0%, #0369a1 100%)' },
};

// Four ratios that drive the classification decision
// Maps Django keys → user-friendly labels
const RATIO_METERS = [
  { key: 'earlyMorningRatio', fallbackKey: 'earlyBirdRatio', label: 'Early Bird', color: '#f59e0b', icon: '🌅' },
  { key: 'peakHourRatio',     fallbackKey: 'rushHourRatio',  label: 'Rush Hour',  color: '#ef4444', icon: '⚡' },
  { key: 'weekendRatio',      fallbackKey: 'weekendRatio',   label: 'Weekend',    color: '#6366f1', icon: '🧭' },
  { key: 'lowCrowdRatio',     fallbackKey: 'smartRatio',     label: 'Smart Pick', color: '#22c55e', icon: '🧠' },
];

const STATION_NAMES = STATIONS.map(s => s.name).sort();

/* ─── Inline styles (scoped to profile, same S-object pattern as Dashboard) ─── */
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

  // Card shell (identical to Dashboard.jsx)
  card: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cardPad: {
    padding: '20px 24px',
  },

  // Bar track — same as Dashboard.jsx S.barTrack
  barTrack: {
    height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px',
    overflow: 'hidden',
  },

  // Section label (reusable muted uppercase label — same as Dashboard)
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

  // Stats row
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

  // Skeleton
  skeleton: {
    background: 'var(--bg-tertiary)',
    borderRadius: '4px',
    animation: 'profileSkeleton 1.2s ease-in-out infinite',
  },

  // Profile-specific
  avatarRing: {
    width: '72px', height: '72px', borderRadius: 'var(--radius-full)',
    background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 700,
    flexShrink: 0,
  },
  fieldRow: {
    display: 'flex', justifyContent: 'space-between', padding: '14px',
    borderBottom: '1px solid var(--border-color)',
  },
  fieldLabel: {
    color: 'var(--text-secondary)', fontSize: '0.9rem',
  },
  fieldValue: {
    fontWeight: 500, fontSize: '0.9rem',
  },

  // Personality card
  personalityHeader: {
    display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px',
  },
  personalityIcon: {
    width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', flexShrink: 0,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  personalityTitle: {
    fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700,
    marginBottom: '4px', background: 'var(--gradient-primary)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },

  // Station Explorer
  select: {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500,
    outline: 'none', cursor: 'pointer',
    transition: 'border-color 150ms ease',
  },
  statGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '16px', marginTop: '20px',
  },
  statCard: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)',
  },
  bigNumber: {
    fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)', lineHeight: 1.2,
  },
  smallLabel: {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px',
  },
  personalBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    fontSize: '0.625rem', fontWeight: 600, color: '#0B7DC3',
    background: 'rgba(11,125,195,0.08)', padding: '2px 8px',
    borderRadius: '4px', letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function buildExplanation(personality, ratios) {
  const type = personality || 'Balanced Traveler';
  if (type === 'Early Bird') {
    const pct = Math.round((ratios.earlyMorningRatio || ratios.earlyBirdRatio || 0) * 100);
    return `You travel before 9 AM ${pct}% of the time — that's what makes you an Early Bird.`;
  }
  if (type === 'Rush Hour Warrior') {
    const pct = Math.round((ratios.peakHourRatio || ratios.rushHourRatio || 0) * 100);
    return `You travel during peak hours ${pct}% of the time — that's what makes you a Rush Hour Warrior.`;
  }
  if (type === 'Weekend Explorer') {
    const pct = Math.round((ratios.weekendRatio || 0) * 100);
    return `You ride on weekends ${pct}% of the time — that's what makes you a Weekend Explorer.`;
  }
  if (type === 'Smart Commuter') {
    const pct = Math.round((ratios.lowCrowdRatio || ratios.smartRatio || 0) * 100);
    return `You dodge crowded trains ${pct}% of the time — that's what makes you a Smart Commuter.`;
  }
  return 'You have a balanced travel pattern — mixing peak and off-peak, weekdays and weekends.';
}

/* ═══════════════════════════════════════════════════════════
   PERSONALITY BREAKDOWN CARD
   Full version of the badge shown on Dashboard
   ═══════════════════════════════════════════════════════════ */
function PersonalityBreakdown() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalityProfile()
      .then(res => {
        const p = res.data.personality;
        if (p && p.totalTrips >= 5) setData(p);
        else setData(null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div className="profile-card-pad" style={S.cardPad}>
          <div style={S.personalityHeader}>
            <div style={{ ...S.skeleton, width: '64px', height: '64px', borderRadius: 'var(--radius-lg)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...S.skeleton, width: '180px', height: '18px', marginBottom: '8px' }} />
              <div style={{ ...S.skeleton, width: '260px', height: '14px' }} />
            </div>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ ...S.skeleton, width: '80px', height: '12px' }} />
              <div style={{ ...S.skeleton, flex: 1, height: '6px' }} />
              <div style={{ ...S.skeleton, width: '36px', height: '12px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div className="profile-card-pad" style={S.cardPad}>
          <div style={S.label}>Commute Personality</div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔒</span>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
              Not enough data yet
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Complete at least 5 trips to unlock your personality breakdown
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meta = TYPE_META[data.personality] || TYPE_META['Balanced Traveler'];
  const ratios = data.ratios || {};

  return (
    <div style={{ ...S.card, marginBottom: '16px', position: 'relative' }}>
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: meta.gradient,
      }} />

      <div className="profile-card-pad" style={{ ...S.cardPad, paddingTop: '24px' }}>
        <div style={S.label}>Commute Personality</div>

        {/* Header: icon + type + description */}
        <div style={S.personalityHeader}>
          <div style={{ ...S.personalityIcon, background: meta.gradient }}>
            {meta.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={S.personalityTitle}>{data.personality}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
              {data.description}
            </p>
          </div>
        </div>

        {/* Four horizontal bar meters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {RATIO_METERS.map(({ key, fallbackKey, label, color, icon }) => {
            const value = ratios[key] ?? ratios[fallbackKey] ?? 0;
            const pct = Math.round(value * 100);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                  width: '88px', flexShrink: 0, textAlign: 'right',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                }}>
                  <span style={{ fontSize: '0.8rem' }}>{icon}</span> {label}
                </span>
                <div style={S.barTrack}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    background: color,
                    width: `${pct}%`,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--text-secondary)', width: '36px',
                }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Plain-language explanation */}
        <div style={{
          padding: '12px 16px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          display: 'flex', gap: '8px', alignItems: 'flex-start',
        }}>
          <i className="fas fa-info-circle" style={{ color: meta.color, marginTop: '2px', flexShrink: 0 }} />
          <span>{buildExplanation(data.personality, ratios)}</span>
        </div>

        {/* Trip count + unique stations footer */}
        {(data.totalTrips || ratios.uniqueStations) && (
          <div style={{
            display: 'flex', gap: '16px', marginTop: '14px',
            fontSize: '0.75rem', color: 'var(--text-muted)',
            justifyContent: 'flex-end', flexWrap: 'wrap',
          }}>
            {data.totalTrips && <span>{data.totalTrips} total trips analyzed</span>}
            {ratios.uniqueStations && (
              <>
                <span style={S.separator} />
                <span>{ratios.uniqueStations} unique stations</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATION EXPLORER
   Django station-profile → global ML stats + personal trips
   ═══════════════════════════════════════════════════════════ */
function CommuterClusterCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommuterCluster()
      .then(res => {
        if (res.data.cluster && res.data.cluster.clusterLabel) {
          setData(res.data.cluster);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div className="profile-card-pad" style={S.cardPad}>
          <div style={{ ...S.skeleton, width: '150px', height: '14px', marginBottom: '16px' }} />
          <div style={{ ...S.skeleton, width: '100%', height: '60px' }} />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ ...S.card, marginBottom: '16px', background: 'var(--bg-tertiary)' }}>
      <div className="profile-card-pad" style={S.cardPad}>
        <div style={S.label}>Similar Commuters (Unsupervised ML)</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', flexShrink: 0,
          }}>
            👥
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              You're in the <span style={{ color: '#0B7DC3' }}>{data.clusterLabel}</span> group
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {data.similarCommuterCount} other commuters share your exact travel pattern. 
              Unlike your rule-based Commute Personality, this insight is powered by a 
              K-Means Clustering algorithm that groups users based on their multi-dimensional travel behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StationExplorer() {
  const [station, setStation] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!station) { setProfile(null); setError(null); return; }
    setLoading(true);
    setError(null);
    getStationProfile(station)
      .then(res => {
        if (res.data.fallback) {
          setError('ML analytics service is offline — try again later.');
          setProfile(null);
        } else {
          setProfile(res.data.profile);
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load station profile');
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [station]);

  // Derive busiest hour from hourly avg crowd
  const busiestHour = useMemo(() => {
    if (!profile?.hourlyAvgCrowd) return null;
    let maxHour = null;
    let maxVal = -1;
    Object.entries(profile.hourlyAvgCrowd).forEach(([h, v]) => {
      if (v !== null && v > maxVal) { maxVal = v; maxHour = parseInt(h, 10); }
    });
    if (maxHour === null) return null;
    const ampm = maxHour >= 12
      ? `${maxHour === 12 ? 12 : maxHour - 12} PM`
      : `${maxHour === 0 ? 12 : maxHour} AM`;
    return { hour: maxHour, display: ampm, crowd: maxVal };
  }, [profile]);

  return (
    <div style={{ ...S.card, marginBottom: '16px' }}>
      <div className="profile-card-pad" style={S.cardPad}>
        <div style={S.label}>Station Explorer</div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Pick a station to see global ML crowd analysis alongside your personal trip data.
        </p>

        {/* Station picker */}
        <select
          style={S.select}
          value={station}
          onChange={e => setStation(e.target.value)}
        >
          <option value="">Select a station…</option>
          {STATION_NAMES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* Loading state */}
        {loading && (
          <div style={S.statGrid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={S.statCard}>
                <div style={{ ...S.skeleton, width: '60px', height: '28px', marginBottom: '6px' }} />
                <div style={{ ...S.skeleton, width: '80px', height: '12px' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            marginTop: '16px', padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(232,40,59,0.06)',
            border: '1px solid rgba(232,40,59,0.12)',
            color: '#E8283B', fontSize: '0.8125rem',
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }} />
            {error}
          </div>
        )}

        {/* Results */}
        {profile && !loading && (
          <>
            <div style={S.statGrid}>
              {/* Busiest Hour */}
              <div style={S.statCard}>
                <div style={S.bigNumber}>{busiestHour?.display || '—'}</div>
                <div style={S.smallLabel}>Busiest Hour</div>
              </div>

              {/* Busiest Day */}
              <div style={S.statCard}>
                <div style={S.bigNumber}>{profile.busiestDay?.day || '—'}</div>
                <div style={S.smallLabel}>Busiest Day</div>
              </div>

              {/* Station Rank */}
              <div style={S.statCard}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ ...S.bigNumber, fontSize: '1.5rem' }}>
                    #{profile.stationRank?.rank || '—'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    of {profile.stationRank?.totalStations || '—'}
                  </span>
                </div>
                <div style={S.smallLabel}>Busiest Station Rank</div>
              </div>

              {/* Personal trip count — the Node-merged personal data */}
              <div style={{ ...S.statCard, position: 'relative' }}>
                <span style={{ ...S.personalBadge, position: 'absolute', top: '8px', right: '8px' }}>
                  YOUR DATA
                </span>
                <div style={{ ...S.bigNumber, color: '#0B7DC3' }}>
                  {profile.personalTripCount ?? 0}
                </div>
                <div style={S.smallLabel}>Your Trips Here</div>
              </div>
            </div>

            {/* Weekday vs Weekend comparison bar */}
            {profile.weekdayWeekend && (
              <div style={{
                marginTop: '16px', padding: '14px 16px',
                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Weekday vs Weekend
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Busier on {profile.weekdayWeekend.busierOn}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '60px', fontWeight: 500 }}>
                    Weekday
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={S.barTrack}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: '#0B7DC3',
                        width: `${Math.min(100, profile.weekdayWeekend.weekdayAvg)}%`,
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '36px', textAlign: 'right' }}>
                    {profile.weekdayWeekend.weekdayAvg}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', width: '60px', fontWeight: 500 }}>
                    Weekend
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={S.barTrack}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: '#6366f1',
                        width: `${Math.min(100, profile.weekdayWeekend.weekendAvg)}%`,
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '36px', textAlign: 'right' }}>
                    {profile.weekdayWeekend.weekendAvg}
                  </span>
                </div>
              </div>
            )}

            {/* Global vs Personal juxtaposition note */}
            <div style={{
              marginTop: '12px', padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(11,125,195,0.04)',
              border: '1px solid rgba(11,125,195,0.10)',
              fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
              display: 'flex', gap: '6px', alignItems: 'flex-start',
            }}>
              <i className="fas fa-flask" style={{ color: '#0B7DC3', marginTop: '1px', flexShrink: 0 }} />
              <span>
                Global stats are computed by Django ML from {profile.totalDataPoints?.toLocaleString() || '—'} data points.
                Your personal count is pulled from your Node ticket history.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PROFILE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const fields = [
    { label: 'Full Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: user.phone || 'Not set' },
    { label: 'Loyalty Points', value: user.loyaltyPoints || 0 },
    { label: 'Travel Streak', value: `${user.streakDays || 0} days` },
    { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : 'N/A' },
  ];

  return (
    <div style={S.page}>
      {/* Inline keyframes */}
      <style>{`
        @keyframes profileSkeleton {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @media (max-width: 768px) {
          .profile-card-pad { padding: 16px !important; }
          .profile-stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══ COMPACT HEADER ═══ */}
      <div style={S.header}>
        <h1 style={S.greeting}>Profile 👤</h1>
        <div style={S.headerMeta}>
          <span>Your MetroMind account</span>
        </div>
      </div>

      {/* ═══ ACCOUNT DETAILS ═══ */}
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div className="profile-card-pad" style={S.cardPad}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={S.avatarRing}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem',
              }}>
                {user.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {fields.map(f => (
              <div key={f.label} style={S.fieldRow}>
                <span style={S.fieldLabel}>{f.label}</span>
                <span style={S.fieldValue}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PERSONALITY BREAKDOWN (Django ML) ═══ */}
      <PersonalityBreakdown />

      {/* ═══ SIMILAR COMMUTERS (Unsupervised ML) ═══ */}
      <CommuterClusterCard />

      {/* ═══ STATION EXPLORER (Django station-profile + Node personal data) ═══ */}
      <StationExplorer />
    </div>
  );
}
