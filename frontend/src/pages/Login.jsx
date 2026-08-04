// frontend/src/pages/Login.jsx
// Premium split-screen login — handles unverified accounts with inline OTP
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, googleLogin as googleLoginApi, verifyOtp, resendOtp, forgotPassword, resetPassword } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/common/Toast';
import { useSystemTheme } from '../hooks/useSystemTheme';
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

/* ═══ OTP Input Component ═══ */
function OtpInput({ length = 6, onComplete, hasError }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const focusInput = (idx) => {
    if (inputRefs.current[idx]) inputRefs.current[idx].focus();
  };

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[idx] = digit;
    setValues(next);
    if (digit && idx < length - 1) focusInput(idx + 1);
    const code = next.join('');
    if (code.length === length && next.every(v => v !== '')) onComplete(code);
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
    if (!pasted.length) return;
    const next = [...values];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setValues(next);
    focusInput(Math.min(pasted.length, length - 1));
    if (pasted.length === length) onComplete(pasted);
  };

  const reset = useCallback(() => {
    setValues(Array(length).fill(''));
    focusInput(0);
  }, [length]);

  useEffect(() => {
    if (hasError) {
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginSteps, setLoginSteps] = useState([false, false, false]);
  const [stepsVisible, setStepsVisible] = useState(false);

  // OTP verification state (for unverified accounts)
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  
  // Forgot Password state
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetResendTimer, setResetResendTimer] = useState(60);
  const [canResetResend, setCanResetResend] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  const googleBtnRef = useRef(null);
  const clock = useClock();

  // Always follow OS/system theme on this public page
  useSystemTheme();

  // Resend countdown
  useEffect(() => {
    if (!showOtpFlow) return;
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
  }, [showOtpFlow]);

  const [isGoogleSdkReady, setIsGoogleSdkReady] = useState(false);
  const [googleSdkFailed, setGoogleSdkFailed] = useState(false);

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1077224737562-8cjsrpmplh7i84ch09ai3s2j6uqlk26d.apps.googleusercontent.com';
    let initAttempts = 0;
    let initInterval;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        clearInterval(initInterval);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 340,
              logo_alignment: 'left',
            });
            setIsGoogleSdkReady(true);
          }
        } catch (e) {
          console.warn('Google GIS initialize failed:', e);
          setGoogleSdkFailed(true);
        }
      } else {
        initAttempts++;
        if (initAttempts > 50) {
          clearInterval(initInterval);
          setGoogleSdkFailed(true);
        }
      }
    };

    // Try immediately
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Poll if not loaded yet
      initInterval = setInterval(initGoogle, 100);
    }

    return () => clearInterval(initInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCallback = async (response) => {
    if (!response?.credential) {
      setError('Google sign-in was cancelled or failed. Please try again.');
      return;
    }
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
      setTimeout(() => navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
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
      setTimeout(() => navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard'), 1800);
    } catch (err) {
      const data = err.response?.data;

      // Handle unverified email
      if (data?.error === 'EMAIL_NOT_VERIFIED') {
        setOtpEmail(data.email);
        setShowOtpFlow(true);
        setError('');
        if (data.otpSent) {
          toast.success('Verification code sent to your email! 📧');
        }
        setLoading(false);
        setStepsVisible(false);
        setLoginSteps([false, false, false]);
        return;
      }

      setError(data?.error || 'Invalid email or password');
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

  // OTP verification
  const handleVerifyOtp = async (code) => {
    setError('');
    setOtpError(false);
    setLoading(true);
    try {
      const res = await verifyOtp(otpEmail, code);
      login(res.data.token, res.data.user);
      toast.success('Email verified! Welcome aboard 🎉');
      setShowSuccess(true);
      setTimeout(() => navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
      setOtpError(true);
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    try {
      await resendOtp(otpEmail);
      toast.success('New verification code sent! 📧');
      setCanResend(false);
      setResendTimer(60);
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('Password reset code sent to your email 📧');
      setShowForgotFlow(false);
      setShowResetFlow(true);
      setResetOtpCode('');
      setNewPassword('');
      setResetResendTimer(60);
      setCanResetResend(false);
      setLoading(false);
      // start countdown for resend
      const id = setInterval(() => {
        setResetResendTimer((prev) => {
          if (prev <= 1) { clearInterval(id); setCanResetResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset code');
      setLoading(false);
    }
  };

  // Called by OtpInput when all 6 digits filled — just stores the code, does NOT submit
  const handleResetOtpComplete = (code) => {
    setResetOtpCode(code);
    setOtpError(false);
    setError('');
  };

  // Called by the Submit button — validates both OTP + password then calls API
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtpCode || resetOtpCode.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setOtpError(false);
    setLoading(true);
    try {
      await resetPassword(forgotEmail, resetOtpCode, newPassword);
      toast.success('Password updated! You can now sign in. 🎉');
      setShowResetFlow(false);
      setForgotEmail('');
      setNewPassword('');
      setResetOtpCode('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
      setOtpError(true);
      setResetOtpCode('');
      setLoading(false);
    }
  };

  const handleResetResendCode = async () => {
    if (!canResetResend) return;
    setError('');
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      toast.success('New reset code sent! 📧');
      setCanResetResend(false);
      setResetResendTimer(60);
      setResetOtpCode('');
      setLoading(false);
      const id = setInterval(() => {
        setResetResendTimer((prev) => {
          if (prev <= 1) { clearInterval(id); setCanResetResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
      setLoading(false);
    }
  };

  const hour = clock.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
          <h1>Your city,<br />connected.</h1>
          <p>Real-time crowd prediction, smart ticketing, and sustainable transit — all in one platform.</p>
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
          <Link to="/" className="auth-mobile-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="auth-logo-icon">
              <span className="material-symbols-outlined">train</span>
            </div>
            <span className="auth-logo-text">MetroMind</span>
          </Link>




          {/* ═══ FORGOT PASSWORD FLOW ═══ */}
          {showForgotFlow ? (
            <div style={{ animation: 'authFadeIn 0.4s ease' }}>
              <div className="auth-heading">
                <h2>Reset Password</h2>
                <p>Enter your email to receive a password reset code.</p>
              </div>

              {error && (
                <div className="auth-error-alert">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleForgotPasswordSubmit}>
                <div className="auth-input-group">
                  <label htmlFor="forgot-email">Email</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      id="forgot-email" type="email" className="auth-input"
                      value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" required
                    />
                  </div>
                </div>

                <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: '24px' }}>
                  {loading ? <div className="auth-spinner" /> : 'Send Reset Code'}
                </button>
              </form>

              <button type="button" onClick={() => { setShowForgotFlow(false); setError(''); }} style={{
                background: 'none', border: 'none', color: '#64748b', display: 'block', margin: '16px auto 0',
                fontSize: '13px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                ← Back to login
              </button>
            </div>
          ) : showResetFlow ? (
            <div style={{ animation: 'authFadeIn 0.4s ease' }}>
              <div className="auth-heading">
                <h2>Create New Password</h2>
                <p>Enter the 6-digit code sent to <strong>{forgotEmail}</strong> and choose a new password.</p>
              </div>

              {error && (
                <div className="auth-error-alert">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit}>
                <div className="auth-input-group">
                  <label>Verification Code</label>
                  <div style={{ margin: '8px 0 4px' }}>
                    <OtpInput length={6} onComplete={handleResetOtpComplete} hasError={otpError} />
                  </div>
                  {resetOtpCode.length === 6 && (
                    <p style={{ fontSize: '11px', color: '#22c55e', textAlign: 'center', margin: '4px 0 12px', fontWeight: 600 }}>
                      ✓ Code entered — now set your new password below
                    </p>
                  )}
                </div>

                <div className="auth-input-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">lock</span>
                    <input
                      id="new-password" type={showPw ? 'text' : 'password'} className="auth-input"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters" minLength={6} autoComplete="new-password"
                      autoFocus
                    />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                      <span className="material-symbols-outlined">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p style={{ fontSize: '11px', color: '#f59e0b', margin: '4px 0 0', fontWeight: 500 }}>
                      ⚠ Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading || resetOtpCode.length < 6 || newPassword.length < 6}
                  style={{ marginTop: '8px' }}
                >
                  {loading ? <div className="auth-spinner" /> : (
                    <><span>Reset Password</span><span className="material-symbols-outlined">lock_reset</span></>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                {canResetResend ? (
                  <>
                    Didn't receive the code?{' '}
                    <button type="button" onClick={handleResetResendCode}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, cursor: 'pointer', fontSize: '12px', fontFamily: "'Inter', system-ui, sans-serif" }}>
                      Resend code
                    </button>
                  </>
                ) : (
                  <span>Resend code in <strong>{resetResendTimer}s</strong></span>
                )}
              </div>

              <button type="button" onClick={() => { setShowResetFlow(false); setShowForgotFlow(true); setError(''); setOtpError(false); setResetOtpCode(''); }} style={{
                background: 'none', border: 'none', color: '#64748b', display: 'block', margin: '16px auto 0',
                fontSize: '13px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                ← Back to email input
              </button>
            </div>
          ) : showOtpFlow ? (
            <div style={{ animation: 'authFadeIn 0.4s ease' }}>
              <div className="auth-heading">
                <h2>Verify your email</h2>
                <p>Your account needs email verification before signing in.</p>
              </div>

              <div className="otp-email-icon">
                <span className="material-symbols-outlined">mark_email_read</span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '4px' }}>
                We sent a 6-digit code to
              </p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'center', marginBottom: '16px' }}>
                {otpEmail}
              </p>

              {error && (
                <div className="auth-error-alert">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <OtpInput length={6} onComplete={handleVerifyOtp} hasError={otpError} />

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                  <div className="auth-spinner" style={{ borderColor: 'rgba(79,70,229,0.2)', borderTopColor: '#4F46E5' }} />
                </div>
              )}

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

              <button type="button" onClick={() => { setShowOtpFlow(false); setError(''); }} style={{
                background: 'none', border: 'none', color: '#64748b', display: 'block', margin: '16px auto 0',
                fontSize: '13px', cursor: 'pointer', fontWeight: 500, fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                ← Back to login
              </button>
            </div>
          ) : (
            /* ═══ NORMAL LOGIN FORM ═══ */
            <>
              <div className="auth-heading auth-anim d1">
                <h2>{greeting} 👋</h2>
                <p>Sign in to manage your commute.</p>
              </div>

              {error && (
                <div className="auth-error-alert">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="auth-input-group auth-anim d2">
                  <label htmlFor="login-email">Email</label>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">mail</span>
                    <input
                      id="login-email" type="email" className="auth-input"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" required autoComplete="email"
                    />
                  </div>
                </div>

                <div className="auth-input-group auth-anim d3">
                  <div className="auth-label-row">
                    <label htmlFor="login-password">Password</label>
                    <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setShowForgotFlow(true); }}>Forgot?</a>
                  </div>
                  <div className="auth-input-wrap">
                    <span className="material-symbols-outlined">lock</span>
                    <input
                      id="login-password" type={showPw ? 'text' : 'password'} className="auth-input"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6}
                      autoComplete="current-password" style={{ paddingRight: '42px' }}
                    />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                      <span className="material-symbols-outlined">
                        {showPw ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="auth-anim d4" style={{ paddingTop: '4px' }}>
                  <button type="submit" className="auth-btn-primary" disabled={loading} id="login-submit">
                    {loading ? <div className="auth-spinner" /> : (
                      <>
                        <span>Sign In</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>

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

                <div className="auth-divider auth-anim d4"><span>or</span></div>

                <div className="auth-anim d5" style={{ width: '100%' }}>
                  {/* Google button — GIS iframe handles clicks directly, no wrapper onClick */}
                  <div className="google-btn-wrapper">
                    <div className="google-btn-inner" style={{ minHeight: '44px' }}>
                      {/* Rendered by Google GIS SDK — handles OAuth natively */}
                      <div ref={googleBtnRef} style={{ display: isGoogleSdkReady ? 'flex' : 'none', justifyContent: 'center', width: '100%' }} />
                      {!isGoogleSdkReady && !googleSdkFailed && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px 16px', fontWeight: 600, fontSize: '14px', color: '#94a3b8', width: '100%' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span>Connecting to Google…</span>
                        </div>
                      )}
                      {googleSdkFailed && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px', color: '#94a3b8', width: '100%' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
                          <span>Google Sign-In requires an authorized origin. Check Google Cloud Console.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              <div className="auth-footer-link auth-anim d5">
                Don't have an account?
                <Link to="/register">Create one</Link>
              </div>

              <div className="auth-anim d6" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '16px' }}>
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 500, marginBottom: '8px' }}>
                  Quick Access (Demo)
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="auth-quick-btn"
                    onClick={() => { setEmail('adminofmetromind@metromind.com'); setPassword('Admin@123'); }}>
                    👑 Admin
                  </button>
                  <button type="button" className="auth-quick-btn"
                    onClick={() => { setEmail('user@metromind.in'); setPassword('user123'); }}>
                    👤 User
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '12px', fontSize: '10px', color: '#94a3b8' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified_user</span>
                256-bit encrypted · Your data stays private
              </div>
            </>
          )}
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
