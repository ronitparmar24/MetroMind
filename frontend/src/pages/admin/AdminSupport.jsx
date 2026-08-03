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
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid var(--border-color)',
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
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
    <div style={{ color: 'var(--text-primary)', maxWidth: '900px' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 700 }}>Support Queue</h1>

      {loading ? (
        <div>Loading Queue...</div>
      ) : queue.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No pending support tickets. Great job!
        </div>
      ) : (
        queue.map(item => (
          <div key={item._id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={pillStyle(item.queueType)}>{item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>
                  {item.userId?.name} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({item.userId?.email})</span>
                </h3>
              </div>
              
              {item.queueType === 'lost_found' && (
                <button
                  onClick={() => handleResolve(item._id, item.queueType)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = 0.8}
                  onMouseOut={(e) => e.target.style.opacity = 1}
                >
                  Resolve
                </button>
              )}
            </div>
            
            <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {item.text || item.itemDescription}
              </p>
              {item.category && (
                <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Category:</strong> {item.category}
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
