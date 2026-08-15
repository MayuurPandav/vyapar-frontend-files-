import React, { useEffect, useState } from 'react';

export default function TemplatesAdmin(){
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  useEffect(()=>{ fetch('/api/admin/notifications/templates').then(r=>r.json()).then(j=>{ if (j.templates) setTemplates(j.templates); }); }, []);
  async function create(e){ e.preventDefault(); await fetch('/api/admin/notifications/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, body }) }); setName(''); setBody(''); alert('Template created'); }
  return (
    <div style={{padding:20}}>
      <h3>Templates</h3>
      <form onSubmit={create}>
        <div><input value={name} onChange={e=>setName(e.target.value)} placeholder="Template name" /></div>
        <div><textarea value={body} onChange={e=>setBody(e.target.value)} style={{width:'100%',height:120}} placeholder="Template body" /></div>
        <div><button type="submit">Create</button></div>
      </form>
      <h4>Existing</h4>
      <ul>{templates.map(t=> <li key={t._id}>{t.name}</li>)}</ul>
    </div>
  );
}
