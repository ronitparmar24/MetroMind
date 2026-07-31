// frontend/src/pages/Login.jsx
// Premium split-screen login — viewport-fitted, no scroll
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, googleLogin as googleLoginApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

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

/* ═══ Live clock ═══ */
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginSteps, setLoginSteps] = useState([false, false, false]);
  const [stepsVisible, setStepsVisible] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  const googleBtnRef = useRef(null);
  const clock = useClock();

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
        text: 'signin_with',
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
      toast.success(
        res.data.isNewUser
          ? `Welcome to MetroMind, ${res.data.user.name}! 🎉`
          : `Welcome back, ${res.data.user.name}!`
      );
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStepsVisible(true);
    setLoginSteps([true, false, false]);

    try {
      const res = await loginUser({ email, password });
      setLoginSteps([true, true, false]);
      await new Promise((r) => setTimeout(r, 400));
      setLoginSteps([true, true, true]);

      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name || 'User'}!`);
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
      setLoading(false);
      setStepsVisible(false);
      setLoginSteps([false, false, false]);

      if (formRef.current) {
        formRef.current.classList.remove('auth-shake');
        void formRef.current.offsetWidth;
        formRef.current.classList.add('auth-shake');
      }
    }
  };

  const hour = clock.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
          <h1>Your city,<br />connected.</h1>
          <p>Real-time crowd prediction, smart ticketing, and sustainable transit — all in one platform.</p>

          {/* Stats */}
          <div className="auth-stats-bar">
            <div className="auth-stat-item">
              <span className="auth-stat-value">32</span>
              <span className="auth-stat-label">Stations</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-value">50K+</span>
              <span className="auth-stat-label">Riders Daily</span>
            </div>
            <div className="auth-stat-item">
              <span className="auth-stat-value">98%</span>
              <span className="auth-stat-label">On-Time</span>
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
              <span className="material-symbols-outlined">qr_code_2</span>
              QR Tickets
            </div>
            <div className="auth-feature-pill">
              <span className="material-symbols-outlined">eco</span>
              Carbon Tracker
            </div>
            <div className="auth-feature-pill">
              <span className="material-symbols-outlined">trending_up</span>
              Crowd AI
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

          {/* Desktop logo */}
          <div className="auth-logo-bar auth-anim" style={{ display: 'none' }}>
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </div>
          <style>{`@media (min-width: 900px) { .auth-logo-bar { display: flex !important; } }`}</style>

          {/* Header */}
          <div className="auth-heading auth-anim d1">
            <h2>{greeting} 👋</h2>
            <p>Sign in to manage your commute.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-alert">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-input-group auth-anim d2">
              <label htmlFor="login-email">Email</label>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-input-group auth-anim d3">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <a href="#">Forgot?</a>
              </div>
              <div className="auth-input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  style={{ paddingRight: '42px' }}
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  <span className="material-symbols-outlined">
                    {showPw ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="auth-anim d4" style={{ paddingTop: '4px' }}>
              <button type="submit" className="auth-btn-primary" disabled={loading} id="login-submit">
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>

            {/* Login steps progress */}
            <div className={`login-steps ${stepsVisible ? 'visible' : ''}`}>
              <div className={`login-step-item ${loginSteps[0] ? 'active' : ''}`}>
                <div className="login-step-dot" /> Verifying
              </div>
              <div className={`login-step-connector ${loginSteps[1] ? 'active' : ''}`} />
              <div className={`login-step-item ${loginSteps[1] ? 'active' : ''}`}>
                <div className="login-step-dot" /> Securing
              </div>
              <div className={`login-step-connector ${loginSteps[2] ? 'active' : ''}`} />
              <div className={`login-step-item ${loginSteps[2] ? 'active' : ''}`}>
                <div className="login-step-dot" /> Redirecting
              </div>
            </div>

            {/* Divider */}
            <div className="auth-divider auth-anim d4">
              <span>or</span>
            </div>

            {/* Google sign-in */}
            <div className="auth-anim d5" style={{ width: '100%' }}>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div ref={googleBtnRef} style={{
                  display: 'flex', justifyContent: 'center', width: '100%',
                }} />
              ) : (
                <button type="button" className="auth-btn-google" disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <span>Google Sign-In unavailable</span>
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer-link auth-anim d5">
            Don't have an account?
            <Link to="/register">Create one</Link>
          </div>

          {/* Quick access */}
          <div className="auth-anim d6" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '16px' }}>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 500, marginBottom: '8px' }}>
              Quick Access (Demo)
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="auth-quick-btn"
                onClick={() => { setEmail('admin@metromind.in'); setPassword('admin123'); }}>
                🛡️ Admin
              </button>
              <button type="button" className="auth-quick-btn"
                onClick={() => { setEmail('user@metromind.in'); setPassword('user123'); }}>
                👤 User
              </button>
            </div>
          </div>

          {/* Security */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '12px', fontSize: '10px', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified_user</span>
            256-bit encrypted · Your data stays private
          </div>
        </div>
      </div>

      {/* ═══ Success Overlay ═══ */}
      <div className={`auth-success-overlay ${showSuccess ? 'show' : ''}`}>
        <svg width="72" height="72" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="4" />
          <path className="check-path" d="M24 42 L34 52 L56 30" fill="none" stroke="#22c55e" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="auth-success-title">Welcome back!</h3>
        <p className="auth-success-sub">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
