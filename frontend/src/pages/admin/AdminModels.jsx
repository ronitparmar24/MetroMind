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

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {Array.from({length:3}).map((_,i)=>(
        <div key={i} className="glass-card" style={{ padding:24, height:120 }}>
          <div className="admin-skeleton" style={{ height:14, width:'40%', marginBottom:12 }} />
          <div className="admin-skeleton" style={{ height:40, width:'70%' }} />
        </div>
      ))}
    </div>
  );

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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
    <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="admin-fade-in">
      <div className="glass-card" style={{ padding:'20px 24px' }}>
        <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
          ML Model Performance
          <span className="admin-badge admin-badge-purple">MLOps Center</span>
        </div>
        <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>Trained model comparison and prediction analytics</div>
      </div>

      <div className="glass-card" style={{...cardStyle}}>

        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Trained Model Comparison</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <th style={{ padding: '16px 12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Model Architecture</th>
              <th style={{ padding: '16px 12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Accuracy</th>
              <th style={{ padding: '16px 12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>F1-Score</th>
              <th style={{ padding: '16px 12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {perf && Object.entries(perf).filter(([k]) => k !== 'hyperparameters' && k !== 'deployed_model' && k !== 'winner').map(([modelId, metrics]) => {
              const isLive = perf.winner ? modelId === perf.winner : modelId === 'gradient_boosting';
              return (
                <tr key={modelId} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', background: isLive ? 'rgba(16,185,129,0.04)' : 'transparent', transition: 'background 0.2s' }} className="hover-lift">
                  <td style={{ padding: '16px 12px', fontWeight: isLive ? 700 : 500, color: isLive ? '#0f172a' : '#334155' }}>{modelId}</td>
                  <td style={{ padding: '16px 12px', fontVariantNumeric: 'tabular-nums', color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>
                    {(metrics.accuracy * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '16px 12px', fontVariantNumeric: 'tabular-nums', color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>
                    {(metrics.weighted_f1 ? metrics.weighted_f1 * 100 : metrics.f1 * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{...pillStyle(isLive), animation: isLive ? 'dashPulse 3s infinite' : 'none'}}>{isLive ? 'LIVE' : 'STANDBY'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>Prediction Volume (Last 30 Days)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} tickFormatter={d => d?.slice(5) || d} axisLine={false} tickLine={false} />
                <YAxis stroke="#cbd5e1" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', color: '#1e293b' }} itemStyle={{ color: '#1e293b', fontWeight: 600 }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '0.85rem', color: '#64748b' }} />
                <Area type="monotone" dataKey="crowd" stackId="1" stroke="#818cf8" fill="url(#colorCrowd)" strokeWidth={2} />
                <Area type="monotone" dataKey="anomaly" stackId="1" stroke="#fb7185" fill="url(#colorAnomaly)" strokeWidth={2} />
                <Area type="monotone" dataKey="personality" stackId="1" stroke="#34d399" fill="url(#colorPersonality)" strokeWidth={2} />
                <Area type="monotone" dataKey="best_departure" stackId="1" stroke="#fbbf24" fill="url(#colorBestDeparture)" strokeWidth={2} />
                <defs>
                  <linearGradient id="colorCrowd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPersonality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBestDeparture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Feature Drift Monitor</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>Training vs Live (7d)</span>
          </div>

          {drift && (
            <div>
              <div style={{ padding: '20px', background: 'rgba(99,102,241,0.04)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)', marginBottom: '16px' }} className="hover-lift">
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>Average Hour of Booking</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{drift.average_hour.live_last_7d}</span>
                    <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>vs {drift.average_hour.training} (Train)</span>
                  </div>
                  {Math.abs(drift.average_hour.delta) > 1.5 && (
                    <span style={{ ...pillStyle(false), background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.3)', animation: 'dashPulse 1.5s infinite' }}>DRIFT DETECTED</span>
                  )}
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: drift.average_hour.delta > 0 ? '#10b981' : '#ef4444' }}>
                  Δ {drift.average_hour.delta > 0 ? '+' : ''}{drift.average_hour.delta} hours
                </p>
              </div>

              <div style={{ padding: '20px', background: 'rgba(99,102,241,0.04)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.1)' }} className="hover-lift">
                <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>Top Frequency Stations Shift</p>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>TRAINING DATA</p>
                    {drift.top_stations.training.slice(0,3).map((st, i) => (
                      <div key={i} style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#334155', fontWeight: 500 }}>{i+1}. {st.station}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>LIVE (LAST 7D)</p>
                    {drift.top_stations.live_last_7d.slice(0,3).map((st, i) => {
                      const changed = drift.top_stations.training[i]?.station !== st.station;
                      return (
                        <div key={i} style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: changed ? '#6366f1' : '#334155', fontWeight: changed ? 700 : 500 }}>
                          {i+1}. {st.station}
                          {changed && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>}
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
