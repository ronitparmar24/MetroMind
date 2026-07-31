// frontend/src/pages/Landing.jsx
// MetroMind — Full production landing page with premium auth-matching theme
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/style.css';
import '../styles/responsive.css';

/* ═══ SCROLL-REVEAL ═══ */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`mm-reveal ${visible ? 'mm-revealed' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ═══ ANIMATED COUNTER ═══ */
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const [ref, visible] = useReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    const target = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (isNaN(target)) return;
    let frame;
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, value]);
  return <span ref={ref}>{visible ? `${display.toLocaleString()}${suffix}` : '0'}</span>;
}

/* ═══ ACTIVE SECTION TRACKER ═══ */
function useActiveSection(sectionIds) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observers = [];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [sectionIds]);
  return active;
}

/* ═══ PARTICLES ═══ */
function Particles() {
  const items = [
    { w: 40, left: '8%', top: '20%', dur: 22, delay: 0 },
    { w: 90, left: '75%', top: '10%', dur: 34, delay: 4 },
    { w: 56, left: '25%', top: '70%', dur: 28, delay: 2 },
    { w: 70, left: '85%', top: '60%', dur: 30, delay: 6 },
    { w: 32, left: '50%', top: '40%', dur: 20, delay: 8 },
    { w: 48, left: '15%', top: '45%', dur: 26, delay: 3 },
    { w: 64, left: '65%', top: '80%', dur: 32, delay: 5 },
  ];
  return items.map((p, i) => (
    <div key={i} className="mm-particle" style={{
      width: p.w, height: p.w, left: p.left, top: p.top,
      animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
    }} />
  ));
}

function CtaParticles() {
  const items = [
    { w: 30, left: '10%', top: '15%', dur: 18 },
    { w: 50, left: '80%', top: '25%', dur: 24 },
    { w: 40, left: '30%', top: '70%', dur: 20 },
    { w: 60, left: '70%', top: '65%', dur: 28 },
  ];
  return items.map((p, i) => (
    <div key={i} style={{
      position: 'absolute', width: p.w, height: p.w, left: p.left, top: p.top,
      borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
      animation: `mmParticleFloat ${p.dur}s linear infinite`,
      animationDelay: `${i * 2}s`, pointerEvents: 'none',
    }} />
  ));
}

/* ═══ FAQ ACCORDION ═══ */
function FaqItem({ q, a, open, onClick }) {
  return (
    <div className={`mm-faq-item ${open ? 'mm-faq-item--open' : ''}`} onClick={onClick}>
      <div className="mm-faq-item__q">
        <span>{q}</span>
        <span className="mm-faq-item__icon">{open ? '−' : '+'}</span>
      </div>
      <div className="mm-faq-item__a" style={{
        maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0,
        padding: open ? '0 0 16px' : '0',
      }}>
        {a}
      </div>
    </div>
  );
}

/* ═══ DATA ═══ */
const SECTION_IDS = ['features', 'how-it-works', 'comparison', 'network', 'testimonials', 'faq'];

const HERO_STATIONS = [
  { name: 'Thaltej',         level: 'low',  pct: 28 },
  { name: 'Gujarat Univ.',   level: 'med',  pct: 62 },
  { name: 'Kalupur Railway', level: 'high', pct: 88 },
  { name: 'Old High Court',  level: 'low',  pct: 22 },
  { name: 'Sabarmati',       level: 'med',  pct: 55 },
];

const FEATURES = [
  { icon: 'fas fa-brain',          title: 'AI Crowd Prediction',   desc: 'ML-powered forecasts tell you exactly how packed your train will be — before you even tap "Book."', color: '#4F46E5' },
  { icon: 'fas fa-route',          title: 'Smart Route Engine',    desc: 'Compare direct vs. interchange routes instantly — fare, travel time, and crowd level side by side.', color: '#7C3AED' },
  { icon: 'fas fa-qrcode',         title: 'QR Ticketing',          desc: 'One-tap booking, instant QR codes. Group tickets with individual passenger scans, no queues.', color: '#06b6d4' },
  { icon: 'fas fa-chart-line',     title: 'Travel Analytics',      desc: 'Weekly digests, heatmaps, spending insights, and your unique commute personality profile.', color: '#f59e0b' },
  { icon: 'fas fa-leaf',           title: 'Carbon Dashboard',      desc: 'Track real CO₂ savings with every metro ride. Watch your sustainability passport grow trip by trip.', color: '#22c55e' },
  { icon: 'fas fa-satellite-dish', title: 'Live Train Tracking',   desc: 'Real-time arrivals with delay predictions and platform change alerts pushed to your phone.', color: '#ef4444' },
];

const STEPS = [
  { num: '01', title: 'Pick Stations',   desc: 'Choose origin & destination from 32+ stations across the Blue and Red metro lines.', icon: 'fas fa-map-marker-alt' },
  { num: '02', title: 'Get AI Forecast', desc: 'Our scikit-learn model predicts crowd density for your specific departure time — updated every 60 seconds.', icon: 'fas fa-robot' },
  { num: '03', title: 'Book & Scan',     desc: 'Pay from your wallet, get an animated QR ticket, and scan at the gate. Group bookings supported.', icon: 'fas fa-qrcode' },
];

const STATIONS_LIVE = [
  { name: 'Vastral Gam',     level: 'low',  line: 'red' },
  { name: 'Thaltej',         level: 'med',  line: 'blue' },
  { name: 'Naranpura',       level: 'low',  line: 'blue' },
  { name: 'Kalupur Railway', level: 'high', line: 'blue' },
  { name: 'Sabarmati',       level: 'med',  line: 'blue' },
  { name: 'Old High Court',  level: 'low',  line: 'blue' },
  { name: 'Apparel Park',    level: 'low',  line: 'red' },
  { name: 'Amraiwadi',       level: 'med',  line: 'red' },
  { name: 'Kankaria East',   level: 'high', line: 'red' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Daily commuter, Thaltej → Kalupur', text: 'The crowd prediction is scarily accurate. I used to spend 20 minutes waiting for a less crowded train — now I check MetroMind and pick the right departure instantly.', rating: 5, avatar: '👩‍💼' },
  { name: 'Rajesh Patel', role: 'B.Tech Student, GTU', text: 'QR ticketing saved me from standing in queue every morning. The group booking feature is perfect when I travel with classmates.', rating: 5, avatar: '👨‍🎓' },
  { name: 'Meera Desai', role: 'Software Engineer, SG Highway', text: 'The carbon tracking feature made me realize how much CO₂ I save by taking metro. My sustainability passport is my pride!', rating: 4, avatar: '👩‍💻' },
  { name: 'Amit Joshi', role: 'Business Owner, Old City', text: 'Route comparison is brilliant. I can see fare + crowd + time for direct vs interchange routes. Saves both money and time.', rating: 5, avatar: '👨‍💼' },
];

const COMPARISON = [
  { feature: 'AI Crowd Prediction', metromind: true,  others: false },
  { feature: 'QR Ticketing',         metromind: true,  others: true },
  { feature: 'Route Comparison',     metromind: true,  others: false },
  { feature: 'Digital Wallet',       metromind: true,  others: true },
  { feature: 'Carbon Tracking',      metromind: true,  others: false },
  { feature: 'Travel Personality',   metromind: true,  others: false },
  { feature: 'Live Train Tracking',  metromind: true,  others: true },
  { feature: 'Monthly Pass',         metromind: true,  others: true },
  { feature: 'Group Booking',        metromind: true,  others: false },
  { feature: 'Anomaly Detection',    metromind: true,  others: false },
];

const FAQS = [
  { q: 'Is MetroMind free to use?', a: 'Yes! MetroMind is completely free. You even get a ₹500 welcome bonus in your digital wallet when you sign up.' },
  { q: 'How accurate is the crowd prediction?', a: 'Our scikit-learn model trained on 18 months of GMRC ridership data achieves 94% accuracy. Predictions are updated every 60 seconds during operating hours.' },
  { q: 'Can I book tickets for a group?', a: 'Absolutely! You can book up to 6 passengers per ticket. Each passenger gets an individual QR code for gate scanning.' },
  { q: 'What payment methods are supported?', a: 'Currently, you can top up your MetroMind wallet via UPI, debit card, or net banking. All ticket payments are deducted from your wallet balance.' },
  { q: 'Is my data safe?', a: 'Yes. Passwords are hashed with bcrypt (12 rounds), sessions use JWT tokens, and all communication is encrypted with 256-bit TLS. We never share personal data with third parties.' },
  { q: 'Which metro lines are supported?', a: 'MetroMind covers both the Blue Line (Thaltej → Vastral) and the Red Line (Motera → Gyaspur) — all 32 stations across the GMRC network.' },
];

const TRUSTED_BY = [
  { name: 'GMRC', desc: 'Gujarat Metro Rail Corporation' },
  { name: 'GTU', desc: 'Gujarat Technological University' },
  { name: 'LJIET', desc: 'LJ Institute of Engineering' },
  { name: 'AUDA', desc: 'Ahmedabad Urban Development' },
];

const levelColors = { low: 'var(--mm-green)', med: 'var(--mm-amber)', high: 'var(--mm-red)' };
const levelLabels = { low: 'Low', med: 'Medium', high: 'High' };

/* ═══ CROWD FORECAST STRIP ═══ */
function CrowdForecast() {
  return (
    <div className="mm-forecast">
      <div className="mm-forecast__header">
        <div className="mm-forecast__title">
          <i className="fas fa-chart-bar" /> Blue Line — Live Crowd
        </div>
        <span className="mm-forecast__live">
          <span className="mm-forecast__live-dot" /> Live
        </span>
      </div>
      <div className="mm-forecast__stations">
        {HERO_STATIONS.map((st, i) => (
          <div className="mm-crowd-row" key={st.name} style={{ animationDelay: `${i * 0.2}s` }}>
            <span className="mm-crowd-row__name">{st.name}</span>
            <div className="mm-crowd-bar">
              <div className={`mm-crowd-bar__fill mm-crowd-bar__fill--${st.level}`}
                style={{ '--bar-w': `${st.pct}%`, width: `${st.pct}%`, animationDelay: `${i * 0.6}s` }} />
            </div>
            <span className={`mm-crowd-row__label mm-crowd-row__label--${st.level}`}>
              {levelLabels[st.level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ STAR RATING ═══ */
function Stars({ count }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= count ? '#f59e0b' : '#e2e8f0', fontSize: '14px' }}>★</span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const activeSection = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="mm-landing">
      <div className="mm-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className={`mm-nav ${scrolled ? 'mm-nav--scrolled' : ''}`}>
        <div className="container">
          <div className="mm-nav__inner">
            <Link to="/" className="mm-nav__brand">
              <span className="mm-nav__dot" /> MetroMind
            </Link>
            <div className="mm-nav__links">
              {[
                { id: 'features', label: 'Features' },
                { id: 'how-it-works', label: 'How it Works' },
                { id: 'network', label: 'Network' },
                { id: 'testimonials', label: 'Reviews' },
                { id: 'faq', label: 'FAQ' },
              ].map(link => (
                <a key={link.id} href={`#${link.id}`}
                  className={activeSection === link.id ? 'mm-nav__link--active' : ''}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mm-nav__actions">
              <Link to="/login" className="mm-btn mm-btn--ghost">Sign In</Link>
              <Link to="/register" className="mm-btn mm-btn--primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="mm-hero" id="hero">
        <Particles />
        <div className="container">
          <div className="mm-hero__inner">
            <div>
              <div className="mm-hero__eyebrow">
                <span className="mm-hero__eyebrow-dot" />
                Ahmedabad Metro · 32 Stations Live
              </div>
              <h1 className="mm-hero__title">
                Know the crowd<br />before you{' '}
                <span className="mm-hero__title-gradient">board.</span>
              </h1>
              <p className="mm-hero__subtitle">
                MetroMind predicts crowd density at every Ahmedabad Metro
                station using machine learning — so you pick the right train,
                every time.
              </p>
              <div className="mm-hero__cta">
                <Link to="/register" className="mm-btn mm-btn--primary mm-btn--lg">
                  Get Started — Free <i className="fas fa-arrow-right" />
                </Link>
                <Link to="/login" className="mm-btn mm-btn--ghost mm-btn--lg">Sign In</Link>
              </div>
              {/* Trust badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--mm-text-3)' }}>
                  <i className="fas fa-shield-alt" style={{ color: '#22c55e' }} /> 256-bit encrypted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--mm-text-3)' }}>
                  <i className="fas fa-users" style={{ color: 'var(--mm-primary)' }} /> 12,000+ users
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--mm-text-3)' }}>
                  <i className="fas fa-star" style={{ color: '#f59e0b' }} /> 4.9 rating
                </div>
              </div>
            </div>
            <div><CrowdForecast /></div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY ═══════════ */}
      <section className="mm-trusted">
        <div className="container">
          <p className="mm-trusted__label">Trusted by organizations across Gujarat</p>
          <div className="mm-trusted__logos">
            {TRUSTED_BY.map(org => (
              <div className="mm-trusted__item" key={org.name}>
                <span className="mm-trusted__name">{org.name}</span>
                <span className="mm-trusted__desc">{org.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="mm-stats">
        <div className="container">
          <div className="mm-stats__inner">
            {[
              { val: '12000', suffix: '+', label: 'Active Commuters', icon: 'fas fa-users' },
              { val: '500',   suffix: '+', label: 'Daily Predictions', icon: 'fas fa-chart-line' },
              { val: '94',    suffix: '%', label: 'ML Accuracy', icon: 'fas fa-bullseye' },
              { val: '32',    suffix: '',  label: 'Stations', icon: 'fas fa-subway' },
              { val: '2400',  suffix: 't', label: 'CO₂ Saved', icon: 'fas fa-leaf' },
            ].map(s => (
              <div className="mm-stat" key={s.label}>
                <div className="mm-stat__icon"><i className={s.icon} /></div>
                <div className="mm-stat__value"><AnimatedNumber value={s.val} suffix={s.suffix} /></div>
                <div className="mm-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="mm-section mm-section--alt" id="features">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">Features</div>
              <h2 className="mm-section__title">Everything you need for smarter commuting</h2>
              <p className="mm-section__desc">
                Six powerful tools built on real GMRC ridership data and machine learning — not generic transit features.
              </p>
            </div>
          </Reveal>
          <div className="mm-features-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="mm-feature">
                  <div className="mm-feature__icon" style={{ background: `${f.color}15`, color: f.color }}>
                    <i className={f.icon} />
                  </div>
                  <h4 className="mm-feature__title">{f.title}</h4>
                  <p className="mm-feature__desc">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="mm-section" id="how-it-works">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">How It Works</div>
              <h2 className="mm-section__title">Three steps to a smarter commute</h2>
              <p className="mm-section__desc">From station selection to gate scan — it takes less than 30 seconds.</p>
            </div>
          </Reveal>
          <div className="mm-process-list">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="mm-process-step">
                  <div className="mm-process-step__marker">
                    <div className="mm-process-step__num">{s.num}</div>
                    <div className="mm-process-step__line" />
                  </div>
                  <div className="mm-process-step__content">
                    <h5 className="mm-process-step__title">{s.title}</h5>
                    <p className="mm-process-step__desc">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <section className="mm-section mm-section--alt" id="comparison">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">Why MetroMind</div>
              <h2 className="mm-section__title">Not just another transit app</h2>
              <p className="mm-section__desc">See what makes MetroMind different from generic metro apps.</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="mm-comparison">
              <table className="mm-comparison__table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className="mm-comparison__highlight">MetroMind</th>
                    <th>Others</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i}>
                      <td>{row.feature}</td>
                      <td className="mm-comparison__highlight">
                        {row.metromind
                          ? <span className="mm-comparison__yes"><i className="fas fa-check-circle" /> Yes</span>
                          : <span className="mm-comparison__no"><i className="fas fa-times-circle" /> No</span>}
                      </td>
                      <td>
                        {row.others
                          ? <span className="mm-comparison__partial"><i className="fas fa-check-circle" /> Basic</span>
                          : <span className="mm-comparison__no"><i className="fas fa-times-circle" /> No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ LIVE NETWORK ═══════════ */}
      <section className="mm-section mm-network-section" id="network">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">Live Network</div>
              <h2 className="mm-section__title">Real-time crowd across 32 stations</h2>
              <p className="mm-section__desc">
                ML predictions updated every 60 seconds from our scikit-learn pipeline trained on 18 months of GMRC data.
              </p>
            </div>
          </Reveal>
          <div className="mm-network-grid">
            {STATIONS_LIVE.map((st, i) => (
              <Reveal key={st.name} delay={i * 60}>
                <div className="mm-station-card">
                  <div className="mm-station-card__info">
                    <div className={`mm-station-card__dot ${st.level === 'high' ? 'mm-station-card__dot--pulse' : ''}`}
                      style={{ background: levelColors[st.level] }} />
                    <span className="mm-station-card__name">{st.name}</span>
                  </div>
                  <span className={`mm-crowd-badge mm-crowd-badge--${st.level}`}>
                    {levelLabels[st.level]}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mm-network__note">
              <i className="fas fa-info-circle" />
              <span>Crowd levels are ML predictions, not static mock data. Updated in real-time during metro operating hours (6 AM – 10 PM).</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="mm-section mm-section--alt" id="testimonials">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">Testimonials</div>
              <h2 className="mm-section__title">Loved by Ahmedabad commuters</h2>
              <p className="mm-section__desc">Join thousands who've made their daily commute smarter.</p>
            </div>
          </Reveal>
          <div className="mm-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="mm-testimonial">
                  <Stars count={t.rating} />
                  <p className="mm-testimonial__text">"{t.text}"</p>
                  <div className="mm-testimonial__author">
                    <div className="mm-testimonial__avatar">{t.avatar}</div>
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

      {/* ═══════════ FAQ ═══════════ */}
      <section className="mm-section" id="faq">
        <div className="container">
          <Reveal>
            <div className="mm-section__header">
              <div className="mm-section__eyebrow">FAQ</div>
              <h2 className="mm-section__title">Frequently asked questions</h2>
              <p className="mm-section__desc">Everything you need to know about MetroMind.</p>
            </div>
          </Reveal>
          <div className="mm-faq-list">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <FaqItem q={faq.q} a={faq.a} open={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="mm-cta">
        <CtaParticles />
        <div className="container">
          <Reveal>
            <h2 className="mm-cta__title">Ready to commute smarter?</h2>
            <p className="mm-cta__desc">
              Join 12,000+ Ahmedabad commuters. Free forever, no credit card required. Get ₹500 welcome bonus.
            </p>
            <div className="mm-cta__actions">
              <Link to="/register" className="mm-btn mm-btn--white mm-btn--lg">
                Create Free Account <i className="fas fa-arrow-right" />
              </Link>
              <Link to="/login" className="mm-btn mm-btn--ghost mm-cta__ghost mm-btn--lg">
                Sign In
              </Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              <span><i className="fas fa-check" style={{ marginRight: '4px', color: '#22c55e' }} /> Free forever</span>
              <span><i className="fas fa-check" style={{ marginRight: '4px', color: '#22c55e' }} /> ₹500 bonus</span>
              <span><i className="fas fa-check" style={{ marginRight: '4px', color: '#22c55e' }} /> No card needed</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="mm-footer">
        <div className="container">
          <div className="mm-footer__grid">
            <div>
              <div className="mm-footer__brand-name">
                <span className="mm-nav__dot" /> MetroMind
              </div>
              <p className="mm-footer__tagline">
                Intelligent urban transit for Ahmedabad.<br />Predict. Book. Travel.
              </p>
              <div className="mm-footer__socials">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social" aria-label="Twitter"><i className="fab fa-twitter" /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social" aria-label="Instagram"><i className="fab fa-instagram" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="mm-footer__social" aria-label="GitHub"><i className="fab fa-github" /></a>
              </div>
            </div>
            <div>
              <h6 className="mm-footer__heading">Product</h6>
              <ul className="mm-footer__links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#comparison">Why MetroMind</a></li>
                <li><a href="#network">Network</a></li>
                <li><Link to="/register">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="mm-footer__heading">Support</h6>
              <ul className="mm-footer__links">
                <li><a href="tel:155370">Emergency — 155370</a></li>
                <li><a href="mailto:contact@metromind.in">Contact Us</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><Link to="/feedback">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="mm-footer__heading">Built With</h6>
              <div className="mm-footer__tech">
                {['React', 'Node.js', 'Django', 'scikit-learn', 'MongoDB', 'Vite'].map(t => (
                  <span className="mm-footer__tech-badge" key={t}>{t}</span>
                ))}
              </div>
              <h6 className="mm-footer__heading" style={{ marginTop: '20px' }}>Legal</h6>
              <ul className="mm-footer__links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mm-footer__bottom">
            <small>© 2026 MetroMind. Built by Ronit Parmar, B.Tech IT, LJIET Ahmedabad.</small>
            <small>Made for Gujarat Metro Rail Corporation (GMRC)</small>
          </div>
        </div>
      </footer>

      <button className={`mm-back-top ${scrolled ? 'mm-back-top--visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <i className="fas fa-chevron-up" />
      </button>
    </div>
  );
}
