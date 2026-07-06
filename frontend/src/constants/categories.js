// frontend/src/constants/categories.js
export const TICKET_STATUS = {
  upcoming: { label: 'Upcoming', color: 'var(--info)', bg: 'var(--info-bg)' },
  completed: { label: 'Completed', color: 'var(--success)', bg: 'var(--success-bg)' },
  cancelled: { label: 'Cancelled', color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

export const CROWD_LEVELS = {
  Low: { label: 'Low', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', icon: '🟢' },
  Medium: { label: 'Medium', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '🟡' },
  High: { label: 'High', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: '🔴' },
};

export const PASS_PLANS = {
  '7day': { label: '7 Day Pass', price: 200, duration: '7 days' },
  'monthly': { label: 'Monthly Pass', price: 700, duration: '30 days' },
  'quarterly': { label: 'Quarterly Pass', price: 1800, duration: '90 days' },
};

export const FEEDBACK_CATEGORIES = [
  { value: 'service', label: 'Service Quality' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'safety', label: 'Safety' },
  { value: 'app', label: 'App Experience' },
  { value: 'other', label: 'Other' },
];

export const LOST_FOUND_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'bags', label: 'Bags & Luggage' },
  { value: 'documents', label: 'Documents' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];
