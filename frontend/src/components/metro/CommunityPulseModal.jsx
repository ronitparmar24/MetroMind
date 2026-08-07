// frontend/src/components/metro/CommunityPulseModal.jsx
// Crowdsourced Live Station Reports & Commuter Verification
import { useState, useEffect } from 'react';
import { getCommuterUpdates, postCommuterUpdate, upvoteCommuterUpdate } from '../../api/commuter.api';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityPulseModal({ isOpen, onClose }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [selectedTag, setSelectedTag] = useState('Amenity');
  const [station, setStation] = useState('Kalupur Ry.');

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getCommuterUpdates()
        .then((res) => {
          setReports(res.data.data || []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleUpvote = async (id) => {
    // Optimistic UI update
    setReports(reports.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    try {
      const res = await upvoteCommuterUpdate(id);
      if (res.data.success) {
        setReports(reports.map(r => r.id === id ? { ...r, upvotes: res.data.upvotes } : r));
      }
    } catch (error) {
      console.error(error);
      // Revert on failure
      setReports(reports.map(r => r.id === id ? { ...r, upvotes: r.upvotes - 1 } : r));
    }
  };

  const handleAddReport = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      const res = await postCommuterUpdate({
        station,
        tag: selectedTag,
        text: newText,
      });
      if (res.data.success) {
        setReports([res.data.data, ...reports]);
        setNewText('');
      }
    } catch (error) {
      console.error('Failed to post update:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      animation: 'fadeInUp 0.3s ease',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '28px', maxWidth: '520px', width: '100%', padding: '28px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)', position: 'relative',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center',
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '12px',
            background: 'rgba(16,185,129,0.12)', color: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Commuter Live Pulse
            </h3>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Real-time crowdsourced station updates by fellow commuters
            </p>
          </div>
        </div>

        {/* Submit New Report Form */}
        <form onSubmit={handleAddReport} style={{ margin: '20px 0', background: 'var(--bg-tertiary)', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            📢 Post a Station Update
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.75rem',
              }}
            >
              <option>Kalupur Ry.</option>
              <option>Thaltej</option>
              <option>Gujarat University</option>
              <option>Old High Court</option>
            </select>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              style={{
                padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.75rem',
              }}
            >
              <option>Amenity</option>
              <option>Queue</option>
              <option>AC</option>
              <option>Delay</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. Lift #1 working, TVM counter clear..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '10px',
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#10B981', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '0 14px', fontSize: '0.8125rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Post
            </button>
          </div>
        </form>

        {/* Live Feed Reports List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading updates...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No updates yet. Be the first to post!
            </div>
          ) : (
            reports.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                borderRadius: '16px', padding: '14px', display: 'flex', justifyContent: 'space-between',
                gap: '12px', alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {r.user}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    · {r.station} · {r.time ? (r.time === 'Just now' ? r.time : formatDistanceToNow(new Date(r.time), { addSuffix: true })) : 'recently'}
                  </span>
                  {r.verified && (
                    <span style={{ fontSize: '0.6875rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {r.text}
                </div>
              </div>

              <button
                onClick={() => handleUpvote(r.id)}
                style={{
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                  borderRadius: '12px', padding: '6px 10px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10B981' }}>thumb_up</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{r.upvotes}</span>
              </button>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
