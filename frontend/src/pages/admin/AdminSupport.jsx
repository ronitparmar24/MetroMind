import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { CheckCircle2, MessageSquare, MapPin, Mail } from 'lucide-react';

const PURPLE  = '#6366f1';
const EMERALD = '#34d399';
const AMBER   = '#fbbf24';
const ROSE    = '#f87171';
const CYAN    = '#22d3ee';

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 22 }}>
      <div className="admin-skeleton" style={{ height: 12, width: '40%', marginBottom: 12 }} />
      <div className="admin-skeleton" style={{ height: 44, marginBottom: 10 }} />
      <div className="admin-skeleton" style={{ height: 10, width: '60%' }} />
    </div>
  );
}

export default function AdminSupport({ setSupportCount }) {
  const [queue, setQueue]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');
  const [resolving, setResolving] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getSupportQueue()
      .then(r => {
        const q = r.data.data || [];
        setQueue(q);
        if (setSupportCount) setSupportCount(q.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setSupportCount]);

  useEffect(() => { load(); }, [load]);

  const handleResolveLostFound = async (id) => {
    setResolving(id);
    try {
      await adminApi.resolveSupportItem(id);
      setQueue(q => {
        const next = q.filter(x => x._id !== id);
        if (setSupportCount) setSupportCount(next.length);
        return next;
      });
    } catch(e) { console.error(e); }
    finally { setResolving(null); }
  };

  const handleResolveFeedback = async (id) => {
    setResolving(id);
    try {
      await adminApi.resolveFeedbackItem(id);
      setQueue(q => {
        const next = q.filter(x => x._id !== id);
        if (setSupportCount) setSupportCount(next.length);
        return next;
      });
    } catch(e) { console.error(e); }
    finally { setResolving(null); }
  };

  const feedback  = queue.filter(q => q.queueType === 'feedback');
  const lostFound = queue.filter(q => q.queueType === 'lost_found');
  const displayed = tab === 'all' ? queue : tab === 'feedback' ? feedback : lostFound;

  const tabs = [
    { id:'all',       label:'All',          count: queue.length },
    { id:'feedback',  label:'Feedback',     count: feedback.length },
    { id:'lost_found',label:'Lost & Found', count: lostFound.length },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <MessageSquare size={20} color={PURPLE} />
            </div>
            <div>
              <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1.1rem', fontWeight:800, color:'var(--adm-text)' }}>
                Support Queue
              </div>
              <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>
                {queue.length} pending items to review
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {tabs.map(({ id, label, count }) => (
              <button
                key={id}
                className={`admin-action-btn ${tab===id ? 'admin-action-btn-primary' : 'admin-action-btn-ghost'}`}
                onClick={() => setTab(id)}
              >
                {label}
                <span style={{
                  marginLeft:4, padding:'1px 6px', borderRadius:10, fontSize:'0.65rem', fontWeight:800,
                  background: tab===id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {Array.from({length:4}).map((_,i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass-card admin-fade-in" style={{ padding:60, textAlign:'center' }}>
          <CheckCircle2 size={52} style={{ opacity:0.2, marginBottom:16 }} color={EMERALD} />
          <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:'1rem', fontWeight:700, color:'var(--adm-text)' }}>All clear!</div>
          <div style={{ fontSize:'0.875rem', color:'#64748b', marginTop:6 }}>No pending items in this category.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {displayed.map((item, i) => (
            <div
              key={item._id || i}
              className="glass-card admin-fade-in"
              style={{
                padding:22, display:'flex', flexDirection:'column', gap:12,
                borderColor: item.queueType==='feedback'
                  ? 'rgba(167,139,250,0.2)'
                  : 'rgba(251,191,36,0.2)',
              }}
            >
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className={`admin-badge ${item.queueType==='feedback' ? 'admin-badge-purple' : 'admin-badge-yellow'}`}>
                  {item.queueType==='feedback' ? (
                    <><MessageSquare size={9} /> Feedback</>
                  ) : (
                    <><MapPin size={9} /> Lost & Found</>
                  )}
                </span>
                <span style={{ fontSize:'0.7rem', color:'#475569', fontFamily:'JetBrains Mono, monospace' }}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </span>
              </div>

              {/* Content */}
              {item.queueType === 'feedback' ? (
                <>

                  <p style={{ margin:0, fontSize:'0.85rem', color:'var(--adm-text-3)', lineHeight:1.6, fontStyle:'italic' }}>
                    "{item.text || 'No message provided.'}"
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--adm-text)' }}>
                    {item.category || 'Item'}: {item.itemDescription || '—'}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                    📍 {item.lastSeenLocation || 'Not specified'} &nbsp;·&nbsp;
                    <span className={`admin-badge ${item.status === 'reported' ? 'admin-badge-yellow' : 'admin-badge-blue'}`} style={{ fontSize:'0.6rem' }}>
                      {item.status}
                    </span>
                  </div>
                </>
              )}

              {/* Footer */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto', paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{
                    width:26, height:26, borderRadius:'50%',
                    background:'rgba(99,102,241,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.7rem', fontWeight:700, color:'#a78bfa',
                  }}>
                    {(item.userId?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--adm-text-3)' }}>
                      {item.userId?.name || 'Anonymous'}
                    </div>
                    {item.userId?.email && (
                      <div style={{ fontSize:'0.65rem', color:'#475569' }}>{item.userId.email}</div>
                    )}
                  </div>
                </div>
                {item.queueType === 'lost_found' && (
                  <button
                    className="admin-action-btn admin-action-btn-primary"
                    style={{ fontSize:'0.72rem', padding:'5px 12px' }}
                    onClick={() => handleResolveLostFound(item._id)}
                    disabled={resolving === item._id}
                  >
                    <CheckCircle2 size={11} />
                    {resolving === item._id ? '…' : 'Resolve'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
