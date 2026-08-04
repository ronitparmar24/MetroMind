// frontend/src/pages/CarbonPassport.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';
import { downloadCarbonPassportPDF } from '../api/analytics.api';

export default function CarbonPassport() {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const totalDistance = tickets.reduce((sum, t) => sum + (t.distance || 0), 0);
  const treesEquivalent = (totalCO2 / 21).toFixed(1); // ~21 kg CO2 per tree per year

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

      <div className="grid grid-3">
        <StatCard icon="🌿" value={`${totalCO2.toFixed(1)} kg`} label="Total CO₂ Saved" color="#22c55e" />
        <StatCard icon="🚇" value={tickets.length} label="Green Rides" color="#16a34a" />
        <StatCard icon="🌳" value={treesEquivalent} label="Trees Equivalent" color="#15803d" />
      </div>
    </div>
  );
}
