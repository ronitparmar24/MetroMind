import React, { useState, useEffect } from 'react';
import api from '../../api/index';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/api/announcements');
        if (response.data.success) {
          setAnnouncements(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || announcements.length === 0) return null;

  if (loading || announcements.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      height: '44px',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 10,
      borderRadius: '22px',
      margin: '16px 24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Live Badge */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        fontWeight: 800,
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        padding: '0 20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 2,
        boxShadow: '4px 0 20px rgba(239, 68, 68, 0.3)',
        textTransform: 'uppercase',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'white',
          animation: 'pulse 1.5s infinite ease-in-out'
        }} />
        LIVE
      </div>

      {/* Scrolling Marquee */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes pulse {
              0% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1.2); opacity: 1; filter: drop-shadow(0 0 4px white); }
              100% { transform: scale(0.95); opacity: 0.8; }
            }
          `}
        </style>
        <div style={{
          display: 'flex',
          animation: 'marquee 40s linear infinite',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          alignItems: 'center',
          width: 'max-content'
        }}>
          {[...announcements, ...announcements].map((ann, idx) => (
            <div key={`${ann._id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <span style={{
                color: ann.priority === 'critical' ? '#ef4444' : ann.priority === 'warning' ? '#f59e0b' : '#3b82f6',
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                background: ann.priority === 'critical' ? 'rgba(239,68,68,0.1)' : ann.priority === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                {ann.title}
              </span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.02em' }}>
                {ann.message}
              </span>
              <span style={{ color: 'var(--text-muted)', opacity: 0.5, marginLeft: '48px', marginRight: '48px' }}>•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
