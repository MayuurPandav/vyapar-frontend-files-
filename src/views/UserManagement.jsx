 import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function UserManagement() {
  const { loginAsTenant } = useApp();

  // Data
  const [owners, setOwners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [shopTypeFilter, setShopTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [resetPwForm, setResetPwForm] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [detailModal, setDetailModal] = useState(null); // { title, rows: [] }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, plansRes] = await Promise.all([
        fetch('/api/super/shops'),
        fetch('/api/super/plans')
      ]);
      if (shopsRes.ok) setOwners(await shopsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
    } catch (err) {
      console.error('UserManagement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derived filter options
  const uniqueCities = useMemo(() => [...new Set(owners.map(o => o.settings?.city || o.city).filter(Boolean))].sort(), [owners]);
  const uniqueStates = useMemo(() => [...new Set(owners.map(o => o.settings?.state || o.state).filter(Boolean))].sort(), [owners]);
  const uniqueShopTypes = useMemo(() => [...new Set(owners.map(o => o.settings?.shopType || o.shopType).filter(Boolean))].sort(), [owners]);
  const uniquePlanNames = useMemo(() => [...new Set(owners.map(o => o.settings?.planName || o.planName).filter(Boolean))].sort(), [owners]);

  // Filtering
  const filtered = useMemo(() => {
    return owners.filter(o => {
      const name = (o.bizName || o.settings?.bizName || '').toLowerCase();
      const email = (o.email || o.settings?.email || '').toLowerCase();
      const phone = (o.phone || o.settings?.phone || '');
      const gstin = (o.settings?.gstin || o.gstin || '').toLowerCase();
      const uname = (o.username || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q) || gstin.includes(q) || uname.includes(q);
      const matchStatus = !statusFilter || o.status === statusFilter;
      const ownerPlan = o.settings?.planName || o.planName || '';
      const matchPlan = !planFilter || ownerPlan === planFilter;
      const ownerCity = (o.settings?.city || o.city || '');
      const matchCity = !cityFilter || ownerCity === cityFilter;
      const ownerState = (o.settings?.state || o.state || '');
      const matchState = !stateFilter || ownerState === stateFilter;
      const ownerShopType = (o.settings?.shopType || o.shopType || '');
      const matchShopType = !shopTypeFilter || ownerShopType === shopTypeFilter;

      // Date joined filter (uses _id timestamp for MongoDB ObjectId or createdAt field)
      let matchDate = true;
      if (dateFrom || dateTo) {
        let joined = o.createdAt || o.settings?.createdAt;
        if (!joined && o._id && typeof o._id === 'string' && o._id.length === 24) {
          try { joined = new Date(parseInt(o._id.substring(0, 8), 16) * 1000).toISOString().substring(0, 10); } catch (e) { /* ignore */ }
        }
        if (joined) {
          const d = typeof joined === 'string' ? joined.substring(0, 10) : '';
          if (dateFrom && d < dateFrom) matchDate = false;
          if (dateTo && d > dateTo) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchPlan && matchCity && matchState && matchShopType && matchDate;
    });
  }, [owners, searchQuery, statusFilter, planFilter, cityFilter, stateFilter, shopTypeFilter, dateFrom, dateTo]);

  // Actions
  const handleToggleStatus = async (username, currentStatus) => {
    const targetStatus = currentStatus === 'active' ? 'blocked' : 'active';
    if (!await window.confirm(`${targetStatus === 'blocked' ? 'Block' : 'Unblock'} user ${username}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, status: targetStatus }) });
      if (res.ok) await fetchData();
      else alert('Failed to update status');
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (username, hard = false) => {
    const msg = hard ? `PERMANENTLY delete ${username} and all their data? This cannot be undone!` : `Deactivate/soft-delete ${username}?`;
    if (!await window.confirm(msg)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/users/${encodeURIComponent(username)}${hard ? '?hard=true' : ''}`, { method: 'DELETE' });
      if (res.ok) { await fetchData(); setActiveModal(null); }
      else { const d = await res.json().catch(() => ({})); alert(d.message || 'Delete failed'); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleForceResetPassword = async () => {
    if (!selectedUser || !resetPwForm) return alert('Enter a new password');
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/users/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: selectedUser.username, newPassword: resetPwForm }) });
      if (res.ok) { alert('Password reset successfully'); setActiveModal(null); setResetPwForm(''); }
      else { const d = await res.json().catch(() => ({})); alert(d.message || 'Reset failed'); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleMerge = async () => {
    if (!selectedUser || !mergeTarget) return alert('Select a target account');
    if (!await window.confirm(`Merge all data from "${selectedUser.username}" into "${mergeTarget}"? The source account will be deactivated.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/users/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceUsername: selectedUser.username, targetUsername: mergeTarget }) });
      if (res.ok) { alert('Accounts merged successfully'); setActiveModal(null); setMergeTarget(''); await fetchData(); }
      else { const d = await res.json().catch(() => ({})); alert(d.message || 'Merge failed'); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const openLoginHistory = async (user) => {
    setSelectedUser(user);
    setLoginHistory([]);
    setAuditLogs([]);
    setActiveModal('history');
    try {
      const [histRes, auditRes] = await Promise.all([
        fetch(`/api/super/users/${encodeURIComponent(user.username)}/login-history`),
        fetch(`/api/super/audit?username=${encodeURIComponent(user.username)}`)
      ]);
      if (histRes.ok) setLoginHistory(await histRes.json());
      if (auditRes.ok) {
        const resData = await auditRes.json();
        setAuditLogs(Array.isArray(resData) ? resData : (resData.data || []));
      }
    } catch (err) { console.error(err); }
  };

  const parseUA = (ua) => {
    if (!ua || ua === 'unknown') return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    let browser = 'Other', os = 'Unknown', device = 'Desktop';
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) { os = 'Android'; device = 'Mobile'; }
    else if (/iPhone|iPad/i.test(ua)) { os = 'iOS'; device = 'Mobile'; }
    else if (/Linux/i.test(ua)) os = 'Linux';
    return { browser, os, device };
  };

  const getJoinDate = (o) => {
    if (o.createdAt) return new Date(o.createdAt).toLocaleDateString('en-IN');
    if (o._id && typeof o._id === 'string' && o._id.length === 24) {
      try { return new Date(parseInt(o._id.substring(0, 8), 16) * 1000).toLocaleDateString('en-IN'); } catch (e) { /* ignore */ }
    }
    return 'N/A';
  };

  // Styles
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
  const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };
  const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading shop owners…</div>
      </div>
    );
  }

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>User Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Manage all shop owners across the platform — filter, search, impersonate, and take actions.
          </p>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Owners', value: owners.length, icon: 'fa-users', color: '#3b82f6', filter: () => true },
          { label: 'Active', value: owners.filter(o => o.status === 'active').length, icon: 'fa-circle-check', color: '#10b981', filter: o => o.status === 'active' },
          { label: 'Blocked', value: owners.filter(o => o.status === 'blocked').length, icon: 'fa-ban', color: '#ef4444', filter: o => o.status === 'blocked' },
          { label: 'No Plan', value: owners.filter(o => !(o.settings?.planName || o.planName)).length, icon: 'fa-circle-exclamation', color: '#f59e0b', filter: o => !(o.settings?.planName || o.planName) },
        ].map((s, i) => (
          <div key={i} className="card card--lift" onClick={() => setDetailModal({ title: s.label, rows: owners.filter(s.filter) })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}15`, display: 'grid', placeItems: 'center', color: s.color, fontSize: '16px' }}>
              <i className={`fas ${s.icon}`}></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-3)', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search name / email / phone / GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
            />
          </div>
          <select className="fi" style={{ width: '130px', height: '38px', fontSize: '13px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="deleted">Deleted</option>
          </select>
          <select className="fi" style={{ width: '140px', height: '38px', fontSize: '13px' }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
            <option value="">All Plans</option>
            {uniquePlanNames.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="fi" style={{ width: '130px', height: '38px', fontSize: '13px' }} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">All States</option>
            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="fi" style={{ width: '130px', height: '38px', fontSize: '13px' }} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All Cities</option>
            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {uniqueShopTypes.length > 0 && (
            <select className="fi" style={{ width: '140px', height: '38px', fontSize: '13px' }} value={shopTypeFilter} onChange={e => setShopTypeFilter(e.target.value)}>
              <option value="">All Shop Types</option>
              {uniqueShopTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <input type="date" className="fi" style={{ width: '140px', height: '38px', fontSize: '12px' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Joined from" />
          <input type="date" className="fi" style={{ width: '140px', height: '38px', fontSize: '12px' }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="Joined to" />
          {(searchQuery || statusFilter || planFilter || cityFilter || stateFilter || shopTypeFilter || dateFrom || dateTo) && (
            <button className="btn btn--sm" style={{ height: '38px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => { setSearchQuery(''); setStatusFilter(''); setPlanFilter(''); setCityFilter(''); setStateFilter(''); setShopTypeFilter(''); setDateFrom(''); setDateTo(''); }}>
              <i className="fas fa-times"></i> Clear
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>
          Showing <strong style={{ color: 'var(--text-1)' }}>{filtered.length}</strong> of {owners.length} shop owners
        </div>
      </div>

      {/* Data Table */}
      <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>SHOP OWNER</th>
              <th>CONTACT</th>
              <th>PLAN</th>
              <th>STATUS</th>
              <th>JOINED</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-3)' }}>
                  <i className="fas fa-user-slash" style={{ fontSize: '36px', marginBottom: '12px', display: 'block', opacity: 0.4 }}></i>
                  No shop owners match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map(o => {
                const ownerPlan = o.settings?.planName || o.planName || '';
                const gstin = o.settings?.gstin || o.gstin || '';
                const city = o.settings?.city || o.city || '';
                const state = o.settings?.state || o.state || '';
                return (
                  <tr key={o._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(246,78,96,0.12), rgba(59,130,246,0.12))', display: 'grid', placeItems: 'center', color: 'var(--accent)', fontSize: '15px', flexShrink: 0 }}>
                          <i className="fas fa-user-tie"></i>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.bizName || o.settings?.bizName || 'Unnamed'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{o.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>{o.email || o.settings?.email || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{o.phone || o.settings?.phone || '—'}</div>
                      {gstin && <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '2px' }}>GST: {gstin}</div>}
                    </td>
                    <td>
                      {ownerPlan ? (
                        <span className="badge badge--blue" style={{ fontSize: '11px' }}>{ownerPlan}</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>No Plan</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${o.status === 'blocked' ? 'badge--red' : o.status === 'deleted' || o.status === 'merged' ? 'badge--yellow' : 'badge--green'}`} style={{ fontSize: '11px' }}>
                        {(o.status || 'active').charAt(0).toUpperCase() + (o.status || 'active').slice(1)}
                      </span>
                      {city && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>{city}{state ? ', ' + state : ''}</div>}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                      {getJoinDate(o)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="btn btn--sm" title="Impersonate" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }} onClick={() => loginAsTenant(o)}>
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn--sm" title="Login History & Activity" onClick={() => openLoginHistory(o)}>
                          <i className="fas fa-clock-rotate-left"></i>
                        </button>
                        <button className="btn btn--sm" title="Reset Password" onClick={() => { setSelectedUser(o); setResetPwForm(''); setActiveModal('reset-pw'); }}>
                          <i className="fas fa-key"></i>
                        </button>
                        <button className="btn btn--sm" title="Merge Duplicate" onClick={() => { setSelectedUser(o); setMergeTarget(''); setActiveModal('merge'); }}>
                          <i className="fas fa-code-merge"></i>
                        </button>
                        <button className="btn btn--sm" title={o.status === 'active' ? 'Block' : 'Unblock'} onClick={() => handleToggleStatus(o.username, o.status)} disabled={actionLoading} style={{ color: o.status === 'active' ? '#f59e0b' : '#10b981' }}>
                          <i className={`fas ${o.status === 'active' ? 'fa-ban' : 'fa-circle-check'}`}></i>
                        </button>
                        <button className="btn btn--sm" title="Delete" onClick={() => handleDelete(o.username)} disabled={actionLoading} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* Login History & Activity Modal */}
      {activeModal === 'history' && selectedUser && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div style={{ ...modalBox, maxWidth: '780px' }}>
            <div style={modalHead}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-clock-rotate-left" style={{ marginRight: '8px', color: 'var(--accent)' }}></i>
                  Login History & Activity
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>@{selectedUser.username}</div>
              </div>
              <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
            </div>

            {/* Device / Login History Table */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                <i className="fas fa-desktop" style={{ marginRight: '6px', color: '#3b82f6' }}></i> Login Sessions
              </h4>
              {loginHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}></i>
                  No login history recorded yet.
                </div>
              ) : (
                <div style={{ maxHeight: '260px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <table className="tbl" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>DATE & TIME</th>
                        <th>IP ADDRESS</th>
                        <th>BROWSER</th>
                        <th>OS</th>
                        <th>DEVICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((h, i) => {
                        const { browser, os, device } = parseUA(h.userAgent);
                        return (
                          <tr key={h._id || i}>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {h.loginAt ? new Date(h.loginAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                            </td>
                            <td><code style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{h.ip || '—'}</code></td>
                            <td>{browser}</td>
                            <td>{os}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <i className={`fas ${device === 'Mobile' ? 'fa-mobile-screen' : 'fa-desktop'}`} style={{ color: device === 'Mobile' ? '#f59e0b' : '#3b82f6', fontSize: '11px' }}></i>
                                {device}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity / Audit Logs */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                <i className="fas fa-list-check" style={{ marginRight: '6px', color: '#8b5cf6' }}></i> Activity Logs
              </h4>
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                  No activity logs found.
                </div>
              ) : (
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {auditLogs.map((log, i) => (
                    <div key={log._id || i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px' }}>
                      <i className="fas fa-circle" style={{ fontSize: '6px', marginTop: '6px', color: log.action?.includes('SUCCESS') ? '#10b981' : log.action?.includes('FAIL') || log.action?.includes('BLOCK') ? '#ef4444' : '#64748b' }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{log.action}</div>
                        {log.details && <div style={{ color: 'var(--text-3)', marginTop: '2px' }}>{log.details}</div>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {activeModal === 'reset-pw' && selectedUser && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div style={{ ...modalBox, maxWidth: '440px' }}>
            <div style={modalHead}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>
                <i className="fas fa-key" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                Force Reset Password
              </h3>
              <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
              Resetting password for <strong style={{ color: 'var(--text-1)' }}>@{selectedUser.username}</strong>
            </div>
            <input
              className="fi"
              type="password"
              placeholder="Enter new password"
              value={resetPwForm}
              onChange={e => setResetPwForm(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleForceResetPassword} disabled={actionLoading || !resetPwForm}>
                {actionLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Accounts Modal */}
      {activeModal === 'merge' && selectedUser && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setActiveModal(null)}>
          <div style={{ ...modalBox, maxWidth: '480px' }}>
            <div style={modalHead}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>
                <i className="fas fa-code-merge" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>
                Merge Duplicate Accounts
              </h3>
              <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '14px', fontSize: '12px', color: '#ef4444', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <i className="fas fa-triangle-exclamation" style={{ marginTop: '2px' }}></i>
              <div>This will move all payments, login history, and audit logs from the source account to the target. The source account will be deactivated.</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '12px' }}>
              <strong>Source (to be removed):</strong> <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>@{selectedUser.username}</span>
            </div>
            <label style={{ fontSize: '13px', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
              <strong>Target (keep this account):</strong>
            </label>
            <select className="fi" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} style={{ marginBottom: '16px' }}>
              <option value="">— Select target account —</option>
              {owners.filter(o => o.username !== selectedUser.username && o.status !== 'deleted' && o.status !== 'merged').map(o => (
                <option key={o._id} value={o.username}>{o.username} ({o.bizName || o.settings?.bizName || 'Unnamed'})</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn--primary" style={{ flex: 1, background: '#8b5cf6' }} onClick={handleMerge} disabled={actionLoading || !mergeTarget}>
                {actionLoading ? 'Merging...' : 'Merge Accounts'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Stats Detail Modal */}
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
                    <th style={{ padding: '12px', textAlign: 'left' }}>Shop/Owner</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Contact</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Plan</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.rows.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No records found.</td></tr>
                  ) : (
                    detailModal.rows.map(o => {
                      const ownerPlan = o.settings?.planName || o.planName || 'No Plan';
                      return (
                        <tr key={o._id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{o.bizName || o.settings?.bizName || 'Unnamed'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>@{o.username}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontSize: '12px' }}>{o.email || o.settings?.email || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{o.phone || o.settings?.phone || '—'}</div>
                          </td>
                          <td style={{ padding: '12px' }}><span className="badge badge--blue">{ownerPlan}</span></td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge ${o.status === 'blocked' ? 'badge--red' : 'badge--green'}`}>
                              {o.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
