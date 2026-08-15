import React, { useEffect, useState } from 'react';

export default function NotificationsReport() {
  const [logs, setLogs] = useState([]);
  useEffect(()=>{ fetch('/api/admin/notifications/config').then(r=>r.json()).then(j=>{ if (j.announcements) setLogs(j.announcements); }); }, []);
  return (
    <div style={{padding:20}}>
      <h3>Announcements Report (summary)</h3>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr><th>Title</th><th>Created</th><th>Sent</th><th>Queued Count</th></tr></thead>
        <tbody>
          {logs.map(a=> (
            <tr key={a._id}>
              <td>{a.title}</td>
              <td>{new Date(a.createdAt).toLocaleString()}</td>
              <td>{a.sent? 'Yes':'No'}</td>
              <td>{a.queuedCount||0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
