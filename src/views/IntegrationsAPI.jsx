import React, { useState, useEffect } from 'react';

export default function IntegrationsAPI() {
  const [tab, setTab] = useState('payments'); // payments, comms, logistics, hardware, dev
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/integrations');
      const j = await res.json();
      if (j.data) setData(j.data);
    } catch (e) {}
    setLoading(false);
  };

  const saveIntegrations = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/super/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) alert('Integrations saved successfully.');
    } catch (e) {
      alert('Error saving integrations');
    }
    setSaving(false);
  };

  const handleChange = (category, provider, field, value) => {
    setData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [provider]: {
          ...(prev[category][provider] || {}),
          [field]: value
        }
      }
    }));
  };

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Integrations...</div>;

  const renderInput = (label, category, provider, field, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={data[category]?.[provider]?.[field] || ''}
        onChange={(e) => handleChange(category, provider, field, e.target.value)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)', fontSize: '13px' }}
      />
    </div>
  );

  const renderToggle = (category, provider) => {
    const isActive = data[category]?.[provider]?.active || false;
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
        <input 
          type="checkbox" 
          checked={isActive} 
          onChange={(e) => handleChange(category, provider, 'active', e.target.checked)} 
          style={{ width: '16px', height: '16px' }}
        />
        <span style={{ fontSize: '14px', fontWeight: 600, color: isActive ? '#10b981' : 'var(--text-3)' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </label>
    );
  };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="topbar__left">
          <h1>Integrations & API</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Configure third-party gateways, SMS, webhooks, and developer APIs.</p>
        </div>
        <button className="btn btn--primary" onClick={saveIntegrations} disabled={saving} style={{ padding: '10px 24px', borderRadius: '8px' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', overflowX: 'auto' }}>
        {[
          { id: 'payments', icon: 'fa-credit-card', label: 'Payments' },
          { id: 'comms', icon: 'fa-envelope', label: 'Comms & SMS' },
          { id: 'logistics', icon: 'fa-truck', label: 'Logistics' },
          { id: 'hardware', icon: 'fa-print', label: 'Hardware & Storage' },
          { id: 'dev', icon: 'fa-code', label: 'Developer & Webhooks' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px', whiteSpace: 'nowrap' }}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {tab === 'payments' && (
          <>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fab fa-stripe fa-2x" style={{ color: '#6772e5' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Stripe Config</h3>
              </div>
              {renderToggle('payments', 'stripe')}
              {renderInput('Publishable Key', 'payments', 'stripe', 'publicKey')}
              {renderInput('Secret Key', 'payments', 'stripe', 'secretKey', 'password')}
            </div>
            
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', background: '#3395ff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>R</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Razorpay Config</h3>
              </div>
              {renderToggle('payments', 'razorpay')}
              {renderInput('Key ID', 'payments', 'razorpay', 'keyId')}
              {renderInput('Key Secret', 'payments', 'razorpay', 'keySecret', 'password')}
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-qrcode fa-2x" style={{ color: '#10b981' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>UPI Gateway Config</h3>
              </div>
              {renderToggle('payments', 'upi')}
              {renderInput('Merchant VPA (UPI ID)', 'payments', 'upi', 'vpa')}
              {renderInput('Merchant Name', 'payments', 'upi', 'merchantName')}
            </div>
          </>
        )}

        {tab === 'comms' && (
          <>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fab fa-whatsapp fa-2x" style={{ color: '#25D366' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>WhatsApp Business API</h3>
              </div>
              {renderToggle('comms', 'whatsapp')}
              {renderInput('Access Token', 'comms', 'whatsapp', 'token', 'password')}
              {renderInput('Phone Number ID', 'comms', 'whatsapp', 'phoneId')}
              {renderInput('Business Account ID', 'comms', 'whatsapp', 'businessId')}
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-envelope fa-2x" style={{ color: '#ef4444' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>SMTP Email Server</h3>
              </div>
              {renderToggle('comms', 'smtp')}
              {renderInput('SMTP Host', 'comms', 'smtp', 'host', 'text', 'e.g. smtp.mailgun.org')}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>{renderInput('Port', 'comms', 'smtp', 'port', 'number', '587')}</div>
                <div style={{ flex: 1 }}>{renderInput('Encryption', 'comms', 'smtp', 'encryption', 'text', 'TLS')}</div>
              </div>
              {renderInput('Username', 'comms', 'smtp', 'user')}
              {renderInput('Password', 'comms', 'smtp', 'pass', 'password')}
            </div>
          </>
        )}

        {tab === 'logistics' && (
          <>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-rocket fa-2x" style={{ color: '#f59e0b' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Shiprocket Integration</h3>
              </div>
              {renderToggle('logistics', 'shiprocket')}
              {renderInput('Email Address', 'logistics', 'shiprocket', 'email')}
              {renderInput('Password', 'logistics', 'shiprocket', 'password', 'password')}
            </div>
          </>
        )}

        {tab === 'hardware' && (
          <>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-print fa-2x" style={{ color: '#6b7280' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Barcode Printer Config (Zebra)</h3>
              </div>
              {renderToggle('hardware', 'printers')}
              {renderInput('Default Printer IP', 'hardware', 'printers', 'printerIp', 'text', '192.168.1.100')}
              {renderInput('Printer Port', 'hardware', 'printers', 'printerPort', 'number', '9100')}
            </div>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fab fa-google-drive fa-2x" style={{ color: '#4285F4' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Cloud Backup Setup</h3>
              </div>
              {renderToggle('hardware', 'cloudBackup')}
              {renderInput('Google Client ID', 'hardware', 'cloudBackup', 'clientId')}
              {renderInput('Google Client Secret', 'hardware', 'cloudBackup', 'clientSecret', 'password')}
            </div>
          </>
        )}

        {tab === 'dev' && (
          <>
            <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-key fa-2x" style={{ color: '#8b5cf6' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Global API Key</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>Generate a master API key for headless access to the Super Admin platform APIs.</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  value={data.developer?.globalApiKey || ''} 
                  readOnly 
                  placeholder="Click Generate to create a new key"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
                />
                <button 
                  className="btn btn--primary" 
                  onClick={() => setData(p => ({ ...p, developer: { ...p.developer, globalApiKey: 'sk_live_' + Math.random().toString(36).substr(2, 24) } }))}
                >
                  Generate New Key
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="fas fa-network-wired fa-2x" style={{ color: '#3b82f6' }}></i>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Webhooks</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>Configure endpoints to receive real-time POST events (e.g., `shop.created`, `subscription.renewed`).</p>
              {renderInput('Webhook URL', 'developer', 'sso', 'webhookUrl', 'url', 'https://your-domain.com/webhook')}
              {renderInput('Webhook Secret (for signature verification)', 'developer', 'sso', 'webhookSecret', 'password')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
