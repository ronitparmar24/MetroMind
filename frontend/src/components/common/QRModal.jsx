import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../utils/formatters';

export default function QRModal({ isOpen, onClose, ticket, onDownloadPDF }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !ticket) return null;

  const passengers = ticket.passengers || [];
  const isGroup = passengers.length > 1;
  const farePerPerson = isGroup
    ? Math.round(ticket.fare / passengers.length)
    : ticket.fare;

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      if (onDownloadPDF) {
        await onDownloadPDF(ticket._id);
      } else {
        // Fallback if not provided by parent
        const { downloadTicketPDF } = await import('../../api/tickets.api');
        const res = await downloadTicketPDF(ticket._id);
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MetroMind-Ticket-${ticket._id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="ticket-modal"
        style={{
          position: 'relative',
          maxWidth: isGroup ? '750px' : '380px',
          width: '100%',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          transform: 'scale(1)',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div style={{ height: '6px', background: 'var(--accent-primary)', width: '100%', flexShrink: 0 }} />
        
        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ 
              display: 'inline-block',
              background: 'var(--bg-secondary)', color: 'var(--accent-primary)', 
              padding: '4px 12px', borderRadius: '20px', 
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: '12px'
            }}>
              {isGroup ? 'Group E-Ticket' : 'Boarding Pass'}
            </span>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: '0 0 4px',
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}>
              {ticket.source} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {ticket.destination}
            </h2>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              margin: 0,
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}>
              ID: {ticket.ticketId}
            </p>
          </div>

          {/* Group booking summary */}
          {isGroup && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px', fontWeight: 600 }}>Passengers</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{passengers.length}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px', fontWeight: 600 }}>Per Person</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{formatCurrency(farePerPerson)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px', fontWeight: 600 }}>Total Fare</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>{formatCurrency(ticket.fare)}</p>
              </div>
            </div>
          )}

          {/* QR cards */}
          <div style={{
            display: 'flex',
            gap: '16px',
            overflowX: isGroup ? 'auto' : 'visible',
            justifyContent: isGroup ? 'flex-start' : 'center',
            paddingBottom: isGroup ? '12px' : 0,
            scrollSnapType: isGroup ? 'x mandatory' : 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {passengers.map((p, idx) => (
              <div
                key={idx}
                style={{
                  flex: isGroup ? '0 0 240px' : '0 0 auto',
                  scrollSnapAlign: 'center',
                  padding: '16px',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Passenger Info */}
                <div style={{ marginBottom: '16px' }}>
                  <p style={{
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    margin: '0 0 4px',
                    color: 'var(--text-primary)',
                  }}>
                    {p.name}
                  </p>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    fontWeight: 600
                  }}>
                    Age {p.age} {isGroup && <span style={{ opacity: 0.5 }}>| #{idx + 1}</span>}
                  </p>
                </div>

                {/* QR Code */}
                <div className="qr-code" style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginBottom: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  {p.qrCode ? (
                    <img
                      src={p.qrCode}
                      alt={`QR for ${p.name}`}
                      style={{
                        width: isGroup ? '160px' : '180px',
                        height: isGroup ? '160px' : '180px',
                        display: 'block',
                        imageRendering: 'pixelated'
                      }}
                    />
                  ) : (
                    <div style={{ width: isGroup ? '160px' : '180px', height: isGroup ? '160px' : '180px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '20px', fontWeight: 600 }}>NO QR</span>
                    </div>
                  )}
                </div>

                {/* Ticket Status / Fare */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Valid Today</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(p.farePerPerson || farePerPerson)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '20px 24px',
          background: 'var(--bg-primary)',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              flex: 1, padding: '14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
              background: 'transparent', color: 'var(--text-primary)', border: '2px solid var(--border-color)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            📄 PDF
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700,
              background: 'var(--accent-primary)', color: '#ffffff', border: 'none',
              cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            Close
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
