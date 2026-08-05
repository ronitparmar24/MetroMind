// frontend/src/pages/Achievements.jsx
// MetroMind — Cinematic Achievements with XP Level System + Holographic Cards
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';

/* ═══ Achievement Definitions ═══ */
const ACHIEVEMENTS = [
  { id: 'first_ride',      icon: '🎫', title: 'First Ride',        desc: 'Complete your first metro ride',              target: 1,   rarity: 'common',    xp: 50  },
  { id: 'regular_5',       icon: '🔥', title: 'Regular Rider',     desc: 'Complete 5 rides',                            target: 5,   rarity: 'common',    xp: 100 },
  { id: 'commuter_20',     icon: '🚇', title: 'Daily Commuter',    desc: 'Complete 20 rides',                           target: 20,  rarity: 'uncommon',  xp: 200 },
  { id: 'century_club',    icon: '💯', title: 'Century Club',      desc: 'Complete 100 rides',                          target: 100, rarity: 'rare',      xp: 500 },
  { id: 'eco_hero',        icon: '🌿', title: 'Eco Hero',          desc: 'Save 1 kg of CO₂',                           target: 1,   rarity: 'uncommon',  xp: 150, type: 'co2'     },
  { id: 'carbon_zero',     icon: '🌳', title: 'Carbon Zero',       desc: 'Save 50 kg of CO₂ total',                    target: 50,  rarity: 'legendary', xp: 800, type: 'co2'     },
  { id: 'big_spender',     icon: '💰', title: 'Points Master',     desc: 'Earn 100 loyalty points',                    target: 100, rarity: 'uncommon',  xp: 200, type: 'points'  },
  { id: 'streak_7',        icon: '⚡', title: 'Week Warrior',      desc: '7-day travel streak',                         target: 7,   rarity: 'uncommon',  xp: 250, type: 'streak'  },
  { id: 'streak_30',       icon: '🔮', title: 'Month Legend',      desc: '30-day travel streak',                        target: 30,  rarity: 'legendary', xp: 1000, type: 'streak' },
  { id: 'explorer',        icon: '🗺️', title: 'Station Explorer',  desc: 'Travel to 10 unique stations',               target: 10,  rarity: 'uncommon',  xp: 300, type: 'stations'},
  { id: 'group_trip',      icon: '👥', title: 'Group Leader',      desc: 'Book a group ticket (3+ passengers)',         target: 3,   rarity: 'common',    xp: 100, type: 'group'   },
  { id: 'phantom_rider',   icon: '🌙', title: 'Phantom Rider',     desc: 'Travel after 10 PM (5 times)',               target: 5,   rarity: 'rare',      xp: 400, type: 'night'   },
  { id: 'crowd_dodger',    icon: '🧠', title: 'Crowd Dodger',      desc: 'Book 10 rides at off-peak hours',            target: 10,  rarity: 'rare',      xp: 350, type: 'offpeak' },
  { id: 'speed_booker',    icon: '⚡', title: 'Flash Booker',      desc: 'A true MetroMind power user',                target: 1,   rarity: 'rare',      xp: 300, type: 'speed'   },
];

const RARITY_STYLES = {
  common:    { border: 'rgba(148,163,184,0.3)',  glow: 'rgba(148,163,184,0.15)', gradient: 'linear-gradient(135deg,#64748b,#475569)',       label: 'Common'    },
  uncommon:  { border: 'rgba(34,197,94,0.4)',    glow: 'rgba(34,197,94,0.12)',   gradient: 'linear-gradient(135deg,#22c55e,#16a34a)',       label: 'Uncommon'  },
  rare:      { border: 'rgba(99,102,241,0.5)',   glow: 'rgba(99,102,241,0.18)', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)',       label: 'Rare'      },
  legendary: { border: 'rgba(251,191,36,0.6)',   glow: 'rgba(251,191,36,0.2)',  gradient: 'linear-gradient(135deg,#f59e0b,#d97706,#b45309)', label: 'Legendary' },
};

const LEVEL_TITLES = [
  'Metro Rookie','Line Starter','Regular Rider','Platform Pro','Rush Hour Rider',
  'Smart Commuter','Crowd Navigator','Track Legend','Metro Expert','Station Master',
  'Phantom Rider','Night Owl','Green Commuter','Speed Booker','Line Conqueror',
  'Metro Champion','Network Master','Carbon Zero Hero','Elite Commuter','Metro God',
];

function getLevel(xp) {
  const level = Math.floor(xp / 200) + 1;
  return Math.min(level, 20);
}

function getLevelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

/* ═══ XP Ring Component ═══ */
function XPRing({ xp, level, totalXp }) {
  const ringRef = useRef(null);
  const [animated, setAnimated] = useState(false);
  const xpInLevel = xp % 200;
  const progress = xpInLevel / 200;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - circumference * progress;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Level ring */}
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
          {/* Progress */}
          <circle
            ref={ringRef}
            cx="70" cy="70" r="54" fill="none"
            stroke="url(#xpGrad)" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)', filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.6))' }}
          />
          <defs>
            <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {level}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            LEVEL
          </div>
        </div>
      </div>

      {/* Title + XP */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '1.1rem', fontWeight: 800, marginBottom: '4px',
          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {getLevelTitle(level)}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {totalXp} XP total · {xpInLevel}/200 XP to next level
        </div>
      </div>
    </div>
  );
}

/* ═══ Achievement Card ═══ */
function AchievementCard({ achievement, progress, unlocked, xpEarned }) {
  const [hovered, setHovered] = useState(false);
  const r = RARITY_STYLES[achievement.rarity];
  const pct = Math.round(Math.min(progress, 1) * 100);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '20px',
        border: `1px solid ${unlocked ? r.border : 'var(--border-color)'}`,
        background: unlocked
          ? `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)`
          : 'var(--bg-secondary)',
        boxShadow: unlocked && hovered
          ? `0 8px 32px ${r.glow}, 0 0 0 1px ${r.border}`
          : unlocked
          ? `0 4px 16px ${r.glow}`
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.2,0.8,0.2,1)',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden',
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      {/* Shimmer sweep on unlocked hover */}
      {unlocked && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: hovered ? 'shimmer 0.8s ease' : 'none',
          pointerEvents: 'none',
        }} />
      )}

      {/* Legendary glow orb */}
      {achievement.rarity === 'legendary' && unlocked && (
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.25), transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
          background: unlocked ? r.gradient : 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
          filter: unlocked ? 'none' : 'grayscale(1)',
          boxShadow: unlocked ? `0 4px 12px ${r.glow}` : 'none',
          transition: 'transform 0.3s ease',
          transform: hovered && unlocked ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
        }}>
          {achievement.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {achievement.title}
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {/* Rarity badge */}
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                background: r.glow, color: unlocked ? r.border.replace('0.', '0.9').replace('rgba', 'rgb').replace(',0.', '') : 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em', border: `1px solid ${r.border}`,
              }}>
                {r.label}
              </span>
              {unlocked && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
                  background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  ✓ +{achievement.xp}XP
                </span>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
            {achievement.desc}
          </p>

          {/* Progress bar */}
          <div style={{ height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              background: unlocked ? r.gradient : 'linear-gradient(90deg, #6366f1, #a855f7)',
              width: `${pct}%`,
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: unlocked ? `0 0 6px ${r.glow}` : 'none',
            }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {pct}%
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Component ═══ */
export default function Achievements() {
  const { user } = useAuth();
  const { tickets } = useTickets();

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const uniqueStations = new Set(tickets.flatMap(t => [t.source, t.destination])).size;
  const nightRides = tickets.filter(t => {
    const h = t.travelDate ? new Date(t.travelDate).getHours() : -1;
    return h >= 22 || h < 5;
  }).length;

  const getProgress = (a) => {
    switch (a.type) {
      case 'co2':     return Math.min(totalCO2 / a.target, 1);
      case 'points':  return Math.min((user?.loyaltyPoints || 0) / a.target, 1);
      case 'streak':  return Math.min((user?.streakDays || 0) / a.target, 1);
      case 'stations':return Math.min(uniqueStations / a.target, 1);
      case 'group':   return tickets.some(t => (t.passengers?.length || 0) >= 3) ? 1 : 0;
      case 'night':   return Math.min(nightRides / a.target, 1);
      case 'offpeak': return Math.min(tickets.filter(t => { const h = t.travelDate ? new Date(t.travelDate).getHours() : -1; return h < 7 || h > 21; }).length / a.target, 1);
      case 'speed':   return tickets.length >= 3 ? 1 : 0; // simplification
      default:        return Math.min(tickets.length / a.target, 1);
    }
  };

  // Compute XP
  const totalXp = ACHIEVEMENTS.reduce((sum, a) => {
    const p = getProgress(a);
    return sum + (p >= 1 ? a.xp : Math.floor(p * a.xp * 0.3));
  }, 0);

  const level = getLevel(totalXp);
  const unlockedCount = ACHIEVEMENTS.filter(a => getProgress(a) >= 1).length;

  const categories = [
    { label: 'All', filter: null },
    { label: 'Rides', filter: (a) => !a.type || a.type === 'speed' },
    { label: 'Eco', filter: (a) => a.type === 'co2' },
    { label: 'Streaks', filter: (a) => a.type === 'streak' },
    { label: 'Rare', filter: (a) => a.rarity === 'rare' || a.rarity === 'legendary' },
  ];
  const [activeCategory, setActiveCategory] = useState('All');
  const activeFilter = categories.find(c => c.label === activeCategory)?.filter;
  const filtered = activeFilter ? ACHIEVEMENTS.filter(activeFilter) : ACHIEVEMENTS;

  return (
    <div style={{ padding: 'var(--space-lg)', maxWidth: '900px', margin: '0 auto', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes achieveStar { 0%,100%{transform:scale(1) rotate(0deg);} 50%{transform:scale(1.15) rotate(10deg);} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulseRing { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Achievements 🏆
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked · {totalXp} XP earned
        </p>
      </div>

      {/* ═══ HERO SECTION — Level Ring + Stats ═══ */}
      <div style={{
        borderRadius: '28px', overflow: 'hidden', marginBottom: '28px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
        position: 'relative',
      }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '120px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(168,85,247,0.1)', pointerEvents: 'none' }} />

        <div style={{ padding: '32px 36px', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <XPRing xp={totalXp} level={level} totalXp={totalXp} />

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, minWidth: '240px' }}>
            {[
              { icon: '🏅', label: 'Unlocked', value: unlockedCount, max: ACHIEVEMENTS.length, color: '#fbbf24' },
              { icon: '⚡', label: 'Total XP', value: totalXp.toLocaleString(), color: '#a855f7' },
              { icon: '🎫', label: 'Total Rides', value: tickets.length, color: '#22c55e' },
              { icon: '🌿', label: 'CO₂ Saved', value: `${Math.round(totalCO2)}g`, color: '#34d399' },
            ].map(({ icon, label, value, max, color }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                padding: '16px',
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {value}{max ? <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginLeft: '2px' }}>/{max}</span> : ''}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CATEGORY TABS ═══ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c.label}
            onClick={() => setActiveCategory(c.label)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontWeight: 600,
              fontSize: '0.82rem', cursor: 'pointer', border: 'none',
              background: activeCategory === c.label
                ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                : 'var(--bg-tertiary)',
              color: activeCategory === c.label ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === c.label ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ═══ ACHIEVEMENTS GRID ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {filtered.map((a, i) => {
          const progress = getProgress(a);
          const unlocked = progress >= 1;
          return (
            <div key={a.id} style={{ animation: `fadeInUp 0.4s ease ${i * 0.05}s both` }}>
              <AchievementCard
                achievement={a}
                progress={progress}
                unlocked={unlocked}
                xpEarned={unlocked ? a.xp : 0}
              />
            </div>
          );
        })}
      </div>

      {/* ═══ NEXT ACHIEVEMENT TIP ═══ */}
      {(() => {
        const nextUp = ACHIEVEMENTS.filter(a => getProgress(a) < 1 && getProgress(a) > 0)
          .sort((a, b) => getProgress(b) - getProgress(a))[0];
        if (!nextUp) return null;
        const p = getProgress(nextUp);
        const r = RARITY_STYLES[nextUp.rarity];
        return (
          <div style={{
            marginTop: '24px', borderRadius: '20px', padding: '18px 22px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <span style={{ fontSize: '1.8rem' }}>{nextUp.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
                Almost there!
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {nextUp.title} — {Math.round(p * 100)}% complete
              </div>
              <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(p * 100)}%`, background: 'linear-gradient(90deg,#6366f1,#a855f7)', borderRadius: '2px', transition: 'width 1s ease' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a855f7' }}>+{nextUp.xp}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>XP ON UNLOCK</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
