// frontend/src/pages/WeeklyDigest.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getWeeklyDigest } from '../api/analytics.api';
import { formatCurrency } from '../utils/formatters';

export default function WeeklyDigest() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getWeeklyDigest();
        setDigest(res.data.digest);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Weekly Digest 🤖</h1>
        <p className="page-subtitle">AI-powered trip summary for the past 7 days</p>
      </div>

      {digest ? (
        <>
          <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
            <StatCard icon="🎫" value={digest.totalTrips} label="Trips This Week" />
            <StatCard icon="💰" value={formatCurrency(digest.totalSpent)} label="Total Spent" color="#ef4444" />
            <StatCard icon="📏" value={`${digest.totalDistance} km`} label="Distance Covered" color="#3b82f6" />
            <StatCard icon="🌿" value={`${digest.totalCO2Saved} kg`} label="CO₂ Saved" color="#22c55e" />
          </div>

          <div className="grid grid-2">
            <GlassCard style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>🛤️ Top Route</h3>
              {digest.topRoute ? (
                <div>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>{digest.topRoute.route}</p>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Taken {digest.topRoute.count} time{digest.topRoute.count > 1 ? 's' : ''} this week
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No routes this week</p>
              )}
            </GlassCard>

            <GlassCard style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>⏰ Peak vs Off-Peak</h3>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--warning)' }}>
                    {digest.peakTrips}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Peak Trips</p>
                </div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success)' }}>
                    {digest.offPeakTrips}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Off-Peak Trips</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard style={{ marginTop: 'var(--space-xl)', padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '12px' }}>💡 AI Insight</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {digest.totalTrips > 0
                ? `Great week! You averaged ${formatCurrency(digest.avgFarePerTrip)} per trip across ${digest.totalTrips} rides. ${digest.peakTrips > digest.offPeakTrips ? 'Consider shifting some trips to off-peak hours (11am-5pm) to save ~20% on fares.' : 'Smart travel! You\'re mostly riding during off-peak hours, saving on fares.'} Your metro usage saved ${digest.totalCO2Saved} kg of CO₂ compared to cab travel. 🌿`
                : 'No trips recorded this week. Book a ride to see your weekly insights!'}
            </p>
          </GlassCard>
        </>
      ) : (
        <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🤖</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>No trip data for this week yet</p>
        </GlassCard>
      )}
    </div>
  );
}
