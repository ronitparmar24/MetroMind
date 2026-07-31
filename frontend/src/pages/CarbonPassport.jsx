// frontend/src/pages/CarbonPassport.jsx
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';

export default function CarbonPassport() {
  const { user } = useAuth();
  const { tickets } = useTickets();

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const totalDistance = tickets.reduce((sum, t) => sum + (t.distance || 0), 0);
  const treesEquivalent = (totalCO2 / 21).toFixed(1); // ~21 kg CO2 per tree per year

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Carbon Passport 🌿</h1>
        <p className="page-subtitle">Your environmental impact through metro travel</p>
      </div>

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
