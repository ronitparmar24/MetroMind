// frontend/src/pages/MetroCard.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { getMetroCard, createMetroCard } from '../api/analytics.api';
import { NCMC_INFO } from '../constants/stations';

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
          maxWidth: '440px', padding: '32px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))',
          borderColor: 'rgba(99, 102, 241, 0.3)',
        }}>
          {/* Decorative background circles */}
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.08)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20px', left: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.06)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>MetroMind Card</p>
              <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, marginTop: '8px', letterSpacing: '2px' }}>
                {card.cardNumber}
              </p>
            </div>
            <span style={{ fontSize: '2rem' }}>🚇</span>
          </div>

          <div style={{ marginTop: '24px', position: 'relative' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Balance</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>₹{card.balance}</p>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '16px', position: 'relative',
          }}>
            <span className={`badge ${card.isActive ? 'badge-success' : 'badge-danger'}`}>
              {card.isActive ? 'Active' : 'Inactive'}
            </span>

            {/* NCMC badge on card visual */}
            {NCMC_INFO.enabled && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#16a34a',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}>
                <span style={{ fontSize: '0.8rem' }}>🪪</span>
                NCMC ✓
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: '60px', textAlign: 'center', maxWidth: '440px' }}>
          <span style={{ fontSize: '3rem' }}>💳</span>
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: '12px' }}>No Metro Card Yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px' }}>Get your digital metro card for contactless travel</p>
          <button className="btn btn-primary" onClick={handleCreate}>Create Metro Card</button>
        </GlassCard>
      )}

      {/* NCMC compatibility detail */}
      {NCMC_INFO.enabled && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          padding: '16px 20px', marginTop: 'var(--space-lg)',
          maxWidth: '440px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.15)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem', color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '1px' }}>🪪</span>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.88rem' }}>
              NCMC-Enabled Card
            </p>
            <p>This card is NCMC-enabled — the same card works on metro systems in Delhi, Mumbai, Chennai, Bengaluru, and other Indian cities.</p>
          </div>
        </div>
      )}
    </div>
  );
}
