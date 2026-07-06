// frontend/src/components/booking/GroupPassengerForm.jsx
// Manages 1-6 passengers with name and age for each
export default function GroupPassengerForm({ passengers, onChange }) {
  const addPassenger = () => {
    if (passengers.length >= 6) return;
    onChange([...passengers, { name: '', age: '' }]);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    onChange(passengers.filter((_, i) => i !== index));
  };

  const updatePassenger = (index, field, value) => {
    const updated = passengers.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange(updated);
  };

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label className="form-label" style={{ margin: 0 }}>
          Passengers ({passengers.length}/6)
        </label>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={addPassenger}
          disabled={passengers.length >= 6}
        >
          + Add
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {passengers.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            padding: '10px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--accent-glow)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)',
              flexShrink: 0,
            }}>
              {i + 1}
            </span>
            <input
              type="text"
              placeholder="Name"
              value={p.name}
              onChange={(e) => updatePassenger(i, 'name', e.target.value)}
              className="form-input"
              style={{ flex: 2, padding: '8px 12px' }}
            />
            <input
              type="number"
              placeholder="Age"
              value={p.age}
              onChange={(e) => updatePassenger(i, 'age', e.target.value)}
              className="form-input"
              style={{ flex: 0.5, padding: '8px 12px', minWidth: '70px' }}
              min="1"
              max="120"
            />
            {passengers.length > 1 && (
              <button
                type="button"
                onClick={() => removePassenger(i)}
                style={{
                  background: 'none', border: 'none', color: 'var(--danger)',
                  cursor: 'pointer', fontSize: '1.2rem', padding: '4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
