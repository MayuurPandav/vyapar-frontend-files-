import React, { useState, useEffect } from 'react';

export default function SecuritySettings() {
  const [globalSettings, setGlobalSettings] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'shops'

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/security-settings');
      if (res.ok) {
        const json = await res.json();
        setGlobalSettings(json.globalSettings || {});
        setShops(json.shops || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalChange = (key, value) => {
    setGlobalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/super/security-settings/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      if (res.ok) alert('Global security settings saved successfully.');
      else alert('Failed to save settings.');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleShopIPChange = async (username, ipStr) => {
    const arr = ipStr.split(',').map(s => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      const res = await fetch(`/api/super/security-settings/shop/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipWhitelist: arr })
      });
      if (res.ok) {
        setShops(prev => prev.map(s => s.username === username ? { ...s, ipWhitelist: arr } : s));
      } else {
        alert('Failed to update shop IP whitelist.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Security Policies</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Manage platform-wide password policies, 2FA, and per-shop IP whitelisting.
          </p>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
          <button 
            style={{ padding: '12px 16px', background: 'none', border: 'none', color: activeTab === 'global' ? 'var(--accent)' : 'var(--text-2)', borderBottom: activeTab === 'global' ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            onClick={() => setActiveTab('global')}
          >
            <i className="fas fa-globe" style={{ marginRight: '8px' }}></i> Global Settings
          </button>
          <button 
            style={{ padding: '12px 16px', background: 'none', border: 'none', color: activeTab === 'shops' ? 'var(--accent)' : 'var(--text-2)', borderBottom: activeTab === 'shops' ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
            onClick={() => setActiveTab('shops')}
          >
            <i className="fas fa-store" style={{ marginRight: '8px' }}></i> Shop Security Overrides
          </button>
        </div>

        {activeTab === 'global' && globalSettings && (
          <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: 'var(--text-1)' }}>Global Password & Access Policy</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>Minimum Password Length</label>
              <input type="number" className="fi" style={{ width: '100px' }} value={globalSettings.passwordMinLength || 8} onChange={(e) => handleGlobalChange('passwordMinLength', parseInt(e.target.value))} />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <input type="checkbox" id="reqSpec" checked={globalSettings.passwordRequireSpecial || false} onChange={(e) => handleGlobalChange('passwordRequireSpecial', e.target.checked)} />
              <label htmlFor="reqSpec" style={{ fontSize: '13px', color: 'var(--text-1)' }}>Require Special Characters</label>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <input type="checkbox" id="reqNum" checked={globalSettings.passwordRequireNumber || false} onChange={(e) => handleGlobalChange('passwordRequireNumber', e.target.checked)} />
              <label htmlFor="reqNum" style={{ fontSize: '13px', color: 'var(--text-1)' }}>Require Numbers</label>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <input type="checkbox" id="enf2fa" checked={globalSettings.enforce2FA || false} onChange={(e) => handleGlobalChange('enforce2FA', e.target.checked)} />
              <label htmlFor="enf2fa" style={{ fontSize: '13px', color: 'var(--text-1)', fontWeight: 700 }}>Enforce 2FA / OTP globally for all shops</label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>Session Timeout (Minutes of inactivity)</label>
              <input type="number" className="fi" style={{ width: '120px' }} value={globalSettings.sessionTimeout || 120} onChange={(e) => handleGlobalChange('sessionTimeout', parseInt(e.target.value))} />
            </div>

            <button className="btn btn--primary" onClick={saveGlobalSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Global Policies'}
            </button>
          </div>
        )}

        {activeTab === 'shops' && (
          <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>SHOP NAME</th>
                  <th>USERNAME</th>
                  <th>IP WHITELIST (Comma separated)</th>
                  <th>TRUSTED DEVICES</th>
                </tr>
              </thead>
              <tbody>
                {shops.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No shops found.</td></tr>
                ) : (
                  shops.map(s => (
                    <tr key={s.username}>
                      <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>{s.bizName}</td>
                      <td style={{ color: 'var(--text-3)' }}>@{s.username}</td>
                      <td>
                        <input 
                          type="text" 
                          className="fi" 
                          style={{ width: '300px', fontSize: '12px', height: '32px' }} 
                          placeholder="e.g. 192.168.1.1, 10.0.0.1" 
                          defaultValue={s.ipWhitelist.join(', ')}
                          onBlur={(e) => {
                            if (e.target.value !== s.ipWhitelist.join(', ')) {
                              handleShopIPChange(s.username, e.target.value);
                            }
                          }}
                        />
                      </td>
                      <td>
                        <span className="badge badge--blue">{s.trustedDevicesCount} devices</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

      </div>
    </div>
  );
}
