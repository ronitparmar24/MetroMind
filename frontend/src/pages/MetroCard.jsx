// frontend/src/pages/MetroCard.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { getMetroCard, createMetroCard } from '../api/analytics.api';

export default function MetroCard() {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetch = async () => {
      try { const res = await getMetroCard(); setCard(res.data.card); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCreate = async () => {
    try {
      const res = await createMetroCard();
      setCard(res.data.card);
      toast.success('Metro Card created! 💳');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Metro Card 💳</h1>
        <p className="page-subtitle">Your digital metro transit card</p>
      </div>

      {card ? (
        <GlassCard style={{
          maxWidth: '440px', padding: '32px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
          borderColor: 'rgba(99, 102, 241, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>MetroMind Card</p>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, marginTop: '8px', letterSpacing: '2px' }}>
                {card.cardNumber}
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>🚇</span>
          </div>
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Balance</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{card.balance}</p>
          </div>
          <span className={`badge ${card.isActive ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: '16px' }}>
            {card.isActive ? 'Active' : 'Inactive'}
          </span>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: '60px', textAlign: 'center', maxWidth: '440px' }}>
          <span style={{ fontSize: '3rem' }}>💳</span>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '12px' }}>No Metro Card Yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px' }}>Get your digital metro card for contactless travel</p>
          <button className="btn btn-primary" onClick={handleCreate}>Create Metro Card</button>
        </GlassCard>
      )}
    </div>
  );
}
