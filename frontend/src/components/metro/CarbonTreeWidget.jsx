// frontend/src/components/metro/CarbonTreeWidget.jsx
import { useState, useEffect } from 'react';
import { getWeeklyDigest } from '../../api/analytics.api';

export default function CarbonTreeWidget() {
  const [co2Saved, setCo2Saved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getWeeklyDigest();
        setCo2Saved(res.data.digest.totalCO2Saved || 0);
      } catch (err) {
        console.error('Failed to load carbon stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Determine tree stage (e.g. 1kg = Sprout, 5kg = Sapling, 15kg = Tree)
  const getStage = (co2) => {
    if (co2 < 2) return { level: 'Seedling', icon: '🌱', color: '#16a34a' };
    if (co2 < 10) return { level: 'Sapling', icon: '🌿', color: '#15803d' };
    if (co2 < 25) return { level: 'Transit Hero', icon: '🌳', color: '#166534' };
    return { level: 'Eco Guardian', icon: '🌲', color: '#14532d' };
  };

  const stage = getStage(co2Saved);

  if (loading) return null;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)',
      borderRadius: '24px',
      padding: '24px',
      border: '1px solid #bbf7d0',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
      marginBottom: '24px'
    }}>
      <style>{`
        @keyframes floatTree {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)); }
          50% { filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.8)); }
        }
      `}</style>

      {/* Animated Tree Icon */}
      <div style={{
        fontSize: '48px',
        animation: 'floatTree 4s ease-in-out infinite, glowPulse 3s ease-in-out infinite',
        background: 'rgba(255,255,255,0.5)',
        width: '80px', height: '80px',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 8px rgba(0,0,0,0.05)'
      }}>
        {stage.icon}
      </div>

      {/* Stats */}
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.125rem', fontWeight: 800, color: stage.color }}>
          {stage.level}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d', fontWeight: 500 }}>
          You've saved <strong style={{ fontSize: '1rem' }}>{co2Saved} kg</strong> of CO₂ this week!
        </p>
        <div style={{
          marginTop: '12px',
          background: 'rgba(255,255,255,0.7)',
          height: '6px',
          borderRadius: '3px',
          overflow: 'hidden',
          width: '100%'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min((co2Saved / 25) * 100, 100)}%`,
            background: stage.color,
            borderRadius: '3px',
            transition: 'width 1s ease-out'
          }} />
        </div>
        <div style={{ fontSize: '0.6875rem', color: '#16a34a', marginTop: '6px', textAlign: 'right' }}>
          Next level: {stage.level === 'Eco Guardian' ? 'MAX' : '25 kg'}
        </div>
      </div>
    </div>
  );
}
