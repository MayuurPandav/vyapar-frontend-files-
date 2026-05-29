import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { token, user } = useApp();
  const [config, setConfig] = useState(null);

  useEffect(() => { fetchCfg(); }, []);

  const fetchCfg = async () => {
    try {
      const res = await fetch('/api/admin/notifications/config?username=' + encodeURIComponent((user && user.username) || ''));
      const j = await res.json();
      if (j.status === 'success') setConfig(j.config);
      else setConfig(j.config || {});
    } catch (err) { console.error(err); }
  };

  const save = async () => {
    try {
      const payload = { username: (user && user.username) || '', config };
      const res = await fetch('/api/admin/notifications/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) alert('Saved');
    } catch (err) { console.error(err); }
  };

  const trigger = async () => {
    try {
      const res = await fetch('/api/admin/notifications/trigger/expiry-reminders', { method: 'POST' });
      const j = await res.json();
      if (j.status === 'success') alert('Triggered: ' + (j.reminders || []).length + ' reminders');
    } catch (err) { console.error(err); }
  };

  const sendTest = async () => {
    try {
      const payload = { to: user.email || user.phone || '', subject: 'Test Notification', message: 'This is a test notification from Vyapar', via: { email: true } };
      const res = await fetch('/api/admin/notifications/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (j.status === 'success') alert('Sent: ' + JSON.stringify(j.results)); else alert('Failed');
    } catch (err) { console.error(err); alert('Error'); }
  };

  if (!config) return <div className="card">Loading...</div>;

  return (
    <>
      <div className="card" style={{ maxWidth: 920, padding: 20 }}>
        <h2 style={{ marginBottom: 6 }}>Notifications & Alerts</h2>
        <p style={{ margin: 0, color: 'var(--text-2)', fontSize: 13 }}>Configure how you receive alerts and set low-stock thresholds.</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {['email', 'whatsapp', 'sms'].map((k) => {
              const checked = !!(config.notifyVia && config.notifyVia[k]);
              return (
                <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)', background: checked ? 'var(--muted-bg)' : 'transparent', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked} onChange={e => setConfig(c => ({ ...c, notifyVia: { ...(c.notifyVia || {}), [k]: e.target.checked } }))} />
                  <span style={{ textTransform: 'capitalize', fontSize: 14 }}>{k === 'sms' ? 'SMS' : (k === 'whatsapp' ? 'WhatsApp' : 'Email')}</span>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <label style={{ fontSize: 13, color: 'var(--text-2)' }}>Low stock threshold</label>
              <input type="number" value={config.lowStockThreshold || 5} onChange={e => setConfig(c => ({ ...c, lowStockThreshold: Number(e.target.value) }))} style={{ width: 92, padding: '6px 8px', marginTop: 6, borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn--primary" onClick={save}>Save</button>
          <button className="btn" onClick={trigger}>Trigger Expiry Reminders</button>
          <button className="btn" onClick={sendTest}>Send Test</button>
        </div>
      </div>
    </>
  );
}
