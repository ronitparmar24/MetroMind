// frontend/src/components/tickets/TicketCard.jsx
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { TICKET_STATUS } from '../../constants/categories';
import CrowdBadge from '../booking/CrowdBadge';

export default function TicketCard({ ticket, onCancel, onShowQR }) {
  const status = TICKET_STATUS[ticket.status] || TICKET_STATUS.upcoming;

  return (
    <div className="glass-card stagger-item" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {ticket.ticketId}
          </p>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>
            {ticket.source} → {ticket.destination}
          </h4>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: status.bg,
          color: status.color,
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {status.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(ticket.travelDate)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatTime(ticket.travelTime)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fare</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{formatCurrency(ticket.fare)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <CrowdBadge level={ticket.crowdBucket} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          👥 {ticket.passengers?.length || 1} passenger{(ticket.passengers?.length || 1) > 1 ? 's' : ''}
        </span>
        {ticket.co2Saved > 0 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
            🌿 {ticket.co2Saved} kg CO₂ saved
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {ticket.passengers?.[0]?.qrCode && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onShowQR(ticket.passengers[0].qrCode, ticket.ticketId)}
          >
            Show QR
          </button>
        )}
        {ticket.status === 'upcoming' && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => onCancel(ticket._id)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
