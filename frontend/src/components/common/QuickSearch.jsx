// frontend/src/components/common/QuickSearch.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SEARCH_ITEMS = [
  { label: 'Dashboard',      desc: 'Your commute command center',    icon: '🏠', to: '/dashboard',     tags: ['home', 'dashboard', 'overview'] },
  { label: 'Book a Ticket',  desc: 'Book your next metro ride',      icon: '🎫', to: '/book',           tags: ['book', 'ticket', 'ride', 'travel'] },
  { label: 'My Tickets',     desc: 'View & manage your bookings',    icon: '📋', to: '/tickets',        tags: ['tickets', 'bookings', 'trips'] },
  { label: 'Wallet',         desc: 'Balance, top up & history',      icon: '💳', to: '/wallet',         tags: ['wallet', 'money', 'balance', 'topup'] },
  { label: 'Transactions',   desc: 'All your payment history',       icon: '💸', to: '/transactions',   tags: ['transactions', 'payments', 'history'] },
  { label: 'Metro Card',     desc: 'Manage your metro card',         icon: '🎴', to: '/metro-card',     tags: ['card', 'metro card', 'discount'] },
  { label: 'Monthly Pass',   desc: 'Buy or renew your pass',         icon: '📅', to: '/monthly-pass',   tags: ['pass', 'monthly', 'subscription'] },
  { label: 'Journey Planner',desc: 'Plan your next route',           icon: '🗺️', to: '/journey',        tags: ['journey', 'plan', 'route', 'map'] },
  { label: 'Live Trains',    desc: 'Real-time train status',         icon: '🚆', to: '/live-trains',    tags: ['live', 'trains', 'realtime', 'status'] },
  { label: 'Metro Map',      desc: 'Interactive GMRC map',           icon: '🗺️', to: '/map',            tags: ['map', 'metro', 'stations', 'gmrc'] },
  { label: 'Analytics',      desc: 'Your travel insights & stats',   icon: '📊', to: '/analytics',      tags: ['analytics', 'stats', 'insights'] },
  { label: 'Profile',        desc: 'Your account & personality',     icon: '👤', to: '/profile',        tags: ['profile', 'account', 'personality'] },
  { label: 'Settings',       desc: 'App preferences & shortcuts',    icon: '⚙️', to: '/settings',       tags: ['settings', 'preferences', 'theme'] },
  { label: 'Lost & Found',   desc: 'Report or track lost items',     icon: '🔍', to: '/lost-found',     tags: ['lost', 'found', 'item'] },
  { label: 'Emergency SOS',  desc: 'Quick emergency help',           icon: '🆘', to: '/sos',            tags: ['sos', 'emergency', 'help'] },
];

export default function QuickSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filtered = query.trim() === ''
    ? SEARCH_ITEMS
    : SEARCH_ITEMS.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(t => t.includes(query.toLowerCase()))
      );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered[activeIdx]) { go(filtered[activeIdx].to); }
    else if (e.key === 'Escape') { onClose(); }
  };

  const go = (to) => { navigate(to); onClose(); };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'qs-fade 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '12vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '560px',
        zIndex: 9999,
        animation: 'qs-drop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        padding: '0 16px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(15,20,40,0.98) 0%, rgba(20,28,55,0.98) 100%)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: '20px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>

          {/* Search Input Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(99,102,241,0.05)',
          }}>
            <span style={{ fontSize: '1.1rem', opacity: 0.7, flexShrink: 0 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, features, stations..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            />
            <kbd style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'monospace',
              flexShrink: 0,
            }}>ESC</kbd>
          </div>

          {/* Results */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
                No results for "{query}"
              </div>
            ) : (
              filtered.map((item, idx) => (
                <div
                  key={item.to}
                  onClick={() => go(item.to)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: idx === activeIdx
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                      : 'transparent',
                    border: idx === activeIdx
                      ? '1px solid rgba(99,102,241,0.3)'
                      : '1px solid transparent',
                    transition: 'background 0.12s, border 0.12s',
                    marginBottom: '2px',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem',
                    background: idx === activeIdx
                      ? 'rgba(99,102,241,0.25)'
                      : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'background 0.12s',
                  }}>
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: idx === activeIdx ? '#c4b5fd' : 'rgba(255,255,255,0.9)',
                      marginBottom: '1px',
                    }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.4)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.desc}
                    </div>
                  </div>

                  {/* Enter hint */}
                  {idx === activeIdx && (
                    <kbd style={{
                      background: 'rgba(99,102,241,0.25)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      color: '#a5b4fc',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                    }}>↵</kbd>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            gap: '16px',
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.28)',
          }}>
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes qs-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes qs-drop { from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.96) } to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) } }
      `}</style>
    </>
  );
}
