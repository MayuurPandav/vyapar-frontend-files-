import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Barcodes() {
  const { token } = useApp();
  const [barcodes, setBarcodes] = useState([]);
  const [productId, setProductId] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState('qr');
  const [size, setSize] = useState('standard');

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/admin/barcodes');
      const j = await res.json();
      setBarcodes(j);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/barcodes/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, code }) });
      if (res.ok) {
        setProductId(''); setCode(''); fetchList();
      } else {
        alert('Failed');
      }
    } catch (err) { console.error(err); }
  };

  const handlePrint = (items) => {
    const isSmall = size === 'small';
    const lW = isSmall ? '120px' : '200px';
    const lH = isSmall ? '80px' : '120px';
    const imgSize = isSmall ? '60x60' : '140x140';
    // Use an external service for barcode generation if format is barcode (e.g. bwip-js or tec-it), here we just use google charts for QR, and for barcode we use a public API stub (bwip-js demo server)
    const getImgSrc = (code) => format === 'qr' 
      ? `https://chart.googleapis.com/chart?cht=qr&chs=${imgSize}&chl=${encodeURIComponent(code)}`
      : `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scaleX=2&scaleY=1`;
    const html = `<!doctype html><html><head><title>Print Labels</title><style>body{font-family:Arial,sans-serif} .label{width:${lW};height:${lH};border:1px solid #ddd;margin:8px;padding:8px;display:inline-block;text-align:center} .code{font-weight:700;margin-top:8px} img{max-width:100%;max-height:${isSmall ? '40px' : '80px'}}</style></head><body>${items.map(i=>`<div class="label"><img src="${getImgSrc(i.code)}"/><div class="code">${i.code}</div><div style="font-size:12px">${i.productId||''}</div></div>`).join('')}</body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close();
    w.focus();
    setTimeout(() => w.print(), 1000);
  };

  const handleDownloadPDF = async (selected) => {
    try {
      const ids = selected && selected.length ? selected.map(i => i._id).join(',') : '';
      let url = '/api/admin/barcodes/pdf?format=' + format + '&size=' + size;
      if (ids) url += `&ids=${encodeURIComponent(ids)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) return alert('Failed to prepare PDF');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'barcode_labels.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); alert('Error generating PDF'); }
  };

  return (
    <>
      <div className="card">
        <h2>Barcode & QR Management</h2>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input placeholder="Product ID" value={productId} onChange={e=>setProductId(e.target.value)} />
          <input placeholder="Optional code" value={code} onChange={e=>setCode(e.target.value)} />
          <select value={format} onChange={e=>setFormat(e.target.value)}>
            <option value="qr">QR Code</option>
            <option value="barcode">Barcode (Code128)</option>
          </select>
          <select value={size} onChange={e=>setSize(e.target.value)}>
            <option value="standard">Standard Label</option>
            <option value="small">Small Label</option>
          </select>
          <button className="btn" type="submit">Generate</button>
        </form>

        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button className="btn btn--sm" onClick={() => handlePrint(barcodes)}>Print All</button>
          <button className="btn btn--sm" onClick={() => handleDownloadPDF(barcodes)}>Download PDF</button>
        </div>

        <table className="tbl" style={{ marginTop: 12 }}>
          <thead><tr><th>Code</th><th>Product</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {barcodes.map(b => (
              <tr key={b._id}>
                <td style={{ width: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={`https://chart.googleapis.com/chart?cht=qr&chs=80x80&chl=${encodeURIComponent(b.code)}`} alt="qr" />
                    <div className="code-text">{b.code}</div>
                  </div>
                </td>
                <td>{b.productId}</td>
                <td>{(b.createdAt||'').slice(0,10)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn--sm" onClick={() => handlePrint([b])}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
