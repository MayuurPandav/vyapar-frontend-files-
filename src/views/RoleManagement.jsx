import React, { useState, useEffect } from 'react';

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState('admins'); // admins, roles, audit
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [adminModal, setAdminModal] = useState({ show: false, mode: 'create', data: null });
  const [roleModal, setRoleModal] = useState({ show: false, mode: 'create', data: null });

  // Form State
  const [adminForm, setAdminForm] = useState({ username: '', password: '', phone: '', sa_role: '', sa_access_expiry: '', status: 'active' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: {} });
  const [detailModal, setDetailModal] = useState(null); // { title, type, rows: [] }

  const ALL_PERMISSIONS = [
    { key: 'all', label: 'Full Master Access' },
    { key: 'billing', label: 'Manage Subscriptions & Invoices' },
    { key: 'payments', label: 'View & Manage Payments' },
    { key: 'users_read', label: 'View Users & Global Staff' },
    { key: 'users_write', label: 'Manage Users & Global Staff' },
    { key: 'support', label: 'Access Helpdesk & Tickets' },
    { key: 'analytics_read', label: 'View Analytics & Dashboard' },
    { key: 'plans_write', label: 'Manage Pricing Plans' },
    { key: 'settings_write', label: 'Manage System Settings' },
    { key: 'content_write', label: 'Manage Legal & Policy Content' },
    { key: 'integrations', label: 'Manage API Keys & Integrations' },
    { key: 'security_write', label: 'Manage Security Policies' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsRes, rolesRes, auditRes] = await Promise.all([
        fetch('/api/super/admins'),
        fetch('/api/super/roles'),
        fetch('/api/super/audit')
      ]);
      
      if (adminsRes.ok) setAdmins(await adminsRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      
      if (auditRes.ok) {
        const resData = await auditRes.json();
        const logs = Array.isArray(resData) ? resData : (resData.data || []);
        // Filter only role and admin related logs
        setAuditLogs(logs.filter(l => l.action.startsWith('ADMIN_') || l.action.startsWith('ROLE_')));
      }
    } catch (err) {
      console.error('Failed to fetch role data', err);
    } finally {
      setLoading(false);
    }
  };

  // Admin Actions
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = adminModal.mode === 'create' ? '/api/super/admins' : `/api/super/admins/${adminForm.username}`;
      const method = adminModal.mode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      
      if (res.ok) {
        setAdminModal({ show: false, mode: 'create', data: null });
        fetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to save Admin');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (username) => {
    if (!await window.confirm(`Permanently delete sub-admin ${username}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/admins/${username}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else alert((await res.json()).message || 'Failed to delete');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Role Actions
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = roleModal.mode === 'create' ? '/api/super/roles' : `/api/super/roles/${roleModal.data._id}`;
      const method = roleModal.mode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });
      
      if (res.ok) {
        setRoleModal({ show: false, mode: 'create', data: null });
        fetchData();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to save Role');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (key) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const openAdminModal = (mode, data = null) => {
    if (mode === 'create') {
      setAdminForm({ username: '', password: '', phone: '', sa_role: roles[0]?.name || '', sa_access_expiry: '', status: 'active' });
    } else {
      setAdminForm({ 
        username: data.username, 
        phone: data.phone || '', 
        sa_role: data.sa_role || '', 
        sa_access_expiry: data.sa_access_expiry ? new Date(data.sa_access_expiry).toISOString().substring(0, 10) : '', 
        status: data.status || 'active' 
      });
    }
    setAdminModal({ show: true, mode, data });
  };

  const openRoleModal = (mode, data = null) => {
    if (mode === 'create') {
      setRoleForm({ name: '', description: '', permissions: {} });
    } else {
      // For editing or cloning
      setRoleForm({ 
        name: mode === 'clone' ? `${data.name} (Copy)` : data.name, 
        description: data.description || '', 
        permissions: data.permissions || {} 
      });
    }
    setRoleModal({ show: true, mode: mode === 'clone' ? 'create' : mode, data });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading Roles & Permissions...</div>
      </div>
    );
  }

  // Styles
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
  const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Role & Permission Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Manage Super Admin access, define sub-roles, and control permissions across the platform.
          </p>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Sub-Admin Accounts', type: 'admins', rows: admins })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f615', display: 'grid', placeItems: 'center', color: '#3b82f6', fontSize: '16px' }}>
              <i className="fas fa-users-gear"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{admins.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sub-Admins</div>
            </div>
          </div>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'SaaS Platform Roles', type: 'roles', rows: roles })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8b5cf615', display: 'grid', placeItems: 'center', color: '#8b5cf6', fontSize: '16px' }}>
              <i className="fas fa-id-badge"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{roles.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Roles</div>
            </div>
          </div>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Access Control Audit Trail', type: 'audit', rows: auditLogs })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#10b98115', display: 'grid', placeItems: 'center', color: '#10b981', fontSize: '16px' }}>
              <i className="fas fa-shield-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>Active</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Control</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'admins' ? '' : 'btn--outline'}`} 
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'admins' ? '2px solid var(--accent)' : 'none' }}
            onClick={() => setActiveTab('admins')}
          >
            <i className="fas fa-users-gear" style={{ marginRight: '6px' }}></i> Sub-Admins
          </button>
          <button 
            className={`btn ${activeTab === 'roles' ? '' : 'btn--outline'}`} 
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'roles' ? '2px solid var(--accent)' : 'none' }}
            onClick={() => setActiveTab('roles')}
          >
            <i className="fas fa-user-shield" style={{ marginRight: '6px' }}></i> Roles & Permissions
          </button>
          <button 
            className={`btn ${activeTab === 'audit' ? '' : 'btn--outline'}`} 
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: activeTab === 'audit' ? '2px solid var(--accent)' : 'none' }}
            onClick={() => setActiveTab('audit')}
          >
            <i className="fas fa-list-check" style={{ marginRight: '6px' }}></i> Audit Logs
          </button>
        </div>

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-users-gear" style={{ color: 'var(--accent)' }}></i> Super Admin Users
              </h2>
              <button className="btn btn--primary" onClick={() => openAdminModal('create')}>
                <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> New Sub-Admin
              </button>
            </div>
            
            <section className="sa-table-card" style={{ padding: 0, overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>USERNAME</th>
                    <th>ASSIGNED ROLE</th>
                    <th>STATUS</th>
                    <th>ACCESS EXPIRY</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                     <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)' }}>No admins found.</td></tr>
                  ) : (
                    admins.map(a => {
                      const isExpired = a.sa_access_expiry && new Date() > new Date(a.sa_access_expiry);
                      return (
                      <tr key={a._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>@{a.username}</div>
                          {a.phone && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.phone}</div>}
                        </td>
                        <td>
                          <span className="badge badge--blue" style={{ fontSize: '11px' }}>{a.sa_role}</span>
                        </td>
                        <td>
                          <span className={`badge ${a.status === 'blocked' ? 'badge--red' : 'badge--green'}`} style={{ fontSize: '11px' }}>
                            {a.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {a.sa_access_expiry ? (
                            <span style={{ fontSize: '12px', color: isExpired ? '#ef4444' : 'var(--text-2)' }}>
                              {new Date(a.sa_access_expiry).toLocaleDateString()} {isExpired && '(Expired)'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Unlimited</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn--sm" style={{ marginRight: '6px' }} onClick={() => openAdminModal('edit', a)} title="Edit Settings">
                            <i className="fas fa-pen"></i>
                          </button>
                          {a.sa_role !== 'Super Admin Owner' && (
                            <button className="btn btn--sm" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteAdmin(a.username)} title="Delete">
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-user-shield" style={{ color: '#8b5cf6' }}></i> Custom Roles & Permissions
              </h2>
              <button className="btn btn--primary" style={{ background: '#8b5cf6' }} onClick={() => openRoleModal('create')}>
                <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Custom Role
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {roles.map(r => (
                <div key={r._id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-1)' }}>{r.name}</h3>
                      {!r.is_custom ? (
                         <span className="badge badge--green" style={{ fontSize: '10px', padding: '2px 6px' }}>PREDEFINED</span>
                      ) : (
                         <span className="badge badge--yellow" style={{ fontSize: '10px', padding: '2px 6px' }}>CUSTOM</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn--sm" title="Clone Role" onClick={() => openRoleModal('clone', r)}>
                        <i className="fas fa-copy"></i>
                      </button>
                      {r.is_custom && (
                        <button className="btn btn--sm" title="Edit Role" onClick={() => openRoleModal('edit', r)}>
                          <i className="fas fa-pen"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0 0 16px', flex: 1 }}>{r.description}</p>
                  
                  <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>PERMISSIONS:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.keys(r.permissions).map(k => r.permissions[k] ? (
                        <span key={k} style={{ fontSize: '10px', background: '#3b82f620', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>
                          {ALL_PERMISSIONS.find(p => p.key === k)?.label || k}
                        </span>
                      ) : null)}
                      {Object.keys(r.permissions).length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>No permissions assigned</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="card">
            <h2 style={{ fontSize: '16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-list-check" style={{ color: '#10b981' }}></i> Access Control Audit Logs
            </h2>
            {auditLogs.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                 No permission or role changes recorded yet.
               </div>
            ) : (
              <table className="tbl" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>DATE & TIME</th>
                    <th>ACTION</th>
                    <th>DETAILS</th>
                    <th>BY</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                      <td>
                        <span className="badge badge--blue" style={{ fontSize: '10px' }}>{log.action}</span>
                      </td>
                      <td>{log.details || '—'}</td>
                      <td><code>@{log.username}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* Admin Modal */}
      {adminModal.show && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setAdminModal({show:false})}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{adminModal.mode === 'create' ? 'Create Sub-Admin' : 'Edit Sub-Admin'}</h3>
              <button className="btn--icon" onClick={() => setAdminModal({show:false})}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleAdminSubmit}>
              <div className="fg">
                <label>Username</label>
                <input type="text" className="fi" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} disabled={adminModal.mode === 'edit'} required />
              </div>
              {adminModal.mode === 'create' && (
                <div className="fg">
                  <label>Password</label>
                  <input type="password" className="fi" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} required={adminModal.mode === 'create'} />
                </div>
              )}
              <div className="fg">
                <label>Phone Number</label>
                <input type="text" className="fi" value={adminForm.phone} onChange={e => setAdminForm({...adminForm, phone: e.target.value})} />
              </div>
              <div className="fg">
                <label>Assigned Role</label>
                <select className="fi" value={adminForm.sa_role} onChange={e => setAdminForm({...adminForm, sa_role: e.target.value})} required>
                  <option value="">-- Select Role --</option>
                  {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="fg">
                <label>Time-Based Access Expiry (Optional)</label>
                <input type="date" className="fi" value={adminForm.sa_access_expiry} onChange={e => setAdminForm({...adminForm, sa_access_expiry: e.target.value})} />
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>Leave blank for permanent access. User will be blocked from logging in after this date.</div>
              </div>
              {adminModal.mode === 'edit' && (
                <div className="fg">
                  <label>Account Status</label>
                  <select className="fi" value={adminForm.status} onChange={e => setAdminForm({...adminForm, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: '10px' }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Sub-Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal.show && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setRoleModal({show:false})}>
          <div style={{...modalBox, maxWidth: '800px'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{roleModal.mode === 'create' ? 'Create Custom Role' : 'Edit Role'}</h3>
              <button className="btn--icon" onClick={() => setRoleModal({show:false})}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="form-row">
                <div className="fg">
                  <label>Role Name</label>
                  <input type="text" className="fi" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} required />
                </div>
              </div>
              <div className="fg">
                <label>Description</label>
                <textarea className="fi" rows="2" value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} required></textarea>
              </div>
              
              <div className="fg" style={{ marginTop: '20px' }}>
                <label style={{ fontSize: '14px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Permission Controls</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={roleForm.permissions[p.key] || false} 
                        onChange={() => togglePermission(p.key)}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-1)' }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: '20px', background: '#8b5cf6' }} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Role Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDetailModal(null)}>
          <div style={{ ...modalBox, maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>{detailModal.title}</h3>
              <button className="btn--icon" onClick={() => setDetailModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {detailModal.type === 'admins' ? (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Assigned Role</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Access Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.rows.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No admins found.</td></tr>
                    ) : (
                      detailModal.rows.map(a => {
                        const isExpired = a.sa_access_expiry && new Date() > new Date(a.sa_access_expiry);
                        return (
                          <tr key={a._id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>@{a.username}</div>
                              {a.phone && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{a.phone}</div>}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className="badge badge--blue" style={{ fontSize: '11px' }}>{a.sa_role}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span className={`badge ${a.status === 'blocked' ? 'badge--red' : 'badge--green'}`} style={{ fontSize: '11px' }}>
                                {a.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              {a.sa_access_expiry ? (
                                <span style={{ fontSize: '12px', color: isExpired ? '#ef4444' : 'var(--text-2)' }}>
                                  {new Date(a.sa_access_expiry).toLocaleDateString()} {isExpired && '(Expired)'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Unlimited</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : detailModal.type === 'roles' ? (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Role Name</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.rows.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No roles found.</td></tr>
                    ) : (
                      detailModal.rows.map(r => (
                        <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{r.description}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {!r.is_custom ? (
                              <span className="badge badge--green" style={{ fontSize: '10px' }}>PREDEFINED</span>
                            ) : (
                              <span className="badge badge--yellow" style={{ fontSize: '10px' }}>CUSTOM</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.rows.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No audit logs found.</td></tr>
                    ) : (
                      detailModal.rows.map((log, i) => (
                        <tr key={log._id || i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge badge--blue" style={{ fontSize: '10px' }}>{log.action}</span>
                          </td>
                          <td style={{ padding: '12px' }}>{log.details || '—'}</td>
                          <td style={{ padding: '12px' }}><code>@{log.username}</code></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
