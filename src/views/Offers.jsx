import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Offers() {
  const { token } = useApp();
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ title: '', type: 'percentage', value: 0, validFrom: '', validTo: '', active: true });

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/admin/offers');
      const j = await res.json();
      setOffers(j || []);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/offers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setForm({ title: '', type: 'percentage', value: 0, validFrom: '', validTo: '', active: true }); fetchList(); }
      else alert('Failed');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete offer?')) return;
    try {
      const res = await fetch('/api/admin/offers/' + id, { method: 'DELETE' });
      if (res.ok) fetchList();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <div className="card">
        <h2>Offers & Discounts</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input placeholder="Title" value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} />
          <select value={form.type} onChange={e=>setForm(f=>({ ...f, type: e.target.value }))}>
            <option value="percentage">Percentage %</option>
            <option value="flat">Flat ₹</option>
            <option value="bogo">Buy X Get Y</option>
          </select>
          <input type="number" placeholder="Value" value={form.value} onChange={e=>setForm(f=>({ ...f, value: Number(e.target.value) }))} />
          <button className="btn" type="submit">Add Offer</button>
        </form>

        <table className="tbl">
          <thead><tr><th>Title</th><th>Type</th><th>Value</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {offers.map(o => (
              <tr key={o._id}>
                <td>{o.title}</td>
                <td>{o.type}</td>
                <td>{o.value}</td>
                <td>{o.active ? 'Yes' : 'No'}</td>
                <td style={{ textAlign: 'right' }}><button className="btn btn--sm" onClick={() => handleDelete(o._id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
