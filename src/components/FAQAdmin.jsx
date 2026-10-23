import React, { useEffect, useState } from 'react';

export default function FAQAdmin(){
  const [faqs, setFaqs] = useState([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  useEffect(()=>{ fetch('/api/admin/faq').then(r=>r.json()).then(j=>{ if (j.faqs) setFaqs(j.faqs); }); }, []);
  async function create(e){ e.preventDefault(); await fetch('/api/admin/faq', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question: q, answer: a }) }); setQ(''); setA(''); alert('FAQ created'); }
  return (
    <div style={{padding:20}}>
      <h3>Knowledge Base</h3>
      <form onSubmit={create}>
        <div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Question" style={{width:'100%'}} /></div>
        <div><textarea value={a} onChange={e=>setA(e.target.value)} placeholder="Answer" style={{width:'100%',height:120}} /></div>
        <div><button type="submit">Create FAQ</button></div>
      </form>
      <h4>Existing</h4>
      <ul>{faqs.map(f=> <li key={f._id}><b>{f.question}</b><div>{f.answer}</div></li>)}</ul>
    </div>
  );
}
