import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { useToast } from '../../components/common/Toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const { showToast } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    adminApi.getUsers({ page, search, limit: 10 })
      .then(res => {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(err => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300); // debounce
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleToggle = async (id, currentStatus) => {
    try {
      await adminApi.toggleUserStatus(id, !currentStatus);
      showToast('User status updated', 'success');
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const pillStyle = (type) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    background: type === 'admin' ? 'rgba(99, 102, 241, 0.15)' : type === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
    color: type === 'admin' ? '#818cf8' : type === 'user' ? '#34d399' : '#f87171',
    border: `1px solid ${type === 'admin' ? 'rgba(99, 102, 241, 0.3)' : type === 'user' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
  });

  return (
    <div style={{ color: 'var(--text-primary)', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>User Management</h1>
        <div style={{ position: 'relative' }}>
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              padding: '12px 16px 12px 40px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-primary)',
              width: '320px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Name</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Email</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Role</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Ride Count</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Wallet</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Status</th>
              <th style={{ padding: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-lift">
                  <td style={{ padding: '16px', fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: '16px', color: 'rgba(255,255,255,0.7)' }}>{u.email}</td>
                  <td style={{ padding: '16px' }}><span style={pillStyle(u.role)}>{u.role}</span></td>
                  <td style={{ padding: '16px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{u.rideCount}</td>
                  <td style={{ padding: '16px', fontVariantNumeric: 'tabular-nums', color: '#34d399', fontWeight: 600 }}>₹{u.walletBalance.toFixed(2)}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={pillStyle(u.isActive ? 'user' : 'disabled')}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => handleToggle(u._id, u.isActive)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: u.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                        background: u.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: u.isActive ? '#f87171' : '#34d399',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      onMouseOver={(e) => e.target.style.background = u.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                      onMouseOut={(e) => e.target.style.background = u.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
                    >
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page === pagination.totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
