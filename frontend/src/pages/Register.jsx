// frontend/src/pages/Register.jsx
// Premium split-screen register — viewport-fitted, multi-step, no scroll
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
  const colors = ['#e2e8f0', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#22c55e'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { checks, score, color: colors[score], label: labels[score] };
}

/* ═══ Floating particles ═══ */
function Particles() {
  const items = [
    { w: 40, left: '12%', top: '15%', dur: 22, delay: 0 },
    { w: 80, left: '72%', top: '35%', dur: 32, delay: 4 },
    { w: 56, left: '28%', top: '75%', dur: 28, delay: 2 },
    { w: 64, left: '82%', top: '8%', dur: 36, delay: 8 },
    { w: 28, left: '55%', top: '55%', dur: 18, delay: 6 },
  ];
  return items.map((p, i) => (
    <div key={i} className="auth-particle" style={{
      width: p.w, height: p.w, left: p.left, top: p.top,
      animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
    }} />
  ));
}

/* ═══ Terms Modal ═══ */
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
    { icon: '💰', title: '4. Fare Calculation', color: '#7c3aed',
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
        background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px',
        maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              📋 Terms of Service
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', margin: '2px 0 0' }}>
              MetroMind v2.0 · July 2026
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
            width: '28px', height: '28px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
          }}>✕</button>
        </div>
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {SECTIONS.map((s, idx) => (
            <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px',
              borderBottom: idx < SECTIONS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>{s.icon}</div>
                <h4 style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0, color: '#0f172a' }}>{s.title}</h4>
              </div>
              {s.content && <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>{s.content}</p>}
              {s.list && (
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {s.list.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: '1px' }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div style={{ background: '#f8fafc', padding: '12px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onAccept} className="auth-btn-primary" style={{ width: 'auto', height: '40px', padding: '0 20px' }}>
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '18px' }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'white',
              color: step >= i + 1 ? 'white' : '#cbd5e1',
              border: step >= i + 1 ? 'none' : '2px solid #e2e8f0',
              boxShadow: step === i + 1 ? '0 3px 10px rgba(79,70,229,0.3)' : 'none',
              transition: 'all 0.3s ease',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: '0.7rem', fontWeight: 600,
              color: step > i + 1 ? '#22c55e' : step === i + 1 ? '#4F46E5' : '#cbd5e1',
              transition: 'color 0.3s',
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: '32px', height: '2px', margin: '0 6px',
              background: step > i + 1 ? '#22c55e' : '#e2e8f0', transition: 'background 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══ Password Checklist ═══ */
function PwChecklist({ checks }) {
  const items = [
    { key: 'length', label: '6+ chars' },
    { key: 'upper', label: 'Uppercase' },
    { key: 'lower', label: 'Lowercase' },
    { key: 'number', label: 'Number' },
    { key: 'special', label: 'Special' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', margin: '4px 0 10px' }}>
      {items.map((item) => (
        <div key={item.key} style={{
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem',
          color: checks[item.key] ? '#22c55e' : '#cbd5e1', transition: 'color 0.3s',
        }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem',
            background: checks[item.key] ? '#22c55e' : 'transparent',
            border: checks[item.key] ? 'none' : '1.5px solid #e2e8f0',
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
        shape: 'rectangular',
        width: 340,
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
      {/* ═══ LEFT PANEL ═══ */}
      <div className="auth-visual">
        <Particles />

        <div className="auth-visual-brand">
          <span className="material-symbols-outlined">subway</span>
          <span>MetroMind</span>
        </div>

        <div className="auth-visual-content">
          <h1>Travel<br />smarter.</h1>
          <p>Join thousands of commuters who save time, money, and the planet every day.</p>

          {/* Stats */}
          <div className="auth-stats-bar">
            <div className="auth-stat-item">
              <span className="auth-stat-value">₹500</span>
              <span className="auth-stat-label">Welcome Bonus</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-value">2.4t</span>
              <span className="auth-stat-label">CO₂ Saved</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-value">4.9★</span>
              <span className="auth-stat-label">User Rating</span>
            </div>
          </div>

          {/* Metro animation */}
          <div className="auth-metro-animation">
            <div className="auth-metro-track">
              <div className="auth-metro-station" style={{ left: '0%' }} />
              <div className="auth-metro-station" style={{ left: '40%' }} />
              <div className="auth-metro-station" style={{ left: '80%' }} />
              <div className="auth-metro-train" />
            </div>
          </div>

          {/* Feature pills */}
          <div className="auth-feature-pills">
            <div className="auth-feature-pill">
              <span className="material-symbols-outlined">wallet</span>
              Digital Wallet
            </div>
            <div className="auth-feature-pill">
              <span className="material-symbols-outlined">schedule</span>
              Live Schedules
            </div>
            <div className="auth-feature-pill">
              <span className="material-symbols-outlined">credit_card</span>
              Monthly Pass
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
            <p>Start your smarter commute today.</p>
          </div>

          <StepProgress step={step} />

          {/* Error */}
          {error && (
            <div className="auth-error-alert">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
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
                  <div style={{ fontSize: '11px', marginTop: '-8px', marginBottom: '10px',
                    color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? '✓ Valid email' : '✗ Invalid email format'}
                  </div>
                )}

                {/* Phone */}
                <div className="auth-input-group">
                  <label htmlFor="reg-phone">Phone (optional)</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{
                      background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      padding: '0 10px', display: 'flex', alignItems: 'center', gap: '3px',
                      fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>🇮🇳 +91</div>
                    <div className="auth-input-wrap" style={{ flex: 1 }}>
                      <span className="material-symbols-outlined">phone</span>
                      <input type="tel" className="auth-input" value={form.phone} maxLength={10}
                        onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210" autoComplete="tel" id="reg-phone" />
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '2px' }}>
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
                      <span>Google Sign-Up unavailable</span>
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
                      autoComplete="new-password" id="reg-password" style={{ paddingRight: '42px' }} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                      <span className="material-symbols-outlined">
                        {showPw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Strength bar */}
                {form.password.length > 0 && (
                  <div style={{ marginBottom: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Strength</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', height: '4px' }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, borderRadius: '2px', transition: 'background 0.3s',
                          background: i <= Math.min(strength.score, 4) ? strength.color : '#e2e8f0',
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
                      autoComplete="new-password" id="reg-confirm" style={{ paddingRight: '42px' }} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowCpw(!showCpw)}>
                      <span className="material-symbols-outlined">
                        {showCpw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
                {form.confirmPw.length > 0 && (
                  <div style={{ fontSize: '11px', marginTop: '-8px', marginBottom: '10px',
                    color: passwordsMatch ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                {/* Terms */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  marginBottom: '12px', fontSize: '12px', color: '#475569',
                }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ accentColor: '#4F46E5', width: '15px', height: '15px' }} />
                  I agree to the{' '}
                  <span onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                    style={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
                    Terms of Service
                  </span>
                </label>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { setStep(1); setError(''); }} style={{
                    background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    padding: '10px 16px', color: '#475569', fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Inter', system-ui, sans-serif", fontSize: '13px',
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
              <div style={{ textAlign: 'center', padding: '20px 0', animation: 'authFadeIn 0.4s ease' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  fontSize: '1.5rem', color: 'white',
                }}>✓</div>
                <h3 style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a', fontSize: '1.1rem' }}>Account Created!</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Redirecting to your dashboard...</p>
              </div>
            )}
          </form>

          {/* Security badge */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            marginTop: '12px', fontSize: '10px', color: '#94a3b8',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified_user</span>
            256-bit encrypted · Your data stays private
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => { setTermsAccepted(true); setTermsOpen(false); }} />

      {/* Success Overlay */}
      <div className={`auth-success-overlay ${showSuccess ? 'show' : ''}`}>
        <svg width="72" height="72" viewBox="0 0 80 80">
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
