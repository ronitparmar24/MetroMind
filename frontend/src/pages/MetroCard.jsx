// frontend/src/pages/MetroCard.jsx
import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { getMetroCard, createMetroCard, topUpMetroCard } from '../api/analytics.api';
import { useWallet } from '../hooks/useWallet';
import { useAuth } from '../hooks/useAuth';

const DISCOUNT = 10; // percent
const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

/* ── Small stat pill ── */
function StatPill({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: '120px',
      padding: '16px 14px',
      borderRadius: '16px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-color)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color || 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

/* ── Benefit row ── */
function BenefitRow({ icon, title, desc, highlight }) {
  return (
    <div style={{
      display: 'flex', gap: '14px', alignItems: 'flex-start',
      padding: '14px 16px',
      borderRadius: '14px',
      background: highlight ? 'rgba(99,102,241,0.06)' : 'transparent',
      border: highlight ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
        background: highlight ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{desc}</div>
      </div>
      {highlight && (
        <div style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'center' }}>
          Active
        </div>
      )}
    </div>
  );
}

export default function MetroCard() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const toast = useToast();
  const { wallet, refetch: refreshWallet } = useWallet();
  const { user } = useAuth();

  useEffect(() => {
    getMetroCard()
      .then(r => setCard(r.data.card))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* 3D tilt on card hover */
  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 14;
    setTilt({ x, y });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await createMetroCard();
      setCard(res.data.card);
      toast.success('Metro Card created! You now get 10% off every ticket 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create card');
    } finally { setCreating(false); }
  };

  const handleTopUp = async (amt) => {
    const amount = Number(amt || topUpAmount);
    if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10'); return; }
    setTopUpLoading(true);
    try {
      const res = await topUpMetroCard(amount);
      setCard(res.data.card);
      refreshWallet?.();
      toast.success(`✅ ₹${amount} added to Metro Card`);
      setTopUpAmount('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Top-up failed');
    } finally { setTopUpLoading(false); }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page" style={{ padding: '12px 16px', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes cardShimmer { 0%{opacity:0;transform:translateX(-100%);} 80%{opacity:0.6;} 100%{opacity:0;transform:translateX(100%);} }
        @keyframes pulse2 { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Metro Card 💳</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '2px', fontSize: '0.82rem' }}>
          Your smart transit card — <span style={{ color: '#6366f1', fontWeight: 700 }}>10% off every ticket</span> automatically
        </p>
      </div>

      {card ? (
        /* ══ TWO-COLUMN LAYOUT ══ */
        <div className="book-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px', alignItems: 'start' }}>

          {/* LEFT: Card + Stats + Top-up */}
          <div>
            {/* Card visual */}
            <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={resetTilt}
              style={{ perspective: '900px', marginBottom: '12px', cursor: 'default' }}>
              <div style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d', transition: 'transform 0.12s ease',
                borderRadius: '20px', padding: '24px 24px 20px', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #5b21b6 100%)',
                boxShadow: `0 20px 60px rgba(99,102,241,0.4), 0 ${4 + tilt.x * 0.3}px 20px rgba(0,0,0,0.3)`,
                minHeight: '180px',
              }}>
                <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(168,85,247,0.25)', filter:'blur(50px)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:'-30px', left:'20px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(99,102,241,0.2)', filter:'blur(40px)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.07) 50%,transparent 60%)', animation:'cardShimmer 3s ease-in-out infinite', pointerEvents:'none' }} />
                <div style={{ position:'absolute', right:'24px', top:'24px', width:'44px', height:'34px', borderRadius:'6px', background:'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow:'0 2px 8px rgba(251,191,36,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:'30px', height:'22px', borderRadius:'4px', border:'1.5px solid rgba(0,0,0,0.2)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px', padding:'3px' }}>
                    {[...Array(4)].map((_, i) => <div key={i} style={{ background:'rgba(0,0,0,0.15)', borderRadius:'1px' }} />)}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>MetroMind Card</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse2 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>ACTIVE • NCMC</span>
                  </div>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '2.5px', marginBottom: '16px' }}>
                  {card.cardNumber.replace('MC-', '').match(/.{1,4}/g)?.join(' ') || card.cardNumber}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Card Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>₹{card.balance?.toLocaleString('en-IN') || 0}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Discount</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', lineHeight: 1 }}>10% OFF</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {user?.name?.toUpperCase() || 'CARDHOLDER'}
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>🚇</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <StatPill icon="💰" label="Total Saved" value={`₹${card.totalSaved || 0}`} color="#22c55e" />
              <StatPill icon="🎫" label="Card Trips" value={card.totalTrips || 0} color="#6366f1" />
              <StatPill icon="💳" label="Wallet" value={`₹${wallet?.balance ?? '—'}`} color="#f59e0b" />
              <StatPill icon="📅" label="Last Used" value={card.lastUsed ? new Date(card.lastUsed).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : 'Never'} />
            </div>

            {/* Top-up */}
            <div style={{ borderRadius: '16px', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Top Up Metro Card</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Wallet: <strong style={{ color: 'var(--text-primary)' }}>₹{wallet?.balance ?? '—'}</strong> available
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => handleTopUp(a)} disabled={topUpLoading || (wallet?.balance ?? 0) < a}
                    style={{ padding: '7px 13px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: (wallet?.balance ?? 0) >= a ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem', cursor: (wallet?.balance ?? 0) >= a ? 'pointer' : 'not-allowed', opacity: (wallet?.balance ?? 0) >= a ? 1 : 0.4, transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { if ((wallet?.balance ?? 0) >= a) { e.target.style.background = 'rgba(99,102,241,0.1)'; e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.color = '#6366f1'; } }}
                    onMouseLeave={e => { e.target.style.background = 'var(--bg-tertiary)'; e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = (wallet?.balance ?? 0) >= a ? 'var(--text-primary)' : 'var(--text-muted)'; }}
                  >+₹{a}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" min={10} max={5000} placeholder="Custom amount (₹10 – ₹5000)" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }} />
                <button onClick={() => handleTopUp()} disabled={topUpLoading || !topUpAmount}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: topUpAmount ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)', color: topUpAmount ? 'white' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.875rem', cursor: topUpAmount ? 'pointer' : 'not-allowed', transition: 'all 0.15s ease' }}>
                  {topUpLoading ? '…' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Benefits (sticky) */}
          <div className="book-sidebar" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', position: 'sticky', top: '80px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Card Benefits
            </div>
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <BenefitRow icon="🏷️" title="10% Off Every Ticket" desc="Automatically applied on all ticket bookings — no coupon needed" highlight />
              <BenefitRow icon="🪪" title="NCMC Compatible" desc="Works on metro systems in Delhi, Mumbai, Chennai, Bengaluru & more" />
              <BenefitRow icon="⚡" title="Instant QR Boarding" desc="Tap your QR at the gate — no cash, no queue" />
              <BenefitRow icon="📊" title="Savings Tracker" desc="See exactly how much you've saved with your Metro Card" />
              <BenefitRow icon="🔄" title="Auto Wallet Deduction" desc="Ticket fare is deducted from your MetroMind wallet automatically" />
            </div>
          </div>

        </div>
      ) : (
        /* ══ NO CARD STATE ══ */
        <div style={{
          borderRadius: '24px', padding: '52px 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.04))',
          border: '1px dashed rgba(99,102,241,0.3)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💳</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>Get Your Metro Card</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px', lineHeight: 1.6 }}>
            Unlock <strong style={{ color: '#6366f1' }}>10% off on every ticket booking</strong> automatically.<br />
            NCMC-enabled — works across all Indian metro cities.
          </p>

          {/* Benefits preview */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', margin: '24px 0' }}>
            {[
              { icon: '🏷️', label: '10% off tickets' },
              { icon: '🪪', label: 'NCMC enabled' },
              { icon: '⚡', label: 'Instant boarding' },
              { icon: '📊', label: 'Savings tracker' },
            ].map(b => (
              <div key={b.label} style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <span>{b.icon}</span>{b.label}
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '14px 40px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            {creating ? 'Creating…' : '✨ Create Metro Card — Free'}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '12px' }}>No charges. Instant activation.</p>
        </div>
      )}
    </div>
  );
}
