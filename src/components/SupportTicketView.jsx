import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function SupportTicketView(){
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [staff, setStaff] = useState([]);
  const [comment, setComment] = useState('');
  useEffect(()=>{ if (id) fetch(`/api/admin/support/tickets/${id}`).then(r=>r.json()).then(j=>{ if (j.ticket) setTicket(j.ticket); }); }, [id]);
  useEffect(()=>{ fetch('/api/admin/support/staff').then(r=>r.json()).then(j=>{ if (j.staff) setStaff(j.staff); }); }, []);
  async function postComment(e){ e.preventDefault(); await fetch(`/api/admin/support/tickets/${id}/comment`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ticketId: id, author: 'agent', message: comment }) }); setComment(''); alert('Comment posted'); }
  async function assignTo(e){ e.preventDefault(); const ass = e.target.assign.value; await fetch(`/api/admin/support/tickets/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ assignedTo: ass, actor: 'agent' }) }); alert('Assigned'); setTicket(prev=> ({ ...prev, assignedTo: ass })); }
  async function changeStatus(e){ e.preventDefault(); const st = e.target.status.value; await fetch(`/api/admin/support/tickets/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: st, actor: 'agent' }) }); alert('Status updated'); setTicket(prev=> ({ ...prev, status: st })); }
  if (!ticket) return <div>Loading ticket...</div>;
  return (
    <div style={{padding:20}}>
      <h3>{ticket.title}</h3>
      <div>User: {ticket.username} | Priority: {ticket.priority} | Status: {ticket.status}</div>
      <p>{ticket.description}</p>
      <div style={{marginTop:10, padding:10, border:'1px solid #eee'}}>
        <form onSubmit={assignTo}>
          <label>Assign to: </label>
          <select name="assign" defaultValue={ticket.assignedTo || ''}>
            <option value="">-- unassigned --</option>
            {staff.map(s=> <option key={s._id} value={s.username}>{s.name} ({s.username})</option>)}
          </select>
          <button style={{marginLeft:8}} type="submit">Assign</button>
        </form>
        <form onSubmit={changeStatus} style={{marginTop:8}}>
          <label>Status: </label>
          <select name="status" defaultValue={ticket.status}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button style={{marginLeft:8}} type="submit">Update</button>
        </form>
      </div>
      <h4>Comments</h4>
      <div>
        {(ticket.comments||[]).map((c,i)=> <div key={i}><b>{c.author}</b>: {c.message}</div>)}
      </div>
      <form onSubmit={postComment} style={{marginTop:12}}>
        <textarea value={comment} onChange={e=>setComment(e.target.value)} style={{width:'100%',height:80}} />
        <div><button type="submit">Add Comment</button></div>
      </form>
    </div>
  );
}
