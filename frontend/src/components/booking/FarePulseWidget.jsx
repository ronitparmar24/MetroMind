// frontend/src/components/booking/FarePulseWidget.jsx
// Shows real-time fare preview based on station selection and time
import { formatCurrency } from '../../utils/formatters';

export default function FarePulseWidget({ fareData }) {
  if (!fareData) return null;

  return (
    <div className="glass-card" style={{
      padding: '16px',
      background: fareData.isPeak
        ? 'rgba(234, 179, 8, 0.08)'
        : 'rgba(34, 197, 94, 0.08)',
      borderColor: fareData.isPeak
        ? 'rgba(234, 179, 8, 0.2)'
        : 'rgba(34, 197, 94, 0.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Estimated Fare {fareData.isPeak && '(Peak ×1.2)'}
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            {formatCurrency(fareData.fare)}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {fareData.distance} km · {formatCurrency(fareData.perPassenger)}/person
          </p>
        </div>
        <div style={{
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: fareData.isPeak ? 'var(--warning-bg)' : 'var(--success-bg)',
          color: fareData.isPeak ? 'var(--warning)' : 'var(--success)',
          fontSize: '0.75rem',
          fontWeight: 600,
        }}>
          {fareData.isPeak ? '⚡ Peak' : '✨ Off-Peak'}
        </div>
      </div>
    </div>
  );
}
