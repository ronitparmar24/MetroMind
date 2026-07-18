// frontend/src/pages/Login.jsx
// Premium login page — MetroFlow-inspired with animated metro background,
// two-panel card, password strength, success overlay, and 3D tilt.
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import '../styles/auth.css';

/* ═══ Password Strength Logic ═══ */
function getStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return { score: s, color: colors[s - 1] || '#e2e8f0', label: labels[s - 1] || '' };
}

/* ═══ Metro SVG Background (theme-aware via CSS) ═══ */
function MetroBackground() {
  return (
    <div className="metro-bg">
      <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
        {/* Line 1: Horizontal */}
        <path className="metro-line-path"
          d="M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200">
          <animate attributeName="d" dur="20s" repeatCount="indefinite"
            values="M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200;M -50,250 C 200,180 300,300 500,380 S 800,250 1050,180 L 1300,250;M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200" />
        </path>
        <circle className="metro-train-dot" r="5">
          <animateMotion dur="8s" repeatCount="indefinite">
            <mpath href="#loginLine1" />
          </animateMotion>
        </circle>
        <path id="loginLine1" d="M -50,200 C 200,200 300,350 500,350 S 800,200 1050,200 L 1300,200" fill="none" />

        {/* Line 2: Diagonal */}
        <path className="metro-line-path"
          d="M -50,600 C 150,500 400,400 600,450 S 900,550 1100,400 L 1300,350" />
        <circle className="metro-train-dot" r="4">
          <animateMotion dur="12s" repeatCount="indefinite">
            <mpath href="#loginLine2" />
          </animateMotion>
        </circle>
        <path id="loginLine2" d="M -50,600 C 150,500 400,400 600,450 S 900,550 1100,400 L 1300,350" fill="none" />

        {/* Line 3: Top sweep */}
        <path className="metro-line-path"
          d="M -50,80 Q 300,160 600,80 T 1300,120" />
        <circle className="metro-train-dot" r="3.5">
          <animateMotion dur="10s" repeatCount="indefinite">
            <mpath href="#loginLine3" />
          </animateMotion>
        </circle>
        <path id="loginLine3" d="M -50,80 Q 300,160 600,80 T 1300,120" fill="none" />

        {/* Station dots */}
        <circle className="metro-station-dot" cx="200" cy="200" r="6" />
        <circle className="metro-station-dot" cx="500" cy="350" r="6" />
        <circle className="metro-station-dot" cx="800" cy="200" r="6" />
        <circle className="metro-station-dot" cx="400" cy="420" r="5" />
        <circle className="metro-station-dot" cx="900" cy="450" r="5" />
        <circle className="metro-station-dot" cx="300" cy="100" r="4" />
        <circle className="metro-station-dot" cx="800" cy="90" r="4" />
      </svg>
    </div>
  );
}

/* ═══ Floating Particles ═══ */
function Particles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 30 + 8,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 12 + 10,
    opacity: Math.random() * 0.15 + 0.03,
  }));

  return (
    <>
      {particles.map((p) => (
        <div key={p.id} className="auth-particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`, bottom: '-20px',
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          opacity: p.opacity,
        }} />
      ))}
    </>
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
  const cardRef = useRef(null);

  // 3D Card Tilt (desktop only)
  useEffect(() => {
    const card = cardRef.current;
    if (!card || window.innerWidth < 900) return;

    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.01)`;
      card.style.boxShadow = `${-x * 20}px ${y * 20}px 60px rgba(0,0,0,0.2)`;
    };
    const onLeave = () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStepsVisible(true);

    // Step 1: Verifying
    setLoginSteps([true, false, false]);

    try {
      const res = await loginUser({ email, password });

      // Step 2: Securing
      setLoginSteps([true, true, false]);
      await new Promise((r) => setTimeout(r, 400));

      // Step 3: Redirecting
      setLoginSteps([true, true, true]);

      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name || 'User'}!`);

      // Show success overlay
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
      setLoading(false);
      setStepsVisible(false);
      setLoginSteps([false, false, false]);

      // Shake card
      if (cardRef.current) {
        cardRef.current.classList.remove('auth-shake');
        void cardRef.current.offsetWidth;
        cardRef.current.classList.add('auth-shake');
      }
    }
  };

  return (
    <div className="auth-page">
      <MetroBackground />
      <Particles />

      {/* ═══ Main Card ═══ */}
      <div className="auth-card" ref={cardRef}>

        {/* Left: Visual Side (Desktop) */}
        <div className="auth-visual">
          <div className="auth-logo-circle">🚇</div>

          {/* Floating dashboard mockup */}
          <div className="auth-visual-img" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(99,102,241,0.1)',
          }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            </div>
            {/* Mini feature list */}
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>🤖</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI Crowd Predictions</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>🌿</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Carbon Tracking</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🎫</div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Instant QR Tickets</span>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Welcome Back!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Access your dashboard and manage your metro journey
            </p>
          </div>
        </div>

        {/* Right: Form Side */}
        <div className="auth-form-side">
          {/* Mobile-only logo */}
          <div style={{ display: 'none' }} className="auth-mobile-logo">
            <div className="auth-logo-circle">🚇</div>
          </div>
          <style>{`.auth-mobile-logo { display: none !important; } @media (max-width: 899px) { .auth-mobile-logo { display: block !important; } }`}</style>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.65rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '6px',
            }}>
              Sign In
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Enter your credentials to continue
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="auth-error-alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-input-group">
              <span className="auth-input-icon">📧</span>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <span className="auth-input-icon">🔒</span>
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div>
                <div className="pw-strength-wrap">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="pw-strength-seg"
                      style={{ background: i <= strength.score ? strength.color : undefined }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600, marginTop: '-6px', marginBottom: '12px' }}>
                  {strength.label}
                </p>
              </div>
            )}

            {/* Remember me + Forgot */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              fontSize: '0.82rem',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input type="checkbox" style={{ accentColor: '#6366f1' }} />
                Remember me
              </label>
              <span style={{ color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>

            {/* Login button */}
            <button type="submit" className="auth-btn-login" disabled={loading} id="login-submit">
              {loading ? (
                <div className="auth-spinner" />
              ) : (
                <>Sign In →</>
              )}
            </button>

            {/* Login progress steps */}
            <div className={`login-steps ${stepsVisible ? 'visible' : ''}`}>
              <div className={`login-step-item ${loginSteps[0] ? 'active' : ''}`}>
                <div className="login-step-dot" />
                Verifying
              </div>
              <div className={`login-step-connector ${loginSteps[1] ? 'active' : ''}`} />
              <div className={`login-step-item ${loginSteps[1] ? 'active' : ''}`}>
                <div className="login-step-dot" />
                Securing
              </div>
              <div className={`login-step-connector ${loginSteps[2] ? 'active' : ''}`} />
              <div className={`login-step-item ${loginSteps[2] ? 'active' : ''}`}>
                <div className="login-step-dot" />
                Redirecting
              </div>
            </div>

            {/* Keyboard hint */}
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <kbd style={{
                background: 'rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '0.65rem',
              }}>Enter ↵</kbd> to sign in
            </div>

            {/* Sign up link */}
            <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '18px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ fontWeight: 700, color: '#6366f1', textDecoration: 'none' }}>Sign Up</Link>
              </p>
            </div>

            {/* Quick access */}
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '10px' }}>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
            }}>
              🔐 Secured with JWT · Your data is safe
            </div>
          </form>
        </div>
      </div>

      {/* ═══ Success Overlay ═══ */}
      <div className={`auth-success-overlay ${showSuccess ? 'show' : ''}`}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#22c55e" strokeWidth="4" />
          <path className="check-path" d="M24 42 L34 52 L56 30" fill="none" stroke="#22c55e" strokeWidth="4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="auth-success-title" style={{ color: 'var(--text-primary)' }}>Welcome back!</h3>
        <p className="auth-success-sub">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
