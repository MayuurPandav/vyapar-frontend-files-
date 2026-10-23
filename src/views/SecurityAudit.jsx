import React, { useState, useEffect } from 'react';

export default function SecurityAudit() {
  const [tab, setTab] = useState('audit'); // 'audit', 'sessions', 'settings', 'alerts'
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({ whitelistIPs: [], blacklistIPs: [], loginAlertThreshold: 5 });
  const [filters, setFilters] = useState({ action: '', username: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'audit') fetchLogs();
    else if (tab === 'sessions') fetchSessions();
    else if (tab === 'settings') fetchSettings();
    else if (tab === 'alerts') fetchAlerts();
  }, [tab, page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 20 });
      if (filters.action) p.set('action', filters.action);
      if (filters.username) p.set('username', filters.username);
      if (filters.startDate) p.set('startDate', filters.startDate);
      if (filters.endDate) p.set('endDate', filters.endDate);
      const res = await fetch(`/api/super/audit?${p}`);
      const j = await res.json();
      if (j.data) {
        setLogs(j.data);
        setTotal(j.total);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/security/sessions');
      const j = await res.json();
      if (j.sessions) setSessions(j.sessions);
    } catch (e) {}
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/super/security/settings');
      const j = await res.json();
      if (j.config) setSettings(j.config);
    } catch (e) {}
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/security/alerts');
      const j = await res.json();
      if (j.alerts) setAlerts(j.alerts);
    } catch (e) {}
    setLoading(false);
  };

  const forceLogout = async (username) => {
    if (!await window.confirm(`Force logout user ${username}?`)) return;
    try {
      await fetch('/api/super/security/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      fetchSessions();
    } catch (e) {}
  };

  const saveSettings = async () => {
    try {
      await fetch('/api/super/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Security settings updated');
    } catch (e) {}
  };

  const formatList = (str) => {
    if (Array.isArray(str)) return str;
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px' }}>
        <div className="topbar__left">
          <h1>Audit Logs & Security</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Monitor platform activity and manage access controls.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button onClick={() => setTab('audit')} className={`btn ${tab === 'audit' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-list-alt"></i> Audit Trail
        </button>
        <button onClick={() => setTab('sessions')} className={`btn ${tab === 'sessions' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-user-shield"></i> Active Sessions
        </button>
        <button onClick={() => setTab('alerts')} className={`btn ${tab === 'alerts' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-bell"></i> Security Alerts
        </button>
        <button onClick={() => setTab('settings')} className={`btn ${tab === 'settings' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-cogs"></i> Access Control
        </button>
      </div>

      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Username" value={filters.username} onChange={e => setFilters({ ...filters, username: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }} />
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}>
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_ATTEMPT_FAILED">Login Failed</option>
              <option value="OTP_SENT">OTP Sent</option>
              <option value="DATA_PURGE">Data Purge</option>
              <option value="FORCE_LOGOUT">Force Logout</option>
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }} />
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }} />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div> : (
              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l._id}>
                        <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{new Date(l.timestamp).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{l.username}</td>
                        <td><span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 600 }}>{l.action}</span></td>
                        <td style={{ fontSize: '13px', color: 'var(--text-2)' }}>{l.details || '-'}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No audit logs found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div> : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr><th>Username</th><th>Role</th><th>Last Seen</th><th>Device/IP</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{s.username}</td>
                      <td>{s.role}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{new Date(s.lastLogin).toLocaleString()}</td>
                      <td style={{ fontSize: '13px' }}>{s.device}</td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: s.status === 'Active' ? '#10b98122' : '#ef444422', color: s.status === 'Active' ? '#10b981' : '#ef4444' }}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn--danger" onClick={() => forceLogout(s.username)} disabled={s.status !== 'Active'} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>
                          Force Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No active sessions found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div> : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr><th>Time</th><th>User</th><th>Alert Type</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{new Date(a.timestamp).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>{a.username}</td>
                      <td><span style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px' }}><i className="fas fa-exclamation-triangle"></i> {a.action}</span></td>
                      <td style={{ fontSize: '13px' }}>{a.details}</td>
                    </tr>
                  ))}
                  {alerts.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No security alerts.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>IP Whitelist (Comma separated)</h3>
            <textarea 
              value={Array.isArray(settings.whitelistIPs) ? settings.whitelistIPs.join(', ') : settings.whitelistIPs} 
              onChange={e => setSettings({ ...settings, whitelistIPs: formatList(e.target.value) })}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              placeholder="e.g. 192.168.1.1, 10.0.0.5"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>If specified, only these IPs can access the Super Admin panel.</p>
          </div>
          
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>IP Blacklist (Comma separated)</h3>
            <textarea 
              value={Array.isArray(settings.blacklistIPs) ? settings.blacklistIPs.join(', ') : settings.blacklistIPs} 
              onChange={e => setSettings({ ...settings, blacklistIPs: formatList(e.target.value) })}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
              placeholder="e.g. 1.2.3.4, 5.6.7.8"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>These IPs will be blocked completely.</p>
          </div>
          
          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <button className="btn btn--primary" onClick={saveSettings} style={{ padding: '10px 24px', borderRadius: '8px' }}>Save Security Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
