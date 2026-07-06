// frontend/src/pages/LostFound.jsx
import { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import { useToast } from '../components/common/Toast';
import { reportLostItem } from '../api/analytics.api';
import { LOST_FOUND_CATEGORIES } from '../constants/categories';
import { STATIONS } from '../constants/stations';

export default function LostFound() {
  const [form, setForm] = useState({ itemDescription: '', lastSeenLocation: '', contactPhone: '', category: 'other' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemDescription) { toast.error('Please describe the item'); return; }
    setLoading(true);
    try {
      await reportLostItem(form);
      toast.success('Lost item reported. We\'ll notify you if found! 🔍');
      setForm({ itemDescription: '', lastSeenLocation: '', contactPhone: '', category: 'other' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Lost & Found 🔍</h1>
        <p className="page-subtitle">Report a lost item or check found items</p>
      </div>
      <GlassCard style={{ maxWidth: '600px', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Item Description</label>
            <textarea className="form-input" value={form.itemDescription}
              onChange={(e) => update('itemDescription', e.target.value)}
              placeholder="Describe the lost item..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={(e) => update('category', e.target.value)}>
              {LOST_FOUND_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Last Seen Location (Station)</label>
            <select className="form-input" value={form.lastSeenLocation} onChange={(e) => update('lastSeenLocation', e.target.value)}>
              <option value="">Select station</option>
              {STATIONS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input type="tel" className="form-input" value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Reporting...' : 'Report Lost Item'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
