import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export default function AdminOverview() {
  const [data, setData] = useState({
    revenue: null,
    support: [],
    usersTotal: 0,
    predictions: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getRevenueSummary(),
      adminApi.getSupportQueue(),
      adminApi.getUsers({ limit: 1 }),
      adminApi.getPredictionVolume()
    ])
    .then(([revRes, supportRes, usersRes, predRes]) => {
      setData({
        revenue: revRes.data.data,
        support: supportRes.data.data.slice(0, 5),
        usersTotal: usersRes.data.pagination.total,
        predictions: predRes.data.volume_last_30_days
      });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-primary)' }}>Loading Overview...</div>;

  // Compute active predictions today
  const todayStr = new Date().toISOString().split('T')[0];
  let todayPredictions = 0;
  if (data.predictions && data.predictions[todayStr]) {
    todayPredictions = Object.values(data.predictions[todayStr]).reduce((a, b) => a + b, 0);
  }

  const statCardStyle = {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    flex: '1 1 200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'transform 0.2s',
    cursor: 'default'
  };

  const valStyle = {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#fff',
    fontVariantNumeric: 'tabular-nums',
    textShadow: '0 0 20px rgba(255,255,255,0.1)'
  };

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Premium Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #4c1d95 70%, #000000 100%)',
        borderRadius: '24px',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '200px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>MetroMind Central Intelligence</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'dashPulse 2s infinite' }} />
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'white', margin: '0 0 12px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            System Overview 📈
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', margin: '0', maxWidth: '600px', lineHeight: 1.5 }}>
            Real-time analytics and monitoring for the MetroMind network. All systems operational.
          </p>
        </div>
      </div>
      
      {/* Stat Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={{...statCardStyle, background: 'linear-gradient(180deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(99,102,241,0.2)'}} className="hover-lift">
          <span style={{ color: '#818cf8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Users</span>
          <span style={valStyle}>{data.usersTotal.toLocaleString()}</span>
        </div>
        <div style={{...statCardStyle, background: 'linear-gradient(180deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(139,92,246,0.2)'}} className="hover-lift">
          <span style={{ color: '#a78bfa', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Bookings This Month</span>
          <span style={valStyle}>{data.revenue?.totalBookings.toLocaleString() || 0}</span>
        </div>
        <div style={{...statCardStyle, background: 'linear-gradient(180deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(52,211,153,0.2)'}} className="hover-lift">
          <span style={{ color: '#6ee7b7', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Revenue This Month</span>
          <span style={{ ...valStyle, color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.2)' }}>₹{(data.revenue?.totalRevenue || 0).toLocaleString()}</span>
        </div>
        <div style={{...statCardStyle, background: 'linear-gradient(180deg, rgba(30,27,75,0.7) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(244,114,182,0.2)'}} className="hover-lift">
          <span style={{ color: '#f472b6', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Predictions Today</span>
          <span style={{ ...valStyle, color: '#f472b6', textShadow: '0 0 20px rgba(244,114,182,0.2)' }}>{todayPredictions.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Revenue Chart */}
        <div style={{ ...statCardStyle, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', backdropFilter: 'none', flex: 'none' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Revenue by Day (Current Month)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="_id" stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="dailyRevenue" stroke="#818cf8" strokeWidth={4} dot={{ r: 5, fill: '#818cf8', stroke: '#1e1b4b', strokeWidth: 2 }} activeDot={{ r: 8 }} style={{ filter: 'drop-shadow(0px 8px 12px rgba(129,140,248,0.6))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Queue Preview */}
        <div style={{ ...statCardStyle, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', backdropFilter: 'none', flex: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Support Queue</h3>
            <Link to="/admin/support" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>View All &rarr;</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scrollbar">
            {data.support.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>No pending support items.</p>
              </div>
            ) : (
              data.support.map((item, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', transition: 'transform 0.2s, box-shadow 0.2s' }} className="hover-lift">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: item.queueType === 'feedback' ? '#818cf8' : '#f59e0b', background: item.queueType === 'feedback' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                      {item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                    {item.text || item.itemDescription}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
