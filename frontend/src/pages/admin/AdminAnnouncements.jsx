import React, { useState, useEffect } from 'react';
import api from '../../api/index';
import { Megaphone, Info, AlertTriangle, AlertOctagon, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('info');
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/api/admin/announcements');
      if (response.data.success) {
        setAnnouncements(response.data.data);
      }
    } catch (err) {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/admin/announcements/${editingId}`, { title, message, priority, isActive });
      } else {
        await api.post('/api/admin/announcements', { title, message, priority, isActive });
      }
      // Reset form
      setEditingId(null);
      setTitle('');
      setMessage('');
      setPriority('info');
      setIsActive(true);
      fetchAnnouncements();
    } catch (err) {
      alert('Error saving announcement');
    }
  };

  const handleEdit = (ann) => {
    setEditingId(ann._id);
    setTitle(ann.title);
    setMessage(ann.message);
    setPriority(ann.priority);
    setIsActive(ann.isActive);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert('Error deleting announcement');
    }
  };

  const toggleStatus = async (ann) => {
    try {
      await api.put(`/api/admin/announcements/${ann._id}`, { ...ann, isActive: !ann.isActive });
      fetchAnnouncements();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const getPriorityIcon = (prio) => {
    if (prio === 'critical') return <AlertOctagon size={14} color="#ef4444" />;
    if (prio === 'warning') return <AlertTriangle size={14} color="#f59e0b" />;
    return <Info size={14} color="#3b82f6" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: 'rgba(99,102,241,0.1)', padding: 12, borderRadius: 12 }}>
          <Megaphone size={24} color="#6366f1" />
        </div>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Live Announcements</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>Manage ticker messages displayed on the User Dashboard</div>
        </div>
      </div>

      {/* Editor Form */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          {editingId ? <Edit2 size={18} color="#6366f1" /> : <Megaphone size={18} color="#6366f1" />}
          {editingId ? 'Edit Announcement' : 'Publish New Announcement'}
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Internal Title</label>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="e.g., Weekend Maintenance"
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Public Ticker Message</label>
              <input 
                type="text"
                className="admin-input" 
                placeholder="This text will scroll horizontally across the dashboard..."
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                required
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Priority Level</label>
              <select 
                className="admin-input" 
                value={priority} 
                onChange={e => setPriority(e.target.value)}
                style={{ width: '100%', maxWidth: 200 }}
              >
                <option value="info">Info (Blue)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="critical">Critical (Red)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Visibility</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', padding: '8px 12px', borderRadius: 6, width: 'max-content' }}>
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={e => setIsActive(e.target.checked)} 
                  style={{ accentColor: '#10b981', transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isActive ? '#059669' : '#64748b' }}>
                  {isActive ? 'Live on Dashboard' : 'Hidden from public'}
                </span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: '100%' }}>
              {editingId && (
                <button 
                  type="button" 
                  className="admin-action-btn" 
                  style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1' }}
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setMessage('');
                    setIsActive(true);
                  }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="admin-action-btn admin-action-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {editingId ? <CheckCircle2 size={16} /> : <Megaphone size={16} />}
                {editingId ? 'Save Changes' : 'Broadcast Now'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Active & Past Announcements</div>
        {error && <div style={{ color: '#ef4444', marginBottom: 16 }}>{error}</div>}
        
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title / Message</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Loading...</td></tr>
              ) : announcements.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No announcements broadcasted yet.</td></tr>
              ) : (
                announcements.map(ann => (
                  <tr key={ann._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ann.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "{ann.message}"
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: ann.priority === 'critical' ? 'rgba(239,68,68,0.1)' : ann.priority === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: ann.priority === 'critical' ? '#ef4444' : ann.priority === 'warning' ? '#d97706' : '#2563eb', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {getPriorityIcon(ann.priority)}
                        {ann.priority}
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(ann)}
                        style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
                          background: ann.isActive ? 'rgba(16,185,129,0.1)' : '#f1f5f9', 
                          color: ann.isActive ? '#10b981' : '#94a3b8', 
                          borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {ann.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {ann.isActive ? 'Live' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button 
                          onClick={() => handleEdit(ann)} 
                          className="admin-action-btn" 
                          style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(ann._id)} 
                          className="admin-action-btn" 
                          style={{ padding: '6px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
