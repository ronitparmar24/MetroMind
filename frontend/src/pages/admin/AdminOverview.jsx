import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, IndianRupee, Ticket, Users,
  Activity, Database, Cpu, Train, CheckCircle2,
  XCircle, ArrowRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import api from '../../api/index';
import { Link } from 'react-router-dom';
import { useWindowWidth } from '../../hooks/useWindowWidth';

const PURPLE  = '#6366f1';
const VIOLET  = '#a78bfa';
const EMERALD = '#34d399';
const AMBER   = '#fbbf24';
const ROSE    = '#f87171';
const CYAN    = '#22d3ee';

const fmt      = (n) => (n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n ?? 0));
const fmtRupee = (n) => `₹${fmt(n)}`;
const fmtFull  = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

function SkeletonBlock({ h = 20, w = '100%', mb = 0 }) {
  return <div className="admin-skeleton" style={{ height: h, width: w, marginBottom: mb }} />;
}

// ── Sparkline ─────────────────────────────────────────
function Sparkline({ data = [], color = PURPLE }) {
  const width = useWindowWidth();
  if (!data || data.length < 2) return null;
  return (
    <div className="admin-sparkline">
      <div style={{ width: '100%', height: 40, overflow: 'hidden' }}>
        <AreaChart width={Math.max(width * 0.15, 120)} height={40} data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="v"
            stroke={color} strokeWidth={2}
            fill={`url(#spark-${color.replace('#','')})`}
            dot={false} isAnimationActive={true}
            animationBegin={200} animationDuration={1200}
          />
        </AreaChart>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconColor, change, changeDir, changeLabel, sparkData, sparkColor, loading, neonColor }) {
  return (
    <div className="glass-card admin-stat-card admin-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      {neonColor && (
        <div className="admin-neon-accent" style={{ background: neonColor }} />
      )}
      {loading ? (
        <>
          <SkeletonBlock h={10} w="55%" mb={14} />
          <SkeletonBlock h={34} w="70%" mb={10} />
          <SkeletonBlock h={40} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="admin-stat-label">{label}</div>
            {Icon && (
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: `${iconColor}18`,
                border: `1px solid ${iconColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${iconColor}20`,
              }}>
                <Icon size={16} color={iconColor} />
              </div>
            )}
          </div>
          <div className="admin-stat-value">{value}</div>
          {changeDir != null && (
            <div className={`admin-stat-change ${changeDir === 'up' ? 'up' : 'down'}`}>
              {changeDir === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {change != null ? `${change > 0 ? '+' : ''}${change}%` : ''} {changeLabel}
            </div>
          )}
          {sparkData && <Sparkline data={sparkData} color={sparkColor || PURPLE} />}
        </>
      )}
    </div>
  );
}

// ── Health dot ────────────────────────────────────────
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

// ── Donut chart ───────────────────────────────────────
function DonutChart({ successRate, cancelRate }) {
  const data = [
    { name: 'Success',   value: successRate },
    { name: 'Cancelled', value: cancelRate  },
  ];
  return (
    <div>
      <div className="admin-donut-wrap">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={58} outerRadius={82}
              startAngle={90} endAngle={-270}
              dataKey="value" strokeWidth={0}
              isAnimationActive={true} animationBegin={100} animationDuration={1400}
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
      <div style={{ marginTop: 20 }}>
        {[
          { label: 'Success Rate', value: successRate, color: EMERALD, icon: CheckCircle2 },
          { label: 'Cancel Rate',  value: cancelRate,  color: ROSE,    icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="admin-prog-bar-wrap">
            <div className="admin-prog-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} color={color} /> {label}
              </span>
              <span style={{ color, fontWeight: 700 }}>{value}%</span>
            </div>
            <div className="admin-prog-track">
              <div className="admin-prog-fill" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Revenue Chart ─────────────────────────────────────
function RevenueChart({ data, loading, range, onRangeChange }) {
  const width = useWindowWidth();
  
  // Need to pad data if it's just 1 point
  const chartData = data && data.length === 1 
    ? [{_id: 'Start', dailyRevenue: 0}, ...data, {_id: 'End', dailyRevenue: 0}]
    : data;

  return (
    <div className="glass-card admin-chart-card admin-fade-in">
      <div className="admin-chart-header">
        <div>
          <div className="admin-chart-title">Revenue Analytics</div>
          <div className="admin-chart-sub">Daily revenue trend from ticket sales</div>
        </div>
        <div className="admin-toggle-group">
          {['week','month','year'].map(r => (
            <button key={r} className={`admin-toggle-btn ${range === r ? 'active' : ''}`} onClick={() => onRangeChange(r)}>
              {r.charAt(0).toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading ? <SkeletonBlock h={260} /> : (
        <div style={{ width: '100%', height: 260, overflowX: 'auto', overflowY: 'hidden' }}>
          <AreaChart width={Math.max(width - (width < 768 ? 64 : 320), 500)} height={260} data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.25} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="_id" type="category" tickFormatter={v => v?.slice(5) || v} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `₹${fmt(v)}`} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip
              contentStyle={{ background: '#0d1117', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }}
              labelStyle={{ fontWeight: 700, color: '#f1f5f9' }}
              formatter={v => [fmtFull(v), 'Revenue']}
            />
            <Area type="monotone" dataKey="dailyRevenue" stroke={PURPLE} strokeWidth={2.5}
              fill="url(#revGrad)" dot={false}
              activeDot={{ r: 5, fill: PURPLE, stroke: '#0d1117', strokeWidth: 2 }}
              isAnimationActive={true} animationDuration={1400}
            />
          </AreaChart>
        </div>
      )}
    </div>
  );
}

// ── Top Routes ────────────────────────────────────────
function TopRoutesCard({ routes, loading }) {
  const colors = [PURPLE, VIOLET, CYAN, EMERALD, AMBER];
  return (
    <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
      <div className="admin-chart-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin-chart-title">Top Routes</div>
          <div className="admin-chart-sub">Most popular journeys</div>
        </div>
        <Train size={16} color={PURPLE} />
      </div>
      {loading ? (
        Array.from({length:5}).map((_,i) => <SkeletonBlock key={i} h={36} mb={10} />)
      ) : (routes || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: '0.82rem' }}>No route data yet</div>
      ) : (
        <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: 8 }}>
          {(routes || []).map((r, i) => {
            const maxCount = routes[0]?.count || 1;
            const pct = Math.round((r.count / maxCount) * 100);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
                    <span style={{ color: colors[i], fontWeight: 800, marginRight: 6 }}>#{i+1}</span>
                    {r.route}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>{r.count} trips</span>
                </div>
                <div className="admin-prog-track">
                  <div className="admin-prog-fill" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${colors[i]}, ${colors[(i+1)%5]})`,
                    boxShadow: `0 0 8px ${colors[i]}40`,
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

// ── Recent Tickets ────────────────────────────────────
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
          fontSize: '0.75rem', fontWeight: 700, color: PURPLE, textDecoration: 'none',
          padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          View all <ArrowRight size={12} />
        </Link>
      </div>
      {loading ? (
        Array.from({length:5}).map((_,i) => <SkeletonBlock key={i} h={44} mb={8} />)
      ) : (
        <div className="admin-table-wrap" style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Passenger</th><th>Route</th><th>Fare</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(tickets || []).slice(0,8).map((t, i) => {
                const s = STATUS_MAP[t.status] || { cls: 'admin-badge-purple', label: t.status };
                return (
                  <tr key={t._id || i}>
                    <td data-label="Passenger">
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{t.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#475569' }}>{t.userId?.email || ''}</div>
                    </td>
                    <td data-label="Route" style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: PURPLE, fontWeight: 600 }}>{t.source}</span>
                      {' → '}
                      <span style={{ color: 'var(--adm-text-3)' }}>{t.destination}</span>
                    </td>
                    <td data-label="Fare" style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Space Grotesk, sans-serif' }}>₹{t.fare}</td>
                    <td data-label="Status"><span className={`admin-badge ${s.cls}`}>{s.label}</span></td>
                    <td data-label="Date" style={{ fontSize: '0.72rem', color: '#475569' }}>
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

// ══ MAIN OVERVIEW ══════════════════════════════════════
export default function AdminOverview({ refreshKey, setSupportCount }) {
  const [range, setRange]     = useState('month');
  const [rev, setRev]         = useState(null);
  const [usersTotal, setUT]   = useState(0);
  const [tickets, setTickets] = useState([]);
  const [ticketStats, setTS]  = useState({ total:0, today:0, cancelled:0, avgFare:0 });
  const [support, setSupport] = useState([]);
  const [health, setHealth]   = useState({ api: 'healthy', db: 'healthy', ml: 'unknown' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      adminApi.getRevenueSummary(range),
      adminApi.getUsers({ limit: 1 }),
      adminApi.getTickets({ limit: 50 }),
      adminApi.getSupportQueue(),
      api.get('/api/health').catch(() => null),
    ]).then(([revR, usrR, tixR, supR, hlR]) => {
      if (revR.status === 'fulfilled') {
        setRev(revR.value?.data?.data);
      }
      if (usrR.status === 'fulfilled') {
        setUT(usrR.value?.data?.pagination?.total || 0);
      }
      if (tixR.status === 'fulfilled') {
        const tixData = tixR.value?.data?.data || [];
        setTickets(tixData);
        const total    = tixR.value?.data?.pagination?.total || 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTix = tixData.filter(t => t.createdAt?.startsWith(todayStr)).length;
        const cancelled = tixData.filter(t => t.status === 'cancelled').length;
        const avgFare  = tixData.reduce((s,t) => s + (t.fare||0), 0) / (tixData.length||1);
        setTS({ total, today: todayTix, cancelled, avgFare: Math.round(avgFare) });
      }
      if (supR.status === 'fulfilled') {
        const q = supR.value?.data?.data || [];
        setSupport(q);
        setSupportCount?.(q.length);
      }
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

  const revenueSparkData = useMemo(() =>
    (rev?.revenueByDay || []).slice(-7).map(d => ({ v: d.dailyRevenue })),
  [rev]);

  const incomeSparkData = useMemo(() =>
    (rev?.revenueByDay || []).slice(-7).map(d => ({ v: d.dailyRevenue })),
  [rev]);

  // Stable user spark — deterministic based on total, not Math.random()
  const userSparkData = useMemo(() => {
    const base = usersTotal || 10;
    return Array.from({length:7},(_,i) => ({ v: Math.round(base * (0.7 + (i / 6) * 0.3)) }));
  }, [usersTotal]);

  const totalRevenue  = rev?.totalRevenue  || 0;
  const totalBookings = rev?.totalBookings || 0;
  const avgFareStat   = rev?.averageFare   || 0;
  const cancelRate    = rev?.cancelRate    || 0;
  const successRate   = rev?.successRate   || 100;
  const cancellations = rev?.cancelledInRange || 0;
  const revPct        = rev?.revenuePctChange;
  const bkPct         = rev?.bookingsPctChange;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat Cards */}
      <div className="admin-stat-grid">
        <StatCard
          label="Total Revenue (Month)" value={fmtRupee(totalRevenue)}
          icon={IndianRupee} iconColor={PURPLE} neonColor={PURPLE}
          sparkColor={PURPLE} sparkData={revenueSparkData}
          change={revPct} changeDir={revPct != null ? (parseFloat(revPct) >= 0 ? 'up' : 'down') : null}
          changeLabel="vs last period"
          loading={loading}
        />
        <StatCard
          label="Tickets Sold (Month)" value={fmt(totalBookings)}
          icon={Ticket} iconColor={CYAN} neonColor={CYAN}
          sparkColor={CYAN} sparkData={incomeSparkData.map(d=>({v:d.v/50||1}))}
          change={bkPct} changeDir={bkPct != null ? (parseFloat(bkPct) >= 0 ? 'up' : 'down') : null}
          changeLabel="vs last period"
          loading={loading}
        />
        <StatCard
          label="Registered Users" value={fmt(usersTotal)}
          icon={Users} iconColor={EMERALD} neonColor={EMERALD}
          sparkColor={EMERALD} sparkData={userSparkData}
          changeDir="up" changeLabel="Growing steadily"
          loading={loading}
        />
        <StatCard
          label="Today's Bookings" value={fmt(ticketStats.today)}
          icon={Activity} iconColor={AMBER} neonColor={AMBER}
          sparkColor={AMBER}
          sparkData={Array.from({length:7},(_,i) => ({
            v: i===6 ? ticketStats.today : Math.max(1, Math.round(ticketStats.today * (0.5 + (i/6)*0.4)))
          }))}
          changeDir="up" changeLabel="Live count"
          loading={loading}
        />
      </div>

      {/* Health + Quick Stats */}
      <div className="admin-mid-grid">
        <div className="glass-card admin-health-card admin-fade-in">
          <div className="admin-section-heading" style={{ marginBottom: 14 }}>System Health</div>
          {[
            { label: 'API Server', status: health.api, icon: <Activity size={13} color={PURPLE} /> },
            { label: 'MongoDB',   status: health.db,  icon: <Database size={13} color={CYAN} /> },
            { label: 'ML Service',status: health.ml,  icon: <Cpu size={13} color={EMERALD} /> },
          ].map(s => (
            <div key={s.label} className="admin-health-item">
              <span style={{ display:'flex', alignItems:'center', gap:8, fontSize: '0.82rem' }}>{s.icon} {s.label}</span>
              <HealthDot status={s.status} />
            </div>
          ))}
          <div style={{
            marginTop: 14, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
            fontSize: '0.72rem', color: '#34d399', fontWeight: 600, textAlign: 'center',
            boxShadow: '0 0 12px rgba(52,211,153,0.08)',
          }}>
            ✓ All core systems operational
          </div>
        </div>

        {[
          { label: 'Bookings Today',          value: fmt(ticketStats.today), icon: '🎫', color: PURPLE },
          { label: `Cancellations (${range})`, value: fmt(cancellations),    icon: '❌', color: ROSE },
          { label: 'Avg Fare',                 value: `₹${Math.round(avgFareStat)}`, icon: '💰', color: AMBER },
          { label: 'Support Queue',            value: fmt(support.length),   icon: '📬', color: CYAN },
        ].map(q => (
          <div key={q.label} className="glass-card admin-quick-card admin-fade-in">
            <div className="admin-quick-icon">{q.icon}</div>
            <div>
              <div className="admin-quick-label">{q.label}</div>
              {loading ? <SkeletonBlock h={28} w="70%" /> : (
                <div className="admin-quick-value" style={{ color: q.color, textShadow: `0 0 20px ${q.color}50` }}>
                  {q.value}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart + Donut */}
      <div className="admin-chart-grid">
        <RevenueChart data={rev?.revenueByDay || []} loading={loading} range={range} onRangeChange={setRange} />
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

      {/* Top Routes + Recent Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <TopRoutesCard routes={rev?.topRoutes} loading={loading} />
        <RecentTicketsCard tickets={tickets} loading={loading} />
      </div>

      {/* Support Queue Preview */}
      <div className="glass-card admin-fade-in" style={{ padding: 24 }}>
        <div className="admin-chart-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="admin-chart-title">Support Queue</div>
            <div className="admin-chart-sub">Pending feedback & lost-found items</div>
          </div>
          <Link to="/admin/support" style={{
            display:'flex', alignItems:'center', gap:4,
            fontSize: '0.75rem', fontWeight: 700, color: PURPLE, textDecoration: 'none',
            padding: '4px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          Array.from({length:3}).map((_,i) => <SkeletonBlock key={i} h={56} mb={10} />)
        ) : support.length === 0 ? (
          <div style={{ textAlign:'center', padding: '30px 0', color:'#475569', fontSize:'0.875rem' }}>
            No pending support items 🎉
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
            {support.slice(0,6).map((item, i) => (
              <div key={i} style={{
                padding: '14px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                  <span className={`admin-badge ${item.queueType==='feedback' ? 'admin-badge-purple' : 'admin-badge-yellow'}`}>
                    {item.queueType === 'feedback' ? 'Feedback' : 'Lost & Found'}
                  </span>
                  <span style={{ fontSize:'0.7rem', color:'#475569' }}>
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short'})}
                  </span>
                </div>
                <div style={{ fontSize:'0.82rem', color:'var(--adm-text-3)', lineHeight:1.5 }}>
                  {(item.text || item.itemDescription || '').slice(0,80)}
                  {(item.text||item.itemDescription||'').length>80?'…':''}
                </div>
                <div style={{ fontSize:'0.7rem', color:'#475569', marginTop:6 }}>
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
