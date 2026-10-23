import React, { useEffect, useState } from 'react';

export default function DeliveryLogs({ onClose }){
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ channel: '', status: '', username: '' });

  useEffect(()=>{ load(); }, [page, limit]);

  async function load(){
    const qs = new URLSearchParams({ page, limit, ...filters });
    const res = await fetch('/api/admin/analytics/logs?' + qs.toString());
    const j = await res.json();
    if (j.status === 'success'){
      setRows(j.data || []); setTotal(j.total || 0);
    }
  }

  function exportCsv(){
    const headers = ['ts','announcementId','username','channel','status','providerResponse','error'];
    const csv = [headers.join(',')].concat(rows.map(r=> headers.map(h=> (r[h]===undefined? '': String(r[h]).replace(/"/g,'""'))).map(v=> '"'+v+'"').join(',')) ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'delivery_logs_page_'+page+'.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:3000 }} onClick={(e)=> e.target===e.currentTarget && onClose && onClose()}>
      <div style={{ width:'95%', maxWidth:1000, maxHeight:'85vh', overflow:'auto', background:'#fff', borderRadius:8, padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ margin:0 }}>Delivery Logs</h3>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={exportCsv}>Export CSV</button>
            <button onClick={()=> onClose && onClose()}>Close</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:8 }}>
          <input placeholder="channel" value={filters.channel} onChange={e=>setFilters(f=>({...f,channel:e.target.value}))} />
          <input placeholder="status" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} />
          <input placeholder="username" value={filters.username} onChange={e=>setFilters(f=>({...f,username:e.target.value}))} />
          <button onClick={()=>{ setPage(1); load(); }}>Filter</button>
        </div>

        <table className="tbl" style={{ width:'100%', fontSize:12 }}>
          <thead><tr><th>Time</th><th>Announcement</th><th>User</th><th>Channel</th><th>Status</th><th>Info</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r._id}>
                <td>{new Date(r.ts||r.createdAt||Date.now()).toLocaleString()}</td>
                <td>{r.announcementId || r.announcement || '-'}</td>
                <td>{r.username || '-'}</td>
                <td>{r.channel || '-'}</td>
                <td>{r.status || '-'}</td>
                <td style={{ maxWidth:300, overflow:'hidden', textOverflow:'ellipsis' }}>{r.error || r.providerResponse || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12 }}>
          <div>Total: {total}</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={()=> setPage(p=> Math.max(1,p-1))}>Prev</button>
            <div>Page {page}</div>
            <button onClick={()=> setPage(p=> p+1)}>Next</button>
            <select value={limit} onChange={e=> setLimit(Number(e.target.value))}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}


