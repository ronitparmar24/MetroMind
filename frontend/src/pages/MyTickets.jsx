// frontend/src/pages/MyTickets.jsx
import { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import TicketCard from '../components/tickets/TicketCard';
import QRModal from '../components/common/QRModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { cancelTicket } from '../api/tickets.api';

export default function MyTickets() {
  const [statusFilter, setStatusFilter] = useState('');
  const { tickets, loading, refetch } = useTickets(statusFilter);
  const [qrModal, setQrModal] = useState({ open: false, qr: '', ticketId: '' });
  const toast = useToast();

  const handleCancel = async (id) => {
    if (!confirm('Cancel this ticket? The fare will be refunded to your wallet.')) return;
    try {
      const res = await cancelTicket(id);
      toast.success(res.data.message);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel ticket');
    }
  };

  const filters = [
    { value: '', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Tickets 🎟️</h1>
        <p className="page-subtitle">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-xl)' }}>
        {filters.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${statusFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tickets.length > 0 ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}>
          {tickets.map((t) => (
            <TicketCard key={t._id} ticket={t} onCancel={handleCancel}
              onShowQR={(qr, id) => setQrModal({ open: true, qr, ticketId: id })} />
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🎫</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '1.1rem' }}>
            No tickets found
          </p>
        </div>
      )}

      <QRModal isOpen={qrModal.open} qrCode={qrModal.qr} ticketId={qrModal.ticketId}
        onClose={() => setQrModal({ open: false, qr: '', ticketId: '' })} />
    </div>
  );
}
