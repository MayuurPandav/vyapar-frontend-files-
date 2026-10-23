import React, { useEffect, useState } from 'react';

export default function SupportDashboard(){
  const [stats, setStats] = useState(null);
  useEffect(()=>{ fetch('/api/admin/support/stats').then(r=>r.json()).then(j=>setStats(j)); }, []);
  if (!stats) return <div>Loading...</div>;
  return (
    <div style={{padding:20}}>
      <h3>Support Dashboard</h3>
      <div>Avg resolution hours: {Number(stats.avgResolutionHours||0).toFixed(2)}</div>
      <div>Total tickets: {stats.totals.total}</div>
      <div>Open: {stats.totals.open} | In Progress: {stats.totals.inprogress} | Resolved: {stats.totals.resolved}</div>
      <h4>Top categories</h4>
      <ul>{(stats.topCategories||[]).map(c=> <li key={c._id}>{c._id} ({c.cnt})</li>)}</ul>
    </div>
  );
}
