// frontend/src/components/booking/TimeSlotPicker.jsx
// Shows time slots with crowd level per slot
import CrowdBadge from './CrowdBadge';

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

export default function TimeSlotPicker({ value, onChange, crowdData }) {
  return (
    <div className="form-group">
      <label className="form-label">Travel Time</label>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '8px',
      }}>
        {TIME_SLOTS.map((slot) => {
          const hour = parseInt(slot.split(':')[0]);
          const crowd = crowdData?.[hour];
          const isSelected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: isSelected ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <span>{slot}</span>
              {crowd && <CrowdBadge level={crowd} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
