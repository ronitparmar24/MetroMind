// frontend/src/pages/MetroMap.jsx
// Full-page interactive metro map with search + Know Your Station
import { useState, useMemo } from 'react';
import InteractiveMetroMap from '../components/metro/InteractiveMetroMap';
import StationInfoModal from '../components/metro/StationInfoModal';
import { STATIONS } from '../constants/stations';

export default function MetroMap() {
  const [infoStation, setInfoStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return STATIONS.filter(s => s.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery]);

  const handleSearchSelect = (station) => {
    setSearchQuery(station.name);
    setSearchResult(station);
    setInfoStation(station);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Metro Map 🗾</h1>
        <p className="page-subtitle">
          Ahmedabad Metro Rail (GMRC) — interactive network map · click stations to plan your journey
        </p>
      </div>

      {/* Search bar for "Know Your Station" */}
      <div style={{
        maxWidth: '420px',
        marginBottom: 'var(--space-lg)',
        position: 'relative',
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search station... (Know Your Station)"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); }}
            style={{ paddingLeft: '16px' }}
          />
        </div>

        {/* Search suggestions dropdown */}
        {suggestions.length > 0 && !searchResult && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0, right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 50,
            marginTop: '4px',
            overflow: 'hidden',
          }}>
            {suggestions.map(s => (
              <button
                key={s.id}
                onClick={() => handleSearchSelect(s)}
                style={{
                  display: 'block', width: '100%',
                  padding: '10px 16px',
                  background: 'none', border: 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <strong>{s.name}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.78rem' }}>
                  {s.line.charAt(0).toUpperCase() + s.line.slice(1)} Line
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <InteractiveMetroMap
        onStationInfo={(station) => setInfoStation(station)}
      />

      {/* Know Your Station Modal */}
      {infoStation && (
        <StationInfoModal
          station={infoStation}
          onClose={() => setInfoStation(null)}
        />
      )}

      {/* Tip */}
      <p style={{
        fontSize: '0.78rem', color: 'var(--text-muted)',
        marginTop: 'var(--space-lg)', textAlign: 'center',
      }}>
        💡 Scroll to zoom · Drag to pan · Click stations to select a route · Right-click a station for details
      </p>
    </div>
  );
}
