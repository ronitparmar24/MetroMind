import { useState, useMemo, useEffect, useRef } from 'react';
import { STATIONS, LINES } from '../../constants/stations';

const LINE_COLORS = {
  blue: '#2563EB', red: '#DC2626', yellow: '#CA8A04',
  pink: '#DB2777', purple: '#7C3AED',
};
const LINE_EMOJIS = { blue: '🔵', red: '🔴', yellow: '🟡', pink: '🩷', purple: '🟣' };

export default function StationSelector({ label, value, onChange, excludeStation, color = '#6366f1', icon = '📍' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return STATIONS.filter(s =>
      s.name !== excludeStation &&
      (q === '' || s.name.toLowerCase().includes(q) || LINES[s.line].name.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [query, excludeStation]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.line]) map[s.line] = [];
      map[s.line].push(s);
    });
    return map;
  }, [filtered]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (name) => { onChange(name); setQuery(''); setOpen(false); };
  const clear = () => { onChange(''); setQuery(''); };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
      {label && (
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-secondary)', border: `2px solid ${open ? color : 'var(--border-color)'}`,
        borderRadius: '14px', padding: '10px 14px', transition: 'all 0.2s ease',
        boxShadow: open ? `0 0 0 4px ${color}20` : 'none', cursor: 'pointer',
      }} onClick={() => !open && setOpen(true)}>
        <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
        {value && !open ? (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {(() => { const s = STATIONS.find(st => st.name === value); return s ? `${LINE_EMOJIS[s.line]} ${LINES[s.line].name}` : ''; })()}
            </div>
          </div>
        ) : (
          <input
            autoFocus={open}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={label ? `Search ${label.toLowerCase()} station...` : 'Search station...'}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'inherit', padding: 0, margin: 0, width: '100%' }}
          />
        )}
        {value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '2px', flexShrink: 0, lineHeight: 1 }}>✕</button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          maxHeight: '220px', overflowY: 'auto',
        }}>
          {Object.keys(grouped).length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No stations found</div>
          ) : (
            Object.entries(grouped).map(([lineKey, stations]) => (
              <div key={lineKey}>
                <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, color: LINE_COLORS[lineKey], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {LINE_EMOJIS[lineKey]} {LINES[lineKey].name}
                </div>
                {stations.map(s => (
                  <div key={s.id} onClick={() => select(s.name)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background 0.15s', fontSize: '0.88rem', color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: LINE_COLORS[lineKey], flexShrink: 0 }} />
                    <span style={{ fontWeight: s.interchange ? 600 : 400 }}>{s.name}</span>
                    {s.interchange && <span style={{ fontSize: '10px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '6px', color: 'var(--text-muted)', marginLeft: 'auto' }}>Interchange</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
