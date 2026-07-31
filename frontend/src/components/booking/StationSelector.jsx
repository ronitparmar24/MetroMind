// frontend/src/components/booking/StationSelector.jsx
// Dropdown of stations grouped by line — supports all 5 GMRC lines
import { STATIONS, LINES } from '../../constants/stations';

const LINE_EMOJI = {
  blue: '🔵',
  red: '🔴',
  yellow: '🟡',
  pink: '🩷',
  purple: '🟣',
};

export default function StationSelector({ label, value, onChange, excludeStation }) {
  const lineKeys = Object.keys(LINES);

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ cursor: 'pointer' }}
      >
        <option value="">Select station</option>
        {lineKeys.map(lineKey => {
          const lineStations = STATIONS.filter(
            s => s.line === lineKey && s.name !== excludeStation
          );
          if (lineStations.length === 0) return null;
          return (
            <optgroup key={lineKey} label={`${LINE_EMOJI[lineKey] || '⚪'} ${LINES[lineKey].name}`}>
              {lineStations.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
