import React, { useState } from 'react';

export default function TargetBuilder({ initialFilters = {}, onClose, onApply }){
  const [filters, setFilters] = useState(initialFilters);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  async function doPreview(){
    setLoading(true);
    try{
      const res = await fetch('/api/admin/notifications/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ filters }) });
      const j = await res.json();
      setPreview(j);
    }catch(e){ setPreview({ status:'error', message: e.message }); }
    setLoading(false);
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:3000 }} onClick={(e)=> e.target===e.currentTarget && onClose && onClose()}>
      <div style={{ width:720, maxHeight:'85vh', overflow:'auto', background:'#fff', padding:18, borderRadius:8 }}>
        <h3>Targeting Builder</h3>
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap:8 }}>
          <div>
            <label>Plan Name</label>
            <input value={filters.planName||''} onChange={e=>setFilters(f=>({...f,planName:e.target.value}))} />
          </div>
          <div>
            <label>Shop Type</label>
            <input value={filters.shopType||''} onChange={e=>setFilters(f=>({...f,shopType:e.target.value}))} />
          </div>
          <div>
            <label>City</label>
            <input value={filters.city||''} onChange={e=>setFilters(f=>({...f,city:e.target.value}))} />
          </div>
          <div>
            <label>State</label>
            <input value={filters.state||''} onChange={e=>setFilters(f=>({...f,state:e.target.value}))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Specific usernames (comma separated)</label>
            <input value={(filters.username && Array.isArray(filters.username))? filters.username.join(',') : (filters.username||'')} onChange={e=> setFilters(f=>({...f,username: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} />
          </div>
        </div>

        <div style={{ marginTop:12, display:'flex', gap:8 }}>
          <button onClick={doPreview} disabled={loading}>{loading? 'Previewing...' : 'Preview Recipients'}</button>
          <button onClick={()=> { onApply && onApply(filters); onClose && onClose(); }}>Apply Filters</button>
          <button onClick={()=> onClose && onClose()}>Close</button>
        </div>

        {preview && (
          <div style={{ marginTop:12 }}>
            {preview.status === 'success' ? (
              <div>
                <div>Total matched: {preview.total}</div>
                <div style={{ maxHeight:200, overflow:'auto', marginTop:8 }}>
                  <table className="tbl"><thead><tr><th>Username</th><th>Email</th><th>Phone</th></tr></thead>
                    <tbody>{(preview.sample||[]).map(s=> <tr key={s.username}><td>{s.username}</td><td>{s.email}</td><td>{s.phone}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            ) : <div style={{ color:'red' }}>{preview.message || 'Preview failed'}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
