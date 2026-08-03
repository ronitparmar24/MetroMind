import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setStats(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: '40px', background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <h1>Admin Panel</h1>
      <p>This page is only accessible to users with the admin role.</p>
      
      {stats ? (
        <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3>System Stats</h3>
          <p>Active Users: {stats.activeUsers}</p>
          <p>Health: {stats.systemHealth}</p>
        </div>
      ) : (
        <p>Loading admin data...</p>
      )}
    </div>
  );
}
