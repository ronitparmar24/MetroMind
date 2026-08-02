// frontend/src/components/metro/TimeToLeaveWidget.jsx
import { useState, useEffect } from 'react';

export default function TimeToLeaveWidget({ targetTime = '08:45 AM', walkMins = 12 }) {
  const [minsLeft, setMinsLeft] = useState(24);

  useEffect(() => {
    // In a real app, this would calculate time diff between now and target departure - walk time
    const id = setInterval(() => {
      setMinsLeft(m => (m > 0 ? m - 1 : 0));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const getStatusColor = () => {
    if (minsLeft > 15) return '#10b981'; // Green
    if (minsLeft > 5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `2px solid ${getStatusColor()}`,
      borderRadius: '24px',
      padding: '20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: `0 8px 24px ${getStatusColor()}20`
    }}>
      <div style={{ 
        width: '72px', height: '72px', 
        borderRadius: '50%', 
        border: `4px solid ${getStatusColor()}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
          {minsLeft}
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          MINS
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: getStatusColor() }}>
            {minsLeft > 15 ? 'check_circle' : minsLeft > 5 ? 'warning' : 'directions_run'}
          </span>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {minsLeft > 15 ? 'On Schedule' : minsLeft > 5 ? 'Time to Leave' : 'Hurry Up!'}
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Leave now for a <strong>{walkMins} min</strong> walk to catch the <strong>{targetTime}</strong> train.
        </p>
      </div>
    </div>
  );
}
