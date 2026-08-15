import React, { useEffect, useState } from 'react';

export default function SupportTicketsList({ history }){
  const [tickets, setTickets] = useState([]);
  useEffect(()=>{ fetch('/api/admin/support/tickets').then(r=>r.json()).then(j=>{ if (j.data) setTickets(j.data); }); }, []);
  return (
    <div style={{padding:20}}>
      <h3>Tickets</h3>
      <table style={{width:'100%'}}>
        <thead><tr><th>Title</th><th>User</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {tickets.map(t=> (
            <tr key={t._id}>
              <td>{t.title}</td>
              <td>{t.username}</td>
              <td>{t.priority}</td>
              <td>{t.status}</td>
              <td><a href={`/super_admin.html#/support/tickets/${t._id}`}>View</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
