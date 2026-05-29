import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Delivery() {
  const { token } = useApp();
  const [deliveries, setDeliveries] = useState([]);
  const [boys, setBoys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customer: { name: '', phone: '', address: '' }, items: [], charges: 0, timeSlot: '' });
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => { fetchList(); fetchBoys(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/deliveries');
      const j = await res.json();
      setDeliveries(j);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const fetchBoys = async () => {
    try {
      const res = await fetch('/api/admin/delivery-boys');
      const j = await res.json();
      setBoys(j);
    } catch (err) { console.error(err); }
  };

  const openCreate = () => { setShowModal(true); };
  const closeCreate = () => { setShowModal(false); setForm({ customer: { name: '', phone: '', address: '' }, items: [], charges: 0, timeSlot: '' }); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.customer?.name) return alert('Customer name required');
    try {
      const res = await fetch('/api/admin/deliveries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        closeCreate();
        fetchList();
      } else {
        alert('Failed to create delivery');
      }
    } catch (err) { console.error(err); }
  };

  const handleAssign = async (id, boyId) => {
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deliveryBoyId: boyId }) });
      if (res.ok) fetchList();
    } catch (err) { console.error(err); }
  };

  const uploadWithProgress = (id, file) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadedBy', 'admin');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(p => ({ ...p, [id]: pct }));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(xhr.responseText || 'Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Upload error'));
    xhr.open('POST', `/api/admin/deliveries/${id}/proof`);
    xhr.send(fd);
  });

  const handleFile = async (id, file) => {
    if (!file) return;
    try {
      await uploadWithProgress(id, file);
      setUploadProgress(p => ({ ...p, [id]: 0 }));
      fetchList();
    } catch (err) { console.error(err); alert('Upload failed'); }
  };

  const markDelivered = async (id) => {
    try {
      const res = await fetch(`/api/admin/deliveries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) });
      if (res.ok) fetchList();
    } catch (err) { console.error(err); }
  };

  const markReturned = async (id) => {
    const reason = prompt('Return reason');
    if (!reason) return;
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
      if (res.ok) fetchList();
    } catch (err) { console.error(err); }
  };

  const getAssignedName = (d) => {
    if (!d.assignedTo) return '-';
    const b = boys.find(x => String(x._id) === String(d.assignedTo));
    return b ? b.name : d.assignedTo;
  };

  return (
    <>
      <div className="card" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="card__head">
          <div>
            <h3>Delivery Management</h3>
            <div style={{ color: 'var(--text-3)', marginTop: 6 }}>Create, assign, upload proofs and track deliveries.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={openCreate}>New Delivery</button>
            <button className="btn" onClick={fetchList}>Refresh</button>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          {loading ? 'Loading...' : (
            deliveries.length === 0 ? (
              <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 48, color: 'var(--text-3)' }}>🚚</div>
                <h3 style={{ marginTop: 12 }}>No deliveries yet</h3>
                <p style={{ color: 'var(--text-3)', marginTop: 8 }}>Create delivery orders and upload proof photos here.</p>
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn--primary" onClick={openCreate}>New Delivery</button>
                </div>
              </div>
            ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
              <thead><tr><th>ID</th><th>Customer</th><th>Status</th><th>Assigned</th><th>Proofs</th><th className="actions">Actions</th></tr></thead>
              <tbody>
                {deliveries.map(d => (
                  <tr key={d._id}>
                    <td style={{ width: 110 }}>{String(d._id).slice(0,8)}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{d.customer?.name}</div>
                      <div style={{ fontSize: 12 }}>{d.customer?.phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{d.customer?.address}</div>
                      {d.partner && d.partner !== 'in-house' && <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}><i className="fas fa-truck"></i> {d.partner.toUpperCase()}</div>}
                    </td>
                    <td><span className={`badge ${d.status === 'delivered' ? 'badge--green' : ['failed','returned'].includes(d.status) ? 'badge--red' : d.status === 'out_for_delivery' ? 'badge--blue' : 'badge--yellow'}`} style={{ textTransform: 'capitalize' }}>{d.status.replace('_', ' ')}</span></td>
                    <td>{getAssignedName(d)}</td>
                    <td style={{ width: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {d.proof && d.proof.length > 0 ? d.proof.map((p, i) => (
                          <img key={i} src={p.url || p.data} alt={`proof-${i}`} style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 6, borderRadius: 6 }} />
                        )) : <div style={{ color: 'var(--text-3)' }}>—</div>}
                      </div>
                      {uploadProgress[d._id] > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 6 }}>
                            <div style={{ width: `${uploadProgress[d._id]}%`, height: 6, background: 'var(--accent)', borderRadius: 6 }}></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="actions" style={{ textAlign: 'right' }}>
                      <div className="staff-actions" style={{ justifyContent: 'flex-end' }}>
                        <select onChange={(e) => handleAssign(d._id, e.target.value)} defaultValue="">
                          <option value="">Assign</option>
                          {boys.map(b => <option key={b._id} value={b._id}>{b.name} ({b.phone})</option>)}
                        </select>
                        <label className="btn btn--icon" style={{ padding: 6 }}>
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(d._id, e.target.files[0])} />
                          <i className="fas fa-upload"></i>
                        </label>
                        <button className="btn btn--sm" onClick={() => markDelivered(d._id)}>Mark Delivered</button>
                        <button className="btn btn--sm" onClick={() => markReturned(d._id)}>Mark Return</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            )
          )}
        </div>
      </div>

      {/* Modal Create */}
      <div className="overlay" style={{ display: showModal ? 'block' : 'none' }} onClick={closeCreate}></div>
      <div className="modal" style={{ display: showModal ? 'block' : 'none' }}>
        <div className="modal__top">
          <h3>New Delivery</h3>
          <button className="btn" onClick={closeCreate}>Close</button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="fg">
              <label>Name</label>
              <input className="fi" value={form.customer.name} onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, name: e.target.value } }))} />
            </div>
            <div className="fg">
              <label>Phone</label>
              <input className="fi" value={form.customer.phone} onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, phone: e.target.value } }))} />
            </div>
          </div>
          <div className="fg">
            <label>Address</label>
            <input className="fi" value={form.customer.address} onChange={e => setForm(s => ({ ...s, customer: { ...s.customer, address: e.target.value } }))} />
          </div>
          <div className="form-row">
            <div className="fg">
              <label>Time Slot</label>
              <select className="fi" value={form.timeSlot || ''} onChange={e => setForm(s => ({ ...s, timeSlot: e.target.value }))}>
                <option value="">Select Time Slot</option>
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
            <div className="fg">
              <label>Delivery Partner</label>
              <select className="fi" value={form.partner || 'in-house'} onChange={e => setForm(s => ({ ...s, partner: e.target.value }))}>
                <option value="in-house">In-House Delivery</option>
                <option value="shiprocket">Shiprocket (API Stub)</option>
                <option value="delhivery">Delhivery (API Stub)</option>
                <option value="dunzo">Dunzo (API Stub)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="fg">
              <label>Charges</label>
              <input className="fi" type="number" value={form.charges} onChange={e => setForm(s => ({ ...s, charges: Number(e.target.value) }))} />
            </div>
            <div className="fg"></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn" type="button" onClick={closeCreate}>Cancel</button>
            <button className="btn btn--primary" type="submit">Create</button>
          </div>
        </form>
      </div>
    </>
  );
}
