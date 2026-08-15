import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import QRCode from 'qrcode.react';

export default function Barcodes() {
  const { dbData, saveDB } = useApp();
  const [barcodes, setBarcodes] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [code, setCode] = useState('');
  const [format, setFormat] = useState('qr');
  const [size, setSize] = useState('standard');
  const [saveToProduct, setSaveToProduct] = useState(true);
  
  // Custom label design states
  const [includeName, setIncludeName] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeSku, setIncludeSku] = useState(true);
  const [includeText, setIncludeText] = useState(true);

  // Selection & Print quantity states
  const [selectedItems, setSelectedItems] = useState([]);
  const [printQuantities, setPrintQuantities] = useState({});

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    try {
      const res = await fetch('/api/admin/barcodes');
      const j = await res.json();
      setBarcodes(j);
      
      // Initialize print copies to 1
      const initialQtys = {};
      j.forEach(item => {
        initialQtys[item._id] = 1;
      });
      setPrintQuantities(prev => ({ ...initialQtys, ...prev }));
    } catch (err) { console.error(err); }
  };

  // Auto-fill code when a product is selected
  useEffect(() => {
    if (selectedProductId) {
      const prod = dbData.products.find(p => p.id === selectedProductId || p._id === selectedProductId);
      if (prod) {
        setCode(prod.barcode || prod.sku || '');
      }
    } else {
      setCode('');
    }
  }, [selectedProductId, dbData.products]);

  const handleAutoGenerateCode = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
    const prod = dbData.products.find(p => p.id === selectedProductId || p._id === selectedProductId);
    const prefix = prod ? (prod.sku || prod.id || 'BC') : 'BC';
    setCode(`${prefix}-${randomSuffix}`);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!code.trim()) return alert('Please enter a barcode value');
    
    try {
      const res = await fetch('/api/admin/barcodes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, code, type: format })
      });
      
      if (res.ok) {
        // Optionally save to the product document's primary barcode field
        if (saveToProduct && selectedProductId) {
          const updatedProds = dbData.products.map(p => {
            if (p.id === selectedProductId || p._id === selectedProductId) {
              return { ...p, barcode: code };
            }
            return p;
          });
          await saveDB({ ...dbData, products: updatedProds });
        }
        setSelectedProductId(''); setCode(''); fetchList();
      } else {
        alert('Failed to generate barcode');
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkGenerate = async () => {
    const missing = dbData.products.filter(p => p.active !== false && !p.barcode);
    if (missing.length === 0) {
      alert('All active products already have barcodes linked!');
      return;
    }
    
    if (!await window.confirm(`Found ${missing.length} products missing barcodes. Generate codes for all of them?`)) {
      return;
    }
    
    let successCount = 0;
    const updatedProds = [...dbData.products];
    
    for (const prod of missing) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
      const prefix = prod.sku || prod.id || 'BC';
      const autoCode = `${prefix}-${randomSuffix}`;
      
      try {
        const res = await fetch('/api/admin/barcodes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: prod.id || prod._id, code: autoCode, type: format })
        });
        
        if (res.ok) {
          successCount++;
          const pIdx = updatedProds.findIndex(p => p.id === prod.id || p._id === prod._id);
          if (pIdx !== -1) {
            updatedProds[pIdx] = { ...updatedProds[pIdx], barcode: autoCode };
          }
        }
      } catch (err) {
        console.error('Failed to generate for product ' + prod.name, err);
      }
    }
    
    if (successCount > 0) {
      await saveDB({ ...dbData, products: updatedProds });
      alert(`Successfully generated barcodes for ${successCount} products!`);
      fetchList();
    } else {
      alert('Failed to generate any barcodes.');
    }
  };

  const getCurrencySymbol = () => {
    const c = dbData.settings?.currency || 'INR (₹)';
    const match = c.match(/\((.*?)\)/);
    return match ? match[1] : '₹';
  };

  const getProductInfo = (productId) => {
    const prod = dbData.products.find(p => p.id === productId || p._id === productId);
    return prod ? { name: prod.name, price: `${getCurrencySymbol()}${prod.price}`, sku: prod.sku || '' } : { name: 'Generic Label', price: '', sku: '' };
  };

  const handlePrint = async (itemsToPrint) => {
    if (!itemsToPrint || itemsToPrint.length === 0) {
      return alert('No items selected to print');
    }
    const isSmall = size === 'small';
    const isLarge = size === 'large';
    const lW = isSmall ? '135px' : (isLarge ? '270px' : '180px');
    const lH = isSmall ? '65px' : (isLarge ? '140px' : '95px');

    // Pre-fetch barcode/QR images and convert to base64 Data URIs
    const itemsWithBase64 = await Promise.all(itemsToPrint.map(async (item) => {
      try {
        const typeParam = item.type === 'qr' ? 'qr' : 'barcode';
        const url = `/api/admin/barcodes/render?code=${encodeURIComponent(item.code)}&type=${typeParam}&includetext=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch image');
        const blob = await res.blob();
        
        const base64Src = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        return { ...item, base64Src };
      } catch (err) {
        console.error('Failed to pre-fetch image for printing', err);
        return { ...item, base64Src: '' };
      }
    }));
    
    // Duplicate elements based on configured copy count
    const expandedItems = [];
    itemsWithBase64.forEach(i => {
      const qty = printQuantities[i._id] || 1;
      for (let c = 0; c < qty; c++) {
        expandedItems.push(i);
      }
    });

    const html = `
      <!doctype html>
      <html>
      <head>
        <title>Print Labels</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 10px; background: #fff; }
          .label-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(${lW}, 1fr)); gap: 8px; }
          .label { 
            width: ${lW}; 
            height: ${lH}; 
            border: 1px dashed #cccccc; 
            box-sizing: border-box;
            padding: 6px; 
            display: flex; 
            align-items: center; 
            background: #fff;
            page-break-inside: avoid;
            overflow: hidden;
            font-size: ${isSmall ? '6px' : (isLarge ? '10px' : '8px')};
          }
          .label-img-wrapper {
            width: ${isSmall ? '36px' : (isLarge ? '90px' : '60px')};
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 6px;
          }
          .label-img { 
            max-width: 100%;
            max-height: ${isSmall ? '36px' : (isLarge ? '90px' : '60px')};
            object-fit: contain;
          }
          .label-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
            overflow: hidden;
            color: #111;
          }
          .label-title { font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
          .label-sku { font-size: ${isSmall ? '5px' : (isLarge ? '8px' : '7px')}; color: #555; margin-bottom: 1px; }
          .label-code { font-family: monospace; font-weight: bold; color: #333; margin-bottom: 2px; }
          .label-price { font-weight: bold; color: #000; font-size: ${isSmall ? '6px' : (isLarge ? '10px' : '9px')}; }
          @media print {
            body { padding: 0; }
            .label { border: 1px solid #000000; }
          }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${expandedItems.map(i => {
            const info = getProductInfo(i.productId);
            return `
              <div class="label">
                <div class="label-img-wrapper">
                  <img class="label-img" src="${i.base64Src}" />
                </div>
                <div class="label-info">
                  ${includeName ? `<div class="label-title">${info.name}</div>` : ''}
                  ${includeSku && info.sku ? `<div class="label-sku">SKU: ${info.sku}</div>` : ''}
                  ${includeText ? `<div class="label-code">${i.code}</div>` : ''}
                  ${includePrice && info.price ? `<div class="label-price">${info.price}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
  };

  const handleDownloadPDF = async (itemsToPrint) => {
    try {
      if (!itemsToPrint || itemsToPrint.length === 0) {
        return alert('No items selected to generate PDF');
      }
      const ids = itemsToPrint.map(i => i._id).join(',');
      const qtys = itemsToPrint.map(i => printQuantities[i._id] || 1).join(',');
      
      let url = `/api/admin/barcodes/pdf?format=${format}&size=${size}&ids=${encodeURIComponent(ids)}&qtys=${encodeURIComponent(qtys)}`;
      url += `&includeName=${includeName}&includePrice=${includePrice}&includeSku=${includeSku}&includeText=${includeText}`;
      
      const res = await fetch(url);
      if (!res.ok) return alert('Failed to prepare PDF');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'barcode_labels.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    }
  };

  const getSelectedObjects = () => {
    return barcodes.filter(b => selectedItems.includes(b._id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
            <i className="fas fa-barcode" style={{ color: 'var(--accent)' }}></i> Barcode & QR Label Engine
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, margin: '6px 0 0 0' }}>
            Configure sizes, select label fields, and perform bulk print generation offline.
          </p>
        </div>
        <button className="btn btn--outline" onClick={handleBulkGenerate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-magic"></i> Bulk Generate Missing Barcodes
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        {/* Left Column: Form and Configuration Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Generator Form */}
          <form onSubmit={handleGenerate} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, fontSize: 15 }}>
              <i className="fas fa-plus-circle" style={{ marginRight: 8, color: 'var(--accent)' }}></i> Create Label Record
            </h3>

            <div className="fg">
              <label>Select Product</label>
              <select className="fi" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                <option value="">-- Generic Label (No Product) --</option>
                {dbData.products.filter(p => p.active !== false).map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} {p.sku ? `(SKU: ${p.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="fg">
              <label>Barcode / Label Code</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="fi" placeholder="Enter barcode or SKU value" value={code} onChange={e => setCode(e.target.value)} required />
                <button type="button" className="btn" style={{ padding: '0 14px' }} onClick={handleAutoGenerateCode} title="Auto Generate Suffix">Auto</button>
              </div>
            </div>

            <div className="fg">
              <label>Output Format</label>
              <select className="fi" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="qr">QR Code (High Density)</option>
                <option value="barcode">Barcode (Code 128 Alphanumeric)</option>
              </select>
            </div>

            {selectedProductId && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                <input type="checkbox" checked={saveToProduct} onChange={e => setSaveToProduct(e.target.checked)} />
                Link & Save code to product primary field
              </label>
            )}

            <button className="btn btn--primary" type="submit" style={{ marginTop: 8 }}>
              <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i> Save Label Record
            </button>
          </form>

          {/* Card 2: Configuration & Label Sizing Settings */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: '0 0 8px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: 8, fontSize: 15 }}>
              <i className="fas fa-sliders-h" style={{ marginRight: 8, color: 'var(--accent)' }}></i> Label Design & Size
            </h3>

            <div className="fg">
              <label>Layout Dimensions</label>
              <select className="fi" value={size} onChange={e => setSize(e.target.value)}>
                <option value="standard">Standard (2" x 1" - 3 columns)</option>
                <option value="small">Small (1.5" x 0.5" - 4 columns)</option>
                <option value="large">Large (3" x 2" - 2 columns)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={includeName} onChange={e => setIncludeName(e.target.checked)} />
                Include Product Name
              </label>

              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={includePrice} onChange={e => setIncludePrice(e.target.checked)} />
                Include Price
              </label>

              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={includeSku} onChange={e => setIncludeSku(e.target.checked)} />
                Include Product SKU
              </label>

              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={includeText} onChange={e => setIncludeText(e.target.checked)} />
                Include Readable Barcode Text
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: List of Labels */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Generated Label Records</h3>
            
            {/* Quick Actions for Selection */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn--sm btn--outline" 
                onClick={() => handlePrint(getSelectedObjects())} 
                disabled={selectedItems.length === 0}
              >
                <i className="fas fa-print"></i> Print Selected ({selectedItems.length})
              </button>
              <button 
                className="btn btn--sm btn--primary" 
                onClick={() => handleDownloadPDF(getSelectedObjects())} 
                disabled={selectedItems.length === 0}
              >
                <i className="fas fa-file-pdf"></i> Download PDF ({selectedItems.length})
              </button>
            </div>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === barcodes.length && barcodes.length > 0}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedItems(barcodes.map(b => b._id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th>Preview</th>
                <th>Code Value</th>
                <th>Linked Product</th>
                <th style={{ textAlign: 'center', width: 90 }}>Copies</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {barcodes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                    No generated labels found. Select a product to generate one.
                  </td>
                </tr>
              ) : (
                barcodes.map(b => {
                  const info = getProductInfo(b.productId);
                  const isChecked = selectedItems.includes(b._id);
                  return (
                    <tr key={b._id} style={{ background: isChecked ? 'rgba(var(--accent-rgb, 100, 110, 245), 0.05)' : 'transparent' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, b._id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== b._id));
                            }
                          }}
                        />
                      </td>
                      <td style={{ width: 100 }}>
                        <div style={{ display: 'inline-block', background: '#ffffff', padding: 4, borderRadius: 4 }}>
                          {b.type === 'barcode' ? (
                            <img 
                              src={`/api/admin/barcodes/render?code=${encodeURIComponent(b.code)}&type=barcode&includetext=false`} 
                              style={{ maxHeight: 30, maxWidth: 90, display: 'block' }} 
                              alt="barcode preview" 
                            />
                          ) : (
                            <QRCode value={b.code} size={36} style={{ display: 'block' }} />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{b.code}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{info.name}</div>
                        {info.sku && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>SKU: {info.sku}</div>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          className="fi"
                          style={{ width: 60, padding: '4px 6px', textAlign: 'center', margin: '0 auto' }}
                          value={printQuantities[b._id] || 1}
                          onChange={e => setPrintQuantities({
                            ...printQuantities,
                            [b._id]: Math.max(1, parseInt(e.target.value, 10) || 1)
                          })}
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn--sm" onClick={() => handlePrint([b])}>
                            <i className="fas fa-print"></i> Print
                          </button>
                          <button className="btn btn--sm btn--outline" onClick={() => handleDownloadPDF([b])}>
                            <i className="fas fa-file-pdf"></i> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
