// frontend/src/pages/Landing.jsx
// MetroMind — Industry-grade landing page
// Animated SVG metro background · Glassmorphic UI · Scroll-reveal · Bento grid
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/style.css';
import '../styles/responsive.css';

/* ═══════════════════════════════════════════════════════════
   ANIMATED SVG METRO BACKGROUND
   ═══════════════════════════════════════════════════════════ */
function MetroLines() {
  return (
    <div className="mm-metro-bg" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        {/* Blue line */}
        <path className="mm-line mm-line--blue" d="M-50,250 C200,250 350,400 550,400 S850,250 1100,250 L1500,250">
          <animate attributeName="d" dur="18s" repeatCount="indefinite"
            values="M-50,250 C200,250 350,400 550,400 S850,250 1100,250 L1500,250;
                    M-50,300 C200,200 350,350 550,430 S850,300 1100,200 L1500,300;
                    M-50,250 C200,250 350,400 550,400 S850,250 1100,250 L1500,250" />
        </path>
        {/* Travelling dot on blue line */}
        <circle className="mm-dot mm-dot--blue" r="5">
          <animateMotion dur="7s" repeatCount="indefinite">
            <mpath href="#bluePath" />
          </animateMotion>
        </circle>
        <path id="bluePath" d="M-50,250 C200,250 350,400 550,400 S850,250 1100,250 L1500,250" fill="none" />

        {/* Red line */}
        <path className="mm-line mm-line--red" d="M-50,650 C200,550 400,450 650,500 S950,600 1200,450 L1500,400">
          <animate attributeName="d" dur="22s" repeatCount="indefinite"
            values="M-50,650 C200,550 400,450 650,500 S950,600 1200,450 L1500,400;
                    M-50,600 C200,500 400,500 650,550 S950,550 1200,400 L1500,450;
                    M-50,650 C200,550 400,450 650,500 S950,600 1200,450 L1500,400" />
        </path>
        <circle className="mm-dot mm-dot--red" r="4">
          <animateMotion dur="9s" repeatCount="indefinite">
            <mpath href="#redPath" />
          </animateMotion>
        </circle>
        <path id="redPath" d="M-50,650 C200,550 400,450 650,500 S950,600 1200,450 L1500,400" fill="none" />

        {/* Accent line */}
        <path className="mm-line mm-line--accent" d="M-50,100 Q350,180 700,100 T1500,150" />

        {/* Station dots */}
        <circle className="mm-station" cx="250" cy="250" r="6" />
        <circle className="mm-station" cx="550" cy="400" r="7" />
        <circle className="mm-station" cx="850" cy="250" r="6" />
        <circle className="mm-station" cx="400" cy="470" r="5" />
        <circle className="mm-station" cx="950" cy="500" r="5" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FLOATING PARTICLES
   ═══════════════════════════════════════════════════════════ */
function Particles() {
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 24 + 6,
    x: Math.random() * 100,
    delay: Math.random() * 12,
    dur: Math.random() * 18 + 14,
    opacity: Math.random() * 0.07 + 0.02,
  }));
  return (
    <div className="mm-particles" aria-hidden="true">
      {items.map(p => (
        <div key={p.id} className="mm-particle" style={{
          width: p.size, height: p.size, left: `${p.x}%`, bottom: '-30px',
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, opacity: p.opacity,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCROLL-REVEAL HOOK (IntersectionObserver)
   ═══════════════════════════════════════════════════════════ */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* Reusable wrapper */
function Reveal({ children, className = '', delay = 0, direction = 'up' }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`mm-reveal mm-reveal--${direction} ${visible ? 'mm-revealed' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const [ref, visible] = useReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    const target = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    let frame;
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplay(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, value]);
  return <span ref={ref}>{visible ? `${display.toLocaleString()}${suffix}` : '0'}</span>;
}

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */
const FEATURES = [
  { icon: 'fas fa-brain',       title: 'AI Crowd Prediction',   desc: 'ML-powered forecasts tell you exactly how packed your train will be — before you even tap "Book."', accent: '#818cf8', span: false },
  { icon: 'fas fa-route',       title: 'Smart Route Engine',    desc: 'Compare direct vs. interchange routes instantly — fare, travel time, and crowd level side by side.', accent: '#60a5fa', span: false },
  { icon: 'fas fa-qrcode',      title: 'QR Ticketing',          desc: 'One-tap booking, instant QR codes. Group tickets with individual passenger scans, no queues.', accent: '#f472b6', span: false },
  { icon: 'fas fa-chart-line',  title: 'Travel Analytics',      desc: 'Weekly digests, heatmaps, spending insights, and a unique commute personality profile.', accent: '#34d399', span: true },
  { icon: 'fas fa-leaf',        title: 'Carbon Dashboard',      desc: 'Track real CO₂ savings with every ride. See your personal sustainability passport grow.', accent: '#4ade80', span: false },
  { icon: 'fas fa-satellite-dish', title: 'Live Train Tracking', desc: 'Real-time arrivals with delay predictions and platform change alerts.', accent: '#a78bfa', span: false },
];

const STEPS = [
  { num: '01', icon: 'fas fa-map-marker-alt', title: 'Pick Stations', desc: 'Choose origin & destination from 32+ stations across two metro lines.' },
  { num: '02', icon: 'fas fa-robot',          title: 'Get AI Forecast', desc: 'Our ML model predicts crowd density for your specific departure time.' },
  { num: '03', icon: 'fas fa-mobile-alt',     title: 'Book & Scan',     desc: 'Pay from wallet, get your animated QR ticket, and scan at the gate.' },
];

const STATIONS_LIVE = [
  { name: 'Vastral Gam',      crowd: 'Low',    color: '#22c55e', badge: 'bg-success' },
  { name: 'Thaltej',          crowd: 'Medium', color: '#eab308', badge: 'bg-warning' },
  { name: 'Naranpura',        crowd: 'Low',    color: '#22c55e', badge: 'bg-success' },
  { name: 'Kalupur Railway',  crowd: 'High',   color: '#ef4444', badge: 'bg-danger' },
  { name: 'Sabarmati',        crowd: 'Medium', color: '#eab308', badge: 'bg-warning' },
  { name: 'Old High Court',   crowd: 'Low',    color: '#22c55e', badge: 'bg-success' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Daily Commuter', text: 'The crowd prediction is scarily accurate. I shifted my commute by 15 minutes and now I always get a seat!', avatar: 'P', color: '#818cf8' },
  { name: 'Arjun M.', role: 'IT Professional', text: 'Route comparison saved me 20 minutes a day. I didn\'t know about the interchange shortcut until MetroMind.', avatar: 'A', color: '#60a5fa' },
  { name: 'Neha R.', role: 'College Student', text: 'Group booking with split QR codes is genius. We book as a group and each person scans their own ticket.', avatar: 'N', color: '#f472b6' },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="mm-landing">
      <MetroLines />
      <Particles />

      {/* Scroll Progress */}
      <div className="mm-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`mm-nav ${scrolled ? 'mm-nav--scrolled' : ''}`}>
        <div className="container">
          <div className="mm-nav__inner">
            <Link to="/" className="mm-nav__brand">
              <div className="mm-nav__logo">🚇</div>
              <span className="mm-nav__wordmark">MetroMind</span>
            </Link>

            <div className="mm-nav__links d-none d-lg-flex">
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
              <a href="#network">Network</a>
            </div>

            <div className="mm-nav__actions">
              <Link to="/login" className="mm-btn mm-btn--ghost">Sign In</Link>
              <Link to="/register" className="mm-btn mm-btn--primary">
                Get Started <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem', marginLeft: 4 }}></i>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="mm-hero" id="hero">
        <div className="mm-hero__glow mm-hero__glow--1" />
        <div className="mm-hero__glow mm-hero__glow--2" />
        <div className="mm-hero__glow mm-hero__glow--3" />

        <div className="container mm-hero__inner">
          <div className="row align-items-center g-5">
            {/* Left */}
            <div className="col-lg-6">
              <div className="mm-hero__badge">
                <span className="mm-hero__badge-dot" />
                <span>MetroMind v2.0 — Now Live</span>
              </div>

              <h1 className="mm-hero__title">
                Ahmedabad Metro,<br />
                <span className="mm-gradient-text">Reimagined.</span>
              </h1>

              <p className="mm-hero__subtitle">
                Book smarter with real-time crowd predictions, live train tracking,
                and AI-powered travel insights — all in one beautifully crafted app.
              </p>

              <div className="mm-hero__ctas">
                <Link to="/register" className="mm-btn mm-btn--primary mm-btn--lg">
                  Start Commuting Smarter
                  <i className="fas fa-arrow-right" />
                </Link>
                <Link to="/login" className="mm-btn mm-btn--outline mm-btn--lg">
                  <i className="fas fa-play-circle" style={{ marginRight: 8 }} />
                  Sign In
                </Link>
              </div>

              {/* Stats row */}
              <div className="mm-hero__stats">
                {[
                  { val: '12000', suffix: '+', label: 'Active Commuters' },
                  { val: '500',   suffix: '+', label: 'Daily Predictions' },
                  { val: '94',    suffix: '%', label: 'ML Accuracy' },
                  { val: '32',    suffix: '',  label: 'Stations Live' },
                ].map(s => (
                  <div className="mm-hero__stat" key={s.label}>
                    <div className="mm-hero__stat-value">
                      <AnimatedNumber value={s.val} suffix={s.suffix} />
                    </div>
                    <div className="mm-hero__stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Glass Booking Card */}
            <div className="col-lg-6 d-none d-lg-block">
              <div className="mm-hero__visual">
                {/* Main card */}
                <div className="mm-glass-card mm-float">
                  <div className="mm-glass-card__header">
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '1.1rem' }}>🚇</span>
                      <span style={{ fontWeight: 700 }}>Quick Booking</span>
                    </div>
                    <span className="mm-live-badge"><span className="mm-live-badge__dot" /> LIVE</span>
                  </div>

                  {/* Route */}
                  <div className="mm-glass-card__route">
                    <div className="mm-glass-card__station">
                      <i className="fas fa-circle" style={{ fontSize: '0.45rem', color: '#818cf8' }} />
                      <span>Vastral Gam</span>
                    </div>
                    <div className="mm-glass-card__connector">
                      <div className="mm-glass-card__connector-line" />
                      <i className="fas fa-train" style={{ color: '#818cf8', fontSize: '0.8rem' }} />
                      <div className="mm-glass-card__connector-line" />
                    </div>
                    <div className="mm-glass-card__station">
                      <i className="fas fa-map-marker-alt" style={{ fontSize: '0.55rem', color: '#f472b6' }} />
                      <span>Thaltej</span>
                    </div>
                  </div>

                  {/* Fare & crowd */}
                  <div className="mm-glass-card__footer">
                    <div>
                      <div className="mm-glass-card__fare">₹32</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>Est. 28 min</div>
                    </div>
                    <div className="mm-crowd-pill mm-crowd-pill--low">
                      <span className="mm-crowd-pill__dot" /> Low Crowd
                    </div>
                  </div>

                  {/* Action button */}
                  <button className="mm-glass-card__book">
                    Book This Journey <i className="fas fa-arrow-right" />
                  </button>
                </div>

                {/* Floating chips */}
                <div className="mm-chip mm-float-chip mm-float-chip--1 mm-float" style={{ animationDelay: '0.5s' }}>
                  <span className="mm-chip__icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>🌿</span>
                  2.4 kg CO₂ saved today
                </div>

                <div className="mm-chip mm-float-chip mm-float-chip--2 mm-float" style={{ animationDelay: '1.2s' }}>
                  <span className="mm-chip__icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>📊</span>
                  98% Prediction Accuracy
                </div>

                <div className="mm-chip mm-float-chip mm-float-chip--3 mm-float" style={{ animationDelay: '2s' }}>
                  <span className="mm-chip__icon" style={{ background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>⚡</span>
                  Live: 3 trains en route
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave transition */}
        <div className="mm-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="mm-trust">
        <div className="container">
          <Reveal>
            <div className="mm-trust__inner">
              <p className="mm-trust__label">Powering intelligent transit for</p>
              <div className="mm-trust__items">
                {['Gujarat Metro Rail (GMRC)', 'Ahmedabad Municipal Corp', '32+ Stations', '2 Metro Lines'].map(t => (
                  <div className="mm-trust__item" key={t}>
                    <i className="fas fa-check-circle" style={{ color: '#818cf8', marginRight: 8 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ FEATURES (Bento Grid) ═══════════ */}
      <section className="mm-features" id="features">
        <div className="container">
          <Reveal>
            <div className="mm-section-header">
              <span className="mm-section-badge"><i className="fas fa-sparkles" /> Features</span>
              <h2 className="mm-section-title">Everything you need to<br /><span className="mm-gradient-text">commute smarter</span></h2>
              <p className="mm-section-desc">Six powerful tools that transform how Ahmedabad travels — powered by machine learning.</p>
            </div>
          </Reveal>

          <div className="mm-bento">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80} className={`mm-bento__item ${f.span ? 'mm-bento__item--wide' : ''}`}>
                <div className="mm-feature-card">
                  <div className="mm-feature-card__icon" style={{ background: `${f.accent}18`, color: f.accent }}>
                    <i className={f.icon} />
                  </div>
                  <h4 className="mm-feature-card__title">{f.title}</h4>
                  <p className="mm-feature-card__desc">{f.desc}</p>
                  <div className="mm-feature-card__shine" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="mm-process" id="how-it-works">
        <div className="container">
          <Reveal>
            <div className="mm-section-header">
              <span className="mm-section-badge"><i className="fas fa-bolt" /> Process</span>
              <h2 className="mm-section-title">Three steps to<br /><span className="mm-gradient-text">smarter travel</span></h2>
            </div>
          </Reveal>

          <div className="mm-steps">
            <div className="mm-steps__line" />
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 150} className="mm-step">
                <div className="mm-step__number">{s.num}</div>
                <div className="mm-step__icon"><i className={s.icon} /></div>
                <h5 className="mm-step__title">{s.title}</h5>
                <p className="mm-step__desc">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ LIVE NETWORK ═══════════ */}
      <section className="mm-network" id="network">
        <div className="container">
          <Reveal>
            <div className="mm-section-header mm-section-header--light">
              <span className="mm-section-badge mm-section-badge--dark"><i className="fas fa-wifi" /> Live</span>
              <h2 className="mm-section-title" style={{ color: '#f1f5f9' }}>Live on the <span className="mm-gradient-text">Network</span></h2>
              <p className="mm-section-desc" style={{ color: 'rgba(255,255,255,0.55)' }}>Real-time ML crowd predictions, updated every 60 seconds.</p>
            </div>
          </Reveal>

          <div className="row g-3 justify-content-center">
            {STATIONS_LIVE.map((st, i) => (
              <Reveal key={st.name} delay={i * 60} className="col-md-4 col-6">
                <div className="mm-station-card">
                  <div className="mm-station-card__info">
                    <div className="mm-station-card__dot" style={{ background: st.color }} />
                    <span className="mm-station-card__name">{st.name}</span>
                  </div>
                  <span className={`mm-station-card__badge ${st.badge}`}>{st.crowd}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mm-network__map-hint">
              <i className="fas fa-map-marked-alt" />
              <span>Crowd levels are generated by our scikit-learn ML pipeline trained on 18 months of ridership data.</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="mm-testimonials">
        <div className="container">
          <Reveal>
            <div className="mm-section-header">
              <span className="mm-section-badge"><i className="fas fa-quote-left" /> Testimonials</span>
              <h2 className="mm-section-title">Loved by <span className="mm-gradient-text">commuters</span></h2>
            </div>
          </Reveal>

          <div className="row g-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 100} className="col-lg-4">
                <div className="mm-testimonial">
                  <div className="mm-testimonial__stars">
                    {Array(5).fill(0).map((_, j) => <i key={j} className="fas fa-star" />)}
                  </div>
                  <p className="mm-testimonial__text">"{t.text}"</p>
                  <div className="mm-testimonial__author">
                    <div className="mm-testimonial__avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="mm-testimonial__name">{t.name}</div>
                      <div className="mm-testimonial__role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="mm-cta">
        <div className="mm-cta__glow mm-cta__glow--1" />
        <div className="mm-cta__glow mm-cta__glow--2" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Reveal>
            <div className="mm-cta__inner">
              <span style={{ fontSize: '2.5rem' }}>🚇</span>
              <h2 className="mm-cta__title">Ready to travel smarter?</h2>
              <p className="mm-cta__desc">Join 12,000+ Ahmedabad commuters who save time, money, and the planet every day.</p>
              <div className="mm-cta__actions">
                <Link to="/register" className="mm-btn mm-btn--white mm-btn--lg">
                  Create Free Account <i className="fas fa-arrow-right" />
                </Link>
                <Link to="/login" className="mm-btn mm-btn--ghost-light mm-btn--lg">
                  Sign In
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="mm-footer">
        <div className="mm-footer__gradient-bar" />
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-4 col-md-6">
              <div className="mm-footer__brand">
                <div className="mm-nav__logo" style={{ width: 36, height: 36, fontSize: '1rem' }}>🚇</div>
                <span className="mm-nav__wordmark" style={{ fontSize: '1.25rem' }}>MetroMind</span>
              </div>
              <p className="mm-footer__tagline">Intelligent urban transit for Ahmedabad. Predict. Book. Travel.</p>
              <div className="mm-footer__socials">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social"><i className="fab fa-twitter" /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social"><i className="fab fa-instagram" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social"><i className="fab fa-linkedin-in" /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social"><i className="fab fa-github" /></a>
              </div>
            </div>
            <div className="col-lg-2 col-md-6">
              <h6 className="mm-footer__heading">Product</h6>
              <ul className="mm-footer__links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#network">Network</a></li>
                <li><Link to="/register">Get Started</Link></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="mm-footer__heading">Support</h6>
              <ul className="mm-footer__links">
                <li><a href="tel:155370">🆘 Emergency — 155370</a></li>
                <li><a href="mailto:contact@metromind.in">📧 Contact Us</a></li>
                <li><Link to="/feedback">💬 Feedback</Link></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6">
              <h6 className="mm-footer__heading">Built With</h6>
              <div className="mm-footer__tech">
                {['React', 'Node.js', 'Django', 'scikit-learn', 'MongoDB'].map(t => (
                  <span className="mm-footer__tech-badge" key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mm-footer__bottom">
            <small>© 2026 MetroMind. Built by Ronit Parmar, B.Tech IT, LJIET Ahmedabad.</small>
            <small>Made for Ahmedabad Metro — Gujarat Metro Rail Corporation (GMRC)</small>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <button className={`mm-back-top ${scrolled ? 'mm-back-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <i className="fas fa-chevron-up" />
      </button>
    </div>
  );
}
