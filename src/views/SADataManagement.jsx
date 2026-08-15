import React, { useState, useEffect } from 'react';

export default function SADataManagement() {
  const [tab, setTab] = useState('exports'); // 'exports', 'imports', 'health', 'purge'
  const [health, setHealth] = useState(null);
  const [shopUsername, setShopUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'health') fetchHealth();
  }, [tab]);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/data/health');
      const j = await res.json();
      if (j.stats) setHealth(j.stats);
    } catch (e) {}
    setLoading(false);
  };

  const handleExport = (type) => {
    let url = `/api/super/data/export/${type}`;
    if (shopUsername) url += `?shopUsername=${encodeURIComponent(shopUsername)}`;
    window.open(url, '_blank');
  };

  const handlePurge = async () => {
    if (!shopUsername) return alert('Please enter a shop username to purge data for.');
    if (!await window.confirm(`WARNING: This will purge sales data for shop ${shopUsername}. Continue?`)) return;
    try {
      const res = await fetch('/api/super/data/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopUsername })
      });
      const j = await res.json();
      alert(j.message || 'Purge initiated');
    } catch (e) {
      alert('Failed to purge data');
    }
  };

  const formatNum = (v) => new Intl.NumberFormat('en-IN').format(v || 0);

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px' }}>
        <div className="topbar__left">
          <h1>Data Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>Export, import, backup, and monitor database health.</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button onClick={() => setTab('exports')} className={`btn ${tab === 'exports' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-file-export"></i> Bulk Exports
        </button>
        <button onClick={() => setTab('imports')} className={`btn ${tab === 'imports' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-file-import"></i> Bulk Imports
        </button>
        <button onClick={() => setTab('health')} className={`btn ${tab === 'health' ? 'btn--primary' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-database"></i> Database Health
        </button>
        <button onClick={() => setTab('purge')} className={`btn ${tab === 'purge' ? 'btn--danger' : 'btn--secondary'}`} style={{ borderRadius: '30px' }}>
          <i className="fas fa-trash-alt"></i> Purge & Retention
        </button>
      </div>

      {tab === 'exports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Filter Exports (Optional)</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input type="text" placeholder="Filter by Shop Username..." value={shopUsername} onChange={e => setShopUsername(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)', width: '300px' }} />
              <button className="btn btn--secondary" onClick={() => setShopUsername('')} style={{ padding: '10px 16px', borderRadius: '8px' }}>Clear Filter</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>Leave empty to export data for ALL shops across the platform.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              { id: 'shops', name: 'Shops & Users', icon: 'fa-users', color: '#3b82f6', desc: 'Export all registered shop accounts.' },
              { id: 'invoices', name: 'Sales Invoices', icon: 'fa-file-invoice-dollar', color: '#10b981', desc: 'Export all generated invoices and bills.' },
              { id: 'inventory', name: 'Inventory Data', icon: 'fa-boxes', color: '#f59e0b', desc: 'Export current stock levels and products.' },
              { id: 'transactions', name: 'Transactions', icon: 'fa-exchange-alt', color: '#8b5cf6', desc: 'Export income and expense logs.' },
              { id: 'gst', name: 'GST Reports', icon: 'fa-landmark', color: '#ef4444', desc: 'Export GST-enabled sales for filing.' },
              { id: 'parties', name: 'Customers & Suppliers', icon: 'fa-address-book', color: '#06b6d4', desc: 'Export all party ledgers.' },
              { id: 'deliveries', name: 'Delivery Logs', icon: 'fa-truck', color: '#f97316', desc: 'Export completed and pending deliveries.' }
            ].map(x => (
              <div key={x.id} className="card card--lift" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${x.color}15`, color: x.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  <i className={`fas ${x.icon}`}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{x.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px' }}>{x.desc}</p>
                  <button className="btn" onClick={() => handleExport(x.id)} style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                    <i className="fas fa-download" style={{ marginRight: '6px' }}></i> Download CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'imports' && (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#3b82f615', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Bulk Import Shops (CSV)</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Upload a CSV file containing shop details (username, name, email, phone) to bulk create accounts.
          </p>
          <div style={{ padding: '40px', border: '2px dashed var(--border)', borderRadius: '12px', background: 'var(--bg-input)', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>Drag & Drop your CSV file here or click to browse</span>
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading || !health ? <div style={{ padding: '40px', textAlign: 'center' }}>Loading Database Health...</div> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Data Size</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#3b82f6' }}>{health.dataSizeMB} MB</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Storage Size</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{health.storageSizeMB} MB</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Total Objects</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>{formatNum(health.objects)}</div>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>Collections</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{health.collections}</div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}><i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#3b82f6' }}></i> Collection Breakdown</h3>
                <div className="table-responsive">
                  <table className="table" style={{ margin: 0 }}>
                    <thead><tr><th>Collection Name</th><th>Document Count</th></tr></thead>
                    <tbody>
                      {health.collectionStats.map(c => (
                        <tr key={c.name}>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td>{formatNum(c.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'purge' && (
        <div className="card" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', border: '1px solid #ef444430' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>Danger Zone: Data Purge</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '8px' }}>Permanently archive and delete sales data for a specific shop.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Shop Username</label>
              <input type="text" value={shopUsername} onChange={e => setShopUsername(e.target.value)} placeholder="e.g. shop123" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }} />
            </div>
            <button className="btn btn--danger" onClick={handlePurge} style={{ padding: '12px', borderRadius: '8px', fontWeight: 600 }}>
              <i className="fas fa-trash-alt" style={{ marginRight: '8px' }}></i> Purge Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
