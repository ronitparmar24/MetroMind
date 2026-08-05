import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../../api/admin.api';
import { CheckCircle2, MessageSquare, MapPin, AlertTriangle } from 'lucide-react';

const PURPLE  = '#6366f1';
const EMERALD = '#10b981';
const AMBER   = '#f59e0b';

export default function AdminSupport() {
  const [queue, setQueue]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    adminApi.getSupportQueue()
      .then(r => setQueue(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (id) => {
    try {
      await adminApi.resolveSupportItem(id);
      setQueue(q => q.filter(x => x._id !== id));
    } catch(e) { console.error(e); }
  };

  const feedback  = queue.filter(q => q.queueType === 'feedback');
  const lostFound = queue.filter(q => q.queueType === 'lost_found');
  const displayed = tab === 'all' ? queue : tab === 'feedback' ? feedback : lostFound;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div className="glass-card admin-fade-in" style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
              <MessageSquare size={20} color={PURPLE} /> Support Queue
            </div>
            <div style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:2 }}>{queue.length} pending items</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {[['all','All'], ['feedback','Feedback'], ['lost_found','Lost & Found']].map(([k,l])=>(
              <button key={k} className={`admin-action-btn ${tab===k?'admin-action-btn-primary':'admin-action-btn-ghost'}`} onClick={()=>setTab(k)}>
                {l} {k==='all'?queue.length:k==='feedback'?feedback.length:lostFound.length}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      {loading ? (
        Array.from({length:4}).map((_,i)=>(
          <div key={i} className="glass-card" style={{ padding:24 }}>
            <div className="admin-skeleton" style={{ height:14, width:'40%', marginBottom:10 }} />
            <div className="admin-skeleton" style={{ height:40 }} />
          </div>
        ))
      ) : displayed.length === 0 ? (
        <div className="glass-card admin-fade-in" style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
          <CheckCircle2 size={48} style={{ opacity:0.3, marginBottom:12 }} color={EMERALD} />
          <div style={{ fontSize:'1rem', fontWeight:700, color:'#1e293b' }}>All clear!</div>
          <div style={{ fontSize:'0.875rem', marginTop:4 }}>No pending support items in this category.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
          {displayed.map((item, i) => (
            <div key={item._id || i} className="glass-card admin-fade-in" style={{ padding:22, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className={`admin-badge ${item.queueType==='feedback' ? 'admin-badge-purple' : 'admin-badge-yellow'}`}>
                  {item.queueType==='feedback' ? (
                    <><MessageSquare size={10} style={{marginRight:4}} />Feedback</>
                  ) : (
                    <><MapPin size={10} style={{marginRight:4}} />Lost & Found</>
                  )}
                </span>
                <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                </span>
              </div>

              {item.queueType === 'feedback' ? (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    {item.rating && (
                      <div style={{ display:'flex', gap:2 }}>
                        {Array.from({length:5}).map((_,j)=>(
                          <span key={j} style={{ color: j < item.rating ? AMBER : '#e2e8f0', fontSize:'1rem' }}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p style={{ margin:0, fontSize:'0.85rem', color:'#475569', lineHeight:1.6 }}>
                    "{item.text || 'No message provided.'}"
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#0f172a' }}>
                    {item.itemType || 'Item'}: {item.itemDescription || '—'}
                  </div>
                  <div style={{ fontSize:'0.78rem', color:'#64748b' }}>
                    Location: {item.location || 'Not specified'} · Status: {item.status}
                  </div>
                </>
              )}

              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                  by <span style={{ fontWeight:700, color:'#475569' }}>{item.userId?.name || 'Anonymous'}</span>
                </div>
                {item.queueType === 'lost_found' && (
                  <button className="admin-action-btn admin-action-btn-primary" onClick={() => handleResolve(item._id)}>
                    <CheckCircle2 size={12} /> Resolve
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
