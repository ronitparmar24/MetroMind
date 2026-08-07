import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import {
  Search, UserX, UserCheck, ChevronLeft, ChevronRight,
  Mail, Download, X, Ticket, Wallet, Calendar, Shield,
} from 'lucide-react';

const PURPLE  = '#6366f1';
const EMERALD = '#34d399';
const ROSE    = '#f87171';
const CYAN    = '#22d3ee';
const AMBER   = '#fbbf24';

function SkeletonRow() {
  return (
    <tr>
      {Array.from({length:6}).map((_,i) => (
        <td key={i} style={{ padding:'14px 14px' }}>
          <div className="admin-skeleton" style={{ height:14, borderRadius:6 }} />
        </td>
      ))}
    </tr>
  );
}

// ── User Detail Modal ─────────────────────────────────
function UserModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal" style={{ padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.3rem', fontWeight: 700,
              boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            }}>
              {user.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: 'var(--adm-text)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} /> {user.email}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, cursor: 'pointer', color: '#64748b',
            width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Role',          value: user.role,                                    icon: <Shield size={14} />,   color: PURPLE },
            { label: 'Status',        value: user.isActive !== false ? 'Active' : 'Disabled', icon: <UserCheck size={14} />, color: user.isActive !== false ? EMERALD : ROSE },
            { label: 'Total Rides',   value: user.rideCount || 0,                          icon: <Ticket size={14} />,   color: CYAN },
            { label: 'Wallet Balance',value: `₹${(user.walletBalance || 0).toFixed(0)}`,   icon: <Wallet size={14} />,   color: AMBER },
          ].map(s => (
            <div key={s.label} style={{
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.icon} {s.label}
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: s.color, textTransform: 'capitalize' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Joined */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.82rem', color: 'var(--adm-text-3)',
        }}>
          <Calendar size={14} color="#6366f1" />
          Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <a
            href={`mailto:${user.email}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
              background: 'rgba(99,102,241,0.1)', color: PURPLE,
              border: '1px solid rgba(99,102,241,0.25)', textDecoration: 'none',
            }}
          >
            <Mail size={14} /> Send Email
          </a>
          <button onClick={onClose} className="admin-action-btn admin-action-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ══ ADMIN USERS ════════════════════════════════════════
export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');
  const [role, setRole]       = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggle] = useState(null);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getUsers({ page, limit: 15, search: query })
      .then(r => {
        let data = r.data.data || [];
        if (role) data = data.filter(u => u.role === role);
        setUsers(data);
        setTotal(r.data.pagination.total || 0);
        setPages(r.data.pagination.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, query, role]);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportUsers();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'metromind_users.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch(e) { console.error(e); }
    finally { setExporting(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {selected && <UserModal user={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>User Management</div>
          <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>{total.toLocaleString()} registered users</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {/* Role filter */}
          <select
            className="admin-input" style={{ width: 130 }}
            value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
              <input
                className="admin-input"
                style={{ paddingLeft:32, width:220 }}
                placeholder="Search name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="admin-action-btn admin-action-btn-primary">Search</button>
          </form>
          <button
            className="admin-action-btn admin-action-btn-ghost"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:8}).map((_,i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'40px 0', color:'#475569' }}>No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} style={{ cursor: 'pointer' }} onClick={() => setSelected(u)}>
                    <td data-label="User">
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:34, height:34, borderRadius:'50%', flexShrink:0,
                          background:`linear-gradient(135deg, ${PURPLE}, #a78bfa)`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'white', fontSize:'0.8rem', fontWeight:700,
                          boxShadow: '0 0 10px rgba(99,102,241,0.35)',
                        }}>
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{u.name}</div>
                          <div style={{ fontSize:'0.7rem', color:'#475569', display:'flex', alignItems:'center', gap:4 }}>
                            <Mail size={9} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role" onClick={e => e.stopPropagation()}>
                      <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-purple' : 'admin-badge-blue'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td data-label="Rides" style={{ fontWeight:700, fontFamily:'Space Grotesk, sans-serif' }}>{u.rideCount || 0}</td>
                    <td data-label="Wallet" style={{ fontWeight:700, color:EMERALD, fontFamily:'Space Grotesk, sans-serif' }}>
                      ₹{(u.walletBalance || 0).toFixed(0)}
                    </td>
                    <td data-label="Joined" style={{ fontSize:'0.78rem', color:'#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td data-label="Actions">
                      <button
                        className={`admin-action-btn ${u.isActive !== false ? 'admin-action-btn-danger' : 'admin-action-btn-ghost'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUser(u._id, u.isActive !== false);
                        }}
                        disabled={toggling === u._id}
                        style={{ minWidth:84 }}
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
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
              Page {page} of {pages} · {total} total
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="admin-action-btn admin-action-btn-ghost" disabled={page<=1} onClick={() => setPage(p=>Math.max(1,p-1))}>
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({length:Math.min(5,pages)},(_,i)=>{
                const p = Math.max(1, Math.min(pages-4, page-2)) + i;
                return p<=pages ? (
                  <button key={p}
                    className={`admin-action-btn ${p===page?'admin-action-btn-primary':'admin-action-btn-ghost'}`}
                    onClick={() => setPage(p)} style={{ minWidth:36, justifyContent:'center' }}>
                    {p}
                  </button>
                ) : null;
              })}
              <button className="admin-action-btn admin-action-btn-ghost" disabled={page>=pages} onClick={() => setPage(p=>Math.min(pages,p+1))}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
