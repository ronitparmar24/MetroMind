// frontend/src/pages/JourneyHistory.jsx
import { useTickets } from '../hooks/useTickets';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function JourneyHistory() {
  const { tickets, loading } = useTickets();

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  const completed = tickets.filter(t => t.status === 'completed' || t.status === 'upcoming');

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Journey History 📜</h1>
        <p className="page-subtitle">{completed.length} journeys recorded</p>
      </div>

      {completed.length > 0 ? (
        <GlassCard style={{ padding: '4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Date', 'Route', 'Fare', 'Distance', 'CO₂ Saved', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem',
                    color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{formatDate(t.travelDate)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 500 }}>{t.source} → {t.destination}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(t.fare)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{t.distance} km</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--success)' }}>{t.co2Saved} kg</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-info'}`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>📜</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>No journey history yet</p>
        </GlassCard>
      )}
    </div>
  );
}
