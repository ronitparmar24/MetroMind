import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import api from '../../api/index'; // announcements endpoints are direct on /api/admin/announcements
import { Bell, Plus, Trash2, Edit2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const PURPLE  = '#6366f1';
const ROSE    = '#f87171';
const EMERALD = '#34d399';
const AMBER   = '#fbbf24';

function SkeletonRow() {
  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
      <div className="admin-skeleton" style={{ height: 16, width: '30%', marginBottom: 10 }} />
      <div className="admin-skeleton" style={{ height: 14, width: '80%', marginBottom: 16 }} />
      <div style={{ display:'flex', gap:10 }}>
        <div className="admin-skeleton" style={{ height: 26, width: 80, borderRadius: 13 }} />
        <div className="admin-skeleton" style={{ height: 26, width: 60, borderRadius: 13 }} />
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  
  // Form state
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [priority, setPriority] = useState('low');
  const [isActive, setIsActive] = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/announcements')
      .then(r => setAnnouncements(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (a = null) => {
    setError('');
    if (a) {
      setEditingId(a._id);
      setTitle(a.title);
      setMessage(a.message);
      setPriority(a.priority);
      setIsActive(a.isActive);
    } else {
      setEditingId(null);
      setTitle('');
      setMessage('');
      setPriority('low');
      setIsActive(true);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }
    if (message.length > 200) {
      setError('Message must be 200 characters or less.');
      return;
    }

    try {
      const payload = { title, message, priority, isActive };
      if (editingId) {
        await api.put(`/api/admin/announcements/${editingId}`, payload);
      } else {
        await api.post('/api/admin/announcements', payload);
      }
      setShowModal(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      load();
    } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      // Find the item to preserve other fields
      const item = announcements.find(a => a._id === id);
      if (!item) return;
      await api.put(`/api/admin/announcements/${id}`, { ...item, isActive: !currentStatus });
      setAnnouncements(list => list.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a));
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Bell size={20} color={AMBER} />
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>
              Announcement Broadcast
            </div>
            <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>
              Manage scrolling ticker announcements for the user dashboard
            </div>
          </div>
        </div>
        <button className="admin-action-btn admin-action-btn-primary" onClick={() => openForm()} style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)`, boxShadow: `0 2px 12px rgba(251,191,36,0.3)` }}>
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {/* List */}
      <div>
        {loading ? (
          Array.from({length:3}).map((_,i) => <SkeletonRow key={i} />)
        ) : announcements.length === 0 ? (
          <div className="glass-card" style={{ padding:60, textAlign:'center' }}>
            <Bell size={40} style={{ opacity:0.2, marginBottom:16 }} color="#94a3b8" />
            <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--adm-text)' }}>No announcements</div>
            <div style={{ fontSize:'0.875rem', color:'#64748b', marginTop:6 }}>Create one to broadcast to all users.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {announcements.map(a => (
              <div key={a._id} className="glass-card admin-fade-in" style={{ padding:20, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, opacity: a.isActive ? 1 : 0.6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.05rem', fontWeight:800, color:'var(--adm-text)' }}>
                      {a.title}
                    </div>
                    <span className={`admin-badge ${a.priority === 'high' ? 'admin-badge-red' : a.priority === 'medium' ? 'admin-badge-yellow' : 'admin-badge-blue'}`}>
                      {a.priority}
                    </span>
                  </div>
                  <div style={{ fontSize:'0.85rem', color:'var(--adm-text-3)', lineHeight:1.5, marginBottom:16 }}>
                    {a.message}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="admin-action-btn admin-action-btn-ghost" style={{ fontSize:'0.7rem', padding:'4px 10px' }} onClick={() => handleToggleActive(a._id, a.isActive)}>
                      {a.isActive ? <><EyeOff size={11} /> Disable</> : <><Eye size={11} /> Enable</>}
                    </button>
                    <button className="admin-action-btn admin-action-btn-ghost" style={{ fontSize:'0.7rem', padding:'4px 10px' }} onClick={() => openForm(a)}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button className="admin-action-btn admin-action-btn-danger" style={{ fontSize:'0.7rem', padding:'4px 10px' }} onClick={() => handleDelete(a._id)}>
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:'0.7rem', color:'#475569' }}>
                  <div>Created</div>
                  <div style={{ fontFamily:'JetBrains Mono, monospace' }}>
                    {new Date(a.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="admin-modal" style={{ padding:0 }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
              <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding:24 }}>
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:12, background:'rgba(248,113,113,0.1)', color:ROSE, borderRadius:10, marginBottom:20, fontSize:'0.82rem', fontWeight:600 }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:6 }}>TITLE</label>
                <input
                  type="text" className="admin-input"
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="E.g., Weekend Maintenance"
                  maxLength={50}
                />
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <label style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--adm-text-3)' }}>MESSAGE</label>
                  <span style={{ fontSize:'0.7rem', color: message.length > 180 ? ROSE : '#475569' }}>{message.length} / 200</span>
                </div>
                <textarea
                  className="admin-input"
                  style={{ minHeight:80, resize:'vertical', lineHeight:1.5 }}
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Enter the broadcast message..."
                  maxLength={200}
                />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:6 }}>PRIORITY</label>
                  <select className="admin-input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low (Blue)</option>
                    <option value="medium">Medium (Yellow)</option>
                    <option value="high">High (Red)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:6 }}>STATUS</label>
                  <label className="admin-toggle-switch" style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ position:'relative', width:44, height:24 }}>
                      <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                      <div className="admin-toggle-track" />
                      <div className="admin-toggle-thumb" />
                    </div>
                    <span style={{ fontSize:'0.82rem', color:'var(--adm-text)', fontWeight:600 }}>{isActive ? 'Active' : 'Disabled'}</span>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:6 }}>LIVE PREVIEW</label>
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden'
                }}>
                  <div style={{
                    background: priority === 'high' ? ROSE : priority === 'medium' ? AMBER : PURPLE,
                    color: '#000', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase', flexShrink: 0
                  }}>
                    {priority}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--adm-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{title || 'Announcement Title'}</span>
                    <span style={{ color: 'var(--adm-text-3)' }}>{message || 'The message will appear here...'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="admin-action-btn admin-action-btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-action-btn admin-action-btn-primary" style={{ background: `linear-gradient(135deg, ${AMBER}, #d97706)`, boxShadow: `0 2px 12px rgba(251,191,36,0.3)` }}>
                  {editingId ? 'Save Changes' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
