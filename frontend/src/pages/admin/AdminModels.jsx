import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function AdminModels() {
  const [data, setData] = useState({ perf: null, volume: null, drift: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getModelPerformance(),
      adminApi.getPredictionVolume(),
      adminApi.getFeatureDrift()
    ])
    .then(([perfRes, volRes, driftRes]) => {
      setData({
        perf: perfRes.data,
        volume: volRes.data.volume_last_30_days,
        drift: driftRes.data.drift
      });
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading Model Analytics...</div>;

  const { perf, volume, drift } = data;

  // Format volume for stacked chart
  const volumeData = volume ? Object.keys(volume).map(date => ({
    date,
    crowd: volume[date].crowd || 0,
    anomaly: volume[date].anomaly || 0,
    personality: volume[date].personality || 0,
    best_departure: volume[date].best_departure || 0
  })) : [];

  const cardStyle = {
    background: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0px 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid var(--border-color)',
    marginBottom: '24px'
  };

  const pillStyle = (isLive) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
    color: isLive ? '#34d399' : '#9ca3af',
    border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
  });

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 700 }}>ML Model Performance (MLOps)</h1>

      <div style={cardStyle}>
        <h3 style={{ marginBottom: '16px' }}>Trained Model Comparison</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Model Name</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Accuracy</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>F1-Score</th>
              <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {perf && perf.models && Object.entries(perf.models).map(([modelId, metrics]) => {
              const isLive = perf.deployed_model === modelId;
              return (
                <tr key={modelId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: isLive ? 600 : 400 }}>{modelId}</td>
                  <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                    {(metrics.accuracy * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', fontVariantNumeric: 'tabular-nums' }}>
                    {(metrics.f1 * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={pillStyle(isLive)}>{isLive ? 'LIVE' : 'STANDBY'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px' }}>Prediction Volume (Last 30 Days)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-secondary)'}} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="crowd" stackId="1" stroke="#6366f1" fill="#6366f1" />
                <Area type="monotone" dataKey="anomaly" stackId="1" stroke="#ef4444" fill="#ef4444" />
                <Area type="monotone" dataKey="personality" stackId="1" stroke="#10b981" fill="#10b981" />
                <Area type="monotone" dataKey="best_departure" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Feature Drift Monitor</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Training vs Live (7d)</span>
          </div>

          {drift && (
            <div>
              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Average Hour of Booking</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{drift.average_hour.live_last_7d}</span>
                    <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>vs {drift.average_hour.training} (Train)</span>
                  </div>
                  {Math.abs(drift.average_hour.delta) > 1.5 && (
                    <span style={{ ...pillStyle(false), background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>DRIFT DETECTED</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: drift.average_hour.delta > 0 ? '#34d399' : '#f87171' }}>
                  Δ {drift.average_hour.delta > 0 ? '+' : ''}{drift.average_hour.delta} hours
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Top Frequency Stations Shift</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TRAINING DATA</p>
                    {drift.top_stations.training.slice(0,3).map((st, i) => (
                      <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>{i+1}. {st.station}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>LIVE (LAST 7D)</p>
                    {drift.top_stations.live_last_7d.slice(0,3).map((st, i) => {
                      const changed = drift.top_stations.training[i]?.station !== st.station;
                      return (
                        <div key={i} style={{ fontSize: '0.85rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {i+1}. {st.station}
                          {changed && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
