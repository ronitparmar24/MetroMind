import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../components/common/Toast';

export default function AdminSupport() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchQueue = () => {
    adminApi.getSupportQueue()
      .then(res => setQueue(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleResolve = async (id, type) => {
    if (type !== 'lost_found') return; // Feedback doesn't have an endpoint for resolving in our current spec
    try {
      await adminApi.resolveSupportItem(id);
      showToast('Item resolved successfully', 'success');
      setQueue(queue.filter(q => q._id !== id));
    } catch (err) {
      showToast('Failed to resolve item', 'error');
    }
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    transition: 'transform 0.2s',
  };

  const pillStyle = (type) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    background: type === 'feedback' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
    color: type === 'feedback' ? '#818cf8' : '#f59e0b',
    border: `1px solid ${type === 'feedback' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
  });

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <h1 style={{ marginBottom: '32px', fontSize: '2.2rem', fontWeight: 800, textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>Support Queue</h1>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading Queue...</div>
      ) : queue.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.6)', borderStyle: 'dashed' }}>
          No pending support tickets. Great job! 🎉
        </div>
      ) : (
        queue.map(item => (
          <div key={item._id} style={cardStyle} className="hover-lift">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={pillStyle(item.queueType)}>{item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700 }}>
                  {item.userId?.name} <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>({item.userId?.email})</span>
                </h3>
              </div>
              
              {item.queueType === 'lost_found' && (
                <button
                  onClick={() => handleResolve(item._id, item.queueType)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(16,185,129,0.3)',
                    background: 'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(52,211,153,0.1) 100%)',
                    color: '#34d399',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'linear-gradient(90deg, rgba(16,185,129,0.3) 0%, rgba(52,211,153,0.2) 100%)'}
                  onMouseOut={(e) => e.target.style.background = 'linear-gradient(90deg, rgba(16,185,129,0.2) 0%, rgba(52,211,153,0.1) 100%)'}
                >
                  Resolve
                </button>
              )}
            </div>
            
            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {item.text || item.itemDescription}
              </p>
              {item.category && (
                <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Category:</strong> {item.category}
                </p>
              )}
              {item.moodRating && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Mood Rating:</strong> {item.moodRating}/5
                </p>
              )}
              {item.lastSeenLocation && (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Last Seen:</strong> {item.lastSeenLocation}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
