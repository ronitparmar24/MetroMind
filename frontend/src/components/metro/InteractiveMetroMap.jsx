// frontend/src/components/metro/InteractiveMetroMap.jsx
// Full interactive SVG metro map with click-to-book, zoom/pan, route highlighting
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STATIONS, LINES } from '../../constants/stations';
import { findRoute, estimateTravelTime, getRouteSegments } from '../../utils/pathfinder';
import { calculateFare } from '../../utils/fareEngine';
import { useAccessibility } from '../../hooks/useAccessibility';
import { formatCurrency } from '../../utils/formatters';

/* ═══════════════════════════════════════════════════════════
   SVG LAYOUT — station positions on a 1400×900 canvas
   Blue: horizontal across middle
   Red: vertical crossing Blue at Old High Court
   Yellow: extends NE from Motera Stadium
   Pink: short spur NW from Koteshwar area
   Purple: short spur E from GNLU
   ═══════════════════════════════════════════════════════════ */

function computeStationPositions() {
  const positions = {};

  // BLUE LINE — horizontal, y=480, from x=60 to x=1340
  const blueStations = STATIONS.filter(s => s.line === 'blue').sort((a, b) => a.order - b.order);
  const blueY = 480;
  const blueXStart = 60;
  const blueXEnd = 1340;
  const blueStep = (blueXEnd - blueXStart) / (blueStations.length - 1);
  blueStations.forEach((s, i) => {
    positions[s.id] = { x: blueXStart + i * blueStep, y: blueY };
  });

  // RED LINE — vertical, x = Old High Court's x, from y=80 (Motera) to y=800 (APMC)
  const redStations = STATIONS.filter(s => s.line === 'red').sort((a, b) => a.order - b.order);
  // Old High Court is Blue station order 8 — find its x position
  const ohcX = positions['old-high-court']?.x || 620;
  const redYStart = 800; // APMC at bottom (order 1)
  const redYEnd = 80;    // Motera at top (order 14)
  const redStep = (redYEnd - redYStart) / (redStations.length - 1);
  redStations.forEach((s, i) => {
    positions[s.id] = { x: ohcX, y: redYStart + i * redStep };
  });

  // YELLOW LINE — extending from Motera Stadium (top of Red) going northeast then curving east
  const yellowStations = STATIONS.filter(s => s.line === 'yellow').sort((a, b) => a.order - b.order);
  const moteraPos = positions['motera-stadium'] || { x: ohcX, y: 80 };
  // Start from Motera position, go right and slightly down
  yellowStations.forEach((s, i) => {
    const t = i / (yellowStations.length - 1);
    // Arc from Motera: go right with a gentle downward curve
    const startX = moteraPos.x + 30;
    const endX = 1360;
    const x = startX + (endX - startX) * t;
    // Gentle sine curve for visual appeal
    const y = moteraPos.y + 20 + t * 200 + Math.sin(t * Math.PI) * 60;
    positions[s.id] = { x, y };
  });

  // PINK LINE — short spur branching NW from near Koteshwar/Motera area
  const pinkStations = STATIONS.filter(s => s.line === 'pink').sort((a, b) => a.order - b.order);
  const pinkStartX = moteraPos.x - 40;
  const pinkStartY = moteraPos.y + 40;
  pinkStations.forEach((s, i) => {
    const t = i / Math.max(pinkStations.length - 1, 1);
    positions[s.id] = {
      x: pinkStartX - t * 280,
      y: pinkStartY - t * 100,
    };
  });

  // PURPLE LINE — short spur from GNLU going east
  const purpleStations = STATIONS.filter(s => s.line === 'purple').sort((a, b) => a.order - b.order);
  const gnluPos = positions['gnlu'] || { x: 900, y: 200 };
  purpleStations.forEach((s, i) => {
    const t = i / Math.max(purpleStations.length - 1, 1);
    positions[s.id] = {
      x: gnluPos.x + 20 + t * 120,
      y: gnluPos.y + 40 + t * 70,
    };
  });

  return positions;
}

const POSITIONS = computeStationPositions();
const stationById = Object.fromEntries(STATIONS.map(s => [s.id, s]));

// ── Line path generator ──
function getLinePath(lineKey) {
  const stations = STATIONS.filter(s => s.line === lineKey).sort((a, b) => a.order - b.order);
  return stations.map(s => POSITIONS[s.id]).filter(Boolean);
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
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 14px',
      pointerEvents: 'none',
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      whiteSpace: 'nowrap',
    }}>
      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{station.name}</p>
      <p style={{ fontSize: '0.75rem', color: line?.color || 'var(--text-muted)', fontWeight: 500 }}>
        {line?.name || station.line} · Station {station.order}
      </p>
      {station.interchange && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          ⇄ Interchange: {station.interchange.map(l => LINES[l]?.name || l).join(', ')}
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
            {fromStation?.name || 'Select FROM station'}
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
            {toStation?.name || 'Select TO station'}
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
            🎫 Continue to Booking
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
}) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [fromId, setFromId] = useState(initialFrom || null);
  const [toId, setToId] = useState(initialTo || null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const { accessible } = useAccessibility();

  // Zoom/pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1400, h: 900 });
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
  }, [fromId, toId, onStationSelect]);

  const handleClear = useCallback(() => {
    setFromId(null);
    setToId(null);
    if (onStationSelect) onStationSelect('', '');
  }, [onStationSelect]);

  const handleContinue = useCallback((from, to) => {
    if (onStationSelect) onStationSelect(from, to);
  }, [onStationSelect]);

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
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = Math.max(400, Math.min(1400, prev.w * zoomFactor));
      const newH = Math.max(260, Math.min(900, prev.h * zoomFactor));
      // Zoom toward center
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return {
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

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

  // Determine label angle per station to avoid overlaps
  const getLabelAngle = (station) => {
    // Yellow line is dense — rotate labels
    if (station.line === 'yellow') return -35;
    if (station.line === 'blue') return -45;
    if (station.line === 'pink') return -30;
    return 0;
  };

  const getLabelAnchor = (station) => {
    if (station.line === 'red') return { dx: 14, dy: 5, rotate: 0 };
    const angle = getLabelAngle(station);
    return { dx: 0, dy: -14, rotate: angle };
  };

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
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={route ? 0.2 : 0.8}
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
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                className="route-highlight"
                opacity={0.9}
              />
            );
          })}

          {/* ── Station dots ── */}
          {STATIONS.map(station => {
            const pos = POSITIONS[station.id];
            if (!pos) return null;
            const lineColor = LINES[station.line]?.color || '#888';
            const isFrom = station.id === fromId;
            const isTo = station.id === toId;
            const isOnRoute = routeStationIds.has(station.id);
            const isInterchange = station.interchange && station.interchange.length > 0;
            const isHovered = hoveredStation?.id === station.id;

            const baseRadius = isInterchange ? 10 : 7;
            const radius = (isFrom || isTo || isHovered) ? baseRadius + 3 : baseRadius;

            return (
              <g key={station.id}>
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

                {/* Station label */}
                {(() => {
                  const labelInfo = getLabelAnchor(station);
                  const showLabel = !compact || isFrom || isTo || isHovered || isOnRoute;
                  if (!showLabel) return null;
                  return (
                    <text
                      x={pos.x + labelInfo.dx}
                      y={pos.y + labelInfo.dy}
                      textAnchor={station.line === 'red' ? 'start' : 'middle'}
                      fontSize={compact ? '8' : '9'}
                      fontWeight={isFrom || isTo ? 700 : 400}
                      fill={route && !isOnRoute && !isFrom && !isTo ? 'var(--text-muted, #999)' : 'var(--text-primary, #333)'}
                      style={{
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                      transform={labelInfo.rotate ? `rotate(${labelInfo.rotate}, ${pos.x + labelInfo.dx}, ${pos.y + labelInfo.dy})` : undefined}
                    >
                      {station.name}
                    </text>
                  );
                })()}
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
          Click any station to select your <strong>FROM</strong> station
        </div>
      )}
      {fromId && !toId && (
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
