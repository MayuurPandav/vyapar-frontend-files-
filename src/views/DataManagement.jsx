import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function DataManagement() {
  const { token, user } = useApp();
  const username = (user && user.username) || '';

  const [activeTab, setActiveTab] = useState('manual');
  const [backups, setBackups] = useState([]);
  const [backupConfig, setBackupConfig] = useState({ enabled: false, schedule: 'daily', email: '' });
  const [storageUsage, setStorageUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Bulk Import States
  const [importType, setImportType] = useState('products'); // 'products' | 'parties'
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [rawText, setRawText] = useState('');

  // Purge States
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [selectedPurgeType, setSelectedPurgeType] = useState(null);

  const showStatus = (text, type = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch(`/api/admin/data/backups?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.status === 'success') {
        setBackups(data.backups || []);
      }
    } catch (err) {
      console.error('Failed to fetch backups', err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/admin/data/backup-config?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.status === 'success' && data.backupConfig) {
        setBackupConfig(data.backupConfig);
      }
    } catch (err) {
      console.error('Failed to fetch backup config', err);
    }
  };

  const fetchStorageUsage = async () => {
    try {
      const res = await fetch(`/api/admin/data/usage?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.status === 'success' && data.usage) {
        setStorageUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to fetch storage usage', err);
    }
  };

  useEffect(() => {
    if (username) {
      fetchBackups();
      fetchConfig();
      fetchStorageUsage();
    }
  }, [username]);

  // Legacy direct JSON file download
  const handleLegacyExport = async () => {
    setLoading(true);
    try {
      const url = `/api/db?username=${encodeURIComponent(username)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const j = await res.json();
      const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-${username}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showStatus('JSON Backup downloaded successfully!');
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Legacy upload & restore
  const handleLegacyImport = async () => {
    if (!importFile) return alert('Select a file first');
    const confirmed = await window.confirm('WARNING: Importing this file will overwrite all your current data. Are you sure you want to proceed?');
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const text = await importFile.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file format');
      }
      data.username = username;
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showStatus('Data restore from file completed successfully!');
        setImportFile(null);
        fetchStorageUsage();
      } else {
        throw new Error('Restore failed. Check file payload.');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create database backup record
  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, type: 'manual' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus(`Backup created successfully! ID: ${data.backupId}`);
        fetchBackups();
        fetchStorageUsage();
      } else {
        throw new Error(data.message || 'Failed to create backup');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Restore from backup record
  const handleRestoreBackup = async (backupId) => {
    const confirmed = await window.confirm(`WARNING: Restoring backup ${backupId} will overwrite all your current database state. This action cannot be undone. Do you want to proceed?`);
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, backupId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus('Database restored successfully from backup snapshot!');
        fetchStorageUsage();
      } else {
        throw new Error(data.message || 'Failed to restore backup');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete backup record
  const handleDeleteBackup = async (backupId) => {
    const confirmed = await window.confirm(`Are you sure you want to delete backup ${backupId}?`);
    if (!confirmed) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data/backup/${backupId}?username=${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus('Backup deleted successfully.');
        fetchBackups();
        fetchStorageUsage();
      } else {
        throw new Error(data.message || 'Failed to delete backup');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download backup record payload
  const handleDownloadBackupPayload = async (backupId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data/backup/${backupId}?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.status === 'success' && data.backup.data) {
        const blob = new Blob([JSON.stringify(data.backup.data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup-${username}-${backupId}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        showStatus('Backup file downloaded successfully!');
      } else {
        throw new Error('Could not retrieve backup payload');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save auto backup config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data/backup-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, backupConfig })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus('Backup settings saved successfully!');
        fetchConfig();
      } else {
        throw new Error(data.message || 'Failed to save configuration');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLink = (type, format) => {
    const url = `/api/admin/data/export/${type}?format=${format}&username=${encodeURIComponent(username)}`;
    window.open(url, '_blank');
  };

  // CSV Parsing Logic
  const handleCSVParse = (text) => {
    if (!text.trim()) {
      setParsedData([]);
      return;
    }
    try {
      const lines = text.split(/\r?\n/);
      if (lines.length === 0 || !lines[0].trim()) {
        setParsedData([]);
        return;
      }

      const splitLine = (line) => {
        const result = [];
        let curVal = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(curVal.trim().replace(/^["']|["']$/g, ''));
            curVal = '';
          } else {
            curVal += char;
          }
        }
        result.push(curVal.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const headers = splitLine(lines[0]);
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const vals = splitLine(line);
        const obj = {};
        headers.forEach((h, idx) => {
          if (h) obj[h] = vals[idx] || '';
        });
        rows.push(obj);
      }
      setParsedData(rows);
    } catch (e) {
      console.error(e);
      showStatus('Error parsing CSV. Please check formatting.', 'error');
    }
  };

  const handleBulkFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkFile(file);
    try {
      const text = await file.text();
      setRawText(text);
      handleCSVParse(text);
    } catch (err) {
      showStatus('Failed to read file: ' + err.message, 'error');
    }
  };

  const handleExecuteBulkImport = async () => {
    if (parsedData.length === 0) return alert('No data to import');
    
    setLoading(true);
    try {
      const isProducts = importType === 'products';
      const endpoint = isProducts ? '/api/products/bulk' : '/api/parties/bulk';
      
      const payload = {
        username,
        [isProducts ? 'products' : 'parties']: parsedData
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus(`Successfully imported ${data.inserted || parsedData.length} records!`);
        setParsedData([]);
        setRawText('');
        setBulkFile(null);
        fetchStorageUsage();
      } else {
        throw new Error(data.message || 'Bulk import failed');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateCSV = () => {
    if (importType === 'products') {
      return `name,sku,category,brand,unit,price,purchasePrice,wholesalePrice,taxSlab,stock,lowStockLevel,expiryDate,notes\nRed Widget,WID-RED,Widgets,Vypar,pcs,150,110,140,18%,25,5,2027-12-31,Standard Red Widget\nBlue Gadget,GAD-BLU,Gadgets,Vypar,pcs,450,320,400,12%,10,2,,Special edition blue gadget`;
    } else {
      return `name,type,phone,email,whatsappNumber,billingAddress,shippingAddress,state,gstin,pan,customerGroup,creditLimit,paymentTerms,openingBalance,notes\nJohn Supplier,Supplier,9876543210,john@supplier.com,9876543210,123 Vendor Rd,123 Vendor Rd,Karnataka,,Net 30,50000,Net 30,12000,Primary vendor\nAcme Client,Customer,9900887766,acme@retail.com,9900887766,456 Market Ave,456 Market Ave,Karnataka,29AAAAA1111A1Z1,,Retail,25000,Net 15,0,Wholesale account`;
    }
  };

  const handlePurgeSubmit = async () => {
    if (purgeConfirmText !== 'PURGE') {
      alert('Please type PURGE to confirm');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, targetType: selectedPurgeType })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showStatus('Data purged successfully! Safety archive copy saved.');
        setSelectedPurgeType(null);
        setPurgeConfirmText('');
        fetchStorageUsage();
        fetchBackups();
      } else {
        throw new Error(data.message || 'Failed to purge data');
      }
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        padding: '24px 32px',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Data Management</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '15px' }}>
            Securely back up, restore, export, and clean up your active workspace database records.
          </p>
        </div>
        <div style={{
          position: 'absolute',
          right: '-50px',
          bottom: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0
        }} />
      </div>

      {/* Global Status Banner */}
      {statusMessage.text && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontWeight: 500,
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.3s ease',
          backgroundColor: statusMessage.type === 'error' ? '#fef2f2' : '#ecfdf5',
          color: statusMessage.type === 'error' ? '#b91c1c' : '#047857',
          border: `1px solid ${statusMessage.type === 'error' ? '#fee2e2' : '#d1fae5'}`
        }}>
          <span style={{ fontSize: '18px' }}>{statusMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Modern Horizontal Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '24px',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'manual', label: '💾 Database Backups', desc: 'Create snapshots and restores' },
          { id: 'auto', label: '⚙️ Automated Schedule', desc: 'Configure background backups' },
          { id: 'export', label: '📤 Multi-Format Export', desc: 'Download CSV, PDF & Excel' },
          { id: 'import', label: '📥 Bulk Data Import', desc: 'Upload products & customers' },
          { id: 'danger', label: '🔒 Danger Zone & Usage', desc: 'Monitor storage & purge data' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 4px 16px 4px',
              fontSize: '16px',
              fontWeight: 600,
              color: activeTab === tab.id ? '#1e3a8a' : '#64748b',
              borderBottom: activeTab === tab.id ? '3px solid #1e3a8a' : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          marginBottom: '24px'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1e3a8a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>Processing request, please wait...</p>
        </div>
      )}

      {/* Tab Contents */}
      {!loading && activeTab === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Main Controls Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Create New Backup</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Perform a full snapshot of your business documents, settings, ledger balances, transactions, and product lists. Backups are stored in our secure database collection and can be downloaded or restored at any time.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn"
                onClick={handleCreateBackup}
                style={{
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Create Database Backup Record
              </button>
              <button
                className="btn"
                onClick={handleLegacyExport}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#1e293b',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Direct Download JSON File
              </button>
            </div>
          </div>

          {/* Past Backups Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Saved Backup Snapshots</h2>
            {backups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🗄️</span>
                <p style={{ margin: 0, fontWeight: 500 }}>No backup snapshots saved yet.</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.8 }}>Create a manual snapshot above or set up auto-backups.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Backup ID</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Created Date</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Type</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: '14px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(bk => (
                      <tr key={bk.backupId} style={{ borderBottom: '1px solid #f8fafc', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{bk.backupId}</td>
                        <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{new Date(bk.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: bk.type === 'auto' ? '#eff6ff' : '#f0fdf4',
                            color: bk.type === 'auto' ? '#2563eb' : '#16a34a',
                            textTransform: 'capitalize'
                          }}>
                            {bk.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>● {bk.status}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleDownloadBackupPayload(bk.backupId)}
                              style={{
                                border: '1px solid #e2e8f0',
                                background: '#ffffff',
                                color: '#475569',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                            >
                              📥 Download
                            </button>
                            <button
                              onClick={() => handleRestoreBackup(bk.backupId)}
                              style={{
                                border: 'none',
                                background: '#3b82f6',
                                color: '#ffffff',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              🔄 Restore
                            </button>
                            <button
                              onClick={() => handleDeleteBackup(bk.backupId)}
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Import JSON Restore Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Restore from File</h2>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Select a previously downloaded JSON database backup file to import and overwrite the current database state.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              flexWrap: 'wrap'
            }}>
              <input
                type="file"
                accept="application/json"
                onChange={e => setImportFile(e.target.files[0])}
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              />
              <button
                className="btn"
                onClick={handleLegacyImport}
                disabled={!importFile}
                style={{
                  backgroundColor: importFile ? '#ef4444' : '#cbd5e1',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: importFile ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s'
                }}
              >
                Upload & Overwrite Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'auto' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9'
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '22px', color: '#1e293b', fontWeight: 600 }}>Automated Schedule Settings</h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>
            Set up automatic, recurrent backups of your database. When a cycle runs, a backup record is automatically created, and the database file is dispatched directly as a JSON attachment to your configured email.
          </p>

          <form onSubmit={handleSaveConfig} style={{ maxWidth: '600px' }}>
            {/* Toggle Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <strong style={{ display: 'block', fontSize: '16px', color: '#1e293b' }}>Enable Automated Backups</strong>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Run background jobs according to the schedule</span>
              </div>
              <input
                type="checkbox"
                checked={backupConfig.enabled}
                onChange={e => setBackupConfig({ ...backupConfig, enabled: e.target.checked })}
                style={{
                  width: '44px',
                  height: '22px',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Schedule Cycle */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px', fontSize: '14px' }}>
                Backup Frequency Cycle
              </label>
              <select
                disabled={!backupConfig.enabled}
                value={backupConfig.schedule}
                onChange={e => setBackupConfig({ ...backupConfig, schedule: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: backupConfig.enabled ? '#ffffff' : '#f1f5f9',
                  color: '#1e293b',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="daily">Daily (Every 24 hours)</option>
                <option value="weekly">Weekly (Every 7 days)</option>
                <option value="monthly">Monthly (Every 30 days)</option>
              </select>
            </div>

            {/* Recipient Email */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px', fontSize: '14px' }}>
                Dispatch Recipient Email
              </label>
              <input
                type="email"
                required={backupConfig.enabled}
                disabled={!backupConfig.enabled}
                placeholder="merchant-email@company.com"
                value={backupConfig.email}
                onChange={e => setBackupConfig({ ...backupConfig, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: backupConfig.enabled ? '#ffffff' : '#f1f5f9',
                  color: '#1e293b',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '6px' }}>
                We will email a JSON document of your transaction archives to this inbox immediately upon completion.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn"
              style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: '10px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Save Configuration Settings
            </button>
          </form>
        </div>
      )}

      {!loading && activeTab === 'export' && (
        <div>
          {/* Card list of Export Types */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Multi-Format File Exports</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
              Download data records scoped to your merchant account in raw CSV, styled PDF report, or Microsoft Excel spreadsheets.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px'
            }}>
              {[
                { type: 'invoices', label: '📄 Sales Invoices', icon: '💰', desc: 'All generated customer billing documents and invoice details.' },
                { type: 'inventory', label: '📦 Product Inventory', icon: '🏷️', desc: 'Current catalog items, barcodes, current stock, pricing logs.' },
                { type: 'transactions', label: '💸 Transactions Ledger', icon: '📊', desc: 'Account transactions, credits, debits, payment settlements.' },
                { type: 'gst', label: '🏛️ GST Taxation', icon: '🏦', desc: 'Taxable sales records with CGST, SGST, and IGST breakdowns.' },
                { type: 'parties', label: '👥 Parties (Ledgers)', icon: '🤝', desc: 'Vendor and customer directories, phone, balance ledgers.' },
                { type: 'deliveries', label: '🚚 Deliveries & Shipments', icon: '📦', desc: 'Active logistics tracking records, drivers, delivery logs.' }
              ].map(card => (
                <div
                  key={card.type}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#1e3a8a';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(30, 58, 138, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{card.icon}</span>
                    <strong style={{ fontSize: '16px', color: '#1e293b' }}>{card.label}</strong>
                  </div>
                  <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b', height: '40px', overflow: 'hidden', lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handleExportLink(card.type, 'csv')}
                      style={{
                        padding: '8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExportLink(card.type, 'pdf')}
                      style={{
                        padding: '8px',
                        border: '1px solid #fee2e2',
                        borderRadius: '6px',
                        backgroundColor: '#fef2f2',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#b91c1c',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => handleExportLink(card.type, 'excel')}
                      style={{
                        padding: '8px',
                        border: '1px solid #d1fae5',
                        borderRadius: '6px',
                        backgroundColor: '#ecfdf5',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#065f46',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'import' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Main Controls Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Bulk Data CSV Import</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
              Import products or customer/supplier contact files in bulk. Upload a formatted CSV file and preview parsed rows before committing data to the live catalog.
            </p>

            {/* Target Select */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="importType"
                  value="products"
                  checked={importType === 'products'}
                  onChange={() => { setImportType('products'); setParsedData([]); setBulkFile(null); }}
                  style={{ width: '18px', height: '18px' }}
                />
                📦 Products Inventory Catalog
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="importType"
                  value="parties"
                  checked={importType === 'parties'}
                  onChange={() => { setImportType('parties'); setParsedData([]); setBulkFile(null); }}
                  style={{ width: '18px', height: '18px' }}
                />
                👥 Parties (Customers / Suppliers)
              </label>
            </div>

            {/* Templates Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                📋 Expected CSV Column Headers Template:
              </strong>
              <code style={{
                display: 'block',
                backgroundColor: '#ffffff',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#1e3a8a',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontFamily: 'Courier New'
              }}>
                {getTemplateCSV().split('\n')[0]}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getTemplateCSV());
                  alert('Template CSV copied to clipboard!');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '8px',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Copy Sample CSV Template
              </button>
            </div>

            {/* CSV File Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginBottom: parsedData.length > 0 ? '24px' : '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>📄</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#334155' }}>
                    {bulkFile ? bulkFile.name : 'Select formatted CSV file'}
                  </strong>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    {bulkFile ? `${(bulkFile.size / 1024).toFixed(1)} KB` : 'Maximum file size: 5MB'}
                  </span>
                </div>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkFileChange}
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Preview Grid */}
            {parsedData.length > 0 && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
                marginTop: '24px'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '14px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                    🔍 Import Preview (Showing first 5 of {parsedData.length} records parsed)
                  </strong>
                  <button
                    onClick={handleExecuteBulkImport}
                    style={{
                      border: 'none',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🚀 Execute Bulk Import
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #f1f5f9' }}>
                        {Object.keys(parsedData[0] || {}).map(header => (
                          <th key={header} style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc', backgroundColor: '#ffffff' }}>
                          {Object.values(row).map((val, cellIdx) => (
                            <td key={cellIdx} style={{ padding: '10px 14px', color: '#334155' }}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && activeTab === 'danger' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Storage Usage Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#1e293b', fontWeight: 600 }}>Workspace Storage Usage</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
              Monitor database health by examining active document allocation across your tenant catalog.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {storageUsage.map(item => (
                <div key={item.name} style={{
                  padding: '18px',
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                    {item.label}
                  </strong>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#1e3a8a' }}>
                    {item.count}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    records
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Purge Options danger zone */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
            border: '1px solid #fee2e2'
          }}>
            <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '16px', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#991b1b', fontWeight: 700 }}>⚠️ Danger Zone</h2>
              <p style={{ margin: '4px 0 0 0', color: '#7f1d1d', fontSize: '14px', opacity: 0.9 }}>
                Actions here will permanently erase data segments from your active workspace catalog. Records will be archived for super-admin recovery, but immediately cleared for this tenant profile.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {[
                { type: 'invoices_transactions', label: 'Erase Invoices & Transactions Ledger', desc: 'Wipes all sales records, estimates, ledger transactions, cash flows, and checks.' },
                { type: 'inventory', label: 'Erase Inventory Catalog', desc: 'Resets the product directory, SKUs, barcodes, categories, and stock counters.' },
                { type: 'parties', label: 'Erase Customers & Suppliers Directory', desc: 'Clears vendor and client accounts, whatsapp numbers, addresses, and credit metrics.' },
                { type: 'backups', label: 'Erase Database Backups History', desc: 'Cleans out all previously saved manual/auto snapshots in the cloud vault.' },
                { type: 'all', label: 'FULL RESET (Factory Default Restore)', desc: 'Wipes all active tables, resetting settings, catalogs, staff list, and transacting documents to default.' }
              ].map(option => (
                <div key={option.type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 24px',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  backgroundColor: '#fff5f5',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ maxWidth: '650px' }}>
                    <strong style={{ fontSize: '15px', color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                      {option.label}
                    </strong>
                    <span style={{ fontSize: '13px', color: '#b91c1c', opacity: 0.9 }}>
                      {option.desc}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedPurgeType(option.type); setPurgeConfirmText(''); }}
                    style={{
                      border: 'none',
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Purge Data
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedPurgeType && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #fee2e2'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#991b1b', fontSize: '20px', fontWeight: 700 }}>
              Confirm Data Purge
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
              You are about to purge <strong>{selectedPurgeType.replace('_', ' ').toUpperCase()}</strong>. This action will instantly drop all active documents in this category for tenant admin <strong>{username}</strong>.
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>
              Type the word <span style={{ textDecoration: 'underline' }}>PURGE</span> in the box below to authorize this cleanup:
            </p>
            <input
              type="text"
              placeholder="Type PURGE here"
              value={purgeConfirmText}
              onChange={e => setPurgeConfirmText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                boxSizing: 'border-box',
                fontSize: '14px',
                marginBottom: '24px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedPurgeType(null)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeSubmit}
                disabled={purgeConfirmText !== 'PURGE'}
                style={{
                  border: 'none',
                  background: purgeConfirmText === 'PURGE' ? '#ef4444' : '#cbd5e1',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  cursor: purgeConfirmText === 'PURGE' ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                Confirm & Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Keyframe Animation Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }} />
    </div>
  );
}
