import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import { adminApi } from '../../api/admin.api';
import { BarChart3, TrendingUp, Users, IndianRupee, Download } from 'lucide-react';

const PURPLE  = '#6366f1';
const CYAN    = '#22d3ee';
const EMERALD = '#34d399';
const AMBER   = '#fbbf24';
const ROSE    = '#f87171';
const VIOLET  = '#a78bfa';

const fmt     = (n) => (n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n ?? 0));
const fmtFull = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

function SkeletonBlock({ h = 20, w = '100%', mb = 0 }) {
  return <div className="admin-skeleton" style={{ height: h, width: w, marginBottom: mb }} />;
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: '#f1f5f9' },
  labelStyle: { fontWeight: 700, color: '#f1f5f9' },
};

export default function AdminAnalytics({ refreshKey }) {
  const width = useWindowWidth();
  const [rev, setRev]         = useState(null);
  const [usersTotal, setUT]   = useState(0);
  const [range, setRange]     = useState('month');
  const [loading, setLoading] = useState(true);
  const [activeTab, setTab]   = useState('revenue');

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      adminApi.getRevenueSummary(range),
      adminApi.getUsers({ limit: 1 }),
    ]).then(([revR, usrR]) => {
      if (revR.status === 'fulfilled') setRev(revR.value?.data?.data);
      if (usrR.status === 'fulfilled') setUT(usrR.value?.data?.pagination?.total || 0);
    }).finally(() => setLoading(false));
  }, [refreshKey, range]);

  const revenueByDay = rev?.revenueByDay || [];

  // Route performance data
  const routeData = useMemo(() => {
    return (rev?.topRoutes || []).map(r => ({
      name: r.route?.split(' → ')[0] || r.route,
      trips: r.count,
      fullRoute: r.route,
    }));
  }, [rev]);

  // Booking vs Cancellation combined chart data
  const bookingVsCancelData = useMemo(() => {
    return revenueByDay.map(d => {
      // Format date nicely based on range
      let dateStr = d._id;
      try {
        if (range === 'year') {
          // d._id is 'YYYY-MM'
          const [yy, mm] = d._id.split('-');
          const dObj = new Date(parseInt(yy), parseInt(mm) - 1, 1);
          dateStr = dObj.toLocaleDateString('en-IN', { month: 'short' });
        } else {
          // d._id is 'YYYY-MM-DD'
          const dObj = new Date(d._id);
          dateStr = dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
      } catch (e) {}
      
      return {
        date: dateStr,
        fullDate: d._id,
        revenue: d.dailyRevenue || 0,
        count: d.count || 0,
      };
    });
  }, [revenueByDay, range]);

  const tabs = [
    { id: 'revenue',  label: 'Revenue',  icon: <IndianRupee size={14} /> },
    { id: 'bookings', label: 'Bookings', icon: <TrendingUp size={14} /> },
    { id: 'routes',   label: 'Routes',   icon: <BarChart3 size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart3 size={22} color={PURPLE} />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-text)' }}>
              Analytics Center
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
              In-depth performance metrics
            </div>
          </div>
        </div>
        <div className="admin-toggle-group">
          {['week','month','year'].map(r => (
            <button key={r} className={`admin-toggle-btn ${range===r?'active':''}`} onClick={() => setRange(r)}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Revenue',   value: fmtFull(rev?.totalRevenue),  color: PURPLE, icon: '💜' },
          { label: 'Total Bookings',  value: fmt(rev?.totalBookings),      color: CYAN,   icon: '🎫' },
          { label: 'Success Rate',    value: `${rev?.successRate ?? 100}%`, color: EMERALD, icon: '✅' },
          { label: 'Avg Fare',        value: `₹${Math.round(rev?.averageFare || 0)}`, color: AMBER, icon: '💰' },
        ].map(k => (
          <div key={k.label} className="glass-card admin-fade-in" style={{ padding: 20 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{k.label}</div>
            {loading ? <SkeletonBlock h={28} w="60%" /> : (
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 900, color: k.color, textShadow: `0 0 20px ${k.color}40` }}>
                {k.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px',
              fontSize: '0.82rem', fontWeight: 600,
              color: activeTab === t.id ? PURPLE : '#64748b',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === t.id ? PURPLE : 'transparent'}`,
              marginBottom: -1,
              transition: 'all 0.2s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? <SkeletonBlock h={280} /> : (
          <>
            {activeTab === 'revenue' && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text)' }}>
                    Revenue Over Time
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Daily revenue from ticket sales (excluding cancellations)</div>
                </div>
                <div style={{ width: '100%', height: 300, overflowX: 'auto', overflowY: 'hidden' }}>
                  <AreaChart width={Math.max(width - (width < 768 ? 64 : 320), 500)} height={300} data={bookingVsCancelData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anaRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" type="category" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={{stroke: 'rgba(255,255,255,0.08)'}} tickLine={false} tickMargin={10} />
                    <YAxis tickFormatter={v => `₹${fmt(v)}`} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={v => [fmtFull(v), 'Revenue']} labelFormatter={l => `Date: ${l}`} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="revenue" stroke={PURPLE} strokeWidth={3}
                      fill="url(#anaRevGrad)" 
                      dot={{ r: 3, fill: '#1e293b', stroke: PURPLE, strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: PURPLE, stroke: '#fff', strokeWidth: 3, style: { filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.8))' } }}
                    />
                  </AreaChart>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text)' }}>Booking Volume</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Daily ticket booking count</div>
                </div>
                <div style={{ width: '100%', height: 300, overflowX: 'auto', overflowY: 'hidden' }}>
                  <BarChart width={Math.max(width - (width < 768 ? 64 : 320), 500)} height={300} data={bookingVsCancelData} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" type="category" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={{stroke: 'rgba(255,255,255,0.08)'}} tickLine={false} tickMargin={10} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={v => [v, 'Tickets']} labelFormatter={l => `Date: ${l}`} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" fill={CYAN} radius={[6,6,0,0]} maxBarSize={45}
                      style={{ filter: `drop-shadow(0 4px 12px ${CYAN}40)` }}
                    />
                  </BarChart>
                </div>
              </div>
            )}

            {activeTab === 'routes' && (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--adm-text)' }}>Top Routes Performance</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Most popular routes by number of trips</div>
                </div>
                {routeData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>No route data available yet</div>
                ) : (
                  <div style={{ width: '100%', height: 300, overflowX: 'auto', overflowY: 'hidden' }}>
                    <BarChart width={Math.max(width - (width < 768 ? 64 : 320), 500)} height={300} data={routeData} layout="vertical" margin={{ top: 15, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} axisLine={{stroke: 'rgba(255,255,255,0.08)'}} tickLine={false} width={150} tickMargin={10} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={v => [v, 'Trips']} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="trips" fill={VIOLET} radius={[0,6,6,0]} maxBarSize={28}
                        style={{ filter: `drop-shadow(4px 0 12px ${VIOLET}40)` }}
                      />
                    </BarChart>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Table */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1rem', fontWeight: 800, color: 'var(--adm-text)', marginBottom: 16 }}>
          Revenue Breakdown by Period
        </div>
        {loading ? (
          Array.from({length:5}).map((_,i) => <SkeletonBlock key={i} h={38} mb={8} />)
        ) : revenueByDay.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:'#475569' }}>No data for this period</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Tickets Sold</th>
                  <th>Revenue</th>
                  <th>Avg per Ticket</th>
                </tr>
              </thead>
              <tbody>
                {revenueByDay.map((d, i) => (
                  <tr key={i}>
                    <td data-label="Period" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--adm-text-3)' }}>{d._id}</td>
                    <td data-label="Tickets Sold" style={{ fontWeight: 700 }}>{d.count || 0}</td>
                    <td data-label="Revenue" style={{ fontWeight: 800, color: PURPLE, fontFamily: 'Space Grotesk, sans-serif' }}>{fmtFull(d.dailyRevenue)}</td>
                    <td data-label="Avg per Ticket" style={{ color: '#64748b' }}>
                      {d.count > 0 ? `₹${Math.round((d.dailyRevenue||0) / d.count)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
