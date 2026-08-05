import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { Search, ShieldOff, ShieldCheck, UserCheck, UserX, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';

const PURPLE  = '#6366f1';
const EMERALD = '#10b981';
const ROSE    = '#ef4444';

function SkeletonRow() {
  return (
    <tr>
      {Array.from({length:6}).map((_,i)=>(
        <td key={i} style={{ padding:'14px 14px' }}>
          <div className="admin-skeleton" style={{ height:14, borderRadius:6 }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggle] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ page, limit: 15, search: query })
      .then(r => {
        setUsers(r.data.data || []);
        setTotal(r.data.pagination.total || 0);
        setPages(r.data.pagination.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const toggleUser = async (id, isActive) => {
    setToggle(id);
    try {
      await adminApi.toggleUserStatus(id, !isActive);
      setUsers(u => u.map(x => x._id === id ? { ...x, isActive: !isActive } : x));
    } catch(e) { console.error(e); }
    finally { setToggle(null); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div>
          <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a' }}>User Management</div>
          <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{total.toLocaleString()} registered users</div>
        </div>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input
              className="admin-input"
              style={{ paddingLeft:32, width:240 }}
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-action-btn admin-action-btn-primary">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card admin-fade-in" style={{ padding:24 }}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Rides</th>
                <th>Wallet</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:8}).map((_,i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:34, height:34, borderRadius:'50%', flexShrink:0,
                          background:`linear-gradient(135deg, ${PURPLE}, #8b5cf6)`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'white', fontSize:'0.8rem', fontWeight:700
                        }}>
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#0f172a' }}>{u.name}</div>
                          <div style={{ fontSize:'0.7rem', color:'#94a3b8', display:'flex', alignItems:'center', gap:4 }}>
                            <Mail size={10} />{u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-purple' : 'admin-badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight:700, color:'#0f172a' }}>{u.rideCount || 0}</td>
                    <td style={{ fontWeight:700, color:EMERALD }}>₹{(u.walletBalance || 0).toFixed(0)}</td>
                    <td style={{ fontSize:'0.78rem', color:'#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td>
                      <button
                        className={`admin-action-btn ${u.isActive !== false ? 'admin-action-btn-danger' : 'admin-action-btn-ghost'}`}
                        onClick={() => toggleUser(u._id, u.isActive !== false)}
                        disabled={toggling === u._id}
                        style={{ minWidth:90 }}
                      >
                        {toggling === u._id ? '…' : u.isActive !== false ? (
                          <><UserX size={12} /> Disable</>
                        ) : (
                          <><UserCheck size={12} /> Enable</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20, paddingTop:16, borderTop:'1px solid rgba(99,102,241,0.08)' }}>
            <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
              Page {page} of {pages} · {total} total
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button
                className="admin-action-btn admin-action-btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p-1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="admin-action-btn admin-action-btn-primary"
                disabled={page >= pages}
                onClick={() => setPage(p => Math.min(pages, p+1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
