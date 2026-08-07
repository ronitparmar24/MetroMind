import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { Filter, ChevronLeft, ChevronRight, Train, Search, XCircle, Calendar } from 'lucide-react';

const STATUS_MAP = {
  upcoming:  { cls: 'admin-badge-purple', label: 'UPCOMING' },
  completed: { cls: 'admin-badge-green',  label: 'USED' },
  cancelled: { cls: 'admin-badge-red',    label: 'CANCELLED' },
};

const PURPLE = '#6366f1';
const ROSE   = '#f87171';

function SkeletonRow() {
  return (
    <tr>
      {Array.from({length:7}).map((_,i) => (
        <td key={i} style={{ padding:'14px' }}>
          <div className="admin-skeleton" style={{ height:14, borderRadius:6 }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminTicketsPage() {
  const [tickets, setTickets]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [status, setStatus]     = useState('');
  const [search, setSearch]     = useState('');
  const [searchQ, setSearchQ]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getTickets({
      page, limit: 15,
      status: status || undefined,
      search: searchQ || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
    })
      .then(r => {
        setTickets(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
        setPages(r.data.pagination?.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status, searchQ, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQ(search);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this ticket? This cannot be undone.')) return;
    setCancelling(id);
    try {
      await adminApi.cancelTicket(id);
      setTickets(ts => ts.map(t => t._id === id ? { ...t, status: 'cancelled' } : t));
    } catch(e) { console.error(e); }
    finally { setCancelling(null); }
  };

  const clearFilters = () => {
    setStatus(''); setSearch(''); setSearchQ(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasFilters = status || searchQ || dateFrom || dateTo;
  const statuses = ['', 'upcoming', 'completed', 'cancelled'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:40, height:40, borderRadius:12,
              background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Train size={18} color={PURPLE} />
            </div>
            <div>
              <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>
                Ticket Management
              </div>
              <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>{total.toLocaleString()} total tickets</div>
            </div>
          </div>
          {hasFilters && (
            <button className="admin-action-btn admin-action-btn-ghost" onClick={clearFilters} style={{ color: ROSE }}>
              <XCircle size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* Status filter row */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {statuses.map(s => (
            <button key={s} className={`admin-action-btn ${status===s ? 'admin-action-btn-primary' : 'admin-action-btn-ghost'}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Search + Date row */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
              <input
                className="admin-input"
                style={{ paddingLeft:30, width:200 }}
                placeholder="Search passenger…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="admin-action-btn admin-action-btn-primary">Search</button>
          </form>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Calendar size={13} color="#64748b" />
            <input
              type="date"
              className="admin-input" style={{ width:150 }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            />
            <span style={{ color:'#475569', fontSize:'0.8rem' }}>–</span>
            <input
              type="date"
              className="admin-input" style={{ width:150 }}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card admin-fade-in" style={{ padding:24 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Passenger</th>
                <th>From → To</th>
                <th>Fare</th>
                <th>Travel Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:8}).map((_,i) => <SkeletonRow key={i} />)
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>No tickets found</td></tr>
              ) : (
                tickets.map((t,i) => {
                  const s = STATUS_MAP[t.status] || { cls:'admin-badge-purple', label:t.status };
                  return (
                    <tr key={t._id || i}>
                      <td data-label="ID" style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem', color:'#475569', userSelect:'all' }}>
                        {String(t._id).slice(-8)}
                      </td>
                      <td data-label="Passenger">
                        <div style={{ fontWeight:700, fontSize:'0.82rem' }}>{t.userId?.name || 'Unknown'}</div>
                        <div style={{ fontSize:'0.7rem', color:'#475569' }}>{t.userId?.email || ''}</div>
                      </td>
                      <td data-label="Route" style={{ fontSize:'0.82rem' }}>
                        <span style={{ fontWeight:600, color:PURPLE }}>{t.source}</span>
                        <span style={{ color:'#475569', margin:'0 4px' }}>→</span>
                        <span style={{ fontWeight:500, color:'var(--adm-text-3)' }}>{t.destination}</span>
                      </td>
                      <td data-label="Fare" style={{ fontWeight:800, fontFamily:'Space Grotesk, sans-serif', color:'var(--adm-text)' }}>₹{t.fare}</td>
                      <td data-label="Date" style={{ fontSize:'0.78rem', color:'#64748b' }}>
                        {t.travelDate ? new Date(t.travelDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                        {t.travelTime && <span style={{display:'block', fontSize:'0.7rem', marginTop:2}}>{t.travelTime}</span>}
                      </td>
                      <td data-label="Status"><span className={`admin-badge ${s.cls}`}>{s.label}</span></td>
                      <td data-label="Actions">
                        {t.status !== 'cancelled' && t.status !== 'completed' && (
                          <button
                            className="admin-action-btn admin-action-btn-danger"
                            style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                            onClick={() => handleCancel(t._id)}
                            disabled={cancelling === t._id}
                          >
                            <XCircle size={11} />
                            {cancelling === t._id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:'0.78rem', color:'#64748b' }}>Page {page} of {pages} · {total} total</div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="admin-action-btn admin-action-btn-ghost" disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="admin-action-btn admin-action-btn-primary" disabled={page>=pages} onClick={() => setPage(p=>Math.min(pages,p+1))}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
