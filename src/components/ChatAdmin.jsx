import React, { useEffect, useState } from 'react';

export default function ChatAdmin(){
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const username = 'agent1';
  useEffect(()=>{ fetch('/api/admin/chat/threads?username=' + encodeURIComponent(username)).then(r=>r.json()).then(j=>{ if (j.threads) setThreads(j.threads); }); }, []);
  useEffect(()=>{ let id = selected; if (!id) return; fetch(`/api/admin/chat/threads/${id}/messages`).then(r=>r.json()).then(j=>{ if (j.messages) setMessages(j.messages); }); const iv = setInterval(()=>{ fetch(`/api/admin/chat/threads/${id}/messages`).then(r=>r.json()).then(j=>{ if (j.messages) setMessages(j.messages); }); }, 5000); return ()=>clearInterval(iv); }, [selected]);
  async function send(){ if (!selected) return alert('select thread'); await fetch('/api/admin/chat/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ threadId: selected, from: username, to: threads.find(t=>t._id===selected)?.participants?.find(p=>p!==username)||'', message: text }) }); setText(''); }
  return (
    <div style={{display:'flex',gap:20,padding:20}}>
      <div style={{width:300,borderRight:'1px solid #ddd'}}>
        <h4>Threads</h4>
        <ul>{threads.map(t=> <li key={t._id}><a href="#" onClick={(e)=>{e.preventDefault(); setSelected(t._id);}}>{t.participants.join(', ')}</a></li>)}</ul>
      </div>
      <div style={{flex:1}}>
        <h4>Messages</h4>
        <div style={{height:300,overflow:'auto',border:'1px solid #eee',padding:8}}>
          {messages.map(m=> <div key={m._id}><b>{m.from}</b>: {m.message}</div>)}
        </div>
        <div style={{marginTop:8}}>
          <input value={text} onChange={e=>setText(e.target.value)} style={{width:'80%'}} />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
