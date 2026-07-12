// frontend/src/components/common/QRModal.jsx
// Supports both single-passenger and group-booking QR display.
// Group bookings show a summary + horizontal scrollable row of per-passenger QR cards.

import { formatCurrency } from '../../utils/formatters';

export default function QRModal({ isOpen, onClose, ticket, onDownloadPDF }) {
  if (!isOpen || !ticket) return null;

  const passengers = ticket.passengers || [];
  const isGroup = passengers.length > 1;
  const farePerPerson = isGroup
    ? Math.round(ticket.fare / passengers.length)
    : ticket.fare;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 'var(--z-modal)', backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="glass-modal animate-scale-in"
        style={{
          padding: '32px',
          maxWidth: isGroup ? '720px' : '360px',
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          marginBottom: '4px',
          color: 'var(--text-primary)',
          textAlign: 'center',
        }}>
          {isGroup ? '👥 Group Booking' : '🎫 Your Ticket'}
        </h3>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          marginBottom: '16px',
          textAlign: 'center',
          fontFamily: 'monospace',
        }}>
          {ticket.ticketId}
        </p>

        {/* Group booking summary */}
        {isGroup && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Fare</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(ticket.fare)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passengers</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{passengers.length}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Per Person</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(farePerPerson)}</p>
            </div>
          </div>
        )}

        {/* QR cards — horizontal scroll for group, centered for single */}
        <div style={{
          display: 'flex',
          gap: '16px',
          overflowX: isGroup ? 'auto' : 'visible',
          justifyContent: isGroup ? 'flex-start' : 'center',
          paddingBottom: isGroup ? '8px' : 0,
          scrollSnapType: isGroup ? 'x mandatory' : 'none',
        }}>
          {passengers.map((p, idx) => (
            <div
              key={idx}
              style={{
                flex: isGroup ? '0 0 200px' : '0 0 auto',
                scrollSnapAlign: 'start',
                padding: '16px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Passenger name + age */}
              <p style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                marginBottom: '2px',
                color: 'var(--text-primary)',
              }}>
                {p.name}
              </p>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '12px',
              }}>
                Age: {p.age} {isGroup && `· #${idx + 1}`}
              </p>

              {/* QR code */}
              {p.qrCode && (
                <img
                  src={p.qrCode}
                  alt={`QR for ${p.name}`}
                  style={{
                    width: isGroup ? '150px' : '220px',
                    height: isGroup ? '150px' : '220px',
                    borderRadius: 'var(--radius-md)',
                    background: 'white',
                    padding: '8px',
                    marginBottom: '10px',
                  }}
                />
              )}

              {/* Fare per person */}
              <p style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
              }}>
                {formatCurrency(p.farePerPerson || farePerPerson)}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll hint for group */}
        {isGroup && passengers.length > 3 && (
          <p style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '8px',
          }}>
            ← Scroll to see all passengers →
          </p>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '20px',
        }}>
          {onDownloadPDF && (
            <button
              className="btn btn-secondary"
              onClick={() => onDownloadPDF(ticket._id)}
              style={{ flex: 1 }}
            >
              📄 Download {isGroup ? 'All Tickets' : 'PDF'}
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
