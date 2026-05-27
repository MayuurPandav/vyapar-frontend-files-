import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { dbData, saveDB } = useApp();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...(dbData.settings || {}) });
  }, [dbData.settings]);

  const handleSave = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    try {
      const updated = { ...dbData, settings: { ...dbData.settings, ...form } };
      await saveDB(updated);
      alert('Settings saved');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="view active" id="view-settings">
      <div className="sec-header">
        <h2>Settings</h2>
        <p>Platform and business preferences.</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card__head">
            <span style={{ display: 'block', marginBottom: '8px' }}>Settings</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className={`btn btn--sm ${tab === 'general' ? 'btn--primary' : ''}`} onClick={() => setTab('general')}>General</button>
              <button className={`btn btn--sm ${tab === 'printing' ? 'btn--primary' : ''}`} onClick={() => setTab('printing')}>Printing</button>
              <button className={`btn btn--sm ${tab === 'integrations' ? 'btn--primary' : ''}`} onClick={() => setTab('integrations')}>Integrations</button>
              <button className={`btn btn--sm ${tab === 'notifications' ? 'btn--primary' : ''}`} onClick={() => setTab('notifications')}>Notifications</button>
              <button className={`btn btn--sm ${tab === 'security' ? 'btn--primary' : ''}`} onClick={() => setTab('security')}>Security</button>
              <button className={`btn btn--sm ${tab === 'billing' ? 'btn--primary' : ''}`} onClick={() => setTab('billing')}>Billing</button>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ marginTop: '16px' }}>
            {tab === 'general' && (
              <>
                <div className="fg"><label>Business Name</label>
                  <input className="fi" value={form.bizName || ''} onChange={(e) => setForm(prev => ({ ...prev, bizName: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="fg"><label>Owner Name</label>
                    <input className="fi" value={form.ownerName || ''} onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))} />
                  </div>
                  <div className="fg"><label>Theme</label>
                    <select className="fi" value={form.theme || 'light'} onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {tab === 'printing' && (
              <>
                <div className="fg"><label>Invoice Prefix</label>
                  <input className="fi" value={form.invoicePrefix || ''} onChange={(e) => setForm(prev => ({ ...prev, invoicePrefix: e.target.value }))} />
                </div>
                <div className="fg"><label>Footer Template</label>
                  <textarea className="fi" rows={3} value={form.termsAndConditions || ''} onChange={(e) => setForm(prev => ({ ...prev, termsAndConditions: e.target.value }))} />
                </div>
                <div className="fg"><label>Print Type</label>
                  <select className="fi" value={form.printType || 'A4'} onChange={(e) => setForm(prev => ({ ...prev, printType: e.target.value }))}>
                    <option value="A4">A4</option>
                    <option value="Thermal">Thermal</option>
                  </select>
                </div>
              </>
            )}

            {tab === 'integrations' && (
              <>
                <div className="fg"><label>SMTP Host</label>
                  <input className="fi" value={form.smtpHost || ''} onChange={(e) => setForm(prev => ({ ...prev, smtpHost: e.target.value }))} />
                </div>
                <div className="fg"><label>SMTP User</label>
                  <input className="fi" value={form.smtpUser || ''} onChange={(e) => setForm(prev => ({ ...prev, smtpUser: e.target.value }))} />
                </div>
                <div className="fg"><label>Payment Gateway Key</label>
                  <input className="fi" type="password" value={form.paymentKey || ''} onChange={(e) => setForm(prev => ({ ...prev, paymentKey: e.target.value }))} />
                </div>
              </>
            )}

            {tab === 'notifications' && (
              <>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ minWidth: '220px' }}>Enable Expiry Reminders</label>
                  <input type="checkbox" checked={!!form.enableExpiryReminders} onChange={(e) => setForm(prev => ({ ...prev, enableExpiryReminders: e.target.checked }))} />
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <label style={{ minWidth: '220px' }}>Reminder Days (comma separated)</label>
                  <input className="fi" value={(form.reminderDays || [7,3,1]).join(',')} onChange={(e) => setForm(prev => ({ ...prev, reminderDays: e.target.value.split(',').map(x => parseInt(x.trim())||0) }))} />
                </div>
              </>
            )}

            {tab === 'security' && (
              <>
                <div className="fg"><label>Require OTP for Sensitive Actions</label>
                  <input type="checkbox" checked={!!form.requireOtp} onChange={(e) => setForm(prev => ({ ...prev, requireOtp: e.target.checked }))} />
                </div>
                <div className="fg"><label>Admin Contact Email</label>
                  <input className="fi" value={form.adminEmail || ''} onChange={(e) => setForm(prev => ({ ...prev, adminEmail: e.target.value }))} />
                </div>
              </>
            )}

            {tab === 'billing' && (
              <>
                <div className="fg"><label>Plan</label>
                  <input className="fi" value={form.planName || ''} onChange={(e) => setForm(prev => ({ ...prev, planName: e.target.value }))} />
                </div>
                <div className="fg"><label>Subscription Expiry</label>
                  <input className="fi" type="date" value={form.subscriptionExpiry || ''} onChange={(e) => setForm(prev => ({ ...prev, subscriptionExpiry: e.target.value }))} />
                </div>
                <div style={{ marginTop: '12px' }}>
                  <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
                </div>
              </>
            )}

            {tab !== 'billing' && (
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <div className="card__head"><span>Help & Tips</span></div>
          <div style={{ padding: '12px' }}>
            <p>Use the tabs to configure platform-wide settings. Changes are saved to your tenant settings document.</p>
            <p>Printing templates affect invoice appearance; integrations require valid API keys to function.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
