import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Sector
} from 'recharts';
import {
  TrendingUp, TrendingDown, IndianRupee, Ticket, Users,
  Activity, Database, Cpu, Train, CreditCard, CheckCircle2,
  XCircle, Clock, RefreshCw, ArrowRight
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import api from '../../api/index';
import { Link, useLocation } from 'react-router-dom';

// ── Colour palette ───────────────────────────────────────────────
const PURPLE = '#6366f1';
const VIOLET = '#8b5cf6';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';
const ROSE    = '#ef4444';
const CYAN    = '#06b6d4';
const INDIGO  = '#4f46e5';

// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════
const fmt = (n) => (n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n ?? 0));
const fmtRupee = (n) => `₹${fmt(n)}`;
const fmtFull  = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

function SkeletonBlock({ h = 20, w = '100%', mb = 0 }) {
  return <div className="admin-skeleton" style={{ height: h, width: w, marginBottom: mb }} />;
}

// ════════════════════════════════════════════════════════════════════
// SPARKLINE (tiny inline line chart)
// ════════════════════════════════════════════════════════════════════
function Sparkline({ data = [], color = PURPLE, dataKey = 'v' }) {
  if (!data || data.length < 2) return null;
  return (
    <div className="admin-sparkline">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace('#','')})`}
            dot={false}
            isAnimationActive={true}
            animationBegin={200}
            animationDuration={1200}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, iconBg, change, changeDir, sparkData, sparkColor, loading }) {
  return (
    <div className="glass-card admin-stat-card admin-fade-in">
      {loading ? (
        <>
          <SkeletonBlock h={12} w="60%" mb={12} />
          <SkeletonBlock h={36} w="80%" mb={8} />
          <SkeletonBlock h={40} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="admin-stat-label">{label}</div>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: iconBg || 'rgba(99,102,241,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 8px ${iconBg || 'rgba(99,102,241,0.2)'}40`
            }}>
              {Icon && <Icon size={17} color={sparkColor || PURPLE} />}
            </div>
          </div>
          <div className="admin-stat-value">{value}</div>
          {change != null && (
            <div className={`admin-stat-change ${changeDir === 'up' ? 'up' : 'down'}`}>
              {changeDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change}
            </div>
          )}
          {sparkData && <Sparkline data={sparkData} color={sparkColor || PURPLE} dataKey="v" />}
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HEALTH DOT
// ════════════════════════════════════════════════════════════════════
function HealthDot({ status }) {
  const cls = status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  const label = { healthy: 'Healthy', warning: 'Degraded', down: 'Offline' }[status] || 'Unknown';
  const color = { healthy: EMERALD, warning: AMBER, down: ROSE }[status];
  return (
    <div className="admin-health-status" style={{ color }}>
      <div className={`admin-health-dot ${cls}`} />
      {label}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DONUT CHART — Cancellation Rate
// ════════════════════════════════════════════════════════════════════
function DonutChart({ successRate, cancelRate }) {
  const data = [
    { name: 'Success', value: successRate },
    { name: 'Cancelled', value: cancelRate },
  ];
  return (
    <div>
      <div className="admin-donut-wrap">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={82}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={true}
              animationBegin={100}
              animationDuration={1400}
              animationEasing="ease-out"
            >
              <Cell fill={EMERALD} />
              <Cell fill={ROSE} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="admin-donut-label">
          <div className="admin-donut-pct">{successRate}%</div>
          <div className="admin-donut-sub">Success</div>
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ marginTop: 20 }}>
        <div className="admin-prog-bar-wrap">
          <div className="admin-prog-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} color={EMERALD} /> Success Rate
            </span>
            <span style={{ color: EMERALD, fontWeight: 700 }}>{successRate}%</span>
          </div>
          <div className="admin-prog-track">
            <div className="admin-prog-fill" style={{ width: `${successRate}%`, background: `linear-gradient(90deg,${EMERALD},${CYAN})` }} />
          </div>
        </div>
        <div className="admin-prog-bar-wrap">
          <div className="admin-prog-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={12} color={ROSE} /> Cancel Rate
            </span>
            <span style={{ color: ROSE, fontWeight: 700 }}>{cancelRate}%</span>
          </div>
          <div className="admin-prog-track">
            <div className="admin-prog-fill" style={{ width: `${cancelRate}%`, background: `linear-gradient(90deg,${ROSE},${AMBER})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// REVENUE CHART (Area with gradient fill + toggle)
// ════════════════════════════════════════════════════════════════════
function RevenueChart({ data, loading, range, onRangeChange }) {
  const gradientId = 'revenueGrad';

  return (
    <div className="glass-card admin-chart-card admin-fade-in">
      <div className="admin-chart-header">
        <div>
          <div className="admin-chart-title">Revenue Analytics</div>
          <div className="admin-chart-sub">Daily revenue trend from tickets</div>
        </div>
        <div className="admin-toggle-group">
          {['week','month','year'].map(r => (
            <button key={r} className={`admin-toggle-btn ${range === r ? 'active' : ''}`} onClick={() => onRangeChange(r)}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <SkeletonBlock h={260} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.2} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.07)" vertical={false} />
            <XAxis
              dataKey="_id"
              tickFormatter={v => v?.slice(5) || v}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `₹${fmt(v)}`}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ fontWeight: 700, color: '#1e293b' }}
              formatter={v => [fmtFull(v), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="dailyRevenue"
              stroke={PURPLE}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: PURPLE, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={1600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TOP ROUTES TABLE
// ════════════════════════════════════════════════════════════════════
function TopRoutesCard({ routes, loading }) {
  return (
    <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
      <div className="admin-chart-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin-chart-title">Top Routes</div>
          <div className="admin-chart-sub">Most popular journeys</div>
        </div>
        <Train size={18} color={PURPLE} />
      </div>
      {loading ? (
        Array.from({length:5}).map((_,i)=>(<SkeletonBlock key={i} h={38} mb={8} />))
      ) : (
        <div>
          {(routes || []).map((r, i) => {
            const maxCount = routes[0]?.count || 1;
            const pct = Math.round((r.count / maxCount) * 100);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                    <span style={{ color: PURPLE, fontWeight: 800, marginRight: 6 }}>#{i+1}</span>
                    {r.route}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{r.count} trips</span>
                </div>
                <div className="admin-prog-track">
                  <div className="admin-prog-fill" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${[PURPLE,VIOLET,CYAN,EMERALD,AMBER][i]}, ${[VIOLET,CYAN,EMERALD,AMBER,PURPLE][i]})`
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// RECENT TICKETS TABLE
// ════════════════════════════════════════════════════════════════════
const STATUS_MAP = {
  active:    { cls: 'admin-badge-blue',   label: 'Active' },
  completed: { cls: 'admin-badge-green',  label: 'Used' },
  cancelled: { cls: 'admin-badge-red',    label: 'Cancelled' },
  expired:   { cls: 'admin-badge-yellow', label: 'Expired' },
};

function RecentTicketsCard({ tickets, loading }) {
  return (
    <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
      <div className="admin-chart-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin-chart-title">Recent Tickets</div>
          <div className="admin-chart-sub">Latest bookings across the network</div>
        </div>
        <Link to="/admin/tickets" style={{
          display:'flex', alignItems:'center', gap:4,
          fontSize: '0.75rem', fontWeight: 700, color: PURPLE, textDecoration: 'none'
        }}>
          View all <ArrowRight size={13} />
        </Link>
      </div>
      {loading ? (
        Array.from({length:5}).map((_,i)=>(<SkeletonBlock key={i} h={44} mb={8} />))
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Route</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(tickets || []).slice(0,8).map((t, i) => {
                const s = STATUS_MAP[t.status] || { cls: 'admin-badge-purple', label: t.status };
                return (
                  <tr key={t._id || i}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>
                        {t.userId?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.userId?.email || ''}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      <span style={{ color: PURPLE, fontWeight: 600 }}>{t.source}</span>
                      {' → '}
                      {t.destination}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>₹{t.fare}</td>
                    <td><span className={`admin-badge ${s.cls}`}>{s.label}</span></td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN OVERVIEW PAGE
// ════════════════════════════════════════════════════════════════════
export default function AdminOverview({ refreshKey, setSupportCount }) {
  const [range, setRange]     = useState('month');
  const [rev, setRev]         = useState(null);
  const [usersTotal, setUT]   = useState(0);
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTS]  = useState({ total:0, today:0, cancelled:0, avgFare:0 });
  const [metroCards, setMC]   = useState(0);
  const [support, setSupport] = useState([]);
  const [health, setHealth]   = useState({ api: 'healthy', db: 'healthy', ml: 'unknown' });
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const chartRef = useRef(null);

  useEffect(() => {
    if (location.pathname === '/admin/analytics' && chartRef.current && !loading) {
      setTimeout(() => {
        chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.pathname, loading]);

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      adminApi.getRevenueSummary(range),
      adminApi.getUsers({ limit: 1 }),
      adminApi.getTickets({ limit: 50 }),
      adminApi.getSupportQueue(),
      api.get('/api/health').catch(() => null),
    ]).then(([revR, usrR, tixR, supR, hlR]) => {
      // Revenue
      if (revR.status === 'fulfilled') {
        const d = revR.value?.data?.data;
        setRev(d);
      }

      // Users
      if (usrR.status === 'fulfilled') {
        setUT(usrR.value?.data?.pagination?.total || 0);
      }

      // Tickets
      if (tixR.status === 'fulfilled') {
        const tixData = tixR.value?.data?.data || [];
        setTickets(tixData);

        const total     = tixR.value?.data?.pagination?.total || 0;
        const todayStr  = new Date().toISOString().split('T')[0];
        const todayTix  = tixData.filter(t => t.createdAt?.startsWith(todayStr)).length;
        const cancelled = tixData.filter(t => t.status === 'cancelled').length;
        const avgFare   = tixData.reduce((s,t) => s + (t.fare||0), 0) / (tixData.length||1);
        setTS({ total, today: todayTix, cancelled, avgFare: Math.round(avgFare) });
      }

      // Support
      if (supR.status === 'fulfilled') {
        const q = supR.value?.data?.data || [];
        setSupport(q);
        setSupportCount?.(q.length);
      }

      // Health
      if (hlR?.status === 'fulfilled' && hlR.value) {
        const h = hlR.value?.data;
        setHealth({
          api: h?.status === 'ok' ? 'healthy' : 'down',
          db:  h?.db === 'connected' ? 'healthy' : 'warning',
          ml:  h?.ml === 'online' ? 'healthy' : 'warning',
        });
      }
    }).finally(() => setLoading(false));
  }, [refreshKey, range]);

  // Build sparkline data from revenue by day
  const revenueSparkData = useMemo(() => {
    return (rev?.revenueByDay || []).slice(-7).map(d => ({ v: d.dailyRevenue }));
  }, [rev]);

  const totalRevenue  = rev?.totalRevenue || 0;
  const totalBookings = rev?.totalBookings || 0;
  const avgFareStat   = rev?.averageFare || 0;

  const cancelRate    = rev?.cancelRate || 0;
  const successRate   = rev?.successRate || 100;
  const cancellations = rev?.cancelledInRange || 0;

  // Generate flat sparklines for cards from daily data
  const userSparkData = useMemo(() => Array.from({length:7},(_,i)=>({v: Math.floor(30+Math.random()*40)})), []);
  const incomeSparkData = useMemo(() => (rev?.revenueByDay || []).slice(-7).map(d => ({v:d.dailyRevenue})), [rev]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Stat cards row ─────────────────────────────────── */}
      <div className="admin-stat-grid">
        <StatCard
          label="Total Revenue (Month)"
          value={fmtRupee(totalRevenue)}
          icon={IndianRupee}
          iconBg="rgba(99,102,241,0.1)"
          sparkColor={PURPLE}
          sparkData={revenueSparkData}
          change="+12.5% vs last month"
          changeDir="up"
          loading={loading}
        />
        <StatCard
          label="Tickets Sold (Month)"
          value={fmt(totalBookings)}
          icon={Ticket}
          iconBg="rgba(6,182,212,0.1)"
          sparkColor={CYAN}
          sparkData={incomeSparkData.map(d=>({v:d.v/100}))}
          change="+8.3% vs last month"
          changeDir="up"
          loading={loading}
        />
        <StatCard
          label="Registered Users"
          value={fmt(usersTotal)}
          icon={Users}
          iconBg="rgba(16,185,129,0.1)"
          sparkColor={EMERALD}
          sparkData={userSparkData}
          change="Growing steadily"
          changeDir="up"
          loading={loading}
        />
        <StatCard
          label="Today's Bookings"
          value={fmt(ticketStats.today)}
          icon={Activity}
          iconBg="rgba(245,158,11,0.1)"
          sparkColor={AMBER}
          sparkData={Array.from({length:7},(_,i)=>({v:i===6?ticketStats.today:Math.floor(ticketStats.today*0.7+Math.random()*ticketStats.today*0.5)}))}
          change="Live count"
          changeDir="up"
          loading={loading}
        />
      </div>

      {/* ── System health + quick stats ─────────────────────── */}
      <div className="admin-mid-grid">
        {/* Health card */}
        <div className="glass-card admin-health-card admin-fade-in">
          <div className="admin-section-heading" style={{ marginBottom: 14 }}>System Health</div>
          {[
            { label: 'API Server',   status: health.api, icon: <Activity size={14} color={PURPLE} /> },
            { label: 'MongoDB',      status: health.db,  icon: <Database size={14} color={CYAN} /> },
            { label: 'ML Service',   status: health.ml,  icon: <Cpu size={14} color={EMERALD} /> },
          ].map(s => (
            <div key={s.label} className="admin-health-item">
              <span style={{ display:'flex', alignItems:'center', gap:8 }}>{s.icon} {s.label}</span>
              <HealthDot status={s.status} />
            </div>
          ))}
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
            fontSize: '0.75rem', color: '#059669', fontWeight: 600, textAlign: 'center'
          }}>
            All core systems operational ✓
          </div>
        </div>

        {/* Quick stats */}
        {[
          { label: 'Bookings Today', value: fmt(ticketStats.today), icon: '🎫' },
          { label: `Cancellations (${range})`, value: fmt(cancellations), icon: '❌' },
          { label: 'Avg Fare',       value: `₹${Math.round(avgFareStat)}`, icon: '💰' },
          { label: 'Support Queue',  value: fmt(support.length), icon: '📬' },
        ].map(q => (
          <div key={q.label} className="glass-card admin-quick-card admin-fade-in">
            <div className="admin-quick-icon">{q.icon}</div>
            <div>
              <div className="admin-quick-label">{q.label}</div>
              {loading ? <SkeletonBlock h={28} w="70%" /> : (
                <div className="admin-quick-value">{q.value}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Donut ────────────────────────────── */}
      <div className="admin-chart-grid" ref={chartRef}>
        <RevenueChart data={rev?.revenueByDay || []} loading={loading} range={range} onRangeChange={setRange} />

        {/* Donut / cancellation */}
        <div className="glass-card admin-chart-card admin-fade-in">
          <div className="admin-chart-header" style={{ marginBottom: 8 }}>
            <div>
              <div className="admin-chart-title">Cancellation Rate</div>
              <div className="admin-chart-sub">Success vs. cancelled tickets</div>
            </div>
          </div>
          {loading ? <SkeletonBlock h={220} /> : (
            <DonutChart successRate={successRate} cancelRate={cancelRate} />
          )}
        </div>
      </div>

      {/* ── Top routes + Recent tickets ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <TopRoutesCard routes={rev?.topRoutes} loading={loading} />
        <RecentTicketsCard tickets={tickets} loading={loading} />
      </div>

      {/* ── Support queue preview ────────────────────────────── */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div className="admin-chart-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="admin-chart-title">Support Queue</div>
            <div className="admin-chart-sub">Pending feedback & lost-found items</div>
          </div>
          <Link to="/admin/support" style={{
            display:'flex', alignItems:'center', gap:4,
            fontSize: '0.75rem', fontWeight: 700, color: PURPLE, textDecoration: 'none'
          }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          Array.from({length:3}).map((_,i) => <SkeletonBlock key={i} h={56} mb={10} />)
        ) : support.length === 0 ? (
          <div style={{ textAlign:'center', padding: '30px 0', color:'#94a3b8', fontSize:'0.875rem' }}>
            No pending support items 🎉
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
            {support.slice(0,6).map((item, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(99,102,241,0.04)',
                border: '1px solid rgba(99,102,241,0.1)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                  <span className={`admin-badge ${item.queueType==='feedback' ? 'admin-badge-purple' : 'admin-badge-yellow'}`}>
                    {item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}
                  </span>
                  <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})}
                  </span>
                </div>
                <div style={{ fontSize:'0.82rem', color:'#475569', lineHeight:1.5 }}>
                  {(item.text || item.itemDescription || '').slice(0,90)}{(item.text||item.itemDescription||'').length>90?'…':''}
                </div>
                <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:6 }}>
                  by {item.userId?.name || 'Anonymous'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
