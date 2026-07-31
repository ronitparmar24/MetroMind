// frontend/src/pages/Login.jsx
// Stitch-inspired split-screen login — gradient left, form right
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, googleLogin as googleLoginApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

/* ═══ Password Strength ═══ */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { score: s, color: colors[s - 1] || '#dce2f3', label: labels[s - 1] || '' };
}

/* ═══ Floating particles on gradient side ═══ */
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
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
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

  const strength = getStrength(password);

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

  return (
    <div className="auth-page">
      {/* ═══ LEFT PANEL — Gradient Brand ═══ */}
      <div className="auth-visual">
        <Particles />

        {/* Brand logo top-left */}
        <div className="auth-visual-brand">
          <span className="material-symbols-outlined">subway</span>
          <span>MetroMind</span>
        </div>

        {/* Centered content */}
        <div className="auth-visual-content">
          <h1>Know before<br />you go.</h1>
          <p>Real-time crowd prediction for a smoother commute.</p>

          {/* Mini metro line animation */}
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
          {/* Mobile brand (hidden on desktop) */}
          <div className="auth-mobile-brand">
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </div>

          {/* Desktop logo bar */}
          <div className="auth-logo-bar auth-anim" style={{ display: 'none' }}>
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </div>
          <style>{`@media (min-width: 900px) { .auth-logo-bar { display: flex !important; } }`}</style>

          {/* Header */}
          <div className="auth-heading auth-anim d1">
            <h2>Welcome back</h2>
            <p>Sign in to manage your commute.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error-alert">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
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
                  style={{ paddingRight: '46px' }}
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  <span className="material-symbols-outlined">
                    {showPw ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div className="pw-strength-wrap">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="pw-strength-seg"
                      style={{ background: i <= strength.score ? strength.color : undefined }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600, marginTop: '-4px' }}>
                  {strength.label}
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="auth-anim d4" style={{ paddingTop: '8px' }}>
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

            {/* Google sign-in — real OAuth 2.0 */}
            <div className="auth-anim d5" style={{ width: '100%' }}>
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <div ref={googleBtnRef} style={{
                  display: 'flex', justifyContent: 'center', width: '100%',
                }} />
              ) : (
                <button type="button" className="auth-btn-google" disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <GoogleLogo />
                  <span>Google Sign-In (configure GOOGLE_CLIENT_ID)</span>
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="auth-footer-link auth-anim d5">
            Don't have an account?
            <Link to="/register">Create one</Link>
          </div>

          {/* Quick access (demo) */}
          <div className="auth-anim d6" style={{ borderTop: '1px solid #dce2f3', paddingTop: '16px', marginTop: '24px' }}>
            <p style={{ textAlign: 'center', color: '#777587', fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>
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

          {/* Security badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', fontSize: '11px', color: '#777587' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            Secured with JWT · Your data is safe
          </div>
        </div>
      </div>

      {/* ═══ Success Overlay ═══ */}
      <div className={`auth-success-overlay ${showSuccess ? 'show' : ''}`}>
        <svg width="80" height="80" viewBox="0 0 80 80">
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
