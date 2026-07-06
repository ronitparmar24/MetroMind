// frontend/src/pages/Feedback.jsx
import { useState } from 'react';
import GlassCard from '../components/common/GlassCard';
import { useToast } from '../components/common/Toast';
import { submitFeedback } from '../api/analytics.api';
import { FEEDBACK_CATEGORIES } from '../constants/categories';

const MOODS = [
  { value: 1, emoji: '😢', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

export default function Feedback() {
  const [text, setText] = useState('');
  const [mood, setMood] = useState(0);
  const [category, setCategory] = useState('other');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mood) { toast.error('Please select a mood rating'); return; }
    if (!text.trim()) { toast.error('Please enter your feedback'); return; }
    setLoading(true);
    try {
      await submitFeedback({ text, moodRating: mood, category });
      toast.success('Thank you for your feedback! 💬');
      setText(''); setMood(0); setCategory('other');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Feedback 💬</h1>
        <p className="page-subtitle">Help us improve your metro experience</p>
      </div>

      <GlassCard style={{ maxWidth: '600px', padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">How was your experience?</label>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '16px 0' }}>
              {MOODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setMood(m.value)} style={{
                  width: '60px', height: '60px', borderRadius: 'var(--radius-lg)', border: 'none',
                  background: mood === m.value ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                  border: mood === m.value ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                  fontSize: '1.8rem', cursor: 'pointer', transition: 'all var(--transition-fast)',
                  transform: mood === m.value ? 'scale(1.15)' : 'scale(1)',
                }}>
                  {m.emoji}
                </button>
              ))}
            </div>
            {mood > 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{MOODS[mood - 1].label}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {FEEDBACK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Your Feedback</label>
            <textarea className="form-input" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Tell us what you think..." rows={4} style={{ resize: 'vertical' }} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
