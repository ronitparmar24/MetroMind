// frontend/src/pages/Dashboard.jsx
// Premium dashboard — MetroFlow-inspired with gradient stat cards,
// animated quick actions, 3D ticket cards, and loyalty progress.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useTickets } from '../hooks/useTickets';
import TicketCard from '../components/tickets/TicketCard';
import { formatCurrency } from '../utils/formatters';

/* ═══ Gradient Stat Card ═══ */
function DashStatCard({ icon, value, label, gradient, delay = 0 }) {
  return (
    <div style={{
      background: 'var(--glass-bg, rgba(255,255,255,0.95))',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      border: '1px solid var(--glass-border, rgba(255,255,255,0.3))',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      animation: `dashFadeUp 0.5s ${delay}s both ease`,
      cursor: 'default',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', top: '-50%', right: '-50%',
        width: '200%', height: '200%', background: gradient,
        opacity: 0.04, transform: 'rotate(45deg)', transition: 'all 0.5s',
        pointerEvents: 'none',
      }} />

      {/* Icon box */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', color: 'white', marginBottom: '14px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
      }}>
        {icon}
      </div>

      <p style={{
        fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)',
        background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 1.1, marginBottom: '4px',
      }}>
        {value}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
    </div>
  );
}

/* ═══ Quick Action Button ═══ */
function QuickAction({ to, icon, label, desc, gradient, delay = 0 }) {
  return (
    <Link to={to} style={{
      background: 'var(--glass-bg, rgba(255,255,255,0.95))',
      backdropFilter: 'blur(20px)',
      border: '2px solid var(--glass-border, rgba(0,0,0,0.04))',
      borderRadius: '18px',
      padding: '24px',
      textAlign: 'center',
      textDecoration: 'none',
      color: 'var(--text-primary)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      display: 'block',
      animation: `dashFadeUp 0.5s ${delay}s both ease`,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(99,102,241,0.2)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '16px',
        background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', margin: '0 auto 12px', color: 'white',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        transition: 'transform 0.3s',
      }}>
        {icon}
      </div>
      <p style={{ fontWeight: 700, fontSize: '0.92rem', fontFamily: 'var(--font-display)', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
    </Link>
  );
}

/* ═══ 3D Ticket Preview Card ═══ */
function TicketPreview({ ticket }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderRadius: '20px',
      padding: '22px',
      color: 'white',
      boxShadow: '0 15px 40px rgba(99,102,241,0.35)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 25px 60px rgba(99,102,241,0.45)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Decorative circle */}
      <div style={{
        position: 'absolute', top: '-60px', right: '-60px',
        width: '160px', height: '160px',
        background: 'rgba(255,255,255,0.08)', borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>From</p>
          <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ticket.source}</p>
        </div>

        {/* Animated route line */}
        <div style={{ flex: 1, margin: '0 12px', position: 'relative', height: '3px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: '2px',
            background: 'white', animation: 'dashRouteProgress 2.5s ease-in-out infinite',
          }} />
          <div style={{ position: 'absolute', left: '-4px', top: '-5px', width: '13px', height: '13px', background: 'white', borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', right: '-4px', top: '-5px', width: '13px', height: '13px', background: 'white', borderRadius: '50%', boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase' }}>To</p>
          <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ticket.destination}</p>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.85 }}>
        <span>📅 {new Date(ticket.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span>💰 {formatCurrency(ticket.fare)}</span>
        <span>👥 {ticket.passengers?.length || 1}</span>
        {ticket.co2Saved > 0 && <span>🌿 {ticket.co2Saved}kg</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { tickets } = useTickets();

  const totalTrips = tickets.length;
  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const recentTickets = tickets.slice(0, 3);
  const loyaltyPoints = user?.loyaltyPoints || 0;
  const streakDays = user?.streakDays || 0;

  const GRADIENTS = {
    primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    info: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
    eco: 'linear-gradient(135deg, #11998e, #38ef7d)',
  };

  return (
    <div className="page">
      {/* Inline keyframes */}
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashRouteProgress {
          0%, 100% { width: 0; }
          50% { width: 100%; }
        }
        @keyframes dashPulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
      `}</style>

      {/* ═══ Welcome Header ═══ */}
      <div style={{ marginBottom: '28px', animation: 'dashFadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
          {/* User avatar */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: GRADIENTS.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.4rem', fontWeight: 700,
            boxShadow: '0 6px 20px rgba(99,102,241,0.3)',
            animation: 'dashPulseGlow 3s infinite',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '👤'}
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800, lineHeight: 1.2,
            }}>
              Welcome back, <span style={{
                background: GRADIENTS.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{user?.name?.split(' ')[0] || 'User'}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
              Here's your metro travel overview
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Stat Cards ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '18px',
        marginBottom: '28px',
      }}>
        <DashStatCard icon="💰" value={formatCurrency(wallet.balance)} label="Wallet Balance" gradient={GRADIENTS.primary} delay={0.05} />
        <DashStatCard icon="🎫" value={totalTrips} label="Total Trips" gradient={GRADIENTS.info} delay={0.1} />
        <DashStatCard icon="🌿" value={`${totalCO2.toFixed(1)} kg`} label="CO₂ Saved" gradient={GRADIENTS.eco} delay={0.15} />
        <DashStatCard icon="🔥" value={`${streakDays} days`} label="Travel Streak" gradient={GRADIENTS.warning} delay={0.2} />
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          ⚡ Quick Actions
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '14px',
        }}>
          <QuickAction to="/book" icon="🎫" label="Book Ticket" desc="Book a new metro ride" gradient={GRADIENTS.primary} delay={0.1} />
          <QuickAction to="/wallet" icon="💰" label="Top Up" desc="Recharge your wallet" gradient={GRADIENTS.success} delay={0.15} />
          <QuickAction to="/monthly-pass" icon="🎪" label="Buy Pass" desc="Save with monthly pass" gradient={GRADIENTS.warning} delay={0.2} />
          <QuickAction to="/live-trains" icon="🚇" label="Live Trains" desc="Real-time departures" gradient={GRADIENTS.info} delay={0.25} />
          <QuickAction to="/journey-planner" icon="🗺️" label="Plan Route" desc="Compare routes" gradient={GRADIENTS.danger} delay={0.3} />
          <QuickAction to="/analytics" icon="📊" label="Analytics" desc="Travel insights" gradient={GRADIENTS.eco} delay={0.35} />
        </div>
      </div>

      {/* ═══ Recent Tickets ═══ */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎟️ Recent Tickets
          </h3>
          <Link to="/tickets" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366f1', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {recentTickets.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {recentTickets.map((t) => (
              <TicketPreview key={t._id} ticket={t} />
            ))}
          </div>
        ) : (
          <div style={{
            background: 'var(--glass-bg, rgba(255,255,255,0.95))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '48px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            border: '1px solid var(--glass-border, rgba(0,0,0,0.04))',
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🎫</span>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '6px' }}>No tickets yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Start your smart commute journey
            </p>
            <Link to="/book" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: GRADIENTS.primary, color: 'white', padding: '10px 24px',
              borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none', boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
            }}>
              🎫 Book Your First Ride
            </Link>
          </div>
        )}
      </div>

      {/* ═══ Bottom Row: Loyalty + Carbon ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '18px',
      }}>
        {/* Loyalty Points Card */}
        <div style={{
          background: 'var(--glass-bg, rgba(255,255,255,0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '22px',
          padding: '26px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.04))',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: GRADIENTS.warning,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>⭐ Loyalty Points</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>Earn 1 point for every ₹10 spent</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                background: GRADIENTS.warning, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}>
                {loyaltyPoints}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>points</p>
            </div>
          </div>

          {/* Progress to next reward */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Progress to next reward</span>
              <span>{loyaltyPoints % 100}/100</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-tertiary, #e2e8f0)', borderRadius: '50px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '50px', transition: 'width 1s ease',
                background: GRADIENTS.warning,
                width: `${loyaltyPoints % 100}%`,
              }} />
            </div>
          </div>
        </div>

        {/* Carbon Passport Card */}
        <div style={{
          background: 'var(--glass-bg, rgba(255,255,255,0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '22px',
          padding: '26px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid var(--glass-border, rgba(0,0,0,0.04))',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
            background: GRADIENTS.eco,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>🌍 Carbon Passport</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>Your environmental impact</p>
            </div>
            <Link to="/carbon-passport" style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#22c55e', textDecoration: 'none',
            }}>View →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(34,197,94,0.08)', borderRadius: '14px', padding: '14px 8px',
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e', fontFamily: 'var(--font-display)' }}>
                {totalCO2.toFixed(1)}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>kg CO₂</p>
            </div>
            <div style={{
              background: 'rgba(59,130,246,0.08)', borderRadius: '14px', padding: '14px 8px',
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-display)' }}>
                {totalTrips}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rides</p>
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.08)', borderRadius: '14px', padding: '14px 8px',
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
                {Math.round(totalCO2 * 0.05)}
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trees 🌱</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
