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

      <div style={{ position: 'relative', marginTop: '20px' }}>
        {/* Blurred background cards as a sneak peek */}
        <div className="grid grid-3" style={{ filter: 'blur(12px) grayscale(40%)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none', transition: 'all 0.4s ease' }}>
          {Object.entries(PASS_PLANS).map(([key, plan]) => (
            <GlassCard key={key} style={{ padding: '28px', textAlign: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>{plan.label}</h3>
              <p style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '16px 0', color: 'var(--accent-primary)' }}>
                {formatCurrency(plan.price)}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                {plan.duration} · Unlimited rides
              </p>
              <button className="btn btn-primary" style={{ width: '100%' }} disabled>Buy Now</button>
            </GlassCard>
          ))}
        </div>

        {/* Coming Soon Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10
        }}>
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            padding: '50px 60px',
            borderRadius: '32px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
            textAlign: 'center',
            animation: 'fadeInUp 0.6s cubic-bezier(0.2,0.8,0.2,1)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '16px', filter: 'drop-shadow(0 10px 15px rgba(99,102,241,0.3))' }}>🚀</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', marginBottom: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Coming Soon</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, marginBottom: '32px' }}>
              We're finalizing our partnership with GMRC to bring you unlimited travel passes. Get ready for seamless daily commutes!
            </p>
            <div style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', gap: '8px', alignItems: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'dashPulse 2s infinite' }}></span>
              Stay Tuned
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
