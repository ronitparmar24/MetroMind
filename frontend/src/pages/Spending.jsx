// frontend/src/pages/Spending.jsx
import { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EcoLeaderboard from '../components/charts/EcoLeaderboard';
import { getSpending } from '../api/analytics.api';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useWindowWidth } from '../hooks/useWindowWidth';

export default function Spending() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const width = useWindowWidth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSpending();
        setData(res.data.spending);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (!data) return <div className="page"><p>No spending data available</p></div>;

  const chartData = Object.entries(data.dailySpending || {}).map(([date, amount]) => ({
    date: date.slice(5), amount,
  }));

  // Recharts sometimes fails to render a BarChart if there is exactly 1 data point.
  // Pad with empty data points if necessary to ensure it renders axes properly.
  if (chartData.length === 1) {
    chartData.unshift({ date: 'Start', amount: 0 });
    chartData.push({ date: 'End', amount: 0 });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Spending 💸</h1>
        <p className="page-subtitle">30-day spending insights & cab-vs-metro comparison</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatCard icon="🚇" value={formatCurrency(data.totalMetroCost)} label="Metro Spent" color="var(--accent-primary)" />
        <StatCard icon="🚕" value={formatCurrency(data.totalCabCost)} label="Cab Would Cost" color="#f59e0b" />
        <StatCard icon="💰" value={formatCurrency(data.savings)} label="You Saved" color="#22c55e" />
        <StatCard icon="📊" value={`${data.savingsPercent}%`} label="Savings Rate" color="#8b5cf6" />
      </div>

      {/* Cab vs Metro Comparison */}
      <GlassCard style={{ marginBottom: 'var(--space-xl)', padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '20px' }}>
          🚇 Metro vs 🚕 Cab Comparison
        </h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Metro</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(data.totalMetroCost)}</span>
            </div>
            <div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                width: data.totalCabCost > 0 ? `${(data.totalMetroCost / data.totalCabCost) * 100}%` : '0%',
                height: '100%', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-full)',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cab (estimated)</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(data.totalCabCost)}</span>
            </div>
            <div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                borderRadius: 'var(--radius-full)',
              }} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Daily Spending Chart */}
      {chartData.length > 0 && (
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px' }}>
            📊 Daily Spending (Last 30 Days)
          </h3>
          <div style={{ width: '100%', height: 250, overflowX: 'auto', overflowY: 'hidden' }}>
            <BarChart 
              width={Math.max(width - (width < 768 ? 64 : 320), 400)} 
              height={250} 
              data={chartData} 
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="date" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </div>
        </GlassCard>
      )}

      {/* Eco Leaderboard */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <EcoLeaderboard />
      </div>
    </div>
  );
}
