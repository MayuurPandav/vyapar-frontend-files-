import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import AnimatedNumber from '../components/AnimatedNumber';

export default function Invoices() {
  const { user } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ customer:'', totalAmount:0, type:'Sale Invoice (GST)' });

  useEffect(() => { if (!user) load(); }, [user]);
  const load = async () => {
    const res = await fetch(`/api/invoices?username=${encodeURIComponent(user.username)}`);
    if (res.ok) setList((await res.json()).data || []);
  };

  const create = async () => {
    const payload = { ...form, username: user.username, date: new Date().toISOString().substring(0,10) };
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { alert('Invoice created'); setForm({ customer:'', totalAmount:0, type:'Sale Invoice (GST)' }); load(); }
    else alert('Failed');
  };

  const del = async (id) => {
    if (!confirm('Delete invoice?')) return;
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Invoices</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 12 }}>
            <h3>Create Invoice</h3>
            <div className="fg"><label>Customer</label><input className="fi" placeholder="Customer" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} /></div>
            <div className="fg"><label>Total</label><input className="fi" type="number" placeholder="Total" value={form.totalAmount} onChange={e=>setForm({...form,totalAmount:Number(e.target.value)})} /></div>
            <div className="fg"><label>Type</label>
              <select className="fi" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                <option>Sale Invoice (GST)</option>
                <option>Sale Invoice (Non-GST)</option>
                <option>Proforma Invoice</option>
                <option>Delivery Challan</option>
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={create} className="btn btn--primary">Create</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <div className="card" style={{ padding: 12 }}>
            <h3>Invoice List</h3>
            <table className="table">
              <thead><tr><th>Invoice#</th><th>Customer</th><th>Date</th><th>Total</th><th>Actions</th></tr></thead>
              <tbody>
                {list.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.invoiceNumber || inv.id}</td>
                    <td>{inv.customer}</td>
                    <td>{inv.date}</td>
                    <td><AnimatedNumber value={Number(inv.totalAmount || inv.amount) || 0} duration={700} formatter={v => String(Math.round(v))} /></td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => downloadInvoicePDF(inv.id, inv.invoiceNumber || inv.id)} className="btn">Download PDF</button>
                      <button onClick={()=>del(inv.id)} className="btn btn--danger">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Download helper: fetch PDF from backend and trigger browser download
async function downloadInvoicePDF(id, fallbackName) {
  try {
    const apiBase = import.meta.env.VITE_API_BASE || (window.location.protocol + '//' + window.location.hostname + ':5001');
    const url = `${apiBase}/api/invoices/${id}/pdf`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=>null);
      alert('Failed to download PDF: ' + (txt || resp.statusText));
      return;
    }
    const blob = await resp.blob();
    // try to get filename from headers
    const cd = resp.headers.get('content-disposition') || '';
    let filename = fallbackName || `invoice-${id}.pdf`;
    const m = /filename\s*=\s*"?([^;\"]+)"?/i.exec(cd);
    if (m && m[1]) filename = m[1].replace(/"/g,'');
    const link = document.createElement('a');
    const urlBlob = window.URL.createObjectURL(blob);
    link.href = urlBlob;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (err) {
    alert('Download error: ' + (err.message || err));
  }
}
