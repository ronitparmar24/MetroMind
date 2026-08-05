// frontend/src/pages/WeeklyDigest.jsx
// MetroMind — Magazine-style editorial Weekly Digest
import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getWeeklyDigest } from '../api/analytics.api';
import { formatCurrency } from '../utils/formatters';

/* CountUp hook */
function useCountUp(target, enabled = true, duration = 1000) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, enabled, duration]);
  return val;
}

function HeroStat({ value, label, icon, color, prefix = '', suffix = '' }) {
  const num = typeof value === 'number' ? value : 0;
  const animated = useCountUp(num, true, 1200);
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '2.4rem', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
        {prefix}{typeof value === 'number' ? animated : value}{suffix}
      </div>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: '6px' }}>
        {label}
      </div>
    </div>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyDigest() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyDigest()
      .then(r => setDigest(r.data.digest))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  /* Fake day-by-day bars from digest data for visualization */
  const weekDayData = digest?.dailyTrips
    ? DAYS.map((d, i) => ({ day: d, count: digest.dailyTrips[i] || 0 }))
    : DAYS.map((d) => ({ day: d, count: 0 }));
  const maxDayCount = Math.max(...weekDayData.map(d => d.count), 1);

  const co2Trees = digest ? (digest.totalCO2Saved / 21).toFixed(1) : '0.0';

  return (
    <div style={{ padding: 'var(--space-lg)', maxWidth: '860px', margin: '0 auto', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes barGrow { from{height:0;} to{height:var(--bar-h);} }
      `}</style>

      {/* ═══ EDITORIAL HEADER ═══ */}
      <div style={{ marginBottom: '32px', borderBottom: '3px solid var(--text-primary)', paddingBottom: '16px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '8px' }}>
          MetroMind Weekly · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Your Week <br /><span style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>in Review</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          AI-powered summary of your metro commutes over the past 7 days
        </p>
      </div>

      {digest ? (
        <>
          {/* ═══ HERO STATS ROW ═══ */}
          <div style={{ borderRadius: '24px', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a, #1e293b)', marginBottom: '24px', display: 'flex', flexWrap: 'wrap' }}>
            <HeroStat value={digest.totalTrips || 0}        label="Trips This Week" icon="🎫" color="#6366f1" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
            <HeroStat value={Math.round((digest.totalSpent || 0))} label="Total Spent" icon="💰" color="#f87171" prefix="₹" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
            <HeroStat value={digest.totalDistance || 0}     label="KM Covered"      icon="📏" color="#60a5fa" suffix=" km" />
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
            <HeroStat value={Math.round((digest.totalCO2Saved || 0) * 1000)} label="CO₂ Saved (g)" icon="🌿" color="#34d399" />
          </div>

          {/* ═══ CONTENT GRID ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

            {/* Top Route */}
            <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '22px', gridColumn: digest.topRoute ? undefined : 'span 2' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>🛤️ Top Route</div>
              {digest.topRoute ? (
                <>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {digest.topRoute.route}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      {digest.topRoute.count}× this week
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No routes this week yet</div>
              )}
            </div>

            {/* Peak vs Off-Peak */}
            <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '22px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>⏰ Timing Split</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'Peak', value: digest.peakTrips || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                  { label: 'Off-Peak', value: digest.offPeakTrips || 0, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', padding: '14px', borderRadius: '14px', background: bg }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day-by-Day bar chart */}
          {weekDayData.some(d => d.count > 0) && (
            <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '22px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>📅 Trips By Day</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px' }}>
                {weekDayData.map(({ day, count }) => {
                  const h = count > 0 ? Math.max(16, (count / maxDayCount) * 72) : 4;
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '100%', borderRadius: '6px 6px 0 0', height: `${h}px`, background: count > 0 ? 'linear-gradient(to top, #6366f1, #a855f7)' : 'var(--bg-tertiary)', transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: count > 0 ? '0 2px 8px rgba(99,102,241,0.3)' : 'none' }} />
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CO2 Story */}
          {digest.totalCO2Saved > 0 && (
            <div style={{ borderRadius: '20px', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.05))', border: '1px solid rgba(34,197,94,0.2)', padding: '22px', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', lineHeight: 1, flexShrink: 0 }}>🌳</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#22c55e', marginBottom: '4px' }}>You saved {Math.round(digest.totalCO2Saved * 1000)}g of CO₂ this week</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  That's equivalent to {parseFloat(co2Trees) > 0 ? `${co2Trees} trees absorbing CO₂ for a year` : 'your metro rides vs. car travel'}. Keep it up! 🌍
                </div>
              </div>
            </div>
          )}

          {/* AI Insight */}
          <div style={{ borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04))', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>✨ AI Insight</div>
              {digest.aiGenerated && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.04em' }}>
                  ✦ Gemini AI
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, fontSize: '0.95rem' }}>
              {digest.aiSummary
                || (digest.totalTrips > 0
                  ? `Great week! You averaged ${formatCurrency(digest.avgFarePerTrip)} per trip across ${digest.totalTrips} rides.`
                  : 'No trips recorded this week. Book a ride to see your weekly insights!')}
            </p>
          </div>
        </>
      ) : (
        <div style={{ borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No data for this week</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Travel and come back to see your weekly intelligence report</div>
        </div>
      )}
    </div>
  );
}
