// frontend/src/pages/EmergencySOS.jsx
// MetroMind — Emergency SOS with hold-to-activate + nearest station info
import { useState, useRef, useEffect } from 'react';

const CONTACTS = [
  { label: 'Metro Control Room', number: '079-2657-2900', icon: '🚇', color: '#6366f1', desc: '24/7 metro helpline' },
  { label: 'Police',             number: '100',           icon: '🚔', color: '#3b82f6', desc: 'Emergency response' },
  { label: 'Ambulance',          number: '108',           icon: '🚑', color: '#ef4444', desc: 'Medical emergency' },
  { label: 'Fire Brigade',       number: '101',           icon: '🚒', color: '#f97316', desc: 'Fire & rescue' },
  { label: 'Women Helpline',     number: '1091',          icon: '🛡️', color: '#a855f7', desc: 'Women safety' },
  { label: 'Child Helpline',     number: '1098',          icon: '🧒', color: '#22c55e', desc: 'Child safety' },
];

const NEAREST_STATIONS = [
  { name: 'Kalupur Railway Station', exit: 'Exit 1 — Railway side', security: '24h' },
  { name: 'Old High Court',          exit: 'Exit 2 — Ashram Road', security: '24h' },
  { name: 'Thaltej',                 exit: 'Exit 1 — Main road',   security: '6am-11pm' },
];

/* Hold-to-SOS Button */
function HoldSOSButton() {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const holdTimer = useRef(null);
  const progressTimer = useRef(null);
  const HOLD_DURATION = 3000;

  const startHold = () => {
    if (activated) return;
    setHolding(true);
    setProgress(0);
    const startTime = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        clearInterval(progressTimer.current);
        setActivated(true);
        setHolding(false);
      }
    }, 30);
  };

  const stopHold = () => {
    if (activated) return;
    setHolding(false);
    clearInterval(progressTimer.current);
    setProgress(0);
  };

  const reset = () => { setActivated(false); setProgress(0); setHolding(false); };

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - circumference * progress;

  if (activated) {
    return (
      <div style={{ textAlign: 'center', animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '3rem', boxShadow: '0 0 0 20px rgba(239,68,68,0.1), 0 0 0 40px rgba(239,68,68,0.05)', animation: 'sosPulse 1s ease-in-out infinite' }}>
          🆘
        </div>
        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#ef4444', marginBottom: '6px' }}>SOS Activated!</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Stay calm. Share your station location with the operator.</div>
        <button onClick={reset} style={{ padding: '10px 24px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
          Cancel SOS
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px' }}>
        {/* Progress ring */}
        <svg width="130" height="130" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="6" />
          <circle cx="65" cy="65" r="52" fill="none" stroke="#ef4444" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: holding ? 'stroke-dashoffset 0.03s linear' : 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {/* Button */}
        <div
          onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
          onTouchStart={startHold} onTouchEnd={stopHold}
          style={{
            position: 'absolute', inset: '8px', borderRadius: '50%',
            background: holding ? '#dc2626' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', userSelect: 'none',
            boxShadow: holding ? '0 0 0 6px rgba(239,68,68,0.2)' : '0 8px 24px rgba(239,68,68,0.4)',
            transition: 'all 0.15s ease',
            transform: holding ? 'scale(0.94)' : 'scale(1)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>🆘</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>SOS</div>
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
        {holding ? `Hold… ${Math.round((1 - progress) * 3)}s` : 'Hold 3 seconds to activate'}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prevents accidental activation</div>
    </div>
  );
}

export default function EmergencySOS() {
  const [copied, setCopied] = useState('');

  const copyNumber = (num) => {
    navigator.clipboard?.writeText(num).catch(() => {});
    setCopied(num);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div style={{ padding: 'var(--space-lg)', width: '100%', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes sosPulse { 0%,100%{box-shadow:0 0 0 20px rgba(239,68,68,0.1),0 0 0 40px rgba(239,68,68,0.05);} 50%{box-shadow:0 0 0 28px rgba(239,68,68,0.15),0 0 0 56px rgba(239,68,68,0.06);} }
      `}</style>

      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>Emergency SOS 🆘</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>Immediate help at your fingertips</p>

      {/* ═══ HOLD-TO-SOS BUTTON ═══ */}
      <div style={{ borderRadius: '24px', background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.05))', border: '1px solid rgba(239,68,68,0.2)', padding: '36px 24px', textAlign: 'center', marginBottom: '20px' }}>
        <HoldSOSButton />
      </div>

      {/* ═══ NEAREST STATIONS ═══ */}
      <div style={{ borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>📍 Well-Lit Station Exits</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {NEAREST_STATIONS.map(s => (
            <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-tertiary)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{s.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.exit}</div>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 8px', borderRadius: '8px', flexShrink: 0, marginLeft: '8px' }}>
                🔒 {s.security}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ EMERGENCY CONTACTS ═══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {CONTACTS.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '16px 18px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0, border: `1px solid ${c.color}30` }}>
              {c.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.desc}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: c.color, fontFamily: 'monospace' }}>{c.number}</span>
              <button onClick={() => copyNumber(c.number)} title="Copy number" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {copied === c.number ? '✓' : '📋'}
              </button>
              <a href={`tel:${c.number}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', background: c.color, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', boxShadow: `0 4px 10px ${c.color}40`, transition: 'opacity 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                📞 Call
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Safety tip */}
      <div style={{ marginTop: '20px', padding: '16px 18px', borderRadius: '16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <strong style={{ color: '#6366f1' }}>Stay safe tip:</strong> If in trouble on the platform, approach the Station Master's cabin near the ticket counter or press the help button on the platform screen doors.
      </div>
    </div>
  );
}
