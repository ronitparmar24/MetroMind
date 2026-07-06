// frontend/src/pages/Analytics.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getHeatmap } from '../api/analytics.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CROWD_COLORS = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };

function crowdLevel(val) {
  if (val <= 50) return 'Low';
  if (val <= 150) return 'Medium';
  return 'High';
}

export default function Analytics() {
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getHeatmap();
        setHeatmap(res.data.heatmap);
        const stations = Object.keys(res.data.heatmap?.heatmap || {});
        if (stations.length > 0) setSelectedStation(stations[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="page"><LoadingSpinner /></div>;

  const heatmapData = heatmap?.heatmap || {};
  const stations = Object.keys(heatmapData);
  const hours = heatmap?.hours || [];

  // Build chart data for selected station
  const stationChartData = selectedStation && heatmapData[selectedStation]
    ? hours.map((h) => ({
        hour: `${h}:00`,
        crowd: heatmapData[selectedStation][String(h)] || 0,
      }))
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analytics 📈</h1>
        <p className="page-subtitle">ML-powered crowd intelligence across stations</p>
      </div>

      {/* Crowd Heatmap Grid */}
      <GlassCard style={{ marginBottom: 'var(--space-xl)', padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>
          🗺️ Crowd Heatmap — Station × Hour
        </h3>
        <div style={{ minWidth: '800px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${hours.length}, 1fr)`, gap: '2px', fontSize: '0.7rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', padding: '4px' }}>Station</div>
            {hours.map((h) => (
              <div key={h} style={{ fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>
                {h}:00
              </div>
            ))}
            {stations.slice(0, 15).map((station) => (
              <>
                <div key={station} style={{
                  padding: '6px 4px', fontSize: '0.7rem', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: selectedStation === station ? 600 : 400,
                }}
                  onClick={() => setSelectedStation(station)}
                >
                  {station}
                </div>
                {hours.map((h) => {
                  const val = heatmapData[station]?.[String(h)] || 0;
                  const level = crowdLevel(val);
                  return (
                    <div key={`${station}-${h}`} style={{
                      background: `${CROWD_COLORS[level]}30`,
                      borderRadius: '3px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', color: CROWD_COLORS[level], fontWeight: 600,
                      cursor: 'pointer', minHeight: '28px',
                    }}
                      onClick={() => setSelectedStation(station)}
                    >
                      {Math.round(val)}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Station Detail Chart */}
      {selectedStation && stationChartData.length > 0 && (
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>
            📊 Hourly Crowd — {selectedStation}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stationChartData}>
              <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="crowd" radius={[4, 4, 0, 0]}>
                {stationChartData.map((entry, i) => (
                  <Cell key={i} fill={CROWD_COLORS[crowdLevel(entry.crowd)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}
    </div>
  );
}
