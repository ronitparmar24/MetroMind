// frontend/src/pages/Achievements.jsx
import GlassCard from '../components/common/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { useTickets } from '../hooks/useTickets';

const ACHIEVEMENTS = [
  { id: 'first_ride', icon: '🎫', title: 'First Ride', desc: 'Complete your first metro ride', target: 1 },
  { id: 'regular_5', icon: '🔥', title: 'Regular Rider', desc: 'Complete 5 rides', target: 5 },
  { id: 'commuter_20', icon: '🚇', title: 'Daily Commuter', desc: 'Complete 20 rides', target: 20 },
  { id: 'eco_hero', icon: '🌿', title: 'Eco Hero', desc: 'Save 1 kg of CO₂', target: 1, type: 'co2' },
  { id: 'big_spender', icon: '💰', title: 'Big Spender', desc: 'Earn 100 loyalty points', target: 100, type: 'points' },
  { id: 'streak_7', icon: '⚡', title: 'Week Warrior', desc: '7-day travel streak', target: 7, type: 'streak' },
  { id: 'explorer', icon: '🗺️', title: 'Station Explorer', desc: 'Travel to 10 unique stations', target: 10, type: 'stations' },
  { id: 'group_trip', icon: '👥', title: 'Group Leader', desc: 'Book a group ticket (3+ passengers)', target: 3, type: 'group' },
];

export default function Achievements() {
  const { user } = useAuth();
  const { tickets } = useTickets();

  const totalCO2 = tickets.reduce((sum, t) => sum + (t.co2Saved || 0), 0);
  const uniqueStations = new Set(tickets.flatMap(t => [t.source, t.destination])).size;

  const getProgress = (a) => {
    switch (a.type) {
      case 'co2': return Math.min(totalCO2 / a.target, 1);
      case 'points': return Math.min((user?.loyaltyPoints || 0) / a.target, 1);
      case 'streak': return Math.min((user?.streakDays || 0) / a.target, 1);
      case 'stations': return Math.min(uniqueStations / a.target, 1);
      case 'group': return tickets.some(t => (t.passengers?.length || 0) >= 3) ? 1 : 0;
      default: return Math.min(tickets.length / a.target, 1);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Achievements 🏆</h1>
        <p className="page-subtitle">Track your milestones and earn badges</p>
      </div>
      <div className="grid grid-2">
        {ACHIEVEMENTS.map((a) => {
          const progress = getProgress(a);
          const unlocked = progress >= 1;
          return (
            <GlassCard key={a.id} style={{
              padding: '20px', opacity: unlocked ? 1 : 0.7,
              borderColor: unlocked ? 'rgba(34, 197, 94, 0.3)' : undefined,
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem', filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ fontWeight: 600 }}>{a.title}</h4>
                    {unlocked && <span className="badge badge-success">✓ Unlocked</span>}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{a.desc}</p>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', marginTop: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.round(progress * 100)}%`, height: '100%',
                      background: unlocked ? 'var(--gradient-success)' : 'var(--gradient-primary)',
                      borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
