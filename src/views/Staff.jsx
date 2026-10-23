import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Staff() {
  const { user } = useApp();
  const [list, setList] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showActivitiesFor, setShowActivitiesFor] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [activitiesModalOpen, setActivitiesModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [profileViewStaff, setProfileViewStaff] = useState(null);
  const [toast, setToast] = useState(null);
  const [logins, setLogins] = useState([]);
  const [logsTab, setLogsTab] = useState('activities'); // activities | logins
  
  // Tab control in the onboarding wizard
  const [formTab, setFormTab] = useState('basic'); // basic | media | access

  const defaultForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    aadhaar: '',
    aadhaarFile: '',
    photo: '',
    joiningDate: new Date().toISOString().substring(0, 10),
    salary: '',
    role: 'Staff / Cashier',
    permissions: {
      canCreateBills: false,
      canEditBills: false,
      canDeleteBills: false,
      canViewReports: false,
      canManageInventory: false,
      canManageParties: false,
      canViewAccounts: false,
      canApplyDiscounts: false,
      canManageDeliveries: false
    }
  };

  const [form, setForm] = useState(defaultForm);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    try {
      const res = await fetch(`/api/staff?username=${encodeURIComponent(user.username)}`);
      if (res.ok) setList(await res.json());

      const todayStr = new Date().toISOString().substring(0, 10);
      const attRes = await fetch(`/api/staff/attendance?username=${encodeURIComponent(user.username)}&from=${todayStr}&to=${todayStr}`);
      if (attRes.ok) {
        setTodayAttendance(await attRes.json());
      }
    } catch (err) {
      console.error('Failed to load staff details:', err);
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    showToast('Uploading file...', 'info');
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, [field]: data.fileUrl }));
        showToast('File uploaded successfully', 'success');
      } else {
        showToast('File upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading file', 'error');
    }
  };

  const add = async () => {
    if (!form.name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    const payload = { ...form, username: user.username };
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Staff member added successfully', 'success');
      setForm(defaultForm);
      setFormTab('basic');
      load();
    } else {
      showToast('Failed to add staff member', 'error');
    }
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      aadhaar: s.aadhaar || '',
      aadhaarFile: s.aadhaarFile || '',
      photo: s.photo || '',
      joiningDate: s.joiningDate || new Date().toISOString().substring(0, 10),
      salary: s.salary || '',
      role: s.role || 'Staff / Cashier',
      permissions: s.permissions || defaultForm.permissions
    });
    setFormTab('basic');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!form.name.trim()) {
      showToast('Full name is required', 'error');
      return;
    }
    const payload = { ...form, username: user.username };
    const res = await fetch(`/api/staff/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Staff details updated successfully', 'success');
      setEditingId(null);
      setForm(defaultForm);
      setFormTab('basic');
      load();
    } else {
      showToast('Failed to update staff member', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm);
    setFormTab('basic');
  };

  const deleteStaff = async (id) => {
    if (!await window.confirm('Are you sure you want to delete this staff member? This will mark them inactive.')) return;
    const res = await fetch(`/api/staff/${id}?username=${encodeURIComponent(user.username)}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Staff member deleted successfully', 'success');
      load();
    } else {
      showToast('Failed to delete staff member', 'error');
    }
  };

  const toggleActive = async (id, active) => {
    const res = await fetch(`/api/staff/${id}/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active, username: user.username })
    });
    if (res.ok) {
      showToast(`Staff member ${!active ? 'activated' : 'deactivated'}`, 'success');
      load();
    } else {
      showToast('Failed to update status', 'error');
    }
  };

  const viewActivities = async (id) => {
    try {
      const [actRes, logRes] = await Promise.all([
        fetch(`/api/staff/activity?username=${encodeURIComponent(user.username)}&staffId=${encodeURIComponent(id)}`),
        fetch(`/api/staff/${id}/logins?username=${encodeURIComponent(user.username)}`)
      ]);
      
      if (actRes.ok) setActivities(await actRes.json());
      if (logRes.ok) setLogins(await logRes.json());
      
      setShowActivitiesFor(id);
      setLogsTab('activities');
      setActivitiesModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load audit history', 'error');
    }
  };

  const addAttendance = async (id) => {
    const today = new Date().toISOString().substring(0, 10);
    const res = await fetch('/api/staff/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, staffId: id, date: today, status: 'present' })
    });
    if (res.ok) {
      showToast('Attendance recorded as Present today', 'success');
      load();
    } else {
      showToast('Failed to record attendance', 'error');
    }
  };

  const updateSalary = async (id, currentSalary) => {
    const v = prompt('Enter monthly salary amount (₹):', currentSalary || '');
    if (v == null) return;
    if (isNaN(v) || Number(v) < 0) {
      showToast('Please enter a valid salary amount', 'error');
      return;
    }
    const res = await fetch(`/api/staff/${id}/salary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salary: Number(v), username: user.username })
    });
    if (res.ok) {
      showToast('Salary details updated', 'success');
      load();
    } else {
      showToast('Failed to update salary details', 'error');
    }
  };

  const viewPerformance = async (id) => {
    const res = await fetch(`/api/staff/performance?username=${encodeURIComponent(user.username)}&staffId=${encodeURIComponent(id)}`);
    if (res.ok) {
      const j = await res.json();
      setPerformance({ staffId: id, ...j });
      setPerformanceModalOpen(true);
    } else {
      showToast('Failed to load performance metrics', 'error');
    }
  };

  const handlePermissionChange = (permKey) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey]
      }
    }));
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Manager':
        return <span className="badge badge--blue" style={{ fontSize: '11px', fontWeight: '600' }}>Manager</span>;
      case 'Accountant':
        return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontSize: '11px', fontWeight: '600' }}>Accountant</span>;
      case 'Staff / Cashier':
      case 'Cashier':
      case 'Staff':
        return <span className="badge badge--green" style={{ fontSize: '11px', fontWeight: '600' }}>{role}</span>;
      case 'Delivery Boy':
        return <span className="badge badge--yellow" style={{ fontSize: '11px', fontWeight: '600' }}>Delivery Boy</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.1)', color: '#64748b', fontSize: '11px', fontWeight: '600' }}>{role || 'Staff'}</span>;
    }
  };

  const getStaffName = (id) => {
    const found = list.find(s => s._id === id);
    return found ? found.name : 'Staff';
  };

  const presentTodayCount = todayAttendance.filter(a => a.status === 'present').length;
  const filteredList = list.filter(s => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || 
           (s.phone || '').includes(q) || 
           (s.email || '').toLowerCase().includes(q) || 
           (s.role || '').toLowerCase().includes(q);
  });
  const paginatedList = filteredList.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  return (
    <section className="view active" id="view-staff" style={{ padding: '24px 30px', fontFamily: "'Outfit', sans-serif" }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : toast.type === 'info' ? '#3b82f6' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white', padding: '12px 24px', borderRadius: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : toast.type === 'info' ? 'fas fa-spinner fa-spin' : 'fas fa-exclamation-circle'}></i>
          {toast.message}
        </div>
      )}

      <div className="sec-header" style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-1)' }}>Staff Command Center</h2>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '4px' }}>Monitor operational schedules, track user histories, audit logs, and log daily check-ins.</p>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card card--lift" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div className="stat__top">
            <span className="stat__lbl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', fontSize: '11px' }}>Total Crew</span>
            <div className="stat__icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: '38px', height: '38px', borderRadius: '10px' }}>
              <i className="fas fa-users" style={{ fontSize: '16px' }}></i>
            </div>
          </div>
          <div className="stat__val" style={{ fontSize: '28px', marginTop: '12px' }}>{list.length}</div>
        </div>

        <div className="card card--lift" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div className="stat__top">
            <span className="stat__lbl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', fontSize: '11px' }}>Active Staff</span>
            <div className="stat__icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '38px', height: '38px', borderRadius: '10px' }}>
              <i className="fas fa-user-check" style={{ fontSize: '16px' }}></i>
            </div>
          </div>
          <div className="stat__val" style={{ fontSize: '28px', marginTop: '12px' }}>{list.filter(s => s.active).length}</div>
        </div>

        <div className="card card--lift" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div className="stat__top">
            <span className="stat__lbl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', fontSize: '11px' }}>On Duty Today</span>
            <div className="stat__icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '38px', height: '38px', borderRadius: '10px' }}>
              <i className="fas fa-calendar-day" style={{ fontSize: '16px' }}></i>
            </div>
          </div>
          <div className="stat__val" style={{ fontSize: '28px', marginTop: '12px' }}>{presentTodayCount}</div>
        </div>

        <div className="card card--lift" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div className="stat__top">
            <span className="stat__lbl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600', fontSize: '11px' }}>Inactive Tiers</span>
            <div className="stat__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '38px', height: '38px', borderRadius: '10px' }}>
              <i className="fas fa-user-slash" style={{ fontSize: '16px' }}></i>
            </div>
          </div>
          <div className="stat__val" style={{ fontSize: '28px', marginTop: '12px' }}>{list.filter(s => !s.active).length}</div>
        </div>
      </div>

      <div className="two-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top: Add/Edit Staff Profile Card */}
        <div style={{ width: '100%' }}>
          <div className="card" style={{ padding: '24px', border: editingId ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
                {editingId ? 'Edit Profile' : 'Staff Onboarding'}
              </h3>
              {editingId && (
                <span className="badge badge--green" style={{ fontSize: '10px', textTransform: 'uppercase' }}>EDIT MODE</span>
              )}
            </div>

            {/* Profile Creation Wizard Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '18px', paddingBottom: '2px' }}>
              <button 
                type="button" 
                onClick={() => setFormTab('basic')} 
                style={{
                  flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: '600',
                  color: formTab === 'basic' ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: formTab === 'basic' ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                Basic
              </button>
              <button 
                type="button" 
                onClick={() => setFormTab('media')} 
                style={{
                  flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: '600',
                  color: formTab === 'media' ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: formTab === 'media' ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                Docs/Photo
              </button>
              <button 
                type="button" 
                onClick={() => setFormTab('access')} 
                style={{
                  flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '12.5px', fontWeight: '600',
                  color: formTab === 'access' ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: formTab === 'access' ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                Access
              </button>
            </div>

            {/* Form Fields: Tab Switching */}
            {formTab === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', animation: 'fadeIn 0.25s ease-out' }}>
                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-user" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input className="fi fi-icon-padding" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>

                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-envelope" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input type="email" className="fi fi-icon-padding" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-phone" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input className="fi fi-icon-padding" placeholder="10-digit Mobile" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Date of Joining</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-calendar-alt" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input type="date" className="fi fi-icon-padding" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                  </div>
                </div>

                <div className="fg" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Residential Address</label>
                  <textarea 
                    className="fi" 
                    style={{ minHeight: '60px', resize: 'vertical', fontSize: '13px' }} 
                    placeholder="Enter complete address details" 
                    value={form.address} 
                    onChange={e => setForm({ ...form, address: e.target.value })} 
                  />
                </div>
              </div>
            )}

            {formTab === 'media' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', animation: 'fadeIn 0.25s ease-out' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {form.photo ? (
                      <img src={form.photo} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="fas fa-user-tie" style={{ fontSize: '24px', color: '#94a3b8' }}></i>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', display: 'block', marginBottom: '4px' }}>Profile Photo</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'photo')} 
                      style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', width: '100%', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Aadhaar / ID Proof Number</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-id-card" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input className="fi fi-icon-padding" placeholder="Enter Aadhaar or Gov ID" value={form.aadhaar} onChange={e => setForm({ ...form, aadhaar: e.target.value })} />
                  </div>
                </div>

                <div className="fg" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Aadhaar / ID Proof Document</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="file" 
                      onChange={e => handleFileUpload(e, 'aadhaarFile')} 
                      style={{ fontSize: '11.5px', flex: 1, color: 'var(--text-3)', cursor: 'pointer' }} 
                    />
                    {form.aadhaarFile && (
                      <a href={form.aadhaarFile} target="_blank" rel="noreferrer" className="btn btn--sm" style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <i className="fas fa-eye"></i> View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formTab === 'access' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', animation: 'fadeIn 0.25s ease-out' }}>
                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Operational Role</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-briefcase" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <select className="fi fi-icon-padding" style={{ cursor: 'pointer' }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option>Staff / Cashier</option>
                      <option>Accountant</option>
                      <option>Delivery Boy</option>
                      <option>Manager</option>
                    </select>
                  </div>
                </div>

                <div className="fg">
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', marginBottom: '4px', display: 'block' }}>Monthly Salary (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-wallet" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}></i>
                    <input type="number" className="fi fi-icon-padding" placeholder="Monthly INR salary" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
                  </div>
                </div>

                <div className="fg" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: '600', fontSize: '12px', color: 'var(--text-2)', display: 'block', marginBottom: '8px' }}>Role Permissions</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', maxHeight: '135px', overflowY: 'auto', padding: '6px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canCreateBills} onChange={() => handlePermissionChange('canCreateBills')} />
                      <span>Create Bills</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canEditBills} onChange={() => handlePermissionChange('canEditBills')} />
                      <span>Edit Bills</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canDeleteBills} onChange={() => handlePermissionChange('canDeleteBills')} />
                      <span>Delete Bills</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canViewReports} onChange={() => handlePermissionChange('canViewReports')} />
                      <span>View Reports</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canManageInventory} onChange={() => handlePermissionChange('canManageInventory')} />
                      <span>Manage Inventory</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canManageParties} onChange={() => handlePermissionChange('canManageParties')} />
                      <span>Manage Parties</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canViewAccounts} onChange={() => handlePermissionChange('canViewAccounts')} />
                      <span>View Accounts</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canApplyDiscounts} onChange={() => handlePermissionChange('canApplyDiscounts')} />
                      <span>Apply Discounts</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} checked={!!form.permissions.canManageDeliveries} onChange={() => handlePermissionChange('canManageDeliveries')} />
                      <span>Manage Deliveries</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              {editingId ? (
                <>
                  <button onClick={saveEdit} className="btn btn--primary btn--sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                    <i className="fas fa-save"></i> Save Details
                  </button>
                  <button onClick={cancelEdit} className="btn btn--sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={add} className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)', cursor: 'pointer' }}>
                  <i className="fas fa-user-plus"></i> Add Staff Member
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom List: Staff Directory */}
        <div style={{ width: '100%' }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>Staff Directory</h3>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', fontSize: '13px', pointerEvents: 'none' }}></i>
                <input placeholder="Search name, role, email..." className="fi fi-search-padding" style={{ width: '250px', height: '36px', fontSize: '13px' }} value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Staff Member</th>
                    <th style={{ width: '15%' }}>Role</th>
                    <th style={{ width: '18%' }}>Contact</th>
                    <th style={{ width: '14%' }}>Monthly Salary</th>
                    <th style={{ width: '8%' }}>Status</th>
                    <th style={{ width: '15%', textAlignment: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length ? (
                    paginatedList.map(s => {
                      const isTodayPresent = todayAttendance.some(a => a.staffId === s._id && a.status === 'present');
                      return (
                        <tr key={s._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#cbd5e1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                {s.photo ? (
                                  <img src={s.photo} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <i className="fas fa-user-tie" style={{ fontSize: '14px', color: '#64748b' }}></i>
                                )}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>{s.name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Joined: {s.joiningDate || s.createdAt || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td>{getRoleBadge(s.role)}</td>
                          <td>
                            <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{s.phone || 'No phone'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{s.email || 'No email'}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '500', color: 'var(--text-2)' }}>
                              {s.salary ? `₹${Number(s.salary).toLocaleString('en-IN')}` : <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Not Set</span>}
                            </div>
                          </td>
                          <td>
                            {s.active ? (
                              <span className="badge badge--green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fas fa-circle" style={{ fontSize: '5px' }}></i> Active
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fas fa-circle" style={{ fontSize: '5px' }}></i> Inactive
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                              {/* View full details profile modal */}
                              <button
                                onClick={() => setProfileViewStaff(s)}
                                className="btn btn--sm btn--icon"
                                title="View Profile Details"
                                style={{ color: 'var(--accent)' }}
                              >
                                <i className="fas fa-eye"></i>
                              </button>

                              {/* Toggle active status */}
                              <button
                                onClick={() => toggleActive(s._id, s.active)}
                                className="btn btn--sm btn--icon"
                                title={s.active ? 'Suspend Account' : 'Activate Account'}
                                style={{ color: s.active ? '#10b981' : 'var(--text-3)' }}
                              >
                                <i className={s.active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'} style={{ fontSize: '15px' }}></i>
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => startEdit(s)}
                                className="btn btn--sm btn--icon"
                                title="Edit Staff"
                                style={{ color: '#3b82f6' }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>

                              {/* Quick Present */}
                              <button
                                onClick={() => addAttendance(s._id)}
                                className="btn btn--sm btn--icon"
                                disabled={isTodayPresent}
                                title={isTodayPresent ? 'Marked Present Today' : 'Mark Present Today'}
                                style={{ color: isTodayPresent ? '#cbd5e1' : '#10b981' }}
                              >
                                <i className="fas fa-calendar-check"></i>
                              </button>

                              {/* Audit Logs */}
                              <button
                                onClick={() => viewActivities(s._id)}
                                className="btn btn--sm btn--icon"
                                title="Operation Audit Logs"
                                style={{ color: '#64748b' }}
                              >
                                <i className="fas fa-history"></i>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => deleteStaff(s._id)}
                                className="btn btn--sm btn--icon"
                                title="Delete Staff"
                                style={{ color: 'var(--red)' }}
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>
                        <i className="fas fa-user-ninja" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', opacity: 0.3 }}></i>
                        No staff profiles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ color: '#64748b', fontSize: '13px' }}>Showing {filteredList.length} total profiles</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn btn--sm"
                  style={{ minWidth: '70px', justifyContent: 'center' }}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <i className="fas fa-chevron-left" style={{ fontSize: '10px', marginRight: '4px' }}></i> Prev
                </button>
                <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-input)', fontWeight: '600', fontSize: '13px' }}>
                  {page}
                </div>
                <button
                  className="btn btn--sm"
                  style={{ minWidth: '70px', justifyContent: 'center' }}
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= filteredList.length}
                >
                  Next <i className="fas fa-chevron-right" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Profile Full Details Modal */}
      {profileViewStaff && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '600px', maxH: '90vh', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>Staff Member Card</h3>
              <button
                className="btn btn--icon"
                onClick={() => setProfileViewStaff(null)}
                style={{ fontSize: '16px' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '6px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '50%', overflow: 'hidden', background: '#cbd5e1', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  {profileViewStaff.photo ? (
                    <img src={profileViewStaff.photo} alt={profileViewStaff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="fas fa-user-tie" style={{ fontSize: '36px', color: '#64748b' }}></i>
                  )}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-1)' }}>{profileViewStaff.name}</h4>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {getRoleBadge(profileViewStaff.role)}
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Joined {profileViewStaff.joiningDate || profileViewStaff.createdAt || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600' }}>Email Address</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-1)', fontWeight: '500', marginTop: '2px' }}>{profileViewStaff.email || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600' }}>Phone Number</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-1)', fontWeight: '500', marginTop: '2px' }}>{profileViewStaff.phone || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600' }}>Aadhaar / ID Number</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-1)', fontWeight: '500', marginTop: '2px' }}>{profileViewStaff.aadhaar || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600' }}>Monthly Salary</span>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-1)', fontWeight: '500', marginTop: '2px' }}>
                    {profileViewStaff.salary ? `₹${Number(profileViewStaff.salary).toLocaleString('en-IN')}` : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Residential Address</span>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', lineHeight: '1.4' }}>
                  {profileViewStaff.address || 'No address details recorded.'}
                </div>
              </div>

              {profileViewStaff.aadhaarFile && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-file-pdf" style={{ color: '#ef4444', fontSize: '18px' }}></i>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-2)', fontWeight: '500' }}>Uploaded ID Proof</span>
                  </div>
                  <a href={profileViewStaff.aadhaarFile} target="_blank" rel="noreferrer" className="btn btn--sm" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fas fa-external-link-alt"></i> View Document
                  </a>
                </div>
              )}

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Assigned Security Permissions</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {[
                    { key: 'canCreateBills', label: 'Create Bills' },
                    { key: 'canEditBills', label: 'Edit Bills' },
                    { key: 'canDeleteBills', label: 'Delete Bills' },
                    { key: 'canViewReports', label: 'View Reports' },
                    { key: 'canManageInventory', label: 'Manage Inventory' },
                    { key: 'canManageParties', label: 'Manage Parties' },
                    { key: 'canViewAccounts', label: 'View Accounts' },
                    { key: 'canApplyDiscounts', label: 'Apply Discounts' },
                    { key: 'canManageDeliveries', label: 'Manage Deliveries' }
                  ].map(p => {
                    const hasPerm = profileViewStaff.permissions && !!profileViewStaff.permissions[p.key];
                    return (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: hasPerm ? 'var(--text-1)' : 'var(--text-3)' }}>
                        <i className={hasPerm ? 'fas fa-circle-check' : 'far fa-circle'} style={{ color: hasPerm ? 'var(--accent)' : 'var(--text-3)', fontSize: '13px' }}></i>
                        <span style={{ textDecoration: hasPerm ? 'none' : 'line-through' }}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              {/* Quick actions for attendance & salary details inside profile card */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { addAttendance(profileViewStaff._id); setProfileViewStaff(null); }} className="btn btn--sm" style={{ color: 'var(--accent)' }}>
                    <i className="fas fa-calendar-check"></i> Present Today
                  </button>
                  <button onClick={() => { updateSalary(profileViewStaff._id, profileViewStaff.salary); setProfileViewStaff(null); }} className="btn btn--sm" style={{ color: '#8b5cf6' }}>
                    <i className="fas fa-wallet"></i> Adjust Salary
                  </button>
                </div>
                <button className="btn btn--primary btn--sm" onClick={() => setProfileViewStaff(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Timeline Modal */}
      {activitiesModalOpen && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '580px', maxH: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
                Audit History: {getStaffName(showActivitiesFor)}
              </h3>
              <button
                className="btn btn--icon"
                onClick={() => { setActivitiesModalOpen(false); setActivities([]); setLogins([]); setShowActivitiesFor(null); }}
                style={{ fontSize: '16px' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Audit History Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '18px', paddingBottom: '2px' }}>
              <button 
                type="button" 
                onClick={() => setLogsTab('activities')} 
                style={{
                  flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600',
                  color: logsTab === 'activities' ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: logsTab === 'activities' ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-list-ul" style={{ marginRight: '6px' }}></i> Activity Logs
              </button>
              <button 
                type="button" 
                onClick={() => setLogsTab('logins')} 
                style={{
                  flex: 1, padding: '8px 0', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600',
                  color: logsTab === 'logins' ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: logsTab === 'logins' ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-key" style={{ marginRight: '6px' }}></i> Login History
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, maxHeight: '350px', paddingRight: '6px' }}>
              {logsTab === 'activities' ? (
                activities.length ? (
                  <div style={{ position: 'relative', borderLeft: '2px solid var(--border)', marginLeft: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }}>
                    {activities.map(a => (
                      <div key={a._id} style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: '-27px', top: '4px',
                          background: 'var(--bg-body)', color: 'var(--accent)',
                          width: '12px', height: '12px', borderRadius: '50%',
                          border: '2px solid var(--accent)', display: 'block'
                        }}></span>
                        <div style={{ fontWeight: '700', color: 'var(--text-1)', fontSize: '13.5px' }}>{a.action}</div>
                        {a.detail && (
                          <div style={{ color: 'var(--text-2)', fontSize: '12.5px', marginTop: '3px' }}>{a.detail}</div>
                        )}
                        <div style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '4px' }}>
                          <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                          {new Date(a.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                    <i className="fas fa-clipboard-list" style={{ fontSize: '28px', marginBottom: '10px', display: 'block', opacity: 0.3 }}></i>
                    No logged activities for this staff member.
                  </div>
                )
              ) : (
                logins.length ? (
                  <div style={{ position: 'relative', borderLeft: '2px solid var(--border)', marginLeft: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }}>
                    {logins.map(l => (
                      <div key={l._id} style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute', left: '-27px', top: '4px',
                          background: 'var(--bg-body)', color: l.successful ? 'var(--accent)' : 'var(--red)',
                          width: '12px', height: '12px', borderRadius: '50%',
                          border: `2px solid ${l.successful ? 'var(--accent)' : 'var(--red)'}`, display: 'block'
                        }}></span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-1)', fontSize: '13.5px' }}>
                            {l.successful ? 'Login Successful' : 'Failed Login Attempt'}
                          </div>
                          <span className={`badge ${l.successful ? 'badge--green' : 'badge--red'}`} style={{ fontSize: '10px' }}>
                            {l.successful ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-2)', fontSize: '12px', marginTop: '3px' }}>
                          <div><b>IP Address:</b> {l.ipAddress}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '2px', wordBreak: 'break-all' }}><b>Device Info:</b> {l.userAgent}</div>
                        </div>
                        <div style={{ color: 'var(--text-3)', fontSize: '11px', marginTop: '4px' }}>
                          <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                          {new Date(l.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
                    <i className="fas fa-user-lock" style={{ fontSize: '28px', marginBottom: '10px', display: 'block', opacity: 0.3 }}></i>
                    No login history records found.
                  </div>
                )
              )}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button className="btn" onClick={() => { setActivitiesModalOpen(false); setActivities([]); setLogins([]); setShowActivitiesFor(null); }}>Close Logs</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Analytics Modal */}
      {performanceModalOpen && performance && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '420px', padding: '24px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-1)' }}>
                Performance metrics: {getStaffName(performance.staffId)}
              </h3>
              <button
                className="btn btn--icon"
                onClick={() => { setPerformance(null); setPerformanceModalOpen(false); }}
                style={{ fontSize: '16px' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-2)' }}>
                  <span>Logged Actions count</span>
                  <span style={{ fontWeight: 'bold' }}>{performance.activityCount} actions</span>
                </div>
                <div style={{ height: '8px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)', width: `${Math.min(100, (performance.activityCount / 50) * 100)}%`, borderRadius: '10px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'var(--text-2)' }}>
                  <span>Recorded Check-ins</span>
                  <span style={{ fontWeight: 'bold' }}>{performance.attendanceCount} days</span>
                </div>
                <div style={{ height: '8px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', width: `${Math.min(100, (performance.attendanceCount / 30) * 100)}%`, borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button className="btn btn--primary" onClick={() => { setPerformance(null); setPerformanceModalOpen(false); }}>Close Analytics</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
