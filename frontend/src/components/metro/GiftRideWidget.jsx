// frontend/src/components/metro/GiftRideWidget.jsx
import { useState } from 'react';

export default function GiftRideWidget() {
  const [giftSent, setGiftSent] = useState(false);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f472b6, #db2777)',
      borderRadius: '24px',
      padding: '20px',
      marginBottom: '24px',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 8px 24px rgba(219, 39, 119, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>redeem</span>
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Gift a Ride</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>
            Send a QR ticket to a friend via WhatsApp.
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => setGiftSent(true)}
        disabled={giftSent}
        style={{
          background: giftSent ? '#10b981' : '#fff',
          color: giftSent ? '#fff' : '#db2777',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '12px',
          fontWeight: 700,
          cursor: giftSent ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.3s'
        }}
      >
        {giftSent ? (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
            Sent!
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
            Gift
          </>
        )}
      </button>
    </div>
  );
}
