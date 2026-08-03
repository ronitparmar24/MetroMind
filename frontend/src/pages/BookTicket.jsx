// frontend/src/pages/BookTicket.jsx — Premium redesign v2
import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/common/Toast';
import { useCrowd } from '../hooks/useCrowd';
import { useWallet } from '../hooks/useWallet';
import { bookTicket } from '../api/tickets.api';
import { STATIONS, LINES } from '../constants/stations';
import { calculateFare, isPeakHour } from '../utils/fareEngine';

const InteractiveMetroMap = lazy(() => import('../components/metro/InteractiveMetroMap'));

/* ── Line colours ──────────────────────────────────────────── */
const LINE_COLORS = {
  blue: '#2563EB', red: '#DC2626', yellow: '#CA8A04',
  pink: '#DB2777', purple: '#7C3AED',
};
const LINE_EMOJIS = { blue: '🔵', red: '🔴', yellow: '🟡', pink: '🩷', purple: '🟣' };

/* ── Crowd helpers ─────────────────────────────────────────── */
const CROWD_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const crowdLevel = (h) => {
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 19)) return 'high';
  if ((h >= 7 && h <= 11) || (h >= 16 && h <= 20)) return 'med';
  return 'low';
};
const CROWD_COLORS = { low: '#22c55e', med: '#f59e0b', high: '#ef4444' };
const CROWD_LABELS = { low: 'Low', med: 'Moderate', high: 'Busy' };

/* ── Passenger avatars ─────────────────────────────────────── */
const PASSENGER_AVATARS = ['👤','👩','🧑','👨','🧒','👧'];

/* ── SearchableStationInput ────────────────────────────────── */
function SearchableStationInput({ label, value, onChange, excludeStation, color = '#6366f1', icon }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return STATIONS.filter(s =>
      s.name !== excludeStation &&
      (q === '' || s.name.toLowerCase().includes(q) || LINES[s.line].name.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [query, excludeStation]);

  // Group by line for display
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.line]) map[s.line] = [];
      map[s.line].push(s);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (name) => { onChange(name); setQuery(''); setOpen(false); };
  const clear = () => { onChange(''); setQuery(''); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-secondary)', border: `2px solid ${open ? color : 'var(--border-color)'}`,
        borderRadius: '14px', padding: '10px 14px', transition: 'all 0.2s ease',
        boxShadow: open ? `0 0 0 4px ${color}20` : 'none', cursor: 'pointer',
      }} onClick={() => !open && setOpen(true)}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
        {value && !open ? (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {(() => { const s = STATIONS.find(st => st.name === value); return s ? `${LINE_EMOJIS[s.line]} ${LINES[s.line].name}` : ''; })()}
            </div>
          </div>
        ) : (
          <input
            autoFocus={open}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={`Search ${label.toLowerCase()} station...`}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        )}
        {value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          maxHeight: '320px', overflowY: 'auto',
        }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No stations found</div>
          ) : (
            Object.entries(grouped).map(([lineKey, stations]) => (
              <div key={lineKey}>
                <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, color: LINE_COLORS[lineKey], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {LINE_EMOJIS[lineKey]} {LINES[lineKey].name}
                </div>
                {stations.map(s => (
                  <div key={s.id} onClick={() => select(s.name)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background 0.15s', fontSize: '0.88rem', color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: LINE_COLORS[lineKey], flexShrink: 0 }} />
                    <span style={{ fontWeight: s.interchange ? 600 : 400 }}>{s.name}</span>
                    {s.interchange && <span style={{ fontSize: '10px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Interchange</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── CrowdHourBar ──────────────────────────────────────────── */
function CrowdHourBar({ selectedHour, onSelect }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
        Crowd Forecast — Pick Travel Time
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px', marginBottom: '6px' }}>
        {CROWD_HOURS.map(h => {
          const level = crowdLevel(h);
          const heights = { low: 20, med: 40, high: 56 };
          const isSelected = selectedHour === h;
          return (
            <div key={h} onClick={() => onSelect(h)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '3px' }}>
              <div style={{
                width: '100%', height: `${heights[level]}px`, borderRadius: '4px 4px 0 0',
                background: isSelected ? CROWD_COLORS[level] : `${CROWD_COLORS[level]}55`,
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 8px ${CROWD_COLORS[level]}66` : 'none',
                border: isSelected ? `1px solid ${CROWD_COLORS[level]}` : '1px solid transparent',
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
        <span>6 AM</span><span>12 PM</span><span>6 PM</span><span>10 PM</span>
      </div>
      {selectedHour !== null && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: `${CROWD_COLORS[crowdLevel(selectedHour)]}15`, borderRadius: '10px', border: `1px solid ${CROWD_COLORS[crowdLevel(selectedHour)]}30` }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {selectedHour < 12 ? `${selectedHour}:00 AM` : selectedHour === 12 ? '12:00 PM' : `${selectedHour - 12}:00 PM`}
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: CROWD_COLORS[crowdLevel(selectedHour)] }}>
            {CROWD_LABELS[crowdLevel(selectedHour)]} crowd
            {isPeakHour(selectedHour, new Date().getDay()) && ' · ⚡ +20% fare'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── FareBreakdown ─────────────────────────────────────────── */
function FareBreakdown({ fareData, passengers }) {
  if (!fareData) return null;
  return (
    <div style={{
      background: fareData.isPeak ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.05))' : 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(99,102,241,0.05))',
      border: `1px solid ${fareData.isPeak ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
      borderRadius: '20px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Total Fare</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
            ₹{fareData.fare}
          </div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: fareData.isPeak ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: fareData.isPeak ? '#d97706' : '#16a34a' }}>
          {fareData.isPeak ? '⚡ Peak' : '✨ Off-Peak'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
        {[
          ['📏 Distance', `${fareData.distance} km`],
          ['👤 Per passenger', `₹${fareData.perPassenger}`],
          ['👥 Passengers', `${passengers} × ₹${fareData.perPassenger}`],
          fareData.isPeak ? ['⚡ Peak surcharge', '+20%'] : null,
        ].filter(Boolean).map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>{label}</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
          <span>💳 Total</span><span>₹{fareData.fare}</span>
        </div>
      </div>
    </div>
  );
}

/* ── JourneySummary ────────────────────────────────────────── */
function JourneySummary({ source, destination, travelDate, travelHour }) {
  if (!source || !destination) return null;
  const srcStation = STATIONS.find(s => s.name === source);
  const destStation = STATIONS.find(s => s.name === destination);
  const dateStr = new Date(travelDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = travelHour !== null ? (travelHour < 12 ? `${travelHour}:00 AM` : travelHour === 12 ? '12:00 PM' : `${travelHour-12}:00 PM`) : '—';
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(124,58,237,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '16px 18px', marginBottom: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>🗺️ Journey Summary</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{source}</div>
          {srcStation && <div style={{ fontSize: '10px', color: LINE_COLORS[srcStation.line], fontWeight: 600 }}>{LINE_EMOJIS[srcStation.line]} {LINES[srcStation.line].name}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '24px', height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '14px' }}>🚇</span>
          <div style={{ width: '24px', height: '1px', background: 'var(--border-color)' }} />
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{destination}</div>
          {destStation && <div style={{ fontSize: '10px', color: LINE_COLORS[destStation.line], fontWeight: 600 }}>{LINE_EMOJIS[destStation.line]} {LINES[destStation.line].name}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem' }}>
        <span style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>📅 {dateStr}</span>
        <span style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px 10px', color: 'var(--text-secondary)', fontWeight: 500 }}>🕐 {timeStr}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function BookTicket() {
  const location = useLocation();
  const prefilled = location.state || {};

  const [source, setSource] = useState(prefilled.source || '');
  const [destination, setDestination] = useState(prefilled.destination || '');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [travelHour, setTravelHour] = useState(null);
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('search');
  const [swapping, setSwapping] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { balance } = useWallet();

  useEffect(() => {
    if (prefilled.source && prefilled.destination) {
      toast.success(`Route pre-filled: ${prefilled.source} → ${prefilled.destination}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default hour to now
  useEffect(() => {
    if (travelHour === null) setTravelHour(new Date().getHours());
  }, [travelHour]);

  const travelTime = travelHour !== null ? `${String(travelHour).padStart(2,'0')}:00` : '';

  const farePreview = useMemo(() => {
    if (!source || !destination) return null;
    const srcStation = STATIONS.find(s => s.name === source);
    const destStation = STATIONS.find(s => s.name === destination);
    if (!srcStation || !destStation) return null;
    const dayOfWeek = new Date(travelDate).getDay();
    return calculateFare(srcStation, destStation, travelHour || new Date().getHours(), dayOfWeek, passengers.length);
  }, [source, destination, travelDate, travelHour, passengers.length]);

  const fromStationId = useMemo(() => STATIONS.find(s => s.name === source)?.id || null, [source]);
  const toStationId = useMemo(() => STATIONS.find(s => s.name === destination)?.id || null, [destination]);

  const handleSwap = () => {
    if (!source && !destination) return;
    setSwapping(true);
    setTimeout(() => {
      const tmp = source;
      setSource(destination);
      setDestination(tmp);
      setSwapping(false);
    }, 200);
  };

  const addPassenger = () => { if (passengers.length < 6) setPassengers(p => [...p, { name: '', age: '' }]); };
  const removePassenger = (i) => { if (passengers.length > 1) setPassengers(p => p.filter((_, idx) => idx !== i)); };
  const updatePassenger = (i, field, value) => setPassengers(p => p.map((x, idx) => idx === i ? { ...x, [field]: value } : x));

  const validPassengers = passengers.filter(p => p.name && p.age);
  const canBook = source && destination && travelDate && travelHour !== null && validPassengers.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!source || !destination || !travelDate || !travelTime) { toast.error('Please fill in all required fields'); return; }
    if (validPassengers.length === 0) { toast.error('Please add at least one passenger with name and age'); return; }
    if (farePreview && balance !== null && balance < farePreview.fare) {
      toast.error(`Insufficient wallet balance (₹${balance}). Need ₹${farePreview.fare}.`);
      setTimeout(() => navigate('/wallet'), 1500);
      return;
    }
    setLoading(true);
    try {
      const res = await bookTicket({ source, destination, passengers: validPassengers.map(p => ({ name: p.name, age: parseInt(p.age) })), travelDate, travelTime });
      toast.success(`🎫 Ticket booked! ${res.data.ticket.ticketId}`);
      navigate('/tickets');
    } catch (err) {
      if (err.response?.status === 402) {
        toast.error(err.response?.data?.error || 'Insufficient balance!');
        setTimeout(() => navigate('/wallet'), 1500);
      } else {
        toast.error(err.response?.data?.error || 'Booking failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-lg)', animation: 'fadeInUp 0.4s ease' }}>
      {/* ── Hero Header ── */}
      <div style={{
        borderRadius: '28px', padding: '28px 32px', marginBottom: '28px', overflow: 'hidden',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #DB2777 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', right: '120px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          {/* Animated metro train */}
          <div style={{ position: 'absolute', bottom: '12px', right: '0', fontSize: '28px', animation: 'trainRide 8s linear infinite', whiteSpace: 'nowrap' }}>
            🚇 — — — — — — —
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
            Ahmedabad Metro · GMRC
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: '0 0 6px', lineHeight: 1.1 }}>
            Book Your Ride 🎫
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0 }}>
            Real-time crowd intelligence · Instant QR tickets · 5 metro lines
          </p>
          {balance !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem', color: 'white', fontWeight: 600 }}>
              💳 Wallet: ₹{balance}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes trainRide { from { transform: translateX(100px); } to { transform: translateX(-800px); } }
      `}</style>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div>
            {/* ── Route Card ── */}
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              {/* Input mode toggle */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', padding: '4px', background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                {[['search', '🔍', 'Search'], ['map', '🗺️', 'Metro Map']].map(([mode, icon, label]) => (
                  <button key={mode} type="button" onClick={() => setInputMode(mode)} style={{
                    flex: 1, padding: '9px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s ease',
                    background: inputMode === mode ? 'var(--bg-secondary)' : 'transparent',
                    color: inputMode === mode ? 'var(--accent-primary)' : 'var(--text-muted)',
                    boxShadow: inputMode === mode ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}>{icon} {label}</button>
                ))}
              </div>

              {inputMode === 'search' && (
                <div>
                  <SearchableStationInput
                    label="From — Departure" value={source} onChange={setSource}
                    excludeStation={destination} color="#22c55e" icon="🟢"
                  />

                  {/* Swap Button */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                    <button type="button" onClick={handleSwap} style={{
                      width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--border-color)',
                      background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.3s ease', transform: swapping ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'var(--text-secondary)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    >⇅</button>
                  </div>

                  <SearchableStationInput
                    label="To — Destination" value={destination} onChange={setDestination}
                    excludeStation={source} color="#ef4444" icon="🔴"
                  />
                </div>
              )}

              {inputMode === 'map' && (
                <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading map...</div>}>
                  <InteractiveMetroMap compact onStationSelect={(from, to) => { if (from) setSource(from); if (to !== undefined) setDestination(to); }} initialFrom={fromStationId} initialTo={toStationId} />
                  {(source || destination) && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: '12px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>🟢 {source || 'Select FROM'}</span>
                      <span style={{ color: 'var(--text-muted)' }}>→</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 {destination || 'Select TO'}</span>
                    </div>
                  )}
                </Suspense>
              )}

              {/* Date */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Travel Date</div>
                <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '14px', border: '2px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* ── Time & Crowd Card ── */}
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              <CrowdHourBar selectedHour={travelHour} onSelect={setTravelHour} />
            </div>

            {/* ── Passengers Card ── */}
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Passengers</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{passengers.length} of 6 max</div>
                </div>
                <button type="button" onClick={addPassenger} disabled={passengers.length >= 6}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '20px', border: '1.5px solid var(--accent-primary)', background: 'var(--accent-glow)', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 700, cursor: passengers.length >= 6 ? 'not-allowed' : 'pointer', opacity: passengers.length >= 6 ? 0.5 : 1 }}>
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {passengers.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {PASSENGER_AVATARS[i] || '👤'}
                    </div>
                    <input type="text" placeholder={`Passenger ${i+1} name`} value={p.name}
                      onChange={e => updatePassenger(i, 'name', e.target.value)}
                      style={{ flex: 2, background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    <input type="number" placeholder="Age" value={p.age}
                      onChange={e => updatePassenger(i, 'age', e.target.value)}
                      min="1" max="120"
                      style={{ flex: '0 0 70px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    {passengers.length > 1 && (
                      <button type="button" onClick={() => removePassenger(i)}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', fontSize: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Submit ── */}
            <button type="submit" disabled={loading || !canBook}
              style={{
                width: '100%', padding: '16px', borderRadius: '18px', border: 'none',
                background: canBook ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--bg-tertiary)',
                color: canBook ? 'white' : 'var(--text-muted)',
                fontSize: '1rem', fontWeight: 700, cursor: canBook ? 'pointer' : 'not-allowed',
                boxShadow: canBook ? '0 8px 24px rgba(79,70,229,0.35)' : 'none',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (canBook) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,70,229,0.45)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canBook ? '0 8px 24px rgba(79,70,229,0.35)' : 'none'; }}
            >
              {loading ? (
                <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Booking...</>
              ) : (
                <>{farePreview ? `🎫 Book Now — ₹${farePreview.fare}` : '🎫 Book Ticket'}</>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Journey summary */}
            <JourneySummary source={source} destination={destination} travelDate={travelDate} travelHour={travelHour} />

            {/* Fare breakdown */}
            {farePreview && <FareBreakdown fareData={farePreview} passengers={passengers.length} />}

            {/* Travel Tips */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>💡 Smart Tips</div>
              {[
                { icon: '🕐', tip: 'Off-peak (11am–5pm) saves you 20% on fares' },
                { icon: '👥', tip: 'Group bookings (up to 6 passengers) in one go' },
                { icon: '🌿', tip: 'Every ride saves ~90g CO₂ vs driving' },
                { icon: '🏆', tip: 'Earn 1 loyalty point per ₹10 spent' },
                { icon: '📱', tip: 'QR code valid for 30 mins after travel time' },
              ].map(({ icon, tip }) => (
                <div key={tip} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* Balance warning */}
            {farePreview && balance !== null && balance < farePreview.fare && (
              <div style={{ marginTop: '12px', padding: '14px', borderRadius: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600, marginBottom: '6px' }}>⚠️ Insufficient Balance</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>You have ₹{balance} but need ₹{farePreview.fare}.</div>
                <button type="button" onClick={() => navigate('/wallet')} style={{ marginTop: '10px', width: '100%', padding: '8px', borderRadius: '10px', border: 'none', background: '#dc2626', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  Top Up Wallet →
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
