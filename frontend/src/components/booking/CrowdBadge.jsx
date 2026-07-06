// frontend/src/components/booking/CrowdBadge.jsx
// Dumb component — displays crowd level pill from ML prediction
import { CROWD_LEVELS } from '../../constants/categories';

export default function CrowdBadge({ level = 'Medium', confidence }) {
  const config = CROWD_LEVELS[level] || CROWD_LEVELS.Medium;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: 'var(--radius-full)',
      background: config.bg,
      color: config.color,
      fontSize: '0.8rem',
      fontWeight: 600,
    }}>
      {config.icon} {config.label}
      {confidence && <span style={{ opacity: 0.7 }}>({confidence}%)</span>}
    </span>
  );
}
