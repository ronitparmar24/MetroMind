// frontend/src/pages/Landing.jsx
// Premium marketing landing page — MetroFlow-inspired design
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BLUE_LINE_STATIONS, RED_LINE_STATIONS } from '../constants/stations';
import '../styles/landing.css';

/* ═══ Data ═══ */
const FEATURES = [
  { icon: '🤖', title: 'AI Crowd Prediction', desc: 'ML-powered forecasts tell you exactly how crowded your train will be — before you even book.', color: '#6366f1' },
  { icon: '🗺️', title: 'Smart Route Planning', desc: 'Compare direct vs interchange routes instantly — fare, time, and crowd level side by side.', color: '#3b82f6' },
  { icon: '🌿', title: 'Carbon Tracking', desc: 'See your real CO₂ savings every time you choose metro over a private vehicle.', color: '#22c55e' },
  { icon: '🎫', title: 'QR Ticketing', desc: 'Book and get instant QR codes — group bookings with individual passenger tickets included.', color: '#f59e0b' },
  { icon: '📊', title: 'Travel Analytics', desc: 'Weekly digests, heatmaps, spending insights, and a commute personality profile — all automated.', color: '#ef4444' },
  { icon: '🚇', title: 'Live Train Tracking', desc: 'Real-time departures with delay predictions and interchange connection warnings.', color: '#8b5cf6' },
];

const ECO_STATS = [
  { icon: '🌍', value: '2,400+', label: 'kg CO₂ Saved', bg: 'rgba(34,197,94,0.1)' },
  { icon: '🚗', value: '8,500+', label: 'Car Trips Avoided', bg: 'rgba(59,130,246,0.1)' },
  { icon: '🌱', value: '120+', label: 'Trees Equivalent', bg: 'rgba(22,163,74,0.1)' },
  { icon: '⚡', value: '45%', label: 'Less Carbon', bg: 'rgba(245,158,11,0.1)' },
];

const STEPS = [
  { num: '01', icon: '🎯', title: 'Pick Stations', desc: 'Choose your origin & destination from the Ahmedabad Metro network', bg: 'rgba(99,102,241,0.15)' },
  { num: '02', icon: '🤖', title: 'Get Prediction', desc: 'Our ML model forecasts crowd levels for your chosen time slot', bg: 'rgba(139,92,246,0.15)' },
  { num: '03', icon: '📱', title: 'Book & Go', desc: 'Pay from your wallet, get your QR ticket, and scan at the gate', bg: 'rgba(59,130,246,0.15)' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Daily Commuter', text: 'The crowd prediction is scarily accurate. I shifted my commute by 15 minutes and now I always get a seat!', avatar: 'P' },
  { name: 'Arjun M.', role: 'IT Professional', text: 'Route comparison saved me so much time. I didn\'t know there was a faster interchange option until MetroMind showed me.', avatar: 'A' },
  { name: 'Neha R.', role: 'College Student', text: 'Group booking with split QR codes is genius. We book as a group and each person scans their own ticket.', avatar: 'N' },
];

const STATS = [
  { value: '12,000+', label: 'Active Commuters' },
  { value: '500+', label: 'Daily Predictions' },
  { value: '98%', label: 'Prediction Accuracy' },
  { value: '4.8★', label: 'User Rating' },
];

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  // Scroll effects
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowBackTop(window.scrollY > 400);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? (window.scrollY / docH) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Scroll Progress Bar */}
      <div id="scrollProgressBar" style={{ width: `${scrollProgress}%` }} />

      {/* ═══ NAVBAR ═══ */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div className="brand-icon-wrap">🚇</div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>MetroMind</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn-animated-outline" style={{ padding: '9px 22px', fontSize: '0.88rem' }}>Sign In</Link>
            <Link to="/register" className="btn-animated" style={{ padding: '9px 22px', fontSize: '0.88rem' }}>Get Started 🚀</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="landing-hero">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Left: Content */}
          <div>
            <div className="section-badge animate-fade-in-down">
              <span>🤖</span> AI-Powered Transit
            </div>

            <h1 className="hero-title animate-fade-in-up" style={{ fontFamily: 'var(--font-display)' }}>
              Ahmedabad Metro,<br />Reimagined
            </h1>

            <p className="animate-fade-in-up" style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '24px',
              maxWidth: '480px',
            }}>
              Book smarter with real-time crowd predictions, live train tracking,
              and AI-powered travel insights — all in one beautiful app.
            </p>

            {/* Trust badges */}
            <div className="animate-fade-in-up" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span className="trust-badge">✅ Free to Use</span>
              <span className="trust-badge">🔒 Secure Wallet</span>
              <span className="trust-badge">⚡ Instant QR</span>
            </div>

            {/* CTAs */}
            <div className="animate-fade-in-up" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link to="/register" className="btn-animated" id="hero-cta-start">
                Get Started — It's Free
              </Link>
              <Link to="/login" className="btn-animated-outline">
                Sign In →
              </Link>
            </div>

            {/* User stack */}
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <div className="user-stack">
                {AVATAR_COLORS.map((c, i) => (
                  <div key={i} className="avatar-dot" style={{ background: c }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div style={{ marginLeft: '14px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  12,000+ commuters
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  trust MetroMind daily
                </p>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div style={{ position: 'relative' }}>
            {/* Main card - mock dashboard */}
            <div className="glass-card animate-scale-in" style={{
              padding: '28px',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(99, 102, 241, 0.15)',
              animation: 'float 6s ease-in-out infinite',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>MetroMind Dashboard</span>
              </div>

              {/* Mock route display */}
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔵 Thaltej → Doordarshan</span>
                  <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>Low Crowd</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>⏱ 12 min</span>
                  <span>💰 ₹25</span>
                  <span>🌿 0.8kg CO₂</span>
                </div>
              </div>

              {/* Mock stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { icon: '🎫', val: '47', lbl: 'Trips' },
                  { icon: '🌿', val: '12.4kg', lbl: 'CO₂ Saved' },
                  { icon: '💰', val: '₹2,350', lbl: 'Balance' },
                ].map((s) => (
                  <div key={s.lbl} style={{ textAlign: 'center', padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <p style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-display)', marginTop: '4px' }}>{s.val}</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating cards */}
            <div className="hero-float-card" style={{ top: '20px', right: '-30px', animationDelay: '0.5s' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✅</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>Ticket Booked!</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>QR ready to scan</p>
              </div>
            </div>

            <div className="hero-float-card" style={{ bottom: '40px', left: '-40px', animationDelay: '1s' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📊</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>98% Accuracy</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ML Crowd Prediction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ padding: '60px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="stat-number-landing" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-badge">✨ Features</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Everything You Need to Commute Smart
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', fontSize: '1rem' }}>
              Six powerful features that transform how Ahmedabad travels
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="feature-icon-box" style={{ background: `${f.color}15` }}>
                  <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ JOURNEY STEPS (Dark Section) ═══ */}
      <section className="journey-section">
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-badge" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)', color: '#a78bfa' }}>
              🚀 How It Works
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
              Three Steps to Smarter Travel
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', margin: '0 auto' }}>
              From booking to boarding — powered by intelligence
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
            {STEPS.map((step) => (
              <div key={step.num} className="journey-step" style={{ textAlign: 'center' }}>
                <div className="journey-icon-box" style={{ background: step.bg }}>
                  <span style={{ fontSize: '1.8rem' }}>{step.icon}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.7rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Step {step.num}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: 'white', marginTop: '8px', marginBottom: '8px' }}>
                  {step.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Animated train line */}
        <div className="journey-train-line">
          <div className="journey-train-dot" />
        </div>
      </section>

      {/* ═══ ECO IMPACT ═══ */}
      <section className="eco-section" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="section-badge" style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
              🌱 Sustainability
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Your Commute Saves the Planet
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
              Every metro ride you take reduces Ahmedabad's carbon footprint
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            {ECO_STATS.map((s) => (
              <div key={s.label} className="eco-stat-card">
                <div style={{ width: '72px', height: '72px', borderRadius: '22px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 18px', transition: 'all 0.4s ease' }}>
                  {s.icon}
                </div>
                <p className="eco-number" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ METRO LINES PREVIEW ═══ */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-badge">🗺️ Network</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '12px' }}>
              Ahmedabad Metro Network
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Two lines, full coverage — all powered by MetroMind</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              { line: 'Blue', color: '#3b82f6', stations: BLUE_LINE_STATIONS, icon: '🔵' },
              { line: 'Red', color: '#ef4444', stations: RED_LINE_STATIONS, icon: '🔴' },
            ].map(({ line, color, stations, icon }) => (
              <div key={line} className="landing-feature-card" style={{ textAlign: 'left', padding: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px', color }}>
                  {icon} {line} Line
                </h3>
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                  <div style={{ position: 'absolute', left: '8px', top: '6px', bottom: '6px', width: '2px', background: color, borderRadius: '2px' }} />
                  {stations.slice(0, 5).map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 0', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-20px', width: '8px', height: '8px', borderRadius: '50%', background: color, border: '2px solid var(--bg-primary)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: i === 0 ? 600 : 400 }}>{s.name}</span>
                    </div>
                  ))}
                  {stations.length > 5 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '4px' }}>+ {stations.length - 5} more stations</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="section-badge">💬 Testimonials</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '12px' }}>
              What Commuters Say
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: '0.75rem' }}>★★★★★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA SECTION ═══ */}
      <section className="landing-cta" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🚇</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, marginBottom: '16px' }}>
            Ready to Commute Smarter?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px', lineHeight: 1.6 }}>
            Join thousands of Ahmedabad commuters who save time, money, and the planet with MetroMind.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-animated" style={{ padding: '16px 36px', fontSize: '1rem' }}>
              🚀 Create Free Account
            </Link>
            <Link to="/login" className="btn-animated-outline" style={{ padding: '14px 28px', fontSize: '1rem' }}>
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="landing-footer" style={{ padding: '70px 24px 0' }}>
        {/* Blobs */}
        <div className="ft-blob" style={{ width: '500px', height: '500px', background: 'rgba(99, 102, 241, 0.06)', top: '-120px', left: '-100px' }} />
        <div className="ft-blob" style={{ width: '450px', height: '450px', background: 'rgba(139, 92, 246, 0.05)', bottom: '-100px', right: '-80px', animationDelay: '6s' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', position: 'relative', zIndex: 2 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="brand-icon-wrap" style={{ width: '42px', height: '42px' }}>🚇</div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>MetroMind</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '280px' }}>
              Intelligent Urban Transit Booking for Ahmedabad Metro Rail Corporation (GMRC).
            </p>
            {/* Tech badges */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '16px' }}>
              {['React', 'Node.js', 'MongoDB', 'Django ML'].map((t) => (
                <span key={t} style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '14px' }}>Product</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Get Started', 'Sign In'].map((l) => (
                <Link key={l} to={l === 'Sign In' ? '/login' : '/register'} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.3s' }}>{l}</Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '14px' }}>Support</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📧 contact@metromind.in</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🆘 Emergency: 155370</span>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '14px' }}>Legal</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Privacy Policy</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Terms of Service</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          borderTop: '1px solid var(--border-color)',
          padding: '20px 0',
          marginTop: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          position: 'relative',
          zIndex: 2,
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            © 2026 MetroMind. Built with ❤️ by a B.Tech IT student for Ahmedabad Metro.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Gujarat Metro Rail Corporation (GMRC)
          </p>
        </div>

        {/* Gradient bar */}
        <div className="gradient-flow-bar" />
      </footer>

      {/* Back to Top */}
      <button
        className={`back-to-top ${showBackTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Back to top"
      >
        ↑
      </button>
    </div>
  );
}
