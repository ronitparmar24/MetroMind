import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { Filter, ChevronLeft, ChevronRight, Train } from 'lucide-react';

const STATUS_MAP = {
  active:    { cls: 'admin-badge-blue',   label: 'Active' },
  completed: { cls: 'admin-badge-green',  label: 'Used' },
  cancelled: { cls: 'admin-badge-red',    label: 'Cancelled' },
  expired:   { cls: 'admin-badge-yellow', label: 'Expired' },
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({length:7}).map((_,i)=>(
        <td key={i} style={{ padding:'14px 14px' }}>
          <div className="admin-skeleton" style={{ height:14, borderRadius:6 }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [status, setStatus]   = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getTickets({ page, limit:15, status: status || undefined })
      .then(r => {
        setTickets(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
        setPages(r.data.pagination?.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const statuses = ['', 'active', 'completed', 'cancelled', 'expired'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
            <Train size={20} color="#6366f1" /> Ticket Management
          </div>
          <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{total.toLocaleString()} total tickets</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {statuses.map(s => (
            <button key={s} className={`admin-action-btn ${status===s ? 'admin-action-btn-primary' : 'admin-action-btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card admin-fade-in" style={{ padding:24 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>From</th>
                <th>To</th>
                <th>Fare</th>
                <th>Travel Date</th>
                <th>Status</th>
                <th>Booked</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:8}).map((_,i)=><SkeletonRow key={i} />)
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>No tickets found</td></tr>
              ) : (
                tickets.map((t,i) => {
                  const s = STATUS_MAP[t.status] || { cls:'admin-badge-purple', label:t.status };
                  return (
                    <tr key={t._id || i}>
                      <td>
                        <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#0f172a' }}>{t.userId?.name || 'Unknown'}</div>
                        <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{t.userId?.email || ''}</div>
                      </td>
                      <td style={{ fontWeight:600, fontSize:'0.82rem', color:'#6366f1' }}>{t.source}</td>
                      <td style={{ fontWeight:600, fontSize:'0.82rem', color:'#475569' }}>{t.destination}</td>
                      <td style={{ fontWeight:800, color:'#0f172a' }}>₹{t.fare}</td>
                      <td style={{ fontSize:'0.78rem', color:'#64748b' }}>{t.travelDate || '—'}</td>
                      <td><span className={`admin-badge ${s.cls}`}>{s.label}</span></td>
                      <td style={{ fontSize:'0.75rem', color:'#94a3b8' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20, paddingTop:16, borderTop:'1px solid rgba(99,102,241,0.08)' }}>
            <div style={{ fontSize:'0.78rem', color:'#64748b' }}>Page {page} of {pages} · {total} total</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="admin-action-btn admin-action-btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="admin-action-btn admin-action-btn-primary" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
