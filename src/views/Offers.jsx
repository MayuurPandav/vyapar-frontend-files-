import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Offers() {
  const { dbData, saveDB, viewOnly } = useApp();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [offerForm, setOfferForm] = useState({
    code: '',
    type: 'Percentage',
    value: 0,
    startDate: '',
    endDate: '',
    minBillAmount: 0,
    usageLimit: 0,
    isActive: true,
    buyQty: 0,
    getQty: 0,
    applicableProduct: '',
    bundleProducts: [],
    seasonName: '',
    applicableCategory: '',
    applicableCustomer: '',
    applicableCustomerGroup: ''
  });

  const productsList = dbData.products || [];
  const categoriesList = [...new Set(productsList.map(p => p.category).filter(Boolean))];
  const customersList = (dbData.parties || []).filter(p => p.type === 'Customer');
  const customerGroupsList = [...new Set((dbData.parties || []).map(p => p.customerGroup).filter(Boolean))];

  const getCurrencySymbol = () => {
    const c = dbData.settings?.currency || 'INR (₹)';
    const match = c.match(/\((.*?)\)/);
    return match ? match[1] : '₹';
  };

  const fmt = (n) => {
    const num = Number(n) || 0;
    const sym = getCurrencySymbol();
    const isINR = sym === '₹';
    const absValStr = Math.abs(num).toLocaleString(isINR ? 'en-IN' : 'en-US');
    if (num < 0) return '-' + sym + absValStr;
    return sym + absValStr;
  };

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    if (viewOnly) return alert('⛔ View-Only Mode');
    let updatedOffers = [...(dbData.offers || [])];
    
    // Additional validations
    if (offerForm.startDate && offerForm.endDate && offerForm.startDate > offerForm.endDate) {
      return alert('Start date cannot be after the end date.');
    }

    if (offerForm.type === 'BOGO') {
      if (!offerForm.applicableProduct) {
        return alert('Please select an applicable product for BOGO.');
      }
      if (Number(offerForm.buyQty) <= 0 || Number(offerForm.getQty) <= 0) {
        return alert('Buy and Get quantities must be greater than 0.');
      }
    }
    if (offerForm.type === 'Bundle') {
      if (!offerForm.bundleProducts || offerForm.bundleProducts.length < 2) {
        return alert('Please select at least 2 products for a Bundle offer.');
      }
    }
    if (offerForm.type === 'Seasonal') {
      if (!offerForm.seasonName.trim()) {
        return alert('Please enter a Season / Campaign Name.');
      }
      if (!offerForm.startDate || !offerForm.endDate) {
        return alert('Start and End dates are strictly required for Seasonal offers.');
      }
    }

    const payload = {
      ...offerForm,
      value: parseFloat(offerForm.value) || 0, 
      minBillAmount: parseFloat(offerForm.minBillAmount) || 0, 
      usageLimit: parseInt(offerForm.usageLimit) || 0,
      buyQty: parseInt(offerForm.buyQty) || 0,
      getQty: parseInt(offerForm.getQty) || 0,
      bundleProducts: Array.isArray(offerForm.bundleProducts) ? offerForm.bundleProducts : [],
      seasonName: offerForm.seasonName || '',
      applicableCategory: offerForm.applicableCategory || '',
      applicableCustomer: offerForm.applicableCustomer || '',
      applicableCustomerGroup: offerForm.applicableCustomerGroup || ''
    };
    
    if (editingOffer) {
      const idx = updatedOffers.findIndex(o => o.id === editingOffer.id);
      if (idx !== -1) {
        updatedOffers[idx] = { 
          ...editingOffer, 
          ...payload
        };
      }
    } else {
      const newId = Math.max(0, ...updatedOffers.map(o => o.id)) + 1;
      updatedOffers.push({ 
        ...payload, 
        id: newId, 
        usedCount: 0
      });
    }
    
    saveDB({ ...dbData, offers: updatedOffers });
    setShowOfferModal(false);
    setEditingOffer(null);
    setOfferForm({ 
      code: '', 
      type: 'Percentage', 
      value: 0, 
      startDate: '', 
      endDate: '', 
      minBillAmount: 0, 
      usageLimit: 0, 
      isActive: true,
      buyQty: 0,
      getQty: 0,
      applicableProduct: '',
      bundleProducts: [],
      seasonName: '',
      applicableCategory: '',
      applicableCustomer: '',
      applicableCustomerGroup: ''
    });
  };

  const handleOfferToggle = (id) => {
    if (viewOnly) return;
    let updatedOffers = (dbData.offers || []).map(o => o.id === id ? { ...o, isActive: !o.isActive } : o);
    saveDB({ ...dbData, offers: updatedOffers });
  };

  const deleteOffer = async (id) => {
    if (viewOnly || !await window.confirm('Delete this offer?')) return;
    let updatedOffers = (dbData.offers || []).filter(o => o.id !== id);
    saveDB({ ...dbData, offers: updatedOffers });
  };

  const handleBundleProductToggle = (pName) => {
    const current = offerForm.bundleProducts || [];
    if (current.includes(pName)) {
      setOfferForm({ ...offerForm, bundleProducts: current.filter(x => x !== pName) });
    } else {
      setOfferForm({ ...offerForm, bundleProducts: [...current, pName] });
    }
  };

  const getOfferTypeBadge = (type) => {
    switch (type) {
      case 'Percentage': 
        return <span className="badge badge--blue" style={{ fontSize: '11px' }}>Percentage (%)</span>;
      case 'Flat Discount': 
        return <span className="badge badge--green" style={{ fontSize: '11px' }}>Flat (₹)</span>;
      case 'BOGO': 
        return <span className="badge" style={{ fontSize: '11px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>BOGO (Buy X Get Y)</span>;
      case 'Bundle': 
        return <span className="badge" style={{ fontSize: '11px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}>Bundle Combo</span>;
      case 'Seasonal': 
        return <span className="badge" style={{ fontSize: '11px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Seasonal Campaign</span>;
      default: 
        return <span className="badge badge--grey" style={{ fontSize: '11px' }}>{type}</span>;
    }
  };

  const getOfferValueText = (o) => {
    let baseText = '';
    if (o.type === 'BOGO') {
      baseText = `Buy ${o.buyQty} Get ${o.getQty} Free on "${o.applicableProduct}"`;
    } else if (o.type === 'Bundle') {
      baseText = `${o.value}% Off Bundle [${(o.bundleProducts || []).join(', ')}]`;
    } else if (o.type === 'Seasonal') {
      baseText = `${o.seasonName}: ${o.value}% Off`;
    } else {
      baseText = o.type === 'Percentage' ? `${o.value}% Off` : `${fmt(o.value)} Off`;
    }
    
    const scopeRules = [];
    if (o.type !== 'BOGO' && o.type !== 'Bundle') {
      if (o.applicableProduct) scopeRules.push(`Product: ${o.applicableProduct}`);
      if (o.applicableCategory) scopeRules.push(`Category: ${o.applicableCategory}`);
    }
    if (o.applicableCustomer) scopeRules.push(`Customer: ${o.applicableCustomer}`);
    if (o.applicableCustomerGroup) scopeRules.push(`Group: ${o.applicableCustomerGroup}`);
    
    if (scopeRules.length > 0) {
      return (
        <div>
          <div>{baseText}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', fontStyle: 'italic', marginTop: '2px' }}>
            Only for: {scopeRules.join(' | ')}
          </div>
        </div>
      );
    }
    return baseText;
  };

  const activeOffersCount = (dbData.offers || []).filter(o => o.isActive).length;

  return (
    <>
      <section className="view active" id="view-offers">
        <div className="sec-header sec-header--row">
          <div>
            <h2>Offers & Discount Management</h2>
            <p>Create BOGO campaigns, bundles, seasonal promotions, and discount codes for invoicing.</p>
          </div>
          <button className="btn btn--primary" onClick={() => { 
            setEditingOffer(null); 
            setOfferForm({ 
              code: '', 
              type: 'Percentage', 
              value: 0, 
              startDate: '', 
              endDate: '', 
              minBillAmount: 0, 
              usageLimit: 0, 
              isActive: true,
              buyQty: 0,
              getQty: 0,
              applicableProduct: '',
              bundleProducts: [],
              seasonName: '',
              applicableCategory: '',
              applicableCustomer: '',
              applicableCustomerGroup: ''
            }); 
            setShowOfferModal(true); 
          }}><i className="fas fa-tag"></i> Create Offer</button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div className="card card--lift" style={{ padding: '15px' }}>
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Offers</div>
            <div className="stat__val" style={{ color: 'var(--blue)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{(dbData.offers || []).length}</div>
          </div>
          <div className="card card--lift" style={{ padding: '15px' }}>
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Offers</div>
            <div className="stat__val" style={{ color: 'var(--green)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{activeOffersCount}</div>
          </div>
          <div className="card card--lift" style={{ padding: '15px' }}>
            <div className="stat__lbl" style={{ color: 'var(--text-3)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Inactive Offers</div>
            <div className="stat__val" style={{ color: 'var(--red)', fontSize: '20px', fontWeight: '800', marginTop: '5px' }}>{(dbData.offers || []).length - activeOffersCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Offer Details / Rules</th>
                <th>Validity</th>
                <th>Min Bill</th>
                <th>Usage</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(dbData.offers || []).length > 0 ? (
                (dbData.offers || []).map((o, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--blue)' }}>{o.code}</td>
                    <td>{getOfferTypeBadge(o.type)}</td>
                    <td style={{ fontWeight: '600', color: 'var(--text-1)' }}>{getOfferValueText(o)}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{o.startDate || '-'} to {o.endDate || '-'}</td>
                    <td>{o.minBillAmount > 0 ? fmt(o.minBillAmount) : 'None'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{o.usedCount || 0} / {o.usageLimit > 0 ? o.usageLimit : '∞'}</td>
                    <td>
                      <button className={`btn btn--sm ${o.isActive ? 'btn--primary' : 'btn--outline'}`} onClick={() => handleOfferToggle(o.id)} style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px' }}>
                        {o.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn--icon" style={{ marginRight: '6px' }} onClick={() => { setEditingOffer(o); setOfferForm({ ...o }); setShowOfferModal(true); }} title="Edit Offer"><i className="fas fa-pen" style={{ fontSize: '12px' }}></i></button>
                      <button className="btn--icon" onClick={() => deleteOffer(o.id)} title="Delete Offer"><i className="fas fa-trash" style={{ color: 'var(--red)', fontSize: '12px' }}></i></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '25px', color: 'var(--text-3)' }}>
                    No offers created yet. Click "Create Offer" above to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showOfferModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal" style={{ display: 'block', maxWidth: '560px', width: '100%', margin: '0 20px', borderRadius: '12px', background: '#ffffff', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.05)' }}>
            <div className="modal__top">
              <h3>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
              <button className="btn--icon" onClick={() => setShowOfferModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            <form onSubmit={handleOfferSubmit}>
              <div className="form-row">
                <div className="fg" style={{ flex: 1 }}><label>Coupon Code <span style={{color: 'red'}}>*</span></label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="text" className="fi" value={offerForm.code} onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })} required placeholder="e.g. BOGO50" />
                    <button type="button" className="btn" onClick={() => {
                      const prefixes = {
                        'Percentage': 'PCT',
                        'Flat Discount': 'FLAT',
                        'BOGO': 'BOGO',
                        'Bundle': 'BNDL',
                        'Seasonal': 'SESN'
                      };
                      const prefix = prefixes[offerForm.type] || 'OFFER';
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setOfferForm({ ...offerForm, code: `${prefix}${rand}` });
                    }}><i className="fas fa-magic"></i> Generate</button>
                  </div>
                </div>
                <div className="fg" style={{ flex: 1 }}><label>Offer Type</label>
                  <select className="fi" value={offerForm.type} onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}>
                    <option value="Percentage">Percentage discount (%)</option>
                    <option value="Flat Discount">Flat discount (₹)</option>
                    <option value="BOGO">Buy X Get Y free (BOGO)</option>
                    <option value="Bundle">Bundle combo offer</option>
                    <option value="Seasonal">Seasonal campaign offer</option>
                  </select>
                </div>
              </div>

              {/* BOGO FIELDS */}
              {offerForm.type === 'BOGO' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
                  <div className="fg" style={{ marginBottom: '10px' }}>
                    <label>Applicable Product <span style={{ color: 'red' }}>*</span></label>
                    <select className="fi" value={offerForm.applicableProduct} onChange={(e) => setOfferForm({ ...offerForm, applicableProduct: e.target.value })} required>
                      <option value="">-- Choose Product --</option>
                      {productsList.map((p, idx) => (
                        <option key={idx} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <div className="fg" style={{ flex: 1 }}><label>Buy Quantity (X)</label>
                      <input type="number" className="fi" value={offerForm.buyQty} onChange={(e) => setOfferForm({ ...offerForm, buyQty: parseInt(e.target.value) || 0 })} min="1" required />
                    </div>
                    <div className="fg" style={{ flex: 1 }}><label>Get Free Quantity (Y)</label>
                      <input type="number" className="fi" value={offerForm.getQty} onChange={(e) => setOfferForm({ ...offerForm, getQty: parseInt(e.target.value) || 0 })} min="1" required />
                    </div>
                  </div>
                </div>
              )}

              {/* BUNDLE FIELDS */}
              {offerForm.type === 'Bundle' && (
                <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
                  <div className="fg" style={{ marginBottom: '10px' }}><label>Select Bundle Products (Min 2) <span style={{ color: 'red' }}>*</span></label>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', background: 'var(--bg-input)' }}>
                      {productsList.map((p, idx) => {
                        const isChecked = (offerForm.bundleProducts || []).includes(p.name);
                        return (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', fontSize: '13px', cursor: 'pointer', color: 'var(--text-1)' }}>
                            <input type="checkbox" checked={isChecked} onChange={() => handleBundleProductToggle(p.name)} />
                            {p.name}
                          </label>
                        );
                      })}
                      {productsList.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No products in catalog. Add products first.</div>}
                    </div>
                  </div>
                  <div className="fg" style={{ margin: 0 }}><label>Discount Percentage (%)</label>
                    <input type="number" className="fi" value={offerForm.value} onChange={(e) => setOfferForm({ ...offerForm, value: parseFloat(e.target.value) || 0 })} min="0" max="100" step="0.1" required />
                  </div>
                </div>
              )}

              {/* SEASONAL FIELDS */}
              {offerForm.type === 'Seasonal' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
                  <div className="fg" style={{ marginBottom: '10px' }}><label>Season / Campaign Name <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" className="fi" value={offerForm.seasonName} onChange={(e) => setOfferForm({ ...offerForm, seasonName: e.target.value })} placeholder="e.g. Diwali Fest, Christmas Sale" required />
                  </div>
                  <div className="form-row" style={{ margin: 0 }}>
                    <div className="fg" style={{ flex: 1 }}><label>Discount Percentage (%)</label>
                      <input type="number" className="fi" value={offerForm.value} onChange={(e) => setOfferForm({ ...offerForm, value: parseFloat(e.target.value) || 0 })} min="0" max="100" step="0.1" required />
                    </div>
                    <div className="fg" style={{ flex: 1 }}><label>Campaign Type</label>
                      <select className="fi" disabled value="Percentage"><option>Percentage (%)</option></select>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '8px', fontWeight: 'bold' }}>
                    ⚠️ Note: Start and End Dates must be populated below for Seasonal Validity checks to pass.
                  </div>
                </div>
              )}

              {/* STANDARD VALUES FIELDS */}
              {(offerForm.type === 'Percentage' || offerForm.type === 'Flat Discount') && (
                <div className="form-row">
                  <div className="fg"><label>Discount Value ({offerForm.type === 'Percentage' ? '%' : getCurrencySymbol()})</label>
                    <input type="number" className="fi" value={offerForm.value} onChange={(e) => setOfferForm({ ...offerForm, value: parseFloat(e.target.value) || 0 })} min="0" step="0.01" required />
                  </div>
                  <div className="fg"><label>Min Bill Amount ({getCurrencySymbol()})</label>
                    <input type="number" className="fi" value={offerForm.minBillAmount} onChange={(e) => setOfferForm({ ...offerForm, minBillAmount: parseFloat(e.target.value) || 0 })} min="0" />
                  </div>
                </div>
              )}

              {/* APPLICABILITY SCOPES */}
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '12px', marginBottom: '12px' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fas fa-filter"></i> Applicability & Scope Rules (Optional)</h5>
                
                {offerForm.type !== 'BOGO' && offerForm.type !== 'Bundle' && (
                  <div className="form-row" style={{ margin: 0, marginBottom: '10px' }}>
                    <div className="fg" style={{ flex: 1 }}>
                      <label>Applicable Product</label>
                      <select className="fi" value={offerForm.applicableProduct} onChange={(e) => setOfferForm({ ...offerForm, applicableProduct: e.target.value })}>
                        <option value="">-- All Products --</option>
                        {productsList.map((p, idx) => (
                          <option key={idx} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="fg" style={{ flex: 1 }}>
                      <label>Applicable Category</label>
                      <select className="fi" value={offerForm.applicableCategory} onChange={(e) => setOfferForm({ ...offerForm, applicableCategory: e.target.value })}>
                        <option value="">-- All Categories --</option>
                        {categoriesList.map((cat, idx) => (
                          <option key={idx} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-row" style={{ margin: 0 }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Applicable Customer</label>
                    <select className="fi" value={offerForm.applicableCustomer} onChange={(e) => setOfferForm({ ...offerForm, applicableCustomer: e.target.value })}>
                      <option value="">-- All Customers --</option>
                      {customersList.map((c, idx) => (
                        <option key={idx} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Applicable Customer Group</label>
                    <select className="fi" value={offerForm.applicableCustomerGroup} onChange={(e) => setOfferForm({ ...offerForm, applicableCustomerGroup: e.target.value })}>
                      <option value="">-- All Groups --</option>
                      {customerGroupsList.map((g, idx) => (
                        <option key={idx} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* VALIDITY DATES */}
              <div className="form-row">
                <div className="fg"><label>Start Date {offerForm.type === 'Seasonal' && <span style={{ color: 'red' }}>*</span>}</label>
                  <input type="date" className="fi" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} required={offerForm.type === 'Seasonal'} />
                </div>
                <div className="fg"><label>End Date {offerForm.type === 'Seasonal' && <span style={{ color: 'red' }}>*</span>}</label>
                  <input type="date" className="fi" value={offerForm.endDate} onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })} required={offerForm.type === 'Seasonal'} />
                </div>
              </div>

              {/* LIMITS AND STATUS */}
              <div className="form-row">
                <div className="fg"><label>Usage Limit (0 for unlimited)</label>
                  <input type="number" className="fi" value={offerForm.usageLimit} onChange={(e) => setOfferForm({ ...offerForm, usageLimit: parseInt(e.target.value) || 0 })} min="0" />
                </div>
                <div className="fg"><label>Status</label>
                  <select className="fi" value={offerForm.isActive ? 'Active' : 'Inactive'} onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.value === 'Active' })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn" onClick={() => setShowOfferModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary"><i className="fas fa-check"></i> Save Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
