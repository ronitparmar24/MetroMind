// frontend/src/pages/MonthlyPass.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { getPass, buyPass } from '../api/analytics.api';
import { PASS_PLANS } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function MonthlyPass() {
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState('');
  const toast = useToast();

  const fetchPass = async () => {
    setLoading(true);
    try {
      const res = await getPass();
      setPass(res.data.pass);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPass(); }, []);

  const handleBuy = async (planType) => {
    if (!confirm(`Buy ${PASS_PLANS[planType].label} for ${formatCurrency(PASS_PLANS[planType].price)}?`)) return;
    setBuying(planType);
    try {
      await buyPass(planType);
      toast.success(`${PASS_PLANS[planType].label} activated! 🎉`);
      fetchPass();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally { setBuying(''); }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Monthly Pass 🎪</h1>
        <p className="page-subtitle">Unlimited rides with a metro pass</p>
      </div>

      {pass && (
        <GlassCard style={{
          marginBottom: 'var(--space-xl)', padding: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
          borderColor: 'rgba(99, 102, 241, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="badge badge-success">Active</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', marginTop: '8px' }}>
                {PASS_PLANS[pass.planType]?.label || pass.planType} Pass
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Valid until {formatDate(pass.endDate)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
                {pass.ridesUsed}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>rides used</p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-3">
        {Object.entries(PASS_PLANS).map(([key, plan]) => (
          <GlassCard key={key} style={{ padding: '28px', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>{plan.label}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '16px 0', color: 'var(--accent-primary)' }}>
              {formatCurrency(plan.price)}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              {plan.duration} · Unlimited rides
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => handleBuy(key)}
              disabled={!!pass || buying === key}
            >
              {buying === key ? 'Processing...' : pass ? 'Already Active' : 'Buy Now'}
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
