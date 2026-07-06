// frontend/src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getTransactions } from '../api/wallet.api';
import { formatCurrency, formatDate, timeAgo } from '../utils/formatters';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getTransactions({ type: filter || undefined });
        setTransactions(res.data.transactions);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [filter]);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Transactions 📋</h1>
        <p className="page-subtitle">{transactions.length} transactions</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-xl)' }}>
        {[{ v: '', l: 'All' }, { v: 'credit', l: '↑ Credits' }, { v: 'debit', l: '↓ Debits' }].map((f) => (
          <button key={f.v} className={`btn btn-sm ${filter === f.v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.v)}>{f.l}</button>
        ))}
      </div>

      <GlassCard>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {transactions.map((t, i) => (
            <div key={t._id} className="stagger-item" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px', borderBottom: i < transactions.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  background: t.type === 'credit' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>
                  {t.type === 'credit' ? '↑' : '↓'}
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{t.note || t.ref}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDate(t.createdAt)} · {timeAgo(t.createdAt)}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: '1rem',
                  color: t.type === 'credit' ? 'var(--success)' : 'var(--danger)',
                }}>
                  {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Bal: {formatCurrency(t.balance)}
                </p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
