// frontend/src/components/metro/ActiveRidePass.jsx
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

export default function ActiveRidePass({ ticket }) {
  const [countdown, setCountdown] = useState(25 * 60); // 25 minutes mock countdown

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Mock data if no ticket is passed
  const activeTicket = ticket || {
    qrCode: 'metro-mind-demo-qr-1234',
    source: 'Thaltej',
    destination: 'Apparel Park',
    platform: 2,
    trainArrival: '2 mins',
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1e1b4b, #312e81)',
      borderRadius: '24px',
      padding: '24px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 20px 40px rgba(49, 46, 129, 0.4)',
      marginBottom: '32px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Holographic glowing orb background effect */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(30px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-50px', left: '-50px',
        width: '150px', height: '150px',
        background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(30px)',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: '#a78bfa' }}>directions_subway</span>
          <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>METROMIND PASS</span>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10b981' }}>sensors</span>
          ACTIVE
        </div>
      </div>

      {/* Journey Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2, marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '4px' }}>From</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeTicket.source}</div>
          <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '4px' }}>Platform {activeTicket.platform}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', flex: 1 }} />
            <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>arrow_forward</span>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.2)', flex: 1 }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '8px', fontWeight: 600 }}>Train in {activeTicket.trainArrival}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#a5b4fc', textTransform: 'uppercase', marginBottom: '4px' }}>To</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeTicket.destination}</div>
          <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '4px' }}>ETA: {formatTime(countdown)}</div>
        </div>
      </div>

      {/* QR Code Section */}
      <div style={{ 
        background: '#fff', borderRadius: '16px', padding: '16px', 
        display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <QRCode value={activeTicket.qrCode} size={160} fgColor="#0f172a" />
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: '#94a3b8', position: 'relative', zIndex: 2 }}>
        Hold near the scanner at the AFC gate
      </div>
    </div>
  );
}
