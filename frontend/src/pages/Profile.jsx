// frontend/src/pages/Profile.jsx
// MetroMind — Cinematic Profile with Google Avatar, Aurora Banner, Spotify-Wrapped Stats
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import { getPersonalityProfile, getCommuterCluster } from '../api/predict.api';
import { getStationProfile } from '../api/analytics.api';
import { STATIONS } from '../constants/stations';
import StationSelector from '../components/booking/StationSelector';
import { formatDate } from '../utils/formatters';

/* ═══ Constants ═══ */
const TYPE_META = {
  'Early Bird':        { icon: '🌅', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', aura: 'rgba(245,158,11,0.15)' },
  'Rush Hour Warrior': { icon: '⚡', color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', aura: 'rgba(239,68,68,0.15)'  },
  'Weekend Explorer':  { icon: '🧭', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', aura: 'rgba(99,102,241,0.15)' },
  'Smart Commuter':    { icon: '🧠', color: '#22c55e', gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', aura: 'rgba(34,197,94,0.15)'  },
  'Balanced Traveler': { icon: '⚖️', color: '#0B7DC3', gradient: 'linear-gradient(135deg,#0B7DC3,#0369a1)', aura: 'rgba(11,125,195,0.15)' },
};

const RATIO_METERS = [
  { key: 'earlyMorningRatio', fallbackKey: 'earlyBirdRatio', label: 'Early Bird', color: '#f59e0b', icon: '🌅' },
  { key: 'peakHourRatio',     fallbackKey: 'rushHourRatio',  label: 'Rush Hour',  color: '#ef4444', icon: '⚡' },
  { key: 'weekendRatio',      fallbackKey: 'weekendRatio',   label: 'Weekend',    color: '#6366f1', icon: '🧭' },
  { key: 'lowCrowdRatio',     fallbackKey: 'smartRatio',     label: 'Smart Pick', color: '#22c55e', icon: '🧠' },
];

const ML_STATIONS = [
  'Motera Stadium','Sabarmati','Ranip','Kankaria East','Kalupur Railway Station',
  'Gheekanta','Old High Court','Shahpur','Vadaj','Thaltej','Doordarshan Kendra',
  'Gujarat University','Commerce Six Roads','SSG Hospital','AEC','Paldi','Shreyas',
  'Amraiwadi','Rabari Colony','Apparel Park','APMC','Vastral Gam','Nirant Cross Road',
  'Vastral','Odhav','CTM Cross Road','Jivraj Mehta Hospital','Kankaria','Kalupur',
  'Usmanpura','Chandkheda','GNLU',
].sort();

/* ═══ Helpers ═══ */
function buildExplanation(personality, ratios) {
  const type = personality || 'Balanced Traveler';
  if (type === 'Early Bird') { const p = Math.round((ratios.earlyMorningRatio || ratios.earlyBirdRatio || 0)*100); return `You travel before 9 AM ${p}% of the time — that's what makes you an Early Bird.`; }
  if (type === 'Rush Hour Warrior') { const p = Math.round((ratios.peakHourRatio || ratios.rushHourRatio || 0)*100); return `You travel during peak hours ${p}% of the time — that's what makes you a Rush Hour Warrior.`; }
  if (type === 'Weekend Explorer') { const p = Math.round((ratios.weekendRatio || 0)*100); return `You ride on weekends ${p}% of the time — that's what makes you a Weekend Explorer.`; }
  if (type === 'Smart Commuter') { const p = Math.round((ratios.lowCrowdRatio || ratios.smartRatio || 0)*100); return `You dodge crowded trains ${p}% of the time — that's what makes you a Smart Commuter.`; }
  return 'You have a balanced travel pattern — mixing peak and off-peak, weekdays and weekends.';
}

/* ═══ CountUp Hook ═══ */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

/* ═══ Animated Stat Card ═══ */
function StatBig({ value, label, icon, color = '#6366f1' }) {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num);
  return (
    <div style={{ textAlign: 'center', padding: '20px 16px', flex: 1 }}>
      <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
        {typeof value === 'number' ? animated : value}
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}

/* ═══ Personality Breakdown Card ═══ */
function PersonalityBreakdown() {
  const { tickets } = useTickets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    getPersonalityProfile()
      .then(res => {
        setIsFallback(!!res.data.fallback);
        setData(res.data.personality);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '24px', marginBottom: '16px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '14px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '12px', animation: 'profileSkeleton 1.2s ease-in-out infinite' }} />)}
    </div>
  );

  if (tickets.length < 5) return (
    <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Commute Personality Locked</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Complete at least 5 trips to unlock your personality breakdown</div>
    </div>
  );

  const meta = TYPE_META[data?.personality] || TYPE_META['Balanced Traveler'];
  const ratios = data?.ratios || { weekendRatio: 0.2, smartRatio: 0.3, peakHourRatio: 0.5 }; // Realistic fallback ratios

  return (
    <div style={{ borderRadius: '20px', border: `1px solid ${meta.aura.replace('0.15)', '0.3)')}`, background: 'var(--bg-secondary)', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
      <div style={{ height: '3px', background: meta.gradient }} />
      <div style={{ padding: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Commute Personality</div>
          {isFallback && (
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#92400e', background: 'rgba(245,158,11,0.15)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚡ ML Offline (Estimate)
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: meta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0, boxShadow: `0 6px 20px ${meta.aura}` }}>
            {meta.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, background: meta.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>{data?.personality || 'Balanced Traveler'}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{data?.description || 'You have a balanced travel pattern — mixing peak and off-peak, weekdays and weekends.'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {RATIO_METERS.map(({ key, fallbackKey, label, color, icon }) => {
            const val = ratios[key] ?? ratios[fallbackKey] ?? 0;
            const pct = Math.round(val * 100);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '88px', flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '0.8rem' }}>{icon}</span> {label}
                </span>
                <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: color, width: `${pct}%`, borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', width: '36px' }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px', background: meta.aura, borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span style={{ color: meta.color, flexShrink: 0, marginTop: '1px' }}>ℹ</span>
          <span>{buildExplanation(data?.personality, ratios)}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══ Commuter Cluster Card ═══ */
function CommuterClusterCard() {
  const { tickets } = useTickets();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    getCommuterCluster()
      .then(r => setData(r.data.cluster?.clusterLabel ? r.data.cluster : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false)); 
  }, []);

  // Hide cluster if user hasn't unlocked personality, or if ML service is offline (fallback data)
  if (loading || !data || tickets.length < 5 || data.fallback) return null;

  return (
    <div style={{ borderRadius: '20px', border: '1px solid rgba(11,125,195,0.2)', background: 'rgba(11,125,195,0.05)', padding: '20px', marginBottom: '16px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>Similar Commuters (ML Cluster)</div>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#0B7DC3,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>👥</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>You're in the <span style={{ color: '#0B7DC3' }}>{data.clusterLabel}</span> group</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{data.similarCommuterCount} other commuters share your pattern · K-Means clustering</p>
        </div>
      </div>
    </div>
  );
}

/* ═══ Station Explorer ═══ */
function StationExplorer() {
  const [station, setStation] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!station) { setProfile(null); setError(null); setIsFallback(false); return; }
    setLoading(true); setError(null); setIsFallback(false);
    getStationProfile(station)
      .then(r => {
        setIsFallback(!!r.data.fallback);
        setProfile(r.data.profile);
      })
      .catch(() => setError('Failed to load station data'))
      .finally(() => setLoading(false));
  }, [station]);

  const busiestHour = useMemo(() => {
    if (!profile?.hourlyAvgCrowd) return null;
    let maxH = null, maxV = -1;
    Object.entries(profile.hourlyAvgCrowd).forEach(([h, v]) => { if (v !== null && v > maxV) { maxV = v; maxH = parseInt(h, 10); } });
    if (maxH === null) return null;
    const ampm = maxH >= 12 ? `${maxH === 12 ? 12 : maxH - 12} PM` : `${maxH === 0 ? 12 : maxH} AM`;
    return { display: ampm, crowd: maxV };
  }, [profile]);

  return (
    <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '24px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Station Explorer</div>
        {isFallback && (
          <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#92400e', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.25)' }}>
            ⚡ Estimated (ML Offline)
          </div>
        )}
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Crowd analysis for any station + your personal trip data</p>
      <StationSelector
        label=""
        value={station}
        onChange={setStation}
        color="#a855f7"
        icon="🚇"
      />

      {loading && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>{[1,2,3,4].map(i => <div key={i} style={{ height: '70px', background: 'var(--bg-tertiary)', borderRadius: '12px', animation: 'profileSkeleton 1.2s ease-in-out infinite' }} />)}</div>}
      {error && !loading && <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(232,40,59,0.06)', color: '#E8283B', fontSize: '0.82rem' }}>⚠ {error}</div>}

      {profile && !loading && (
        <>
          <div className="card-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            {[
              { label: 'Busiest Hour', value: busiestHour?.display || '—', estimated: isFallback },
              { label: 'Busiest Day',  value: profile.busiestDay?.day || (isFallback ? 'Mon–Fri' : '—') },
              { label: 'Station Rank', value: profile.stationRank?.rank ? `#${profile.stationRank.rank}` : (isFallback ? 'N/A' : '—') },
              { label: 'Your Trips',   value: profile.personalTripCount ?? 0, accent: true },
            ].map(({ label, value, accent, estimated }) => (
              <div key={label} style={{ padding: '16px', borderRadius: '12px', background: accent ? 'rgba(11,125,195,0.06)' : 'var(--bg-tertiary)', border: accent ? '1px solid rgba(11,125,195,0.2)' : '1px solid transparent', position: 'relative' }}>
                {accent && <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.55rem', fontWeight: 700, color: '#0B7DC3', background: 'rgba(11,125,195,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>YOU</span>}
                {estimated && !accent && <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '0.55rem', fontWeight: 700, color: '#92400e', background: 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Est.</span>}
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: accent ? '#0B7DC3' : 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
          {profile.weekdayWeekend && (
            <div style={{ marginTop: '14px', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekday vs Weekend</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Busier on {profile.weekdayWeekend.busierOn}</span>
              </div>
              {[['Weekday','#0B7DC3', profile.weekdayWeekend.weekdayAvg],['Weekend','#6366f1', profile.weekdayWeekend.weekendAvg]].map(([label, color, val]) => (
                <div key={label} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', width: '60px', fontWeight: 500 }}>{label}</span>
                  <div style={{ flex: 1, height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, val)}%`, background: color, borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', width: '28px', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          )}
          {/* Show a synthetic hourly summary bar when ML data is not available */}
          {isFallback && profile.hourlyAvgCrowd && (
            <div style={{ marginTop: '14px', padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Estimated Crowd Pattern</div>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '40px' }}>
                {Object.entries(profile.hourlyAvgCrowd).map(([h, v]) => {
                  const pct = Math.min(100, (v / 200) * 100);
                  const color = v > 150 ? '#ef4444' : v > 65 ? '#eab308' : '#22c55e';
                  return (
                    <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '2px 2px 0 0', minHeight: '3px', opacity: 0.7 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                <span>6 AM</span><span>12 PM</span><span>10 PM</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══ Main Profile Component ═══ */
export default function Profile() {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [avatarError, setAvatarError] = useState(false);

  // Reset error state whenever the avatar URL itself changes
  useEffect(() => { setAvatarError(false); }, [user?.avatar]);

  if (!user) return null;

  // Upgrade Google photo URL to higher resolution (s400 instead of s96)
  const avatarUrl = user.avatar?.includes('googleusercontent.com')
    ? user.avatar.replace(/=s\d+-c/, '=s400-c').replace(/\?sz=\d+/, '?sz=200')
    : user.avatar;

  const hasAvatar = avatarUrl && !avatarError;

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const uniqueStations = new Set(tickets.flatMap(t => [t.source, t.destination])).size;

  return (
    <div className="page" style={{ maxWidth: '960px', margin: '0 auto', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter', system-ui, sans-serif" }}>

      <style>{`
        @keyframes profileSkeleton { 0%,100%{opacity:0.4;} 50%{opacity:0.8;} }
        @keyframes auroraShift { 0%{background-position:0% 50%;} 50%{background-position:100% 50%;} 100%{background-position:0% 50%;} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @media(max-width:768px){ 
          .profile-stats-row { display: grid !important; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--border-color) !important; }
          .profile-stats-row > div:not(.stat-divider) { background: var(--bg-tertiary); }
          .stat-divider { display: none; }
        }
      `}</style>

      {/* ═══ HERO BANNER + PROFILE CARD — single stacked container ═══ */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>

        {/* Aurora Banner */}
        <div style={{
          borderRadius: '24px 24px 0 0',
          background: 'linear-gradient(270deg, #312e81, #4c1d95, #1e3a5f, #064e3b, #312e81)',
          backgroundSize: '300% 300%',
          animation: 'auroraShift 12s ease infinite',
          height: '130px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '80px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(168,85,247,0.3)', filter: 'blur(50px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '60px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(34,197,94,0.2)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        </div>

        {/* Profile Card */}
        <div style={{
          borderRadius: '0 0 24px 24px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          padding: '60px 28px 28px 28px',
        }}>
          {/* Avatar — absolutely positioned straddling banner / card boundary */}
          <div style={{
            position: 'absolute',
            top: '90px',   /* banner height (130) - half avatar (80/2=40) = 90 */
            left: '28px',
            width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden',
            border: '4px solid var(--bg-secondary)',
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            zIndex: 2,
          }}>
            {hasAvatar ? (
              <img
                src={avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                fetchPriority="high"
                loading="eager"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />

            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.8rem' }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name + badges — offset to the right of the avatar */}
          <div style={{ paddingLeft: '100px', minHeight: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
              {user.authProvider === 'google' && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(66,133,244,0.1)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Google
                </span>
              )}
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✓ Verified
              </span>
            </div>
          </div>

          {/* ═══ STATS ROW — Spotify Wrapped style ═══ */}
          <div className="profile-stats-row" style={{ display: 'flex', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', marginTop: '20px' }}>
            <StatBig value={tickets.length} label="Total Rides" icon="🎫" color="#6366f1" />
            <div className="stat-divider" style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch' }} />
            <StatBig value={Math.round(totalCO2)} label="CO₂ Saved (g)" icon="🌿" color="#22c55e" />
            <div className="stat-divider" style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch' }} />
            <StatBig value={user.streakDays || 0} label="Day Streak" icon="🔥" color="#f59e0b" />
            <div className="stat-divider" style={{ width: '1px', background: 'var(--border-color)', alignSelf: 'stretch' }} />
            <StatBig value={uniqueStations} label="Stations" icon="📍" color="#a855f7" />
          </div>

          {/* ═══ ACCOUNT DETAILS ═══ */}
          <div style={{ marginTop: '20px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {[
              { label: 'Full Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone || 'Not set' },
              { label: 'Loyalty Points', value: `${user.loyaltyPoints || 0} pts` },
              { label: 'Travel Streak', value: `${user.streakDays || 0} days` },
              { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : 'N/A' },
            ].map((f, i, arr) => (
              <div key={f.label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '13px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: i % 2 === 0 ? 'var(--bg-tertiary)' : 'transparent',
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{f.label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ PERSONALITY BREAKDOWN ═══ */}
      <PersonalityBreakdown />

      {/* ═══ ML CLUSTER ═══ */}
      <CommuterClusterCard />

      {/* ═══ STATION EXPLORER ═══ */}
      <StationExplorer />
    </div>
  );
}
