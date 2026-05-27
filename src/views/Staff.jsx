import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Staff() {
  const { user } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', role: 'Staff', phone: '' });
  const [editingId, setEditingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showActivitiesFor, setShowActivitiesFor] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [performance, setPerformance] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add | edit
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);

  useEffect(() => { if (!user) return; load(); }, [user]);
  const load = async () => {
    const res = await fetch(`/api/staff?username=${encodeURIComponent(user.username)}`);
    if (res.ok) setList(await res.json());
  };

  const add = async () => {
    const payload = { ...form, username: user.username };
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { alert('Added'); setForm({ name:'', role:'Staff', phone:'' }); load(); }
    else alert('Failed');
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({ name: s.name || '', role: s.role || 'Staff', phone: s.phone || '' });
    setModalMode('edit');
    setModalOpen(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const payload = { ...form, username: user.username };
    const res = await fetch(`/api/staff/${editingId}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) { alert('Saved'); setEditingId(null); setForm({ name:'', role:'Staff', phone:'' }); load(); }
    else alert('Failed to save');
  };

  const cancelEdit = () => { setEditingId(null); setForm({ name:'', role:'Staff', phone:'' }); };

  const deleteStaff = async (id) => {
    if (!confirm('Delete this staff? This will mark them inactive.')) return;
    const res = await fetch(`/api/staff/${id}?username=${encodeURIComponent(user.username)}`, { method: 'DELETE' });
    if (res.ok) load(); else alert('Failed to delete');
  };

  const openAdd = () => {
    setForm({ name: '', role: 'Staff', phone: '' });
    setEditingId(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const saveFromModal = async () => {
    setSaving(true);
    if (modalMode === 'add') await add();
    else await saveEdit();
    setSaving(false);
    setModalOpen(false);
  };

  const toggleActive = async (id, active) => {
    const res = await fetch(`/api/staff/${id}/active`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ active: !active, username: user.username }) });
    if (res.ok) load();
  };

  const viewActivities = async (id) => {
    const res = await fetch(`/api/staff/activity?username=${encodeURIComponent(user.username)}&staffId=${encodeURIComponent(id)}`);
    if (res.ok) {
      const j = await res.json();
      setActivities(j);
      setShowActivitiesFor(id);
      setActivitiesModalOpen(true);
    } else alert('Failed to load activities');
  };

  const addAttendance = async (id) => {
    if (!attendanceDate) return alert('Select date');
    const res = await fetch('/api/staff/attendance', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, staffId: id, date: attendanceDate, status: attendanceStatus }) });
    if (res.ok) { alert('Attendance recorded'); setAttendanceDate(''); load(); } else alert('Failed');
  };

  const setSalary = async (id) => {
    const v = prompt('Enter salary amount');
    if (v == null) return;
    const res = await fetch(`/api/staff/${id}/salary`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ salary: Number(v), username: user.username }) });
    if (res.ok) { alert('Salary updated'); load(); } else alert('Failed');
  };

  const viewPerformance = async (id) => {
    const res = await fetch(`/api/staff/performance?username=${encodeURIComponent(user.username)}&staffId=${encodeURIComponent(id)}`);
    if (res.ok) { const j = await res.json(); setPerformance({ staffId: id, ...j }); } else alert('Failed');
    setPerformanceModalOpen(true);
  };

  return (
    <section className="view active" id="view-staff">
      <div className="sec-header" style={{ paddingLeft: 16, paddingTop: 8 }}>
        <h2 style={{ margin: 0 }}>Staff Management</h2>
        <p>Manage staff members, attendance, salaries and activity logs.</p>
      </div>

      <div className="two-col" style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ flex: '0 0 380px' }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 8 }}>Add / Edit Staff</h3>
            <div className="fg"><label>Full name</label><input className="fi" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="fg"><label>Phone</label><input className="fi" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="fg"><label>Role</label>
              <select className="fi" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option>Staff</option>
                <option>Cashier</option>
                <option>Accountant</option>
                <option>Delivery Boy</option>
                <option>Manager</option>
              </select>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {editingId ? (
                <>
                  <button onClick={saveEdit} className="btn btn--primary btn--sm">Save</button>
                  <button onClick={cancelEdit} className="btn btn--sm">Cancel</button>
                </>
              ) : (
                <button onClick={add} className="btn btn--primary">Add Staff</button>
              )}
              <button onClick={()=>{ setForm({ name:'', role:'Staff', phone:''}); setEditingId(null); }} className="btn btn--ghost btn--sm">Clear</button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Staff List</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Search by name or phone" className="fi" style={{ width: 220 }} value={query} onChange={e=>{ setQuery(e.target.value); setPage(1); }} />
              </div>
            </div>
            <table className="tbl" style={{ width: '100%' }}>
              <thead><tr><th style={{ width: '36%' }}>Name</th><th style={{ width: '18%' }}>Role</th><th style={{ width: '18%' }}>Phone</th><th style={{ width: '8%' }}>Active</th><th style={{ width: '30%' }}>Actions</th></tr></thead>
              <tbody>
                {list.filter(s => !query || (s.name || '').toLowerCase().includes(query.toLowerCase()) || (s.phone||'').includes(query)).slice((page-1)*pageSize, (page-1)*pageSize + pageSize).map(s => (
                  <tr key={s._id}>
                    <td style={{ paddingTop: 12, paddingBottom: 12 }}>{s.name}</td>
                    <td>{s.role}</td>
                    <td>{s.phone}</td>
                    <td>{s.active ? 'Yes' : 'No'}</td>
                    <td className="actions">
                      <div className="staff-actions">
                        <button onClick={()=>toggleActive(s._id, s.active)} className="btn btn--sm">{s.active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={()=>startEdit(s)} className="btn btn--sm">Edit</button>
                        <button onClick={()=>deleteStaff(s._id)} className="btn btn--danger btn--sm">Delete</button>
                        <button onClick={()=>viewActivities(s._id)} className="btn btn--sm">Activities</button>
                        <button onClick={()=>{ setAttendanceDate(new Date().toISOString().substring(0,10)); setAttendanceStatus('present'); addAttendance(s._id); }} className="btn btn--sm">Present</button>
                        <button onClick={()=>setSalary(s._id)} className="btn btn--sm">Salary</button>
                        <button onClick={()=>viewPerformance(s._id)} className="btn btn--sm">Perf</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ color: '#64748b', fontSize: 13 }}>{list.length} staff</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn--sm" onClick={()=>setPage(Math.max(1, page-1))} disabled={page===1}>Prev</button>
                <div style={{ padding: '4px 8px', borderRadius: 4, background: '#f8fafc' }}>{page}</div>
                <button className="btn btn--sm" onClick={()=>setPage(page+1)} disabled={(page*pageSize) >= list.filter(s => !query || (s.name || '').toLowerCase().includes(query.toLowerCase()) || (s.phone||'').includes(query)).length}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activitiesModalOpen && (
        <div style={{ position: 'fixed', left:0,top:0,right:0,bottom:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div className="card" style={{ width: 600, maxHeight: 420, overflow: 'auto', padding: 12 }}>
            <h3>Activities</h3>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              {activities.length ? activities.map(a => (
                <div key={a._id} style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 700 }}>{a.action}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{a.detail}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(a.timestamp).toLocaleString()}</div>
                </div>
              )) : <div>No activities.</div>}
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}><button className="btn" onClick={()=>{ setActivitiesModalOpen(false); setActivities([]); setShowActivitiesFor(null); }}>Close</button></div>
          </div>
        </div>
      )}

      {performanceModalOpen && performance && (
        <div style={{ position: 'fixed', left:0,top:0,right:0,bottom:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}>
          <div className="card" style={{ width: 420, padding: 12 }}>
            <h3>Performance</h3>
            <div className="fg"><label>Activity Count</label><div className="sub-meta">{performance.activityCount}</div></div>
            <div className="fg"><label>Present Days</label><div className="sub-meta">{performance.attendanceCount}</div></div>
            <div style={{ marginTop: 8, textAlign: 'right' }}><button className="btn" onClick={()=>{ setPerformance(null); setPerformanceModalOpen(false); }}>Close</button></div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 520, padding: 16 }}>
            <h3>{modalMode === 'add' ? 'Add Staff' : 'Edit Staff'}</h3>
            <div className="fg"><label>Full name</label><input className="fi" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="fg"><label>Phone</label><input className="fi" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="fg"><label>Role</label>
              <select className="fi" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option>Staff</option>
                <option>Cashier</option>
                <option>Accountant</option>
                <option>Delivery Boy</option>
                <option>Manager</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn--primary" onClick={saveFromModal} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn" onClick={()=>{ setModalOpen(false); setEditingId(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
