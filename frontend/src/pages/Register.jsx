// frontend/src/pages/Register.jsx
// 3-step registration: Account (all fields) → Verify (OTP) → Done
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, googleLogin as googleLoginApi, verifyOtp, resendOtp } from '../api/auth.api';
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
  const steps = ['Account', 'Verify', 'Done'];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', margin: '2px 0 8px' }}>
      {items.map((item) => (
        <div key={item.key} style={{
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem',
          color: checks[item.key] ? '#22c55e' : '#cbd5e1', transition: 'color 0.3s',
        }}>
          <div style={{
            width: '11px', height: '11px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4rem',
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

/* ═══ OTP Input Component ═══ */
function OtpInput({ length = 6, onComplete, hasError }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const focusInput = (idx) => {
    if (inputRefs.current[idx]) inputRefs.current[idx].focus();
  };

  const handleChange = (idx, val) => {
    // Only accept single digits
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[idx] = digit;
    setValues(next);

    if (digit && idx < length - 1) {
      focusInput(idx + 1);
    }

    // Auto-submit when all filled
    const code = next.join('');
    if (code.length === length && next.every(v => v !== '')) {
      onComplete(code);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (values[idx]) {
        const next = [...values];
        next[idx] = '';
        setValues(next);
      } else if (idx > 0) {
        focusInput(idx - 1);
        const next = [...values];
        next[idx - 1] = '';
        setValues(next);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      focusInput(idx + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length === 0) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setValues(next);
    // Focus last filled or next empty
    const focusIdx = Math.min(pasted.length, length - 1);
    focusInput(focusIdx);
    // Auto-submit if full
    if (pasted.length === length) {
      onComplete(pasted);
    }
  };

  // Reset values when error clears (allow retry)
  const reset = useCallback(() => {
    setValues(Array(length).fill(''));
    focusInput(0);
  }, [length]);

  // Expose reset via ref-like pattern
  useEffect(() => {
    if (hasError) {
      // Keep values visible briefly, then clear after shake animation
      const t = setTimeout(reset, 600);
      return () => clearTimeout(t);
    }
  }, [hasError, reset]);

  return (
    <div className="otp-container" onPaste={handlePaste}>
      {values.map((val, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className={`otp-input${val ? ' filled' : ''}${hasError ? ' error' : ''}`}
          value={val}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onFocus={(e) => e.target.select()}
          autoFocus={idx === 0}
          autoComplete="one-time-code"
        />
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
  const [otpError, setOtpError] = useState(false);

  // Resend cooldown
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  const googleBtnRef = useRef(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const strength = getStrength(form.password);
  const passwordsMatch = form.confirmPw.length > 0 && form.password === form.confirmPw;

  // Resend countdown timer
  useEffect(() => {
    if (step !== 2) return;
    setResendTimer(60);
    setCanResend(false);
    const id = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

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
      setStep(3);
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-up failed');
      setLoading(false);
    }
  };

  // Step 1 → register + send OTP
  const handleCreateAccount = async () => {
    if (!form.name.trim()) { setError('Please enter your name'); return; }
    if (!form.email.trim()) { setError('Please enter your email'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPw) { setError('Passwords do not match'); return; }
    if (!termsAccepted) { setError('Please accept the Terms of Service'); return; }

    setError('');
    setLoading(true);
    try {
      const res = await registerUser({
        name: form.name, email: form.email, password: form.password, phone: form.phone,
      });
      if (res.data.requiresVerification) {
        toast.success('Verification code sent to your email! 📧');
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Registration failed');
      if (formRef.current) {
        formRef.current.classList.remove('auth-shake');
        void formRef.current.offsetWidth;
        formRef.current.classList.add('auth-shake');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → verify OTP
  const handleVerifyOtp = async (code) => {
    setError('');
    setOtpError(false);
    setLoading(true);
    try {
      const res = await verifyOtp(form.email, code);
      login(res.data.token, res.data.user);
      toast.success('Account verified! Welcome aboard 🎉');
      setStep(3);
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid verification code';
      setError(msg);
      setOtpError(true);
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    try {
      await resendOtp(form.email);
      toast.success('New verification code sent! 📧');
      setCanResend(false);
      setResendTimer(60);
      // Restart countdown
      const id = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) handleCreateAccount();
  };

  // Mask email for display
  const maskedEmail = form.email
    ? form.email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '•'.repeat(Math.min(b.length, 5)) + c)
    : '';

  return (
    <div className="auth-page">
      {/* ═══ LEFT PANEL ═══ */}
      <div className="auth-visual">
        <Particles />
        <Link to="/" className="auth-visual-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="material-symbols-outlined">subway</span>
          <span>MetroMind</span>
        </Link>
        <div className="auth-visual-content">
          <h1>Travel<br />smarter.</h1>
          <p>Join thousands of commuters who save time, money, and the planet every day.</p>
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
          <div className="auth-metro-animation">
            <div className="auth-metro-track">
              <div className="auth-metro-station" style={{ left: '0%' }} />
              <div className="auth-metro-station" style={{ left: '40%' }} />
              <div className="auth-metro-station" style={{ left: '80%' }} />
              <div className="auth-metro-train" />
            </div>
          </div>
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
          <Link to="/" className="auth-mobile-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </Link>

          {/* Heading */}
          <div className="auth-heading auth-anim d1">
            <h2>{step === 2 ? 'Verify your email' : step === 3 ? 'All set!' : 'Create your account'}</h2>
            <p>{step === 2 ? `Enter the code sent to ${maskedEmail}` : step === 3 ? 'Your account is ready.' : 'Start your smarter commute today.'}</p>
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
            {/* ═══ STEP 1: Account + Password + Terms ═══ */}
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

                {/* Strength bar + checklist */}
                {form.password.length > 0 && (
                  <div style={{ marginBottom: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Strength</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '3px', height: '3px' }}>
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
                  <div style={{ fontSize: '11px', marginTop: '-8px', marginBottom: '8px',
                    color: passwordsMatch ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                    {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                {/* Terms */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  marginBottom: '10px', fontSize: '12px', color: '#475569',
                }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{ accentColor: '#4F46E5', width: '15px', height: '15px' }} />
                  I agree to the{' '}
                  <span onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                    style={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer' }}>
                    Terms of Service
                  </span>
                </label>

                {/* Create Account button */}
                <button type="submit" className="auth-btn-primary" disabled={loading} id="register-submit">
                  {loading ? <div className="auth-spinner" /> : (
                    <>
                      <span>Create Account</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>

                {/* Divider + Google */}
                <div className="auth-divider"><span>or</span></div>
                <div style={{ width: '100%' }}>
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                    <div className="google-btn-wrapper">
                      <div className="google-btn-inner">
                        <div ref={googleBtnRef} style={{
                          display: 'flex', justifyContent: 'center', width: '100%',
                        }} />
                      </div>
                    </div>
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

            {/* ═══ STEP 2: OTP Verification ═══ */}
            {step === 2 && (
              <div style={{ animation: 'authFadeIn 0.4s ease', textAlign: 'center' }}>
                {/* Email icon */}
                <div className="otp-email-icon">
                  <span className="material-symbols-outlined">mark_email_read</span>
                </div>

                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                  We sent a 6-digit code to
                </p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                  {form.email}
                </p>

                {/* OTP Inputs */}
                <OtpInput length={6} onComplete={handleVerifyOtp} hasError={otpError} />

                {/* Verify button */}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                    <div className="auth-spinner" style={{ borderColor: 'rgba(79,70,229,0.2)', borderTopColor: '#4F46E5' }} />
                  </div>
                )}

                {/* Resend */}
                <div className="otp-resend">
                  {canResend ? (
                    <>
                      Didn't receive the code?{' '}
                      <button type="button" onClick={handleResendOtp}>Resend code</button>
                    </>
                  ) : (
                    <span>Resend code in <strong>{resendTimer}s</strong></span>
                  )}
                </div>

                {/* Back */}
                <button type="button" onClick={() => { setStep(1); setError(''); }} style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontSize: '13px', cursor: 'pointer', marginTop: '16px', fontWeight: 500,
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  ← Change email
                </button>
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
                <h3 style={{ fontWeight: 700, marginBottom: '6px', color: '#0f172a', fontSize: '1.1rem' }}>Account Verified!</h3>
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Redirecting to your dashboard...</p>
              </div>
            )}
          </form>

          {/* Security badge */}
          {step !== 3 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
              marginTop: '12px', fontSize: '10px', color: '#94a3b8',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified_user</span>
              256-bit encrypted · Your data stays private
            </div>
          )}
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
