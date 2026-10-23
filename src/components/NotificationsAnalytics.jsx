import React, { useEffect, useState } from 'react';

export default function NotificationsAnalytics({ onClose }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => { fetchSummary(); }, []);
  async function fetchSummary() { const res = await fetch('/api/admin/analytics/summary'); const j = await res.json(); if (j.status === 'success') setSummary(j); }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 3000 }} onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div style={{ width: 640, maxHeight: '80vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Notifications Analytics</h3>
          <button onClick={() => onClose && onClose()}>Close</button>
        </div>
        {!summary ? <div>Loading...</div> : (
          <div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ padding: 12, borderRadius: 8, background: '#f3f4f6' }}><div style={{ fontSize: 12 }}>Sent</div><div style={{ fontSize: 20, fontWeight: 700 }}>{summary.totals?.sent || 0}</div></div>
              <div style={{ padding: 12, borderRadius: 8, background: '#fff0f0' }}><div style={{ fontSize: 12 }}>Errors</div><div style={{ fontSize: 20, fontWeight: 700 }}>{summary.totals?.errors || 0}</div></div>
            </div>
            <h4 style={{ marginTop: 16 }}>By Channel</h4>
            <table className="tbl"><thead><tr><th>Channel</th><th>Count</th><th>Errors</th></tr></thead>
              <tbody>
                {(summary.byChannel || []).map(b => <tr key={b._id}><td>{b._id}</td><td>{b.cnt}</td><td>{b.errors}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

