// frontend/src/pages/Wallet.jsx
// MetroMind — 3D Credit Card Wallet Experience
import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { topupWallet } from '../api/wallet.api';
import api from '../api/index';
import { formatCurrency, timeAgo } from '../utils/formatters';
import { NCMC_INFO } from '../constants/stations';

/* ═══ 3D Credit Card ═══ */
function CreditCard({ balance, name, isFlipped, onFlip, transactions = [] }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (isFlipped) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 18;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const accountId = 'MM' + String(Math.abs(balance * 37)).slice(0, 4).padStart(4, '0');

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onFlip}
      title="Click to flip"
      style={{
        width: '100%', maxWidth: '380px', aspectRatio: '1.586',
        perspective: '1000px', cursor: 'pointer', margin: '0 auto',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        transform: `rotateY(${isFlipped ? 180 : 0}deg) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transformStyle: 'preserve-3d',
        transition: isFlipped ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.15s ease',
        position: 'relative',
      }}>
        {/* FRONT */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '20px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #1a1040 0%, #312e81 35%, #4c1d95 65%, #1e3a5f 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 8px 24px rgba(99,102,241,0.3)',
          padding: '24px 28px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(168,85,247,0.2)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '40px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          {/* Top row: logo + chip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🚇</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>MetroMind</span>
            </div>
            {/* Chip */}
            <div style={{ width: '40px', height: '30px', borderRadius: '6px', background: 'linear-gradient(135deg, #d4af37, #f5e67e, #b8860b)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '28px', height: '20px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.2)', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '1px', padding: '2px' }}>
                {[0,1,2,3].map(i => <div key={i} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '2px' }} />)}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Available Balance</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {formatCurrency(balance)}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Card Holder</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>{name?.toUpperCase() || 'CARDHOLDER'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Account</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>{accountId}</div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '20px', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Magnetic stripe */}
          <div style={{ width: '100%', height: '44px', background: '#111', margin: '24px 0 16px' }} />
          {/* Transactions preview */}
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Recent Activity</div>
            {transactions.slice(0, 3).map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{t.note || t.ref || 'Transaction'}</span>
                <span style={{ fontWeight: 700, color: t.type === 'credit' ? '#22c55e' : '#f87171', flexShrink: 0, marginLeft: '8px' }}>
                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>No transactions yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Wallet Component ═══ */
export default function Wallet() {
  const { user } = useAuth();
  const { wallet, loading, refetch } = useWallet();
  const [amount, setAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const toast = useToast();

  const handleTopup = async (a) => {
    const value = parseInt(a || amount);
    if (!value || value <= 0) { toast.error('Enter a valid amount'); return; }
    setTopupLoading(true);
    try {
      const res = await topupWallet(value);
      toast.success(res.data.message);
      setAmount('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Topup failed');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleRazorpayTopup = async (a) => {
    const value = parseInt(a || amount);
    if (!value || value <= 0) { toast.error('Enter a valid amount'); return; }
    setTopupLoading(true);
    try {
      const { data } = await api.post('/wallet/create-order', { amount: value });
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: 'INR',
        order_id: data.orderId,
        name: 'MetroMind',
        description: 'Wallet Top Up',
        handler: async (response) => {
          try {
            await api.post('/wallet/verify-payment', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: data.amount,
            });
            toast.success(`₹${value} added to wallet successfully`);
            setAmount('');
            refetch();
          } catch (err) {
            toast.error(err.response?.data?.error || 'Payment verification failed');
          }
        },
        theme: { color: '#6366f1' },
      });
      rzp.on('payment.failed', function (response){
        toast.error(response.error.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start payment');
    } finally {
      setTopupLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000];

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  const walletWarning = wallet.balance < 20 ? 'critical' : wallet.balance < 50 ? 'low' : null;

  return (
    <div style={{ padding: '12px 16px', animation: 'fadeInUp 0.4s ease', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes cardEntrance { from{opacity:0;transform:translateY(30px) scale(0.95);} to{opacity:1;transform:translateY(0) scale(1);} }
        .wallet-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; align-items: start; }
        @media(max-width:700px){ .wallet-grid{grid-template-columns:1fr!important;} }
      `}</style>

      <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '2px' }}>Wallet 💳</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '14px' }}>Your MetroMind digital wallet</p>

      {/* Low balance warning */}
      {walletWarning && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: walletWarning === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${walletWarning === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`, marginBottom: '12px', animation: 'fadeInUp 0.3s ease' }}>
          <span style={{ fontSize: '1.3rem' }}>{walletWarning === 'critical' ? '🚨' : '⚠️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: walletWarning === 'critical' ? '#ef4444' : '#f59e0b', marginBottom: '2px' }}>
              {walletWarning === 'critical' ? 'Critical Balance — Top Up Now' : 'Low Balance Warning'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {wallet.prediction?.lowBalanceWarning ? `Runs out in ~${wallet.prediction.daysUntilEmpty} days at current pace` : 'Your balance is running low'}
            </div>
          </div>
          <button onClick={() => handleTopup('200')} style={{ padding: '8px 16px', borderRadius: '12px', background: walletWarning === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', border: `1px solid ${walletWarning === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, color: walletWarning === 'critical' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Quick ₹200
          </button>
        </div>
      )}

      <div className="wallet-grid">
        {/* LEFT: Card + Top Up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 3D Card */}
          <div style={{ animation: 'cardEntrance 0.6s cubic-bezier(0.2,0.8,0.2,1)' }}>
            <CreditCard
              balance={wallet.balance}
              name={user?.name}
              isFlipped={isCardFlipped}
              onFlip={() => setIsCardFlipped(f => !f)}
              transactions={wallet.recentTransactions || []}
            />
            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px' }}>Click card to flip · Hover for 3D effect</p>
          </div>

          {/* Quick Top-Up */}
          <div style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '14px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Add Money</div>

            {/* Tap chips */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {quickAmounts.map(a => (
                <button
                  key={a}
                  onClick={() => { setAmount(String(a)); handleTopup(String(a)); }}
                  disabled={topupLoading}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer', border: 'none',
                    background: parseInt(amount) === a ? 'linear-gradient(135deg,#6366f1,#a855f7)' : 'var(--bg-tertiary)',
                    color: parseInt(amount) === a ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    boxShadow: parseInt(amount) === a ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}
                >₹{a}</button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <input
                type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Custom amount"
                min="1" max="10000"
                style={{ width: '100%', padding: '11px 16px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleTopup()}
                  disabled={topupLoading || !amount}
                  style={{ flex: 1, padding: '11px 10px', borderRadius: '14px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: (!amount || topupLoading) ? 0.6 : 1, transition: 'all 0.2s ease' }}
                >
                  Instant Test
                </button>
                <button
                  onClick={() => handleRazorpayTopup()}
                  disabled={topupLoading || !amount}
                  style={{ flex: 1, padding: '11px 10px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', opacity: (!amount || topupLoading) ? 0.6 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                >
                  Razorpay Checkout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Transactions */}
        <div style={{ borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Recent Transactions</span>
            {wallet.prediction?.avgWeeklySpend > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>avg {formatCurrency(wallet.prediction.avgWeeklySpend)}/wk</span>
            )}
          </div>
          <div style={{ padding: '8px 0', maxHeight: '495px', overflowY: 'auto' }}>
            {wallet.recentTransactions?.length > 0 ? (
              wallet.recentTransactions.map((t, i) => (
                <div key={t._id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  animation: `fadeInUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: t.type === 'credit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                    }}>
                      {t.type === 'credit' ? '💳' : '🎫'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.note || t.ref || 'Transaction'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{timeAgo(t.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, marginLeft: '12px', color: t.type === 'credit' ? '#22c55e' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>No transactions yet</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Top up your wallet to get started</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NCMC notice */}
      {NCMC_INFO.enabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', marginTop: '12px', borderRadius: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🪪</span>
          <p style={{ margin: 0 }}>{NCMC_INFO.description}</p>
        </div>
      )}
    </div>
  );
}
