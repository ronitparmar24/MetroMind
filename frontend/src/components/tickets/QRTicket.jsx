// frontend/src/components/tickets/QRTicket.jsx
export default function QRTicket({ qrCode, ticketId, passengerName }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '16px',
      background: 'white',
      borderRadius: 'var(--radius-lg)',
    }}>
      {qrCode && (
        <img src={qrCode} alt={`QR for ${passengerName}`} style={{ width: '160px', height: '160px' }} />
      )}
      <p style={{ color: '#333', fontSize: '0.8rem', marginTop: '8px', fontFamily: 'monospace' }}>
        {ticketId}
      </p>
      {passengerName && (
        <p style={{ color: '#666', fontSize: '0.75rem' }}>{passengerName}</p>
      )}
    </div>
  );
}
