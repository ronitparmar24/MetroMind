// frontend/src/pages/CarbonPassport.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';
import { downloadCarbonPassportPDF } from '../api/analytics.api';
import { convertCarbonReward } from '../api/wallet.api';

export default function CarbonPassport() {
  const { user, updateUser } = useAuth();
  const { tickets } = useTickets();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  
  const [converting, setConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState({ type: '', text: '' });

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const totalDistance = tickets.reduce((sum, t) => sum + (t.distance || 0), 0);
  const treesEquivalent = (totalCO2 / 21).toFixed(1); // ~21 kg CO2 per tree per year

  // Carbon Reward Logic (1kg = ₹5)
  const claimedCO2 = user?.claimedCO2 || 0;
  const unclaimedCO2 = Math.max(0, totalCO2 - claimedCO2);
  const rewardCash = Number((unclaimedCO2 * 5).toFixed(2));
  const canConvert = unclaimedCO2 >= 0.4;

  const [sliderValue, setSliderValue] = useState(null);
  const selectedAmount = sliderValue !== null ? sliderValue : Math.floor(rewardCash);

  const handleConvert = async () => {
    if (!canConvert) return;
    setConverting(true);
    setConvertMessage({ type: '', text: '' });
    
    try {
      const res = await convertCarbonReward(selectedAmount);
      if (res.data.success) {
        setConvertMessage({ type: 'success', text: `Success! Added ₹${res.data.rewardCash} to your wallet.` });
        updateUser({ claimedCO2: res.data.claimedCO2 });
      }
    } catch (err) {
      setConvertMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to convert reward.' 
      });
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const response = await downloadCarbonPassportPDF();
      // Trigger file download in the browser
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `MetroMind_CarbonPassport_${user?.name?.replace(/\s+/g, '_') || 'user'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('Download failed. Please try again.');
      console.error('[CarbonPassport] PDF download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Carbon Passport 🌿</h1>
          <p className="page-subtitle">Your environmental impact through metro travel</p>
        </div>

        {/* ── Download Passport Button ── */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 22px',
            borderRadius: '14px',
            border: 'none',
            background: downloading
              ? 'var(--bg-tertiary)'
              : 'linear-gradient(135deg, #16a34a, #15803d)',
            color: downloading ? 'var(--text-muted)' : 'white',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: downloading ? 'not-allowed' : 'pointer',
            boxShadow: downloading ? 'none' : '0 6px 20px rgba(22,163,74,0.35)',
            transition: 'all 0.25s ease',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!downloading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 28px rgba(22,163,74,0.45)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = downloading ? 'none' : '0 6px 20px rgba(22,163,74,0.35)';
          }}
        >
          {downloading ? (
            <>
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--text-muted)',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
              }} />
              Generating PDF…
            </>
          ) : (
            <>📄 Download Passport (PDF)</>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {downloadError && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#dc2626', fontSize: '0.85rem', fontWeight: 500,
        }}>
          ⚠️ {downloadError}
        </div>
      )}

      {/* Eco Card */}
      <GlassCard style={{
        maxWidth: '500px', margin: '0 auto var(--space-xl)', padding: '32px',
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(22, 163, 74, 0.08))',
        borderColor: 'rgba(34, 197, 94, 0.25)', textAlign: 'center',
      }}>
        <span style={{ fontSize: '3rem' }}>🌍</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginTop: '12px' }}>
          Eco Warrior Card
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{user?.name}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '24px' }}>
          <div>
            <p className="mm-num" style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>
              {totalCO2.toFixed(1)}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg CO₂ saved</p>
          </div>
          <div>
            <p className="mm-num" style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
              {totalDistance.toFixed(0)}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>km by metro</p>
          </div>
        </div>
        <div style={{
          marginTop: '20px', padding: '10px', borderRadius: 'var(--radius-md)',
          background: 'rgba(34, 197, 94, 0.1)', fontSize: '0.85rem', color: 'var(--success)',
        }}>
          🌳 Equivalent to planting <strong>{treesEquivalent}</strong> trees
        </div>
      </GlassCard>

      {/* ── Carbon Reward Conversion Card ── */}
      <GlassCard style={{
        maxWidth: '500px', margin: '0 auto var(--space-xl)', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>🎁 Carbon Cash Reward</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Convert your saved CO₂ directly into wallet balance! (400g = ₹2)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center', margin: '8px 0' }}>
          <div style={{ textAlign: 'center', background: 'var(--bg-tertiary)', padding: '12px 24px', borderRadius: '12px', minWidth: '120px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{unclaimedCO2.toFixed(2)} <span style={{fontSize: '0.8rem', fontWeight: 500}}>kg</span></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Unclaimed CO₂</div>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-tertiary)', padding: '12px 24px', borderRadius: '12px', minWidth: '120px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>₹{rewardCash.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Max Value</div>
          </div>
        </div>

        {canConvert && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Choose Amount:</span>
              <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>₹{selectedAmount}</strong>
            </div>
            <input 
              type="range" 
              min="2" 
              max={Math.max(2, Math.floor(rewardCash))} 
              step="1" 
              value={selectedAmount} 
              onChange={(e) => setSliderValue(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#10B981' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>₹2 min</span>
              <span>₹{Math.floor(rewardCash)} max</span>
            </div>
          </div>
        )}

        {convertMessage.text && (
          <div style={{
            padding: '10px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, width: '100%', textAlign: 'center',
            background: convertMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: convertMessage.type === 'success' ? '#10B981' : '#dc2626'
          }}>
            {convertMessage.text}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={!canConvert || converting}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: (!canConvert || converting) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #10B981, #059669)',
            color: (!canConvert || converting) ? 'var(--text-muted)' : '#fff',
            fontSize: '0.95rem', fontWeight: 700, cursor: (!canConvert || converting) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', boxShadow: (!canConvert || converting) ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
          }}
        >
          {converting ? 'Converting...' : (canConvert ? `Convert ₹${selectedAmount} to Wallet Cash` : 'Need at least 400g to convert')}
        </button>
      </GlassCard>

      <div className="grid grid-3">
        <StatCard icon="🌿" value={`${totalCO2.toFixed(1)} kg`} label="Total CO₂ Saved" color="#22c55e" />
        <StatCard icon="🚇" value={tickets.length} label="Green Rides" color="#16a34a" />
        <StatCard icon="🌳" value={treesEquivalent} label="Trees Equivalent" color="#15803d" />
      </div>
    </div>
  );
}
