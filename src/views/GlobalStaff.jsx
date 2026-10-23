import React, { useState, useEffect, useMemo } from 'react';

export default function GlobalStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [detailModal, setDetailModal] = useState(null); // { title, rows: [] }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/staff');
      if (res.ok) {
        const json = await res.json();
        setStaff(json.data || []);
      }
    } catch (err) {
      console.error('Fetch staff error:', err);
    } finally {
      setLoading(false);
    }
  };

  const uniqueRoles = useMemo(() => [...new Set(staff.map(s => s.role).filter(Boolean))].sort(), [staff]);
  const uniqueShops = useMemo(() => [...new Set(staff.map(s => s.shopName).filter(Boolean))].sort(), [staff]);

  const filtered = useMemo(() => {
    return staff.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (s.name || '').toLowerCase().includes(q) || (s.username || '').toLowerCase().includes(q) || (s.shopName || '').toLowerCase().includes(q);
      const matchRole = !roleFilter || s.role === roleFilter;
      const matchShop = !shopFilter || s.shopName === shopFilter;
      const matchStatus = !statusFilter || (statusFilter === 'active' ? s.active !== false : s.active === false);
      return matchSearch && matchRole && matchShop && matchStatus;
    });
  }, [staff, searchQuery, roleFilter, shopFilter, statusFilter]);

  const handleToggleStatus = async (staffMember) => {
    const targetStatus = staffMember.active === false; // toggle
    if (!await window.confirm(`${targetStatus ? 'Activate' : 'Block/Deactivate'} staff member "${staffMember.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/staff/${staffMember._id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: targetStatus })
      });
      if (res.ok) await fetchData();
      else alert('Failed to update status');
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const openActivity = async (s) => {
    setSelectedStaff(s);
    setActivityLogs([]);
    setActiveModal('activity');
    try {
      const res = await fetch(`/api/super/staff/activity/${s._id}`);
      if (res.ok) {
        const json = await res.json();
        setActivityLogs(json.data || []);
      }
    } catch (err) { console.error(err); }
  };

  const openLogins = async (s) => {
    setSelectedStaff(s);
    setLoginLogs([]);
    setActiveModal('logins');
    try {
      const res = await fetch(`/api/super/staff/${s._id}/logins`);
      if (res.ok) {
        const json = await res.json();
        setLoginLogs(json.data || []);
      }
    } catch (err) { console.error(err); }
  };

  // Styles
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
  const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };
  const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Global Staff Members</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            View and manage all staff members across all tenant shops.
          </p>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Total Staff Members', rows: staff })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f615', display: 'grid', placeItems: 'center', color: '#3b82f6', fontSize: '16px' }}>
              <i className="fas fa-users-viewfinder"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{staff.length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Staff</div>
            </div>
          </div>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Active Staff Members', rows: staff.filter(s => s.active !== false) })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#10b98115', display: 'grid', placeItems: 'center', color: '#10b981', fontSize: '16px' }}>
              <i className="fas fa-user-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{staff.filter(s => s.active !== false).length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1 1 220px', position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-3)', fontSize: '13px' }}></i>
              <input
                type="text"
                placeholder="Search staff or shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '38px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
              />
            </div>
            <select className="fi" style={{ width: '150px', height: '38px', fontSize: '13px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="fi" style={{ width: '180px', height: '38px', fontSize: '13px' }} value={shopFilter} onChange={e => setShopFilter(e.target.value)}>
              <option value="">All Shops</option>
              {uniqueShops.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="fi" style={{ width: '130px', height: '38px', fontSize: '13px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
            {(searchQuery || roleFilter || shopFilter || statusFilter) && (
              <button className="btn btn--sm" style={{ height: '38px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => { setSearchQuery(''); setRoleFilter(''); setShopFilter(''); setStatusFilter(''); }}>
                <i className="fas fa-times"></i> Clear
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>STAFF MEMBER</th>
                <th>SHOP / TENANT</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-3)' }}>
                    No staff members match the filters.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-1)', fontSize: '13px' }}>{s.shopName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>@{s.username}</div>
                    </td>
                    <td>
                      <span className="badge badge--blue" style={{ fontSize: '11px' }}>{s.role || 'Staff'}</span>
                    </td>
                    <td>
                      <span className={`badge ${s.active === false ? 'badge--red' : 'badge--green'}`} style={{ fontSize: '11px' }}>
                        {s.active === false ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="btn btn--sm" title="Activity Logs" onClick={() => openActivity(s)}>
                          <i className="fas fa-list-check"></i>
                        </button>
                        <button className="btn btn--sm" title="Login History" onClick={() => openLogins(s)}>
                          <i className="fas fa-desktop"></i>
                        </button>
                        <button className="btn btn--sm" title={s.active === false ? 'Activate' : 'Block'} onClick={() => handleToggleStatus(s)} disabled={actionLoading} style={{ color: s.active === false ? '#10b981' : '#f59e0b' }}>
                          <i className={`fas ${s.active === false ? 'fa-circle-check' : 'fa-ban'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Activity Logs Modal */}
        {activeModal === 'activity' && selectedStaff && (
          <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
            <div style={modalBox}>
              <div style={modalHead}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>Activity Logs</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{selectedStaff.name} ({selectedStaff.shopName})</div>
                </div>
                <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
              </div>
              {activityLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  No activity logs found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activityLogs.map((log, i) => (
                    <div key={log._id || i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px' }}>
                      <i className="fas fa-circle" style={{ fontSize: '6px', marginTop: '6px', color: '#8b5cf6' }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{log.action}</div>
                        {log.detail && <div style={{ color: 'var(--text-3)', marginTop: '2px' }}>{log.detail}</div>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Logs Modal */}
        {activeModal === 'logins' && selectedStaff && (
          <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
            <div style={{...modalBox, maxWidth: '700px'}}>
              <div style={modalHead}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>Login History</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{selectedStaff.name} ({selectedStaff.shopName})</div>
                </div>
                <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
              </div>
              {loginLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  No login history recorded yet.
                </div>
              ) : (
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>DATE & TIME</th>
                      <th>IP ADDRESS</th>
                      <th>USER AGENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.map((h, i) => (
                      <tr key={h._id || i}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}
                        </td>
                        <td><code>{h.ip || '—'}</code></td>
                        <td><div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.userAgent}>{h.userAgent || '—'}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Staff Stats Detail Modal */}
      {detailModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDetailModal(null)}>
          <div style={{ ...modalBox, maxWidth: '800px' }}>
            <div style={modalHead}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>
                {detailModal.title}
              </h3>
              <button className="btn--icon" onClick={() => setDetailModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Staff Member</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Shop / Tenant</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.rows.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No staff members found.</td></tr>
                  ) : (
                    detailModal.rows.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.phone || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ color: 'var(--text-1)', fontSize: '13px' }}>{s.shopName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>@{s.username}</div>
                        </td>
                        <td style={{ padding: '12px' }}><span className="badge badge--blue">{s.role || 'Staff'}</span></td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${s.active === false ? 'badge--red' : 'badge--green'}`}>
                            {s.active === false ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
