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
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid var(--border-color)',
    flex: '1 1 200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  };

  const valStyle = {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums'
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 700 }}>Overview</h1>
      
      {/* Stat Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <div style={statCardStyle}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users</span>
          <span style={valStyle}>{data.usersTotal.toLocaleString()}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bookings This Month</span>
          <span style={valStyle}>{data.revenue?.totalBookings.toLocaleString() || 0}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue This Month</span>
          <span style={{ ...valStyle, color: 'var(--accent-primary)' }}>₹{(data.revenue?.totalRevenue || 0).toLocaleString()}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Predictions Today</span>
          <span style={valStyle}>{todayPredictions.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Revenue Chart */}
        <div style={{ ...statCardStyle, flex: 'none' }}>
          <h3 style={{ marginBottom: '16px' }}>Revenue by Day (Current Month)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="_id" stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="dailyRevenue" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Queue Preview */}
        <div style={{ ...statCardStyle, flex: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Support Queue</h3>
            <Link to="/admin/support" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500 }}>View All &rarr;</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.support.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No pending items.</p>
            ) : (
              data.support.map((item, i) => (
                <div key={i} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
