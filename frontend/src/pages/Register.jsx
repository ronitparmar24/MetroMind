// frontend/src/pages/Register.jsx
// Premium multi-step register page with Terms modal — MetroFlow-inspired.
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

/* ═══ Password Strength ═══ */
function getStrength(pw) {
  const checks = {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { checks, score, color: colors[score], label: labels[score] };
}

/* ═══ Metro SVG Background ═══ */
function MetroBackground() {
  return (
    <div className="metro-bg">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path className="metro-line-path" stroke="rgba(255,255,255,0.8)"
          d="M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200" />
        <circle className="metro-train-dot" r="5">
          <animateMotion dur="8s" repeatCount="indefinite"><mpath href="#regLine1" /></animateMotion>
        </circle>
        <path id="regLine1" d="M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200" fill="none" />
        <path className="metro-line-path" stroke="rgba(255,255,255,0.6)"
          d="M -50,600 C 150,500 400,400 600,450 S 900,550 1100,400 L 1300,350" />
        <circle className="metro-train-dot" r="4">
          <animateMotion dur="12s" repeatCount="indefinite"><mpath href="#regLine2" /></animateMotion>
        </circle>
        <path id="regLine2" d="M -50,600 C 150,500 400,400 600,450 S 900,550 1100,400 L 1300,350" fill="none" />
        <path className="metro-line-path" stroke="rgba(255,255,255,0.5)" d="M -50,80 Q 300,160 600,80 T 1300,120" />
        <circle className="metro-station-dot" cx="200" cy="200" r="6" />
        <circle className="metro-station-dot" cx="500" cy="350" r="6" />
        <circle className="metro-station-dot" cx="800" cy="200" r="6" />
        <circle className="metro-station-dot" cx="400" cy="420" r="5" />
        <circle className="metro-station-dot" cx="900" cy="450" r="5" />
      </svg>
    </div>
  );
}

function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i, size: Math.random() * 30 + 8, left: Math.random() * 100,
    delay: Math.random() * 8, duration: Math.random() * 12 + 10, opacity: Math.random() * 0.15 + 0.03,
  }));
  return <>
    {particles.map((p) => (
      <div key={p.id} className="auth-particle" style={{
        width: p.size, height: p.size, left: `${p.left}%`, bottom: '-20px',
        animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, opacity: p.opacity,
      }} />
    ))}
  </>;
}

/* ═══ Terms Modal ═══ */
function TermsModal({ open, onClose, onAccept }) {
  if (!open) return null;

  const SECTIONS = [
    { icon: '🤝', title: '1. Acceptance of Terms', color: '#6366f1',
      content: 'By registering for a MetroMind account, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. MetroMind reserves the right to modify these terms at any time with prior notice.' },
    { icon: '🛡️', title: '2. Account & Security', color: '#22c55e', list: [
      'Username must be unique across the platform.',
      'Password must be at least 6 characters. A combination of uppercase, lowercase, numbers and symbols is recommended.',
      'You are solely responsible for maintaining the confidentiality of your credentials.',
      'Each account is entitled to one digital wallet with ₹500 welcome bonus.',
    ]},
    { icon: '🎫', title: '3. Ticketing & Booking Rules', color: '#f59e0b', list: [
      'Each ticket is valid only for the selected date, route, and number of passengers.',
      'A maximum of 6 passengers can be booked per ticket.',
      'QR codes are generated upon successful booking and must be scanned at entry and exit gates.',
      'Tickets can be downloaded as PDF for offline access.',
      'Source and destination stations must be different.',
    ]},
    { icon: '💰', title: '4. Fare Calculation & Peak Hours', color: '#8b5cf6',
      content: 'Fares are dynamically calculated based on station-to-station distance.',
      table: { headers: ['Component', 'Details'], rows: [
        ['Base Fare', '₹10 (flat)'], ['Per Kilometre', '₹5/km'], ['Minimum Fare', '₹10'], ['Peak Hour Surge', '+25% surcharge'],
      ]},
      info: '⏰ Peak Hours: 8:00 AM – 11:00 AM & 5:00 PM – 7:00 PM. A 25% surge is automatically applied during these hours.' },
    { icon: '↩️', title: '5. Cancellation & Refund Policy', color: '#ef4444',
      content: 'Tickets may be cancelled before the travel date. Refunds are credited to your MetroMind wallet:',
      table: { headers: ['Window', 'Refund', 'Status'], rows: [
        ['More than 24 hours', '80%', '✅ Best Rate'], ['Less than 24 hours', '50%', '⚠️ Partial'], ['After travel / Used', '0%', '❌ Non-refundable'],
      ]} },
    { icon: '👛', title: '6. Digital Wallet', color: '#06b6d4', list: [
      'Every user receives a digital wallet upon registration with ₹500 welcome bonus.',
      'Wallet can be recharged with any positive amount.',
      'Ticket fares are automatically deducted from the wallet at booking time.',
      'All transactions (recharges, deductions, refunds) are recorded in history.',
    ]},
    { icon: '🌿', title: '7. Carbon Tracking', color: '#16a34a', list: [
      'MetroMind calculates CO₂ savings for every metro trip vs. private vehicle.',
      'Your carbon passport tracks cumulative environmental impact.',
      'Eco leaderboard ranks users by total CO₂ saved.',
    ]},
    { icon: '🔒', title: '8. Privacy & Data Protection', color: '#4f46e5', list: [
      'Passwords are securely hashed using bcrypt encryption.',
      'JWT-based authentication protects your sessions.',
      'Personal data is stored in a secure MongoDB database and never shared with third parties.',
    ]},
    { icon: '⚖️', title: '9. Limitation of Liability', color: '#64748b',
      content: 'MetroMind is a B.Tech Information Technology academic project developed for educational purposes. While designed with real-world functionality, it is not a commercial transit system. The developers are not liable for any service disruptions or data inconsistencies.' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(6px)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px',
        maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        animation: 'authCardEntrance 0.4s ease forwards',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '20px 24px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-50%', right: '-30%', width: '200px', height: '200px',
            background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                📋 Terms of Service
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', margin: '4px 0 0' }}>
                Effective: July 2026 · MetroMind v2.0
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {SECTIONS.map((s, idx) => (
            <div key={idx} style={{
              marginBottom: '20px', paddingBottom: '20px',
              borderBottom: idx < SECTIONS.length - 1 ? '1px solid #f0f0f0' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0,
                }}>{s.icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: '#1e293b' }}>{s.title}</h4>
              </div>
              {s.content && <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.7 }}>{s.content}</p>}
              {s.list && (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {s.list.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.7, marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.table && (
                <table style={{
                  width: '100%', borderCollapse: 'separate', borderSpacing: 0,
                  borderRadius: '8px', overflow: 'hidden', marginTop: '10px', fontSize: '0.82rem',
                }}>
                  <thead>
                    <tr>{s.table.headers.map((h) => (
                      <th key={h} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '10px 14px', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {s.table.rows.map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '9px 14px', color: '#555', borderBottom: '1px solid #f0f0f0', background: ri % 2 ? '#fafbff' : 'white' }}>{cell}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              )}
              {s.info && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8f9ff, #f0f4ff)',
                  borderLeft: '3px solid #6366f1', borderRadius: '0 8px 8px 0',
                  padding: '12px 16px', marginTop: '10px', fontSize: '0.82rem', color: '#555',
                }}>{s.info}</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          background: '#fafbff', padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '10px', borderTop: '1px solid #f0f0f0',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            📧 support@metromind.in · 🆘 Emergency: 155370
          </span>
          <button onClick={onAccept} style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
            border: 'none', padding: '10px 24px', borderRadius: '10px',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}>
            I Understand & Accept ✓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Step Progress ═══ */
function StepProgress({ step }) {
  const steps = ['Account', 'Security', 'Done'];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700,
              background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'white',
              color: step >= i + 1 ? 'white' : '#94a3b8',
              border: step >= i + 1 ? 'none' : '2px solid #e2e8f0',
              boxShadow: step === i + 1 ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              transition: 'all 0.4s ease',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: step > i + 1 ? '#22c55e' : step === i + 1 ? '#6366f1' : '#94a3b8',
              transition: 'color 0.3s',
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '40px', height: '2px', margin: '0 8px',
              background: step > i + 1 ? '#22c55e' : '#e2e8f0', transition: 'background 0.4s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══ Password Requirements Checklist ═══ */
function PwChecklist({ checks }) {
  const items = [
    { key: 'length', label: '6+ characters' },
    { key: 'upper', label: 'Uppercase' },
    { key: 'lower', label: 'Lowercase' },
    { key: 'number', label: 'Number' },
    { key: 'special', label: 'Special char' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', margin: '8px 0 14px' }}>
      {items.map((item) => (
        <div key={item.key} style={{
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.73rem',
          color: checks[item.key] ? '#22c55e' : '#94a3b8', transition: 'color 0.3s',
        }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem',
            background: checks[item.key] ? '#22c55e' : 'transparent',
            border: checks[item.key] ? 'none' : '1.5px solid #cbd5e1',
            color: 'white', transition: 'all 0.3s',
          }}>
            {checks[item.key] ? '✓' : ''}
          </div>
          {item.label}
        </div>
      ))}
    </div>
  );
}

/* ═══ Main Component ═══ */
export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPw: '' });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const cardRef = useRef(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const strength = getStrength(form.password);
  const passwordsMatch = form.confirmPw.length > 0 && form.password === form.confirmPw;

  // 3D tilt
  useEffect(() => {
    const card = cardRef.current;
    if (!card || window.innerWidth < 900) return;
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.01)`;
    };
    const onLeave = () => { card.style.transform = ''; };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => { card.removeEventListener('mousemove', onMove); card.removeEventListener('mouseleave', onLeave); };
  }, []);

  const goStep2 = () => {
    if (!form.name.trim()) { setError('Please enter your name'); return; }
    if (!form.email.trim()) { setError('Please enter your email'); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { goStep2(); return; }
    if (form.password !== form.confirmPw) { setError('Passwords do not match'); return; }
    if (!termsAccepted) { setError('Please accept the Terms of Service'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name, email: form.email, password: form.password, phone: form.phone,
      });
      setStep(3);
      login(res.data.token, res.data.user);
      toast.success('Account created! Welcome aboard 🎉');
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Registration failed');
      setLoading(false);
      if (cardRef.current) {
        cardRef.current.classList.remove('auth-shake');
        void cardRef.current.offsetWidth;
        cardRef.current.classList.add('auth-shake');
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      padding: '1rem', overflow: 'hidden', position: 'relative',
    }}>
      <MetroBackground />
      <Particles />

      <div className="auth-card" ref={cardRef}>
        {/* Visual Side (Desktop) */}
        <div className="auth-visual">
          <div className="auth-logo-circle">🚇</div>
          <div className="auth-visual-img" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
            borderRadius: '20px', padding: '24px', border: '1px solid rgba(99,102,241,0.1)',
          }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>🎁</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>₹500 Welcome Bonus</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>🤖</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI Crowd Predictions</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🏆</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Eco Achievements</span>
            </div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Join MetroMind!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Create your account and start your smart journey</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="auth-form-side">
          <style>{`.reg-mobile-logo { display: none !important; } @media (max-width: 899px) { .reg-mobile-logo { display: block !important; } }`}</style>
          <div className="reg-mobile-logo"><div className="auth-logo-circle">🚇</div></div>

          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.65rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '6px',
            }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Fill in your details to get started</p>
          </div>

          <StepProgress step={step} />

          {error && <div className="auth-error-alert"><span>⚠️</span><span>{error}</span></div>}

          <form onSubmit={handleSubmit}>
            {/* ═══ STEP 1: Account ═══ */}
            {step === 1 && (
              <div style={{ animation: 'authFadeIn 0.4s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>👥 Join 12,000+ commuters</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⏱ ~30 seconds</span>
                </div>

                {/* Name */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">👤</span>
                  <input type="text" className="auth-input" value={form.name}
                    onChange={(e) => update('name', e.target.value)} placeholder="Full Name" required id="reg-name" autoComplete="name" />
                </div>

                {/* Email */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">📧</span>
                  <input type="email" className="auth-input" value={form.email}
                    onChange={(e) => update('email', e.target.value)} placeholder="Email address" required id="reg-email" autoComplete="email" />
                </div>
                {form.email && (
                  <div style={{ fontSize: '0.72rem', marginTop: '-12px', marginBottom: '12px',
                    color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '✓ Valid email' : '✗ Invalid email format'}
                  </div>
                )}

                {/* Phone */}
                <div className="auth-input-group" style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    background: 'var(--bg-tertiary, #f8fafc)', border: '2px solid #e2e8f0', borderRadius: '14px',
                    padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>🇮🇳 +91</div>
                  <input type="tel" className="auth-input" value={form.phone} maxLength={10}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="Phone (optional)" autoComplete="tel" id="reg-phone"
                    style={{ paddingLeft: '14px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{form.phone.length} / 10</span>
                </div>

                <button type="button" className="auth-btn-login" onClick={goStep2} style={{ marginBottom: '12px' }}>
                  Continue →
                </button>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}>Sign In</Link>
                  </p>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Security ═══ */}
            {step === 2 && (
              <div style={{ animation: 'authFadeIn 0.4s ease' }}>
                {/* Password */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">🔒</span>
                  <input type={showPw ? 'text' : 'password'} className="auth-input" value={form.password}
                    onChange={(e) => update('password', e.target.value)} placeholder="Password" required minLength={6}
                    maxLength={15} autoComplete="new-password" id="reg-password" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Strength</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', height: '5px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, borderRadius: '3px', transition: 'background 0.3s',
                          background: i <= Math.min(strength.score, 4) ? strength.color : '#e2e8f0',
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <PwChecklist checks={strength.checks} />

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <span className="auth-input-icon">🔒</span>
                  <input type={showCpw ? 'text' : 'password'} className="auth-input" value={form.confirmPw}
                    onChange={(e) => update('confirmPw', e.target.value)} placeholder="Confirm Password" required
                    maxLength={15} autoComplete="new-password" id="reg-confirm" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowCpw(!showCpw)}>
                    {showCpw ? '🙈' : '👁️'}
                  </button>
                </div>
                {form.confirmPw.length > 0 && (
                  <div style={{ fontSize: '0.72rem', marginTop: '-12px', marginBottom: '12px',
                    color: passwordsMatch ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                {/* Terms */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  marginBottom: '16px', fontSize: '0.82rem', color: 'var(--text-muted)',
                }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ accentColor: '#6366f1', width: '16px', height: '16px' }} />
                  I agree to the{' '}
                  <span onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                    style={{ color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}>
                    Terms of Service
                  </span>
                </label>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button type="button" onClick={() => { setStep(1); setError(''); }} style={{
                    background: 'none', border: '2px solid var(--border-color, #e2e8f0)', borderRadius: '14px',
                    padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.9rem', transition: 'all 0.2s',
                  }}>
                    ← Back
                  </button>
                  <button type="submit" className="auth-btn-login" style={{ flex: 1 }} disabled={loading} id="register-submit">
                    {loading ? <div className="auth-spinner" /> : <>Create Account 🚀</>}
                  </button>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: Done ═══ */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '24px 0', animation: 'authFadeIn 0.4s ease' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%', background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  fontSize: '1.8rem', color: 'white',
                }}>✓</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Account Created!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting to your dashboard...</p>
              </div>
            )}
          </form>

          {/* Security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            marginTop: '12px', fontSize: '0.68rem', color: 'var(--text-muted)',
          }}>
            🔐 Secured with JWT · Your data is safe
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => { setTermsAccepted(true); setTermsOpen(false); }} />

      {/* Success Overlay */}
      <div className={`auth-success-overlay ${showSuccess ? 'show' : ''}`}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="4" />
          <path className="check-path" d="M24 42 L34 52 L56 30" fill="none" stroke="#22c55e" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="auth-success-title" style={{ color: 'var(--text-primary)' }}>Welcome to MetroMind! 🎉</h3>
        <p className="auth-success-sub">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
