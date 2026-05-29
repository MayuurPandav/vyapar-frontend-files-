import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function DataManagement() {
  const { token, user } = useApp();
  const [importFile, setImportFile] = useState(null);

  const handleExport = async () => {
    const username = (user && user.username) || '';
    const url = `/api/db?username=${encodeURIComponent(username)}`;
    const res = await fetch(url);
    if (!res.ok) return alert('Export failed');
    const j = await res.json();
    const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${username}.json`;
    document.body.appendChild(link); link.click(); link.remove();
  };

  const handleImport = async () => {
    if (!importFile) return alert('Select a file');
    const text = await importFile.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { return alert('Invalid JSON'); }
    const username = (user && user.username) || '';
    data.username = username;
    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) alert('Import succeeded'); else alert('Import failed');
  };

  return (
    <>
      <div className="card" style={{ maxWidth: 800 }}>
        <h2>Data Management</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleExport}>Download Backup (JSON)</button>
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <input type="file" accept="application/json" onChange={e=>setImportFile(e.target.files[0])} />
            <button className="btn" onClick={handleImport}>Upload & Restore</button>
          </label>
        </div>
      </div>
    </>
  );
}
