// frontend/src/pages/Wallet.jsx
import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { topupWallet } from '../api/wallet.api';
import { formatCurrency, timeAgo } from '../utils/formatters';
import { NCMC_INFO } from '../constants/stations';

export default function Wallet() {
  const { wallet, loading, refetch } = useWallet();
  const [amount, setAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const toast = useToast();

  const handleTopup = async (e) => {
    e.preventDefault();
    const value = parseInt(amount);
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

  const quickAmounts = [100, 200, 500, 1000, 2000];

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Wallet 💰</h1>
        <p className="page-subtitle">Manage your MetroMind wallet</p>
      </div>

      {/* Predictive low-balance warning */}
      {wallet.prediction?.lowBalanceWarning && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-lg)',
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>⚠️</span>
          <p style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            At your current pace, your wallet runs out in{' '}
            <strong style={{ color: '#f59e0b' }}>
              ~{wallet.prediction.daysUntilEmpty} day{wallet.prediction.daysUntilEmpty !== 1 ? 's' : ''}
            </strong>.
            Consider topping up.
          </p>
          <button
            className="btn btn-sm"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onClick={() => {
              setAmount('200');
              // Auto-scroll to topup form
              document.getElementById('topup-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            Top Up ₹200
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Balance Card */}
        <div>
          <GlassCard style={{
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
            marginBottom: 'var(--space-lg)',
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              Available Balance
            </p>
            <h2 className="mm-num" style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '8px' }}>
              {formatCurrency(wallet.balance)}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              {wallet.currency || 'INR'}
              {wallet.prediction?.avgWeeklySpend > 0 && (
                <span style={{ marginLeft: '12px' }}>
                  · Avg. {formatCurrency(wallet.prediction.avgWeeklySpend)}/week
                </span>
              )}
            </p>
          </GlassCard>

          {/* Topup Form */}
          <GlassCard>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>Add Money</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {quickAmounts.map((a) => (
                <button key={a} type="button"
                  className={`btn btn-sm ${parseInt(amount) === a ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAmount(String(a))}>
                  ₹{a}
                </button>
              ))}
            </div>
            <form onSubmit={handleTopup} style={{ display: 'flex', gap: '8px' }}>
              <input type="number" className="form-input" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min="1" max="10000" />
              <button type="submit" className="btn btn-primary" disabled={topupLoading} id="topup-submit">
                {topupLoading ? '...' : 'Add'}
              </button>
            </form>
          </GlassCard>
        </div>

        {/* Recent Transactions */}
        <GlassCard>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>
            Recent Transactions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {wallet.recentTransactions?.length > 0 ? (
              wallet.recentTransactions.map((t) => (
                <div key={t._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)',
                }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t.note || t.ref}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(t.createdAt)}</p>
                  </div>
                  <p className="mm-num" style={{
                    fontWeight: 600, fontFamily: 'var(--font-display)',
                    color: t.type === 'credit' ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                No transactions yet
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* NCMC compatibility notice */}
      {NCMC_INFO.enabled && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 20px', marginTop: 'var(--space-xl)',
          background: 'rgba(34, 197, 94, 0.08)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem', color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>🪪</span>
          <p>{NCMC_INFO.description}</p>
        </div>
      )}
    </div>
  );
}
