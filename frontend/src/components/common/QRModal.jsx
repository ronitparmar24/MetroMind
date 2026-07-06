// frontend/src/components/common/QRModal.jsx
export default function QRModal({ isOpen, onClose, qrCode, ticketId }) {
  if (!isOpen) return null;

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
        style={{ padding: '32px', textAlign: 'center', maxWidth: '360px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Scan QR Code
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Ticket: {ticketId}
        </p>
        {qrCode && (
          <img
            src={qrCode}
            alt="QR Code"
            style={{ width: '220px', height: '220px', borderRadius: 'var(--radius-md)', background: 'white', padding: '12px' }}
          />
        )}
        <button
          className="btn btn-primary"
          onClick={onClose}
          style={{ marginTop: '20px', width: '100%' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
