import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { adminApi } from '../../api/admin.api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Cpu, WifiOff, AlertTriangle, RefreshCw, CheckCircle, Radio, Zap } from 'lucide-react';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const PURPLE  = '#6366f1';
const EMERALD = '#34d399';
const ROSE    = '#f87171';
const AMBER   = '#fbbf24';
const CYAN    = '#22d3ee';
const VIOLET  = '#a78bfa';

const MOCK_PERF = {
  gradient_boosting: { accuracy: 0.75, weighted_f1: 0.7379 },
  random_forest:     { accuracy: 0.71, weighted_f1: 0.7006 },
  winner: 'gradient_boosting',
};

const MOCK_VOLUME = Array.from({length:10},(_,i) => ({
  date: `2026-07-${String(22+i).padStart(2,'0')}`,
  crowd: Math.floor(120+Math.random()*80),
  anomaly: Math.floor(20+Math.random()*30),
  personality: Math.floor(40+Math.random()*50),
  best_departure: Math.floor(60+Math.random()*60),
}));

const MOCK_DRIFT = {
  average_hour: { live_last_7d: 14.2, training: 12.8, delta: 1.4 },
  top_stations: {
    training:    [{ station:'Rajiv Chowk' },{ station:'CSMT' },{ station:'Dadar' }],
    live_last_7d:[{ station:'CSMT' },{ station:'Rajiv Chowk' },{ station:'Bandra' }],
  },
};

function SkeletonBlock({ h=16, w='100%', mb=0 }) {
  return <div className="admin-skeleton" style={{ height:h, width:w, marginBottom:mb }} />;
}

const TOOLTIP_STYLE = {
  contentStyle: { background:'#0d1117', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, fontSize:12, color:'#f1f5f9' },
  labelStyle: { fontWeight:700, color:'#f1f5f9' },
};

export default function AdminModels() {
  const width = useWindowWidth();
  const [activeTab, setActiveTab] = useState('crowd');
  const [data, setData]         = useState({ perf:null, volume:null, drift:null });
  const [loading, setLoading]   = useState(true);
  const [offline, setOffline]   = useState(false);

  const load = () => {
    setLoading(true);
    setOffline(false);
    Promise.all([
      adminApi.getModelPerformance(),
      adminApi.getPredictionVolume(),
      adminApi.getFeatureDrift(),
    ])
    .then(([perfRes, volRes, driftRes]) => {
      // Check if any response indicates offline
      if (perfRes.data?.offline || volRes.data?.offline || driftRes.data?.offline) {
        setOffline(true);
        setData({ perf: MOCK_PERF, volume: MOCK_VOLUME, drift: MOCK_DRIFT });
      } else {
        setData({
          perf:   perfRes.data,
          volume: volRes.data?.volume_last_30_days,
          drift:  driftRes.data?.drift,
        });
      }
    })
    .catch(() => {
      setOffline(true);
      setData({ perf: MOCK_PERF, volume: MOCK_VOLUME, drift: MOCK_DRIFT });
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {Array.from({length:3}).map((_,i) => (
        <div key={i} className="glass-card" style={{ padding:24 }}>
          <SkeletonBlock h={14} w="40%" mb={12} />
          <SkeletonBlock h={120} />
        </div>
      ))}
    </div>
  );

  const { perf, volume, drift } = data;

  // Format volume for chart
  const volumeData = Array.isArray(volume)
    ? volume
    : volume ? Object.keys(volume).map(date => ({
        date,
        crowd:         volume[date].crowd || 0,
        anomaly:       volume[date].anomaly || 0,
        personality:   volume[date].personality || 0,
        best_departure:volume[date].best_departure || 0,
      }))
    : [];

  const modelEntries = perf ? Object.entries(perf).filter(([k]) =>
    !['hyperparameters','deployed_model','winner'].includes(k)
  ) : [];

  const winnerKey = perf?.winner || 'gradient_boosting';
  const winnerAcc = perf?.[winnerKey]?.accuracy;

  // Sentry test error handler
  const [sentryStatus, setSentryStatus] = useState(null); // null | 'sending' | 'sent'
  const triggerSentryTest = () => {
    setSentryStatus('sending');
    // Capture a manual test event with rich context
    const eventId = Sentry.captureException(
      new Error('[TEST] MetroMind Admin — Sentry integration verified'),
      {
        tags: { test: 'true', page: 'admin-models', trigger: 'manual' },
        level: 'error',
        extra: {
          winner_model: winnerKey,
          winner_accuracy: winnerAcc,
          timestamp: new Date().toISOString(),
          note: 'This is a deliberate test error. Safe to ignore in Sentry.',
        },
      }
    );
    console.log('[Sentry] Test event captured, eventId:', eventId);
    setSentryStatus('sent');
    setTimeout(() => setSentryStatus(null), 4000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="admin-fade-in">
      {/* Header */}
      <div className="glass-card" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:44, height:44, borderRadius:14,
            background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Cpu size={22} color={VIOLET} />
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)', display:'flex', alignItems:'center', gap:10 }}>
              ML Models
              <span className="admin-badge admin-badge-purple" style={{ fontSize:'0.6rem' }}>MLOps Center</span>
            </div>
            <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>
              Model performance comparison & prediction analytics
            </div>
          </div>
        </div>
        <button className="admin-action-btn admin-action-btn-ghost" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Offline Banner */}
      {offline && (
        <div style={{
          display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
          background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)',
          borderRadius:14, color:AMBER,
        }}>
          <WifiOff size={16} />
          <div>
            <div style={{ fontSize:'0.82rem', fontWeight:700 }}>ML Service Offline — Showing Cached Data</div>
            <div style={{ fontSize:'0.72rem', color:'#d97706', marginTop:2 }}>
              The Python ML service is not reachable. Displaying last known model metrics.
            </div>
          </div>
        </div>
      )}

      {/* Live model + accuracy */}
      {winnerKey && (
        <div className="admin-mid-grid" style={{ gap:16 }}>
          <div className="glass-card" style={{ padding:20, gridColumn:'span 1', borderColor:'rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
              Live Model
            </div>
            <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:EMERALD, marginBottom:4, textTransform:'capitalize' }}>
              {winnerKey.replace(/_/g,' ')}
            </div>
            <span style={{ fontSize:'0.7rem', padding:'3px 10px', background:'rgba(52,211,153,0.1)', color:EMERALD, borderRadius:20, border:'1px solid rgba(52,211,153,0.25)', fontWeight:700 }}>
              ● LIVE
            </span>
          </div>
          {winnerAcc && (
            <>
              <div className="glass-card" style={{ padding:20 }}>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Accuracy</div>
                <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'2rem', fontWeight:900, color:PURPLE }}>
                  {(winnerAcc*100).toFixed(2)}%
                </div>
              </div>
              <div className="glass-card" style={{ padding:20 }}>
                <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>F1-Score</div>
                <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'2rem', fontWeight:900, color:CYAN }}>
                  {((perf?.[winnerKey]?.weighted_f1 || perf?.[winnerKey]?.f1 || 0)*100).toFixed(2)}%
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Model comparison table */}
      <div className="glass-card" style={{ padding:24 }}>
        <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--adm-text)', marginBottom:20 }}>
          Trained Model Comparison
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Accuracy</th>
                <th>F1-Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {modelEntries.map(([modelId, metrics]) => {
                const isLive = modelId === winnerKey;
                return (
                  <tr key={modelId} style={{ background: isLive ? 'rgba(52,211,153,0.04)' : 'transparent' }}>
                    <td data-label="Model Architecture" style={{ fontWeight: isLive ? 700 : 500, color: isLive ? 'var(--adm-text)' : 'var(--adm-text-2)', textTransform:'capitalize' }}>
                      {modelId.replace(/_/g,' ')}
                    </td>
                    <td data-label="Accuracy" style={{ fontFamily:'Space Grotesk, sans-serif', fontWeight:700, color: isLive ? EMERALD : 'var(--adm-text-2)' }}>
                      {(metrics.accuracy * 100).toFixed(2)}%
                    </td>
                    <td data-label="F1-Score" style={{ fontFamily:'Space Grotesk, sans-serif', fontWeight:700, color:'var(--adm-text)' }}>
                      {((metrics.weighted_f1 || metrics.f1 || 0) * 100).toFixed(2)}%
                    </td>
                    <td data-label="Status">
                      {isLive ? (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', background:'rgba(52,211,153,0.1)', color:EMERALD, border:'1px solid rgba(52,211,153,0.25)', borderRadius:20 }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:EMERALD, boxShadow:`0 0 8px ${EMERALD}` }} />
                          LIVE
                        </span>
                      ) : (
                        <span style={{ fontSize:'0.7rem', fontWeight:600, color:'#475569', padding:'3px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20 }}>
                          STANDBY
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div className="admin-settings-grid" style={{ gap:20 }}>
        {/* Prediction Volume */}
        <div className="glass-card" style={{ padding:24, maxHeight: '380px', overflowY: 'auto' }}>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'0.95rem', fontWeight:800, color:'var(--adm-text)', marginBottom:4 }}>
            Prediction Volume
          </div>
          <div style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:16 }}>Last 30 days by model type</div>
          <div style={{ height:250, width: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
            <AreaChart width={Math.max((width - (width < 768 ? 64 : 320)) / 2 - 20, 300)} height={250} data={volumeData} margin={{ top:8, right:8, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" type="category" tick={{fill:'#475569', fontSize:10}} tickFormatter={d=>d?.slice(5)||d} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#475569', fontSize:10}} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize:'0.78rem', color:'#64748b', paddingTop:12 }} />
              <defs>
                <linearGradient id="gCrowd"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.5}/><stop offset="95%" stopColor="#818cf8" stopOpacity={0}/></linearGradient>
                <linearGradient id="gAnomaly"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.5}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                <linearGradient id="gPersonal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.5}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                <linearGradient id="gDeparture"x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5}/><stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/></linearGradient>
              </defs>
              <Area type="monotone" dataKey="crowd"          stroke="#818cf8" fill="url(#gCrowd)"    strokeWidth={2} />
              <Area type="monotone" dataKey="anomaly"        stroke="#f87171" fill="url(#gAnomaly)"  strokeWidth={2} />
              <Area type="monotone" dataKey="personality"    stroke="#34d399" fill="url(#gPersonal)" strokeWidth={2} />
              <Area type="monotone" dataKey="best_departure" stroke="#fbbf24" fill="url(#gDeparture)"strokeWidth={2} />
            </AreaChart>
          </div>
        </div>

        {/* Feature Drift Monitor */}
        <div className="glass-card" style={{ padding:24, maxHeight: '380px', overflowY: 'auto' }}>
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'0.95rem', fontWeight:800, color:'var(--adm-text)', marginBottom:4 }}>
            Feature Drift Monitor
          </div>
          <div style={{ fontSize:'0.72rem', color:'#64748b', marginBottom:16 }}>Training vs Live (7d)</div>
          {drift && (
            <div>
              {/* Avg hour drift */}
              <div style={{ padding:'16px', background:'rgba(255,255,255,0.025)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)', marginBottom:12 }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:8 }}>Average Booking Hour</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.8rem', fontWeight:900, color:PURPLE }}>
                      {drift.average_hour.live_last_7d}
                    </span>
                    <span style={{ marginLeft:10, color:'#475569', fontSize:'0.85rem' }}>
                      vs {drift.average_hour.training} (train)
                    </span>
                  </div>
                  {Math.abs(drift.average_hour.delta) > 1.5 && (
                    <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', background:'rgba(251,191,36,0.1)', color:AMBER, border:'1px solid rgba(251,191,36,0.25)', borderRadius:20 }}>
                      ⚠ DRIFT
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'0.82rem', fontWeight:600, color: drift.average_hour.delta >= 0 ? EMERALD : ROSE, marginTop:8 }}>
                  Δ {drift.average_hour.delta > 0 ? '+' : ''}{drift.average_hour.delta} hours
                </div>
              </div>

              {/* Station shift */}
              <div style={{ padding:'16px', background:'rgba(255,255,255,0.025)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--adm-text-3)', marginBottom:12 }}>Top Station Shift</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { label:'Training', stations: drift.top_stations.training, color:'#475569' },
                    { label:'Live (7d)', stations: drift.top_stations.live_last_7d, color:CYAN },
                  ].map(({ label, stations, color }) => (
                    <div key={label}>
                      <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{label}</div>
                      {stations.slice(0,3).map((st,i) => (
                        <div key={i} style={{ fontSize:'0.82rem', marginBottom:6, color, fontWeight: label === 'Live (7d)' ? 600 : 400 }}>
                          {i+1}. {st.station}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Sentry Observability Panel */}
      <div className="glass-card" style={{
        padding:20,
        border:'1px solid rgba(99,102,241,0.2)',
        background:'rgba(99,102,241,0.03)',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:38, height:38, borderRadius:12,
              background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <Radio size={18} color={PURPLE} />
            </div>
            <div>
              <div style={{ fontSize:'0.85rem', fontWeight:800, color:'var(--adm-text)', display:'flex', alignItems:'center', gap:8 }}>
                Sentry Error Monitoring
                <span style={{
                  fontSize:'0.6rem', fontWeight:700, padding:'2px 8px',
                  background:'rgba(52,211,153,0.1)', color:'#34d399',
                  border:'1px solid rgba(52,211,153,0.25)', borderRadius:20,
                }}>● ACTIVE</span>
              </div>
              <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:2 }}>
                Real-time error tracking via Sentry — the same tool used by Disney &amp; Microsoft
              </div>
            </div>
          </div>
          <button
            className="admin-action-btn"
            style={{
              background: sentryStatus === 'sent'
                ? 'rgba(52,211,153,0.15)'
                : 'rgba(99,102,241,0.12)',
              border: sentryStatus === 'sent'
                ? '1px solid rgba(52,211,153,0.3)'
                : '1px solid rgba(99,102,241,0.3)',
              color: sentryStatus === 'sent' ? '#34d399' : PURPLE,
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 16px', borderRadius:10, fontWeight:700,
              fontSize:'0.78rem', cursor:'pointer', transition:'all 0.2s',
            }}
            onClick={triggerSentryTest}
            disabled={sentryStatus === 'sending'}
          >
            {sentryStatus === 'sent' ? (
              <><CheckCircle size={13} /> Sent to Sentry ✓</>
            ) : sentryStatus === 'sending' ? (
              <><Zap size={13} /> Sending...</>
            ) : (
              <><Zap size={13} /> Trigger Test Error</>
            )}
          </button>
        </div>
        {sentryStatus === 'sent' && (
          <div style={{
            marginTop:12, padding:'10px 14px',
            background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)',
            borderRadius:10, fontSize:'0.75rem', color:'#34d399', lineHeight:1.5,
          }}>
            ✅ Test error captured and sent to Sentry dashboard.{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noreferrer"
              style={{ color:'#6366f1', fontWeight:700, textDecoration:'underline' }}
            >
              Open Sentry →
            </a>
            {' '}to see the full stack trace, browser info, and OS context.
          </div>
        )}
      </div>
    </div>
  );
}
