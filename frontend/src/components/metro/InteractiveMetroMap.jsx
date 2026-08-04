// frontend/src/components/metro/InteractiveMetroMap.jsx
// Full interactive SVG schematic metro map matching real Ahmedabad topology
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATIONS, LINES } from '../../constants/stations';
import { findRoute, estimateTravelTime, getRouteSegments } from '../../utils/pathfinder';
import { calculateFare } from '../../utils/fareEngine';
import { useAccessibility } from '../../hooks/useAccessibility';
import { formatCurrency } from '../../utils/formatters';

/* ═══════════════════════════════════════════════════════════
   SVG LAYOUT — Precise Schematic Coordinates (1600x1400 canvas)
   ═══════════════════════════════════════════════════════════ */

const SCHEMATIC = {
  // RED LINE (South to North)
  'apmc': { x: 640, y: 1290, anchor: 'end', dx: -15, dy: 4 },
  'jivraj-park': { x: 680, y: 1250, anchor: 'end', dx: -15, dy: 4 },
  'rajivnagar': { x: 720, y: 1210, anchor: 'end', dx: -15, dy: 4 },
  'shreyas': { x: 760, y: 1170, anchor: 'end', dx: -15, dy: 4 },
  'paldi': { x: 800, y: 1130, anchor: 'end', dx: -15, dy: 4 },
  'gandhigram': { x: 800, y: 1090, anchor: 'end', dx: -15, dy: 4 },
  'old-high-court': { x: 800, y: 1050, anchor: 'end', dx: -15, dy: -15 }, // Interchange
  'old-high-court-red': { x: 800, y: 1050, anchor: 'end', dx: -15, dy: -15 }, // Interchange
  'usmanpura': { x: 800, y: 1010, anchor: 'end', dx: -15, dy: 4 },
  'vijaynagar': { x: 800, y: 970, anchor: 'end', dx: -15, dy: 4 },
  'vadaj': { x: 800, y: 930, anchor: 'end', dx: -15, dy: 4 },
  'ranip': { x: 840, y: 890, anchor: 'end', dx: -15, dy: 4 },
  'sabarmati-railway': { x: 880, y: 850, anchor: 'end', dx: -15, dy: 4 },
  'aec': { x: 920, y: 810, anchor: 'end', dx: -15, dy: 4 },
  'sabarmati': { x: 960, y: 770, anchor: 'end', dx: -15, dy: 4 },
  'motera-stadium': { x: 1000, y: 730, anchor: 'end', dx: -15, dy: 4 },

  // BLUE LINE (West to East)
  'thaltej-gam': { x: 460, y: 1010, anchor: 'middle', dx: 0, dy: 20 },
  'thaltej': { x: 510, y: 1010, anchor: 'middle', dx: 0, dy: 20 },
  'doordarshan-kendra': { x: 560, y: 1010, anchor: 'middle', dx: 0, dy: -15 },
  'gurukul-road': { x: 610, y: 1010, anchor: 'middle', dx: 0, dy: 20 },
  'gujarat-university': { x: 660, y: 1010, anchor: 'middle', dx: 0, dy: -15 },
  'commerce-six-road': { x: 710, y: 1010, anchor: 'middle', dx: 0, dy: 20 },
  'sp-stadium': { x: 760, y: 1010, anchor: 'middle', dx: -10, dy: 20 },
  // old-high-court defined above
  'shahpur': { x: 840, y: 1010, anchor: 'start', dx: 10, dy: -10 },
  'gheekanta': { x: 880, y: 1050, anchor: 'start', dx: 15, dy: -5 },
  'kalupur': { x: 920, y: 1090, anchor: 'start', dx: 15, dy: -5 },
  'kankaria-east': { x: 960, y: 1130, anchor: 'middle', dx: 0, dy: 20 },
  'apparel-park': { x: 1010, y: 1130, anchor: 'middle', dx: 0, dy: -15 },
  'amraivadi': { x: 1060, y: 1130, anchor: 'middle', dx: 0, dy: 20 },
  'rabari-colony': { x: 1110, y: 1130, anchor: 'middle', dx: 0, dy: -15 },
  'vastral': { x: 1160, y: 1130, anchor: 'middle', dx: 0, dy: 20 },
  'nirant-cross-road': { x: 1210, y: 1130, anchor: 'middle', dx: 0, dy: -15 },
  'vastral-gam': { x: 1250, y: 1170, anchor: 'start', dx: 15, dy: 4 },

  // YELLOW LINE (North from Motera)
  'koteshwar-road': { x: 1040, y: 690, anchor: 'end', dx: -15, dy: 0 },
  'vishwakarma-college': { x: 1080, y: 650, anchor: 'start', dx: 15, dy: 4 },
  'tapovan-circle': { x: 1120, y: 610, anchor: 'end', dx: -15, dy: 4 },
  'narmada-canal': { x: 1160, y: 570, anchor: 'start', dx: 15, dy: 4 },
  'koba-circle': { x: 1200, y: 530, anchor: 'end', dx: -15, dy: 4 },
  'juna-koba': { x: 1240, y: 490, anchor: 'start', dx: 15, dy: 4 },
  'koba-gam': { x: 1280, y: 450, anchor: 'start', dx: 15, dy: 4 },
  'gnlu': { x: 1280, y: 410, anchor: 'end', dx: -15, dy: 4 },
  'raysan': { x: 1280, y: 370, anchor: 'start', dx: 15, dy: 4 },
  'randesan': { x: 1240, y: 330, anchor: 'start', dx: 15, dy: 4 },
  'dholakuva-circle': { x: 1200, y: 290, anchor: 'start', dx: 15, dy: 4 },
  'infocity': { x: 1200, y: 250, anchor: 'end', dx: -15, dy: 4 },
  'sector-1': { x: 1240, y: 210, anchor: 'start', dx: 15, dy: 4 },
  'sector-10a': { x: 1280, y: 170, anchor: 'start', dx: 15, dy: 4 },
  'sachivalaya': { x: 1280, y: 130, anchor: 'start', dx: 15, dy: 4 },
  'akshardham': { x: 1240, y: 90, anchor: 'start', dx: 10, dy: -10 },
  'juna-sachivalaya': { x: 1190, y: 90, anchor: 'middle', dx: 0, dy: -15 },
  'sector-16': { x: 1140, y: 90, anchor: 'middle', dx: 0, dy: 20 },
  'sector-24': { x: 1090, y: 90, anchor: 'middle', dx: 0, dy: -15 },
  'mahatma-mandir': { x: 1040, y: 90, anchor: 'middle', dx: 0, dy: 20 },

  // PINK LINE
  'koteshwar-prachin-mandir': { x: 1160, y: 690, anchor: 'middle', dx: 0, dy: -15 },
  'ashram-road': { x: 1100, y: 690, anchor: 'middle', dx: 0, dy: 20 },
  'sabarmati-river': { x: 1200, y: 730, anchor: 'start', dx: 15, dy: 4 },
  'sardarnagar': { x: 1200, y: 780, anchor: 'start', dx: 15, dy: 4 },
  'airport': { x: 1200, y: 830, anchor: 'start', dx: 15, dy: 4 },

  // PURPLE LINE
  'pdeu': { x: 1400, y: 410, anchor: 'middle', dx: 0, dy: 20 },
  'gift-city': { x: 1520, y: 410, anchor: 'middle', dx: 0, dy: 20 },
};

function computeStationPositions() {
  const positions = {};
  STATIONS.forEach(s => {
    const loc = SCHEMATIC[s.id];
    if (loc) {
      positions[s.id] = loc;
    } else {
      // Fallback in case a station is missing from schematic
      positions[s.id] = { x: 800, y: 800, anchor: 'middle', dx: 0, dy: 0 };
    }
  });
  return positions;
}

const POSITIONS = computeStationPositions();
const stationById = Object.fromEntries(STATIONS.map(s => [s.id, s]));

// ── Line path generator ──
function getLinePath(lineKey) {
  const stations = STATIONS.filter(s => s.line === lineKey).sort((a, b) => a.order - b.order);
  const points = stations.map(s => POSITIONS[s.id]).filter(Boolean);

  // Visually connect spurs to their main lines
  if (lineKey === 'yellow') {
    points.unshift(POSITIONS['motera-stadium']);
  } else if (lineKey === 'pink') {
    points.unshift(POSITIONS['koteshwar-road']);
  } else if (lineKey === 'purple') {
    points.unshift(POSITIONS['gnlu']);
  }

  return points;
}

function pointsToSvgPath(points) {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

/* ═══════════════════════════════════════════════════════════
   TOOLTIP COMPONENT
   ═══════════════════════════════════════════════════════════ */
function Tooltip({ station, position }) {
  if (!station || !position) return null;
  const line = LINES[station.line];
  return (
    <div style={{
      position: 'absolute',
      left: position.clientX + 14,
      top: position.clientY - 40,
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '12px 16px',
      pointerEvents: 'none',
      zIndex: 100,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
      whiteSpace: 'nowrap',
    }}>
      <p style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{station.name}</p>
      <p style={{ fontSize: '0.75rem', margin: 0, color: line?.color || 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {line?.name || `${station.line} Line`}
      </p>
      {station.interchange && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0', fontWeight: 600 }}>
          <span style={{ marginRight: '4px' }}>⇄</span> Interchange
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUMMARY CARD (floating or bottom-sheet)
   ═══════════════════════════════════════════════════════════ */
function RouteSummaryCard({ fromStation, toStation, route, onContinue, onClear, compact }) {
  const navigate = useNavigate();

  const fareData = useMemo(() => {
    if (!fromStation || !toStation) return null;
    const hour = new Date().getHours();
    const day = new Date().getDay();
    return calculateFare(fromStation, toStation, hour, day, 1);
  }, [fromStation, toStation]);

  const travelTime = useMemo(() => estimateTravelTime(route), [route]);

  if (!fromStation && !toStation) return null;

  const handleContinue = () => {
    if (onContinue) {
      onContinue(fromStation.name, toStation.name);
    } else {
      navigate('/book', { state: { source: fromStation.name, destination: toStation.name } });
    }
  };

  return (
    <div className="metro-map-summary" style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: compact ? '16px' : '20px 24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      minWidth: compact ? undefined : '300px',
      animation: 'fadeInUp 0.3s ease',
    }}>
      {/* Route display */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#22c55e', flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {fromStation?.name || 'Select FROM station 🔄'}
          </span>
        </div>

        {route?.interchanges?.length > 0 && route.interchanges.map((ic, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            paddingLeft: '4px', marginBottom: '6px',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⇄</span>
            <span style={{
              fontSize: '0.75rem', color: 'var(--text-muted)',
              padding: '2px 8px', background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-full)',
            }}>
              Change at {ic.station.name} ({LINES[ic.fromLine]?.name} → {LINES[ic.toLine]?.name})
            </span>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#ef4444', flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {toStation?.name || 'Select TO station 🔄'}
          </span>
        </div>
      </div>

      {/* Stats */}
      {fareData && toStation && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
          marginBottom: '16px',
        }}>
          <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fare</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {formatCurrency(fareData.fare)}
            </p>
          </div>
          <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Travel Time</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              ~{travelTime} min
            </p>
          </div>
          <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Distance</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {fareData.distance} km
            </p>
          </div>
          <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Stations</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {route?.totalStations || '—'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {toStation && (
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
            onClick={handleContinue}
          >
            🎫 Continue
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={onClear}
          title="Clear selection"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEGEND
   ═══════════════════════════════════════════════════════════ */
function Legend() {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '12px',
      padding: '10px 16px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.75rem', fontWeight: 600,
    }}>
      {Object.entries(LINES).map(([key, line]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '16px', height: '4px', borderRadius: '2px',
            background: line.color,
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>{line.name}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '12px', height: '12px', borderRadius: '50%',
          border: '2px solid var(--text-muted)', background: 'var(--bg-primary)',
        }} />
        <span style={{ color: 'var(--text-secondary)' }}>Interchange</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN INTERACTIVE METRO MAP COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function InteractiveMetroMap({
  compact = false,
  onStationSelect,
  initialFrom,
  initialTo,
  onStationInfo,
  onContinueAction,
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [fromId, setFromId] = useState(initialFrom || null);
  const [toId, setToId] = useState(initialTo || null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const { accessible } = useAccessibility();

  // Zoom/pan state
  const [viewBox, setViewBox] = useState({ x: 300, y: 0, w: 1300, h: 1400 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);

  // Sync with external props
  useEffect(() => {
    if (initialFrom !== undefined) setFromId(initialFrom);
  }, [initialFrom]);
  useEffect(() => {
    if (initialTo !== undefined) setToId(initialTo);
  }, [initialTo]);

  // Compute route when both stations selected
  const route = useMemo(() => {
    if (!fromId || !toId) return null;
    return findRoute(fromId, toId);
  }, [fromId, toId]);

  const routeSegments = useMemo(() => getRouteSegments(route), [route]);

  const fromStation = fromId ? stationById[fromId] : null;
  const toStation = toId ? stationById[toId] : null;

  // Click handler — select stations
  const handleStationClick = useCallback((stationId) => {
    // If we're on the map page (no select handler), just show station info
    if (onStationInfo && !onStationSelect) {
      onStationInfo(stationById[stationId]);
      return;
    }

    if (!fromId) {
      // First click → FROM
      setFromId(stationId);
      setToId(null);
      if (onStationSelect) onStationSelect(stationById[stationId]?.name || '', '');
    } else if (!toId && stationId !== fromId) {
      // Second click → TO
      setToId(stationId);
      if (onStationSelect) onStationSelect(stationById[fromId]?.name || '', stationById[stationId]?.name || '');
    } else {
      // Third click → reset, new FROM
      setFromId(stationId);
      setToId(null);
      if (onStationSelect) onStationSelect(stationById[stationId]?.name || '', '');
    }
  }, [fromId, toId, onStationSelect, onStationInfo]);

  const handleClear = useCallback(() => {
    setFromId(null);
    setToId(null);
    if (onStationSelect) onStationSelect('', '');
  }, [onStationSelect]);

  const handleContinue = useCallback((from, to) => {
    if (onStationSelect) onStationSelect(from, to);
    if (onContinueAction) onContinueAction();
  }, [onStationSelect, onContinueAction]);

  // Hover handlers
  const handleMouseEnter = useCallback((station, e) => {
    setHoveredStation(station);
    setTooltipPos({ clientX: e.clientX, clientY: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (hoveredStation) {
      setTooltipPos({ clientX: e.clientX, clientY: e.clientY });
    }
  }, [hoveredStation]);

  const handleMouseLeave = useCallback(() => {
    setHoveredStation(null);
    setTooltipPos(null);
  }, []);

  // Zoom via scroll
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;

    // Mouse position in SVG coordinates
    const mouseX = (e.clientX - rect.left) * scaleX + viewBox.x;
    const mouseY = (e.clientY - rect.top) * scaleY + viewBox.y;

    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85; // Slightly faster zoom
    
    setViewBox(prev => {
      // Constrain zoom levels (min 400px wide, max 1800px wide)
      const newW = Math.max(400, Math.min(1800, prev.w * zoomFactor));
      const newH = Math.max(400, Math.min(1800, prev.h * zoomFactor));

      // Calculate new x, y to keep mouseX, mouseY at the same screen position
      const ratioW = newW / prev.w;
      const ratioH = newH / prev.h;

      return {
        x: mouseX - (mouseX - prev.x) * ratioW,
        y: mouseY - (mouseY - prev.y) * ratioH,
        w: newW,
        h: newH,
      };
    });
  }, [viewBox]);

  // Pan handlers
  const handlePanStart = useCallback((e) => {
    if (e.target.tagName === 'circle' || e.target.tagName === 'text') return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y });
  }, [viewBox]);

  const handlePanMove = useCallback((e) => {
    if (!isPanning || !panStart) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (e.clientX - panStart.x) * scaleX;
    const dy = (e.clientY - panStart.y) * scaleY;
    setViewBox(prev => ({ ...prev, x: panStart.vx - dx, y: panStart.vy - dy }));
  }, [isPanning, panStart, viewBox.w, viewBox.h]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  // Touch equivalents for mobile
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsPanning(true);
    setPanStart({ x: touch.clientX, y: touch.clientY, vx: viewBox.x, vy: viewBox.y });
  }, [viewBox]);

  const handleTouchMove = useCallback((e) => {
    if (!isPanning || !panStart) return;
    const touch = e.touches[0];
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (touch.clientX - panStart.x) * scaleX;
    const dy = (touch.clientY - panStart.y) * scaleY;
    setViewBox(prev => ({ ...prev, x: panStart.vx - dx, y: panStart.vy - dy }));
  }, [isPanning, panStart, viewBox.w, viewBox.h]);

  // Check if a station is on the active route
  const routeStationIds = useMemo(() => {
    if (!route) return new Set();
    return new Set(route.path.map(s => s.id));
  }, [route]);

  // ── Render ──
  const lineKeys = Object.keys(LINES);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
      onMouseMove={handleMouseMove}
    >
      {/* SVG Map */}
      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        cursor: isPanning ? 'grabbing' : 'grab',
      }}>
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          width="100%"
          height={compact ? '400' : '600'}
          style={{ display: 'block' }}
          onWheel={handleWheel}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePanEnd}
        >
          {/* ── Defs for glow/pulse animation ── */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <style>{`
              @keyframes dashPulse {
                0% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -40; }
              }
              .route-highlight {
                animation: dashPulse 1s linear infinite;
                stroke-dasharray: 20 10;
              }
            `}</style>
          </defs>

          {/* ── Background Map Elements (Sabarmati River) ── */}
          <path
            d="M 1250 0 Q 1200 400 1150 700 T 1100 1400"
            fill="none"
            stroke="rgba(59, 130, 246, 0.15)"
            strokeWidth="80"
            strokeLinecap="round"
          />
          <path
            d="M 1250 0 Q 1200 400 1150 700 T 1100 1400"
            fill="none"
            stroke="rgba(59, 130, 246, 0.25)"
            strokeWidth="30"
            strokeLinecap="round"
          />

          {/* ── Line paths (background) ── */}
          {lineKeys.map(lineKey => {
            const points = getLinePath(lineKey);
            const pathD = pointsToSvgPath(points);
            return (
              <path
                key={`line-${lineKey}`}
                d={pathD}
                fill="none"
                stroke={LINES[lineKey].color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={route ? 0.2 : 1}
              />
            );
          })}

          {/* ── Route highlight (animated segments) ── */}
          {routeSegments.map((seg, i) => {
            const points = seg.stationIds
              .map(id => POSITIONS[id])
              .filter(Boolean);
            const pathD = pointsToSvgPath(points);
            return (
              <path
                key={`route-seg-${i}`}
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="route-highlight"
                opacity={0.9}
              />
            );
          })}

          {/* ── Station dots and labels ── */}
          {STATIONS.map(station => {
            const pos = POSITIONS[station.id];
            if (!pos) return null;
            const lineColor = LINES[station.line]?.color || '#888';
            const isFrom = station.id === fromId;
            const isTo = station.id === toId;
            const isOnRoute = routeStationIds.has(station.id);
            const isInterchange = station.interchange && station.interchange.length > 0;
            const isHovered = hoveredStation?.id === station.id;

            const baseRadius = isInterchange ? 9 : 6;
            const radius = (isFrom || isTo || isHovered) ? baseRadius + 3 : baseRadius;
            const labelOpacity = route && !isOnRoute && !isFrom && !isTo ? 0.2 : 1;

            return (
              <g key={station.id}>
                {/* Station Label */}
                <text
                  x={pos.x + (pos.dx || 0)}
                  y={pos.y + (pos.dy || 0)}
                  textAnchor={pos.anchor || 'start'}
                  alignmentBaseline="middle"
                  fontSize="12"
                  fontWeight={isFrom || isTo ? 800 : isInterchange ? 700 : 500}
                  fill="var(--text-primary)"
                  opacity={labelOpacity}
                  style={{ pointerEvents: 'none', textShadow: '0 1px 3px var(--bg-primary), 0 -1px 3px var(--bg-primary), 1px 0 3px var(--bg-primary), -1px 0 3px var(--bg-primary)' }}
                >
                  {station.name}
                </text>

                {/* Interchange outer ring */}
                {isInterchange && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    fill="var(--bg-primary, #fff)"
                    stroke={lineColor}
                    strokeWidth="3"
                  />
                )}

                {/* Station circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={isFrom ? '#22c55e' : isTo ? '#ef4444' : (isOnRoute ? lineColor : lineColor)}
                  stroke={isFrom ? '#166534' : isTo ? '#991b1b' : 'var(--bg-primary, #fff)'}
                  strokeWidth={isFrom || isTo ? 3 : 2}
                  style={{
                    cursor: 'pointer',
                    transition: 'r 0.15s ease, fill 0.15s ease',
                    opacity: route && !isOnRoute && !isFrom && !isTo ? 0.3 : 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleStationClick(station.id); }}
                  onMouseEnter={(e) => handleMouseEnter(station, e)}
                  onMouseLeave={handleMouseLeave}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (onStationInfo) onStationInfo(station);
                  }}
                />

                {/* FROM/TO pin icons */}
                {isFrom && (
                  <text x={pos.x} y={pos.y - radius - 8} textAnchor="middle" fontSize="16" style={{ pointerEvents: 'none' }}>
                    📍
                  </text>
                )}
                {isTo && (
                  <text x={pos.x} y={pos.y - radius - 8} textAnchor="middle" fontSize="16" style={{ pointerEvents: 'none' }}>
                    🏁
                  </text>
                )}

                {/* Accessibility badge */}
                {accessible && (
                  <text
                    x={pos.x + radius + 2}
                    y={pos.y - radius + 2}
                    fontSize="8"
                    style={{ pointerEvents: 'none' }}
                  >
                    ♿
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      <Tooltip station={hoveredStation} position={tooltipPos} />

      {/* Legend + Summary layout */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: compact ? 'stretch' : 'flex-start',
        gap: '16px',
        marginTop: '12px',
        flexWrap: 'wrap',
      }}>
        <Legend />

        {(fromId || toId) && !compact && (
          <RouteSummaryCard
            fromStation={fromStation}
            toStation={toStation}
            route={route}
            onContinue={onStationSelect ? handleContinue : undefined}
            onClear={handleClear}
            compact={compact}
          />
        )}
      </div>

      {/* Compact mode: summary below */}
      {compact && (fromId || toId) && (
        <div style={{ marginTop: '12px' }}>
          <RouteSummaryCard
            fromStation={fromStation}
            toStation={toStation}
            route={route}
            onContinue={onStationSelect ? handleContinue : undefined}
            onClear={handleClear}
            compact
          />
        </div>
      )}

      {/* Instructions overlay */}
      {!fromId && !toId && (
        <div style={{
          position: 'absolute',
          top: compact ? '12px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}>
          {onStationSelect 
            ? <>Click any station to select your <strong>FROM</strong> station</> 
            : 'Click any station for details'}
        </div>
      )}
      {fromId && !toId && onStationSelect && (
        <div style={{
          position: 'absolute',
          top: compact ? '12px' : '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(34, 197, 94, 0.85)',
          color: '#fff',
          padding: '8px 20px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}>
          Now click your <strong>TO</strong> station
        </div>
      )}
    </div>
  );
}
