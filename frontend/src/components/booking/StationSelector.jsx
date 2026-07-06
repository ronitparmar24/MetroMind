// frontend/src/components/booking/StationSelector.jsx
// Dumb component — renders a dropdown of stations grouped by line
import { STATIONS } from '../../constants/stations';

export default function StationSelector({ label, value, onChange, excludeStation }) {
  const blueStations = STATIONS.filter(s => s.line === 'blue' && s.name !== excludeStation);
  const redStations = STATIONS.filter(s => s.line === 'red' && s.name !== excludeStation);

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
        <optgroup label="🔵 Blue Line">
          {blueStations.map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </optgroup>
        <optgroup label="🔴 Red Line">
          {redStations.map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
