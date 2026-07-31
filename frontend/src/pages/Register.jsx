// frontend/src/pages/Register.jsx
// Stitch-inspired split-screen register — gradient left, form right
// Preserves: multi-step flow, TermsModal, PwChecklist, validation, success overlay
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, googleLogin as googleLoginApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

/* ═══ Password Strength ═══ */
function getStrength(pw) {
  const checks = {
    length: pw.length >= 6, upper: /[A-Z]/.test(pw), lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw), special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = ['#dce2f3', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { checks, score, color: colors[score], label: labels[score] };
}

/* ═══ Floating particles ═══ */
function Particles() {
  const items = [
    { w: 48, left: '10%', top: '20%', dur: 25, delay: 0 },
    { w: 96, left: '70%', top: '40%', dur: 35, delay: 5 },
    { w: 64, left: '30%', top: '80%', dur: 30, delay: 2 },
    { w: 80, left: '80%', top: '10%', dur: 40, delay: 10 },
    { w: 32, left: '50%', top: '60%', dur: 20, delay: 7 },
  ];
  return items.map((p, i) => (
    <div key={i} className="auth-particle" style={{
      width: p.w, height: p.w, left: p.left, top: p.top,
      animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
    }} />
  ));
}

/* ═══ Google SVG Logo ═══ */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ═══ Terms Modal (unchanged logic) ═══ */
function TermsModal({ open, onClose, onAccept }) {
  if (!open) return null;
  const SECTIONS = [
    { icon: '🤝', title: '1. Acceptance of Terms', color: '#4F46E5',
      content: 'By registering for a MetroMind account, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.' },
    { icon: '🛡️', title: '2. Account & Security', color: '#22c55e', list: [
      'Username must be unique across the platform.',
      'Password must be at least 6 characters.',
      'You are responsible for maintaining credential confidentiality.',
      'Each account gets one digital wallet with ₹500 welcome bonus.',
    ]},
    { icon: '🎫', title: '3. Ticketing & Booking', color: '#f59e0b', list: [
      'Each ticket is valid for the selected date, route, and passengers.',
      'Maximum 6 passengers per ticket.',
      'QR codes are generated upon booking.',
    ]},
    { icon: '💰', title: '4. Fare Calculation', color: '#712ae2',
      content: 'Fares are dynamically calculated. Base: ₹10, per km: ₹5. Peak hours (8–11 AM, 5–7 PM): +25% surge.' },
    { icon: '🌿', title: '5. Carbon Tracking', color: '#16a34a', list: [
      'MetroMind calculates CO₂ savings for every metro trip.',
      'Eco leaderboard ranks users by total CO₂ saved.',
    ]},
    { icon: '🔒', title: '6. Privacy & Data Protection', color: '#4F46E5', list: [
      'Passwords are hashed with bcrypt.',
      'JWT-based authentication protects sessions.',
      'Personal data is never shared with third parties.',
    ]},
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(6px)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
        maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', padding: '20px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
              📋 Terms of Service
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: '4px 0 0' }}>
              MetroMind v2.0 · July 2026
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem',
          }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {SECTIONS.map((s, idx) => (
            <div key={idx} style={{ marginBottom: '16px', paddingBottom: '16px',
              borderBottom: idx < SECTIONS.length - 1 ? '1px solid #f0f3ff' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>{s.icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0, color: '#151c27' }}>{s.title}</h4>
              </div>
              {s.content && <p style={{ fontSize: '0.85rem', color: '#464555', lineHeight: 1.6 }}>{s.content}</p>}
              {s.list && (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {s.list.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: '#464555', lineHeight: 1.6, marginBottom: '2px' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div style={{ background: '#f9f9ff', padding: '14px 24px', borderTop: '1px solid #f0f3ff',
          display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onAccept} className="auth-btn-primary" style={{ width: 'auto', height: '44px', padding: '0 24px' }}>
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
              background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'white',
              color: step >= i + 1 ? 'white' : '#c7c4d8',
              border: step >= i + 1 ? 'none' : '2px solid #dce2f3',
              boxShadow: step === i + 1 ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
              transition: 'all 0.4s ease',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: step > i + 1 ? '#22c55e' : step === i + 1 ? '#4F46E5' : '#c7c4d8',
              transition: 'color 0.3s',
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '40px', height: '2px', margin: '0 8px',
              background: step > i + 1 ? '#22c55e' : '#dce2f3', transition: 'background 0.4s',
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
          color: checks[item.key] ? '#22c55e' : '#c7c4d8', transition: 'color 0.3s',
        }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem',
            background: checks[item.key] ? '#22c55e' : 'transparent',
            border: checks[item.key] ? 'none' : '1.5px solid #dce2f3',
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
  const formRef = useRef(null);
  const googleBtnRef = useRef(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const strength = getStrength(form.password);
  const passwordsMatch = form.confirmPw.length > 0 && form.password === form.confirmPw;

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        shape: 'pill',
        width: 350,
        logo_alignment: 'left',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCallback = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await googleLoginApi(response.credential);
      login(res.data.token, res.data.user);
      toast.success(`Welcome to MetroMind, ${res.data.user.name}! 🎉`);
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-up failed');
      setLoading(false);
    }
  };

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
      if (formRef.current) {
        formRef.current.classList.remove('auth-shake');
        void formRef.current.offsetWidth;
        formRef.current.classList.add('auth-shake');
      }
    }
  };

  return (
    <div className="auth-page">
      {/* ═══ LEFT PANEL — Gradient Brand ═══ */}
      <div className="auth-visual">
        <Particles />

        <div className="auth-visual-brand">
          <span className="material-symbols-outlined">subway</span>
          <span>MetroMind</span>
        </div>

        <div className="auth-visual-content">
          <h1>Know before<br />you go.</h1>
          <p>Smart transit planning for the modern urban commuter. Join thousands already traveling smarter.</p>

          <div className="auth-metro-animation">
            <div className="auth-metro-track">
              <div className="auth-metro-station" style={{ left: '0%' }} />
              <div className="auth-metro-station" style={{ left: '40%' }} />
              <div className="auth-metro-station" style={{ left: '80%' }} />
              <div className="auth-metro-train" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Form ═══ */}
      <div className="auth-form-side">
        <div className="auth-form-inner" ref={formRef}>
          {/* Mobile brand */}
          <div className="auth-mobile-brand">
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </div>

          {/* Heading */}
          <div className="auth-heading auth-anim d1">
            <h2>Create your account</h2>
            <p>Join MetroMind to start planning your smarter commute.</p>
          </div>

          <StepProgress step={step} />

          {/* Error */}
          {error && (
            <div className="auth-error-alert">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ═══ STEP 1: Account ═══ */}
            {step === 1 && (
              <div style={{ animation: 'authFadeIn 0.4s ease' }}>
                {/* Full Name */}
                <div className="auth-input-group">
                  <label htmlFor="reg-name">Full Name</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">person</span>
                    <input type="text" className="auth-input" value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="John Doe" required id="reg-name" autoComplete="name" />
                  </div>
                </div>

                {/* Email */}
                <div className="auth-input-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">mail</span>
                    <input type="email" className="auth-input" value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="john@example.com" required id="reg-email" autoComplete="email" />
                  </div>
                </div>
                {form.email && (
                  <div style={{ fontSize: '12px', marginTop: '-10px', marginBottom: '12px',
                    color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '#22c55e' : '#ba1a1a', fontWeight: 500 }}>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '✓ Valid email' : '✗ Invalid email format'}
                  </div>
                )}

                {/* Phone */}
                <div className="auth-input-group">
                  <label htmlFor="reg-phone">Phone (optional)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                      background: '#f0f3ff', border: '2px solid #dce2f3', borderRadius: '12px',
                      padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '13px', fontWeight: 700, color: '#464555', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>🇮🇳 +91</div>
                    <div className="auth-input-wrap" style={{ flex: 1 }}>
                      <span className="material-symbols-outlined">phone</span>
                      <input type="tel" className="auth-input" value={form.phone} maxLength={10}
                        onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210" autoComplete="tel" id="reg-phone" />
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <button type="button" className="auth-btn-primary" onClick={goStep2}>
                    <span>Continue</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>

                {/* Divider + Google */}
                <div className="auth-divider"><span>or</span></div>
                <div style={{ width: '100%' }}>
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                    <div ref={googleBtnRef} style={{
                      display: 'flex', justifyContent: 'center', width: '100%',
                    }} />
                  ) : (
                    <button type="button" className="auth-btn-google" disabled
                      style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                      <GoogleLogo />
                      <span>Google Sign-Up (configure GOOGLE_CLIENT_ID)</span>
                    </button>
                  )}
                </div>

                <div className="auth-footer-link">
                  Already have an account?
                  <Link to="/login">Sign in</Link>
                </div>
              </div>
            )}

            {/* ═══ STEP 2: Security ═══ */}
            {step === 2 && (
              <div style={{ animation: 'authFadeIn 0.4s ease' }}>
                {/* Password */}
                <div className="auth-input-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">lock</span>
                    <input type={showPw ? 'text' : 'password'} className="auth-input" value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="••••••••" required minLength={6} maxLength={15}
                      autoComplete="new-password" id="reg-password" style={{ paddingRight: '46px' }} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                      <span className="material-symbols-outlined">
                        {showPw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                  <p className="pw-hint">Must be at least 6 characters.</p>
                </div>

                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#777587', fontWeight: 600 }}>Strength</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', height: '5px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, borderRadius: '3px', transition: 'background 0.3s',
                          background: i <= Math.min(strength.score, 4) ? strength.color : '#dce2f3',
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                <PwChecklist checks={strength.checks} />

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <label htmlFor="reg-confirm">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">lock</span>
                    <input type={showCpw ? 'text' : 'password'} className="auth-input" value={form.confirmPw}
                      onChange={(e) => update('confirmPw', e.target.value)}
                      placeholder="••••••••" required maxLength={15}
                      autoComplete="new-password" id="reg-confirm" style={{ paddingRight: '46px' }} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowCpw(!showCpw)}>
                      <span className="material-symbols-outlined">
                        {showCpw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
                {form.confirmPw.length > 0 && (
                  <div style={{ fontSize: '12px', marginTop: '-10px', marginBottom: '12px',
                    color: passwordsMatch ? '#22c55e' : '#ba1a1a', fontWeight: 500 }}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                {/* Terms */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                  marginBottom: '16px', fontSize: '13px', color: '#464555',
                }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ accentColor: '#4F46E5', width: '16px', height: '16px' }} />
                  I agree to the{' '}
                  <span onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                    style={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
                    Terms of Service
                  </span>
                </label>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => { setStep(1); setError(''); }} style={{
                    background: 'none', border: '2px solid #dce2f3', borderRadius: '9999px',
                    padding: '12px 20px', color: '#464555', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Inter', system-ui, sans-serif", fontSize: '14px',
                  }}>
                    ← Back
                  </button>
                  <button type="submit" className="auth-btn-primary" style={{ flex: 1 }} disabled={loading} id="register-submit">
                    {loading ? <div className="auth-spinner" /> : (
                      <>
                        <span>Create Account</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
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
                <h3 style={{ fontWeight: 700, marginBottom: '8px', color: '#151c27', fontSize: '1.2rem' }}>Account Created!</h3>
                <p style={{ color: '#464555', fontSize: '0.9rem' }}>Redirecting to your dashboard...</p>
              </div>
            )}
          </form>

          {/* Security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            marginTop: '16px', fontSize: '11px', color: '#777587',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            Secured with JWT · Your data is safe
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
        <h3 className="auth-success-title">Welcome to MetroMind! 🎉</h3>
        <p className="auth-success-sub">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
