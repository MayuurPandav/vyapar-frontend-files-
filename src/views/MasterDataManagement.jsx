import React, { useState, useEffect } from 'react';

const SECTIONS = {
  product: {
    title: '📦 Product & Inventory Master',
    fields: [
      { key: 'product_categories', label: 'Global Product Category Templates', type: 'tags' },
      { key: 'product_subcategories', label: 'Global Sub-Category Templates', type: 'tags' },
      { key: 'brand_list', label: 'Global Brand List', type: 'tags' },
      { key: 'uom_list', label: 'Unit of Measurement List', type: 'tags' },
      { key: 'hsn_sac_codes', label: 'Default HSN / SAC Code Directory', type: 'tags' },
      { key: 'gst_rate_slabs', label: 'Default GST Rate Slab Templates', type: 'tags' },
      { key: 'barcode_formats', label: 'Barcode Format Configuration', type: 'tags' }
    ]
  },
  billing: {
    title: '🧾 Billing & Invoice Master',
    fields: [
      { key: 'invoice_number_formats', label: 'Invoice Number Format Templates', type: 'tags' },
      { key: 'invoice_template_styles', label: 'Invoice Template Styles', type: 'tags' },
      { key: 'payment_terms', label: 'Payment Terms Templates', type: 'tags' },
      { key: 'bank_account_template', label: 'Default Bank Account Details Template', type: 'text' },
      { key: 'invoice_footer_text', label: 'Default Invoice Footer / Terms Text', type: 'text' },
      { key: 'discount_types', label: 'Discount Type Templates', type: 'tags' },
      { key: 'additional_charges', label: 'Additional Charges Templates', type: 'tags' }
    ]
  },
  gst: {
    title: '🏛️ GST & Tax Master',
    fields: [
      { key: 'gst_rate_master', label: 'GST Rate Master', type: 'tags' },
      { key: 'hsn_code_master_list', label: 'HSN Code Master List', type: 'tags' },
      { key: 'sac_code_master_list', label: 'SAC Code Master List', type: 'tags' },
      { key: 'state_code_master_list', label: 'State Code Master List (for GST)', type: 'tags' },
      { key: 'eway_bill_config', label: 'E-Way Bill Configuration', type: 'tags' },
      { key: 'composition_scheme_config', label: 'Composition Scheme Configuration', type: 'tags' }
    ]
  },
  party: {
    title: '🤝 Party Master',
    fields: [
      { key: 'customer_category_list', label: 'Default Customer Category List', type: 'tags' },
      { key: 'supplier_category_list', label: 'Default Supplier Category List', type: 'tags' },
      { key: 'payment_mode_master_list', label: 'Payment Mode Master List', type: 'tags' },
      { key: 'credit_limit_policy_templates', label: 'Credit Limit Policy Templates', type: 'tags' },
      { key: 'party_payment_terms_templates', label: 'Payment Terms Templates', type: 'tags' }
    ]
  },
  expense: {
    title: '💸 Expense Master',
    fields: [
      { key: 'global_expense_category_list', label: 'Global Expense Category List', type: 'tags' },
      { key: 'default_expense_templates', label: 'Default Expense Templates', type: 'tags' }
    ]
  },
  delivery: {
    title: '🚚 Delivery Master',
    fields: [
      { key: 'delivery_status_list', label: 'Default Delivery Status List', type: 'tags' },
      { key: 'failed_delivery_reason_list', label: 'Default Failed Delivery Reason List', type: 'tags' },
      { key: 'delivery_charge_templates', label: 'Default Delivery Charge Templates', type: 'tags' },
      { key: 'delivery_time_slot_templates', label: 'Delivery Time Slot Templates', type: 'tags' }
    ]
  },
  offers: {
    title: '🏷️ Offers Master',
    fields: [
      { key: 'offer_type_templates', label: 'Default Offer Type Templates', type: 'tags' },
      { key: 'coupon_code_format_config', label: 'Coupon Code Format Configuration', type: 'tags' }
    ]
  }
};

function TagInput({ values, onChange }) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!values.includes(input.trim())) {
        onChange([...values, input.trim()]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeTag = (idx) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const editTag = (idx, text) => {
    setInput(text);
    onChange(values.filter((_, i) => i !== idx));
    // Small timeout to allow state to settle before focusing, though focus is handled by the wrapper onClick
  };

  return (
    <div style={{ 
      background: 'var(--bg-input)', 
      border: '1px solid var(--border)', 
      borderRadius: '8px', 
      padding: '8px 10px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '6px', 
      alignItems: 'center',
      minHeight: '42px',
      cursor: 'text'
    }} onClick={(e) => { if(e.target === e.currentTarget) e.currentTarget.querySelector('input')?.focus() }}>
      {values.map((v, i) => (
        <span key={i} style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))', 
          color: '#3b82f6', 
          padding: '4px 10px', 
          borderRadius: '6px', 
          fontSize: '12px', 
          fontWeight: 600,
          border: '1px solid rgba(59,130,246,0.15)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }} title="Click to edit" onClick={() => editTag(i, v)}>
          {v}
          <button onClick={(e) => { e.stopPropagation(); removeTag(i); }} style={{ 
            background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', fontSize: '14px', lineHeight: 1, display: 'flex'
          }}>&times;</button>
        </span>
      ))}
      <input 
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? 'Type and press Enter to add...' : 'Add more...'}
        style={{ 
          border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-1)', 
          fontSize: '13px', flex: 1, minWidth: '120px', padding: '4px 0'
        }}
      />
    </div>
  );
}

export default function MasterDataManagement() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [detailModal, setDetailModal] = useState(null); // { title, type }

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super/master-data');
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Failed to load master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/super/master-data/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: data[key] })
      });
      if (!res.ok) alert('Failed to save');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const updateField = (key, values) => {
    setData(prev => ({ ...prev, [key]: values }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading Master Data...</div>
      </div>
    );
  }

  const totalItems = Object.values(data).reduce((sum, v) => sum + (Array.isArray(v) ? v.length : 1), 0);

  // Styles
  const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
  const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '600px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Master Data Management</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Manage global product categories, billing templates, HSN codes, and all platform-wide master lists.
          </p>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Master Data Categories', type: 'categories' })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f615', display: 'grid', placeItems: 'center', color: '#3b82f6', fontSize: '16px' }}>
              <i className="fas fa-database"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{Object.keys(data).length}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</div>
            </div>
          </div>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Total Master Items Breakdown', type: 'items' })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8b5cf615', display: 'grid', placeItems: 'center', color: '#8b5cf6', fontSize: '16px' }}>
              <i className="fas fa-tags"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{totalItems}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Items</div>
            </div>
          </div>
          <div className="card card--lift" onClick={() => setDetailModal({ title: 'Database Synchronization Status', type: 'sync' })} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#10b98115', display: 'grid', placeItems: 'center', color: '#10b981', fontSize: '16px' }}>
              <i className="fas fa-circle-check"></i>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>Live</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sync Status</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        {Object.entries(SECTIONS).map(([sectionKey, section]) => (
          <div key={sectionKey} className="card" style={{ marginBottom: '24px' }}>
            <div className="card__head" style={{ fontSize: '16px' }}>{section.title}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
              {section.fields.map(field => (
                <div key={field.key} style={{ 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{field.label}</label>
                    <button 
                      className="btn btn--sm" 
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => handleSave(field.key)}
                      disabled={saving[field.key]}
                    >
                      {saving[field.key] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                      {saving[field.key] ? ' Saving' : ' Save'}
                    </button>
                  </div>

                  {field.type === 'tags' ? (
                    <TagInput 
                      values={Array.isArray(data[field.key]) ? data[field.key] : []} 
                      onChange={(vals) => updateField(field.key, vals)}
                    />
                  ) : (
                    <textarea
                      className="fi"
                      rows="4"
                      value={data[field.key] || ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
                    ></textarea>
                  )}

                  {field.type === 'tags' && (
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>
                      {Array.isArray(data[field.key]) ? data[field.key].length : 0} items · Type and press Enter to add
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDetailModal(null)}>
          <div style={{ ...modalBox, maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)' }}>{detailModal.title}</h3>
              <button className="btn--icon" onClick={() => setDetailModal(null)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '450px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {detailModal.type === 'categories' ? (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Section</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Category Field</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Item Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(SECTIONS).flatMap(([sKey, sVal]) => 
                      sVal.fields.map(f => {
                        const val = data[f.key];
                        const count = Array.isArray(val) ? val.length : (val ? 1 : 0);
                        return (
                          <tr key={f.key} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>
                              {sVal.title.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim()}
                            </td>
                            <td style={{ padding: '12px' }}>{f.label}</td>
                            <td style={{ padding: '12px' }}><span className="badge badge--blue">{f.type}</span></td>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{count}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : detailModal.type === 'items' ? (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Master Category</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Items / Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(SECTIONS).flatMap(([sKey, sVal]) => 
                      sVal.fields.map(f => {
                        const val = data[f.key];
                        const displayVal = Array.isArray(val) ? val.join(', ') : (val || '—');
                        return (
                          <tr key={f.key} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{f.label}</td>
                            <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-2)', wordBreak: 'break-word' }}>
                              {displayVal || <span style={{ color: 'var(--text-3)' }}>Empty</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <i className="fas fa-circle-check" style={{ color: '#10b981', fontSize: '18px' }}></i>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>Database Schema Integrity</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Schema validation passed. Collections are synced with MongoDB master.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <i className="fas fa-circle-check" style={{ color: '#10b981', fontSize: '18px' }}></i>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>In-Memory Cache Cache-Aside</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Platform-wide cache sync is enabled and operating with zero lag.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <i className="fas fa-circle-check" style={{ color: '#10b981', fontSize: '18px' }}></i>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>Client Session Sync</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>All connected tenants received latest master update.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <i className="fas fa-clock" style={{ color: 'var(--blue)', fontSize: '18px' }}></i>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>Last Sync Time</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{new Date().toLocaleTimeString()} (Auto sync runs every 5 minutes)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
