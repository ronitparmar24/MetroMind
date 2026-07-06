// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { useTickets } from '../hooks/useTickets';
import StatCard from '../components/common/StatCard';
import GlassCard from '../components/common/GlassCard';
import TicketCard from '../components/tickets/TicketCard';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const { tickets } = useTickets();

  const totalTrips = tickets.length;
  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const recentTickets = tickets.slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="page-subtitle">Here's your metro travel overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatCard icon="🎫" value={totalTrips} label="Total Trips" color="var(--accent-primary)" />
        <StatCard icon="💰" value={formatCurrency(wallet.balance)} label="Wallet Balance" color="#22c55e" />
        <StatCard icon="🌿" value={`${totalCO2.toFixed(1)} kg`} label="CO₂ Saved" color="#16a34a" />
        <StatCard icon="🔥" value={`${user?.streakDays || 0} days`} label="Travel Streak" color="#f59e0b" />
      </div>

      {/* Quick Actions */}
      <GlassCard style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/book" className="btn btn-primary">🎫 Book Ticket</Link>
          <Link to="/wallet" className="btn btn-secondary">💰 Top Up Wallet</Link>
          <Link to="/monthly-pass" className="btn btn-secondary">🎪 Buy Pass</Link>
          <Link to="/analytics" className="btn btn-secondary">📈 View Analytics</Link>
        </div>
      </GlassCard>

      {/* Recent Tickets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Recent Tickets</h3>
          <Link to="/tickets" style={{ fontSize: '0.85rem', fontWeight: 500 }}>View All →</Link>
        </div>
        {recentTickets.length > 0 ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {recentTickets.map((t) => (
              <TicketCard key={t._id} ticket={t} onCancel={() => {}} onShowQR={() => {}} />
            ))}
          </div>
        ) : (
          <GlassCard style={{ padding: '40px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🎫</span>
            <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
              No tickets yet. <Link to="/book">Book your first ride!</Link>
            </p>
          </GlassCard>
        )}
      </div>

      {/* Loyalty Points */}
      <GlassCard style={{ marginTop: 'var(--space-xl)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Loyalty Points</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              Earn 1 point for every ₹10 spent
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>
              {user?.loyaltyPoints || 0}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>points</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
