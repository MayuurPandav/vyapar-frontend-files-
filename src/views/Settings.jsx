import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { dbData, saveDB } = useApp();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  const addBranch = () => {
    if (!newBranchName.trim() || !newBranchAddress.trim()) return alert('Please enter branch details');
    const updatedBranches = [...(form.branches || []), { name: newBranchName, address: newBranchAddress }];
    setForm(prev => ({ ...prev, branches: updatedBranches }));
    setNewBranchName('');
    setNewBranchAddress('');
  };

  const removeBranch = (idx) => {
    const updatedBranches = (form.branches || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, branches: updatedBranches }));
  };

  useEffect(() => {
    setForm({ ...(dbData.settings || {}) });
  }, [dbData.settings]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        logo: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        digitalSignature: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({
        ...prev,
        shopStamp: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSocialLinksChange = (key, val) => {
    setForm(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || { facebook: '', instagram: '', twitter: '', linkedin: '' }),
        [key]: val
      }
    }));
  };

  const handleBankDetailsChange = (key, val) => {
    setForm(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || { accountName: '', accountNumber: '', bankName: '', ifscCode: '' }),
        [key]: val
      }
    }));
  };

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
              <button className={`btn btn--sm ${tab === 'local' ? 'btn--primary' : ''}`} onClick={() => setTab('local')}>Localization</button>
              <button className={`btn btn--sm ${tab === 'branches' ? 'btn--primary' : ''}`} onClick={() => setTab('branches')}>Branches & Warehouses</button>
              <button className={`btn btn--sm ${tab === 'bank' ? 'btn--primary' : ''}`} onClick={() => setTab('bank')}>Bank & UPI</button>
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
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Basic Info</h3>
                <div className="form-row">
                  <div className="fg"><label>Shop Name</label>
                    <input className="fi" value={form.bizName || ''} onChange={(e) => setForm(prev => ({ ...prev, bizName: e.target.value }))} required />
                  </div>
                  <div className="fg"><label>Owner Full Name</label>
                    <input className="fi" placeholder="Owner full name" value={form.ownerName || ''} onChange={(e) => setForm(prev => ({ ...prev, ownerName: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Shop Type</label>
                    <select className="fi" value={form.shopType || 'General'} onChange={(e) => setForm(prev => ({ ...prev, shopType: e.target.value }))}>
                      <option value="General">General</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Food/Restaurant">Food & Restaurant</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="fg"><label>Theme</label>
                    <select className="fi" value={form.theme || 'light'} onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Contact Details</h3>
                <div className="form-row form-row-3">
                  <div className="fg"><label>Official Email</label>
                    <input className="fi" type="email" placeholder="e.g. contact@shop.com" value={form.email || ''} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="fg"><label>Official Phone</label>
                    <input className="fi" type="tel" placeholder="e.g. +91 9876543210" value={form.phone || ''} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="fg"><label>WhatsApp Number</label>
                    <input className="fi" type="tel" placeholder="WhatsApp number" value={form.whatsapp || ''} onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                  <label style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '8px', display: 'block' }}>Social Media Links</label>
                  <div className="form-row">
                    <div className="fg"><label>Facebook URL</label>
                      <input className="fi" placeholder="Facebook URL" value={form.socialLinks?.facebook || ''} onChange={(e) => handleSocialLinksChange('facebook', e.target.value)} />
                    </div>
                    <div className="fg"><label>Instagram URL</label>
                      <input className="fi" placeholder="Instagram URL" value={form.socialLinks?.instagram || ''} onChange={(e) => handleSocialLinksChange('instagram', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="fg"><label>Twitter / X URL</label>
                      <input className="fi" placeholder="Twitter URL" value={form.socialLinks?.twitter || ''} onChange={(e) => handleSocialLinksChange('twitter', e.target.value)} />
                    </div>
                    <div className="fg"><label>LinkedIn URL</label>
                      <input className="fi" placeholder="LinkedIn URL" value={form.socialLinks?.linkedin || ''} onChange={(e) => handleSocialLinksChange('linkedin', e.target.value)} />
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Registrations</h3>
                <div className="form-row form-row-3">
                  <div className="fg"><label>GSTIN Number</label>
                    <input className="fi" placeholder="GSTIN" value={form.gstin || ''} onChange={(e) => setForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="fg"><label>PAN Number</label>
                    <input className="fi" placeholder="PAN" maxLength={10} value={form.pan || ''} onChange={(e) => setForm(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="fg"><label>Shop Registration Number</label>
                    <input className="fi" placeholder="Registration number" value={form.regNumber || ''} onChange={(e) => setForm(prev => ({ ...prev, regNumber: e.target.value }))} />
                  </div>
                </div>
                {['Food/Restaurant', 'Grocery'].includes(form.shopType) && (
                  <div className="fg" style={{ maxWidth: '33%', marginTop: '8px' }}><label>FSSAI License Number</label>
                    <input className="fi" placeholder="FSSAI number (14 digits)" maxLength={14} value={form.fssai || ''} onChange={(e) => setForm(prev => ({ ...prev, fssai: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                )}

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Shop Address</h3>
                <div className="form-row">
                  <div className="fg"><label>Address Line 1</label>
                    <input className="fi" placeholder="Building, Street, Lane" value={form.addressLine1 || ''} onChange={(e) => setForm(prev => ({ ...prev, addressLine1: e.target.value }))} />
                  </div>
                  <div className="fg"><label>Address Line 2</label>
                    <input className="fi" placeholder="Locality, Landmark" value={form.addressLine2 || ''} onChange={(e) => setForm(prev => ({ ...prev, addressLine2: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="fg"><label>City</label>
                    <input className="fi" placeholder="City" value={form.city || ''} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} />
                  </div>
                  <div className="fg"><label>State</label>
                    <input className="fi" placeholder="State" value={form.state || ''} onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))} />
                  </div>
                  <div className="fg"><label>PIN Code</label>
                    <input className="fi" placeholder="PIN" value={form.pincode || ''} onChange={(e) => setForm(prev => ({ ...prev, pincode: e.target.value }))} />
                  </div>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Branding</h3>
                <div className="fg"><label>Shop Logo</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                    {form.logo && <img src={form.logo} alt="Logo Preview" style={{ maxHeight: '50px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                  </div>
                </div>
              </>
            )}

            {tab === 'local' && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Regional & Platform Settings</h3>
                <div className="form-row">
                  <div className="fg"><label>Financial Year Settings</label>
                    <select className="fi" value={form.financialYear || 'Apr-Mar'} onChange={(e) => setForm(prev => ({ ...prev, financialYear: e.target.value }))}>
                      <option value="Apr-Mar">April - March</option>
                      <option value="Jan-Dec">January - December</option>
                    </select>
                  </div>
                  <div className="fg"><label>Working Hours Configuration</label>
                    <input className="fi" placeholder="e.g. 09:00 - 21:00" value={form.workingHours || ''} onChange={(e) => setForm(prev => ({ ...prev, workingHours: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Time Zone Settings</label>
                    <select className="fi" value={form.timezone || 'UTC+05:30'} onChange={(e) => setForm(prev => ({ ...prev, timezone: e.target.value }))}>
                      <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                      <option value="UTC+00:00">UTC+00:00 (GMT)</option>
                      <option value="UTC-05:00">UTC-05:00 (Eastern Time)</option>
                      <option value="UTC+08:00">UTC+08:00 (Singapore/China)</option>
                    </select>
                  </div>
                  <div className="fg"><label>Base Currency</label>
                    <select className="fi" value={form.currency || 'INR (₹)'} onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}>
                      <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                      <option value="USD ($)">USD ($) - US Dollar</option>
                      <option value="EUR (€)">EUR (€) - Euro</option>
                      <option value="GBP (£)">GBP (£) - British Pound</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Date Format Settings</label>
                    <select className="fi" value={form.dateFormat || 'DD-MM-YYYY'} onChange={(e) => setForm(prev => ({ ...prev, dateFormat: e.target.value }))}>
                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>
                  <div className="fg"><label>Language Settings</label>
                    <select className="fi" value={form.language || 'English'} onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      <option value="Marathi">Marathi (मરાठी)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {tab === 'branches' && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Branches & Warehouses/Godowns Locations Management</h3>
                <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '16px', fontSize: '13px', color: '#3b82f6' }}>
                  <i className="fas fa-info-circle"></i> <strong>Note:</strong> Locations added here will automatically populate warehouse selection lists across the application (product catalog, sales checkout, purchases, stock reconciliation, and transfers).
                </div>
                <div className="form-row">
                  <div className="fg" style={{ flex: 1 }}><label>Location Name</label>
                    <input className="fi" placeholder="e.g. South Branch or Godown C" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} />
                  </div>
                  <div className="fg" style={{ flex: 2 }}><label>Address</label>
                    <input className="fi" placeholder="Full address" value={newBranchAddress} onChange={(e) => setNewBranchAddress(e.target.value)} />
                  </div>
                  <div className="fg" style={{ flex: 'none', alignSelf: 'flex-end' }}>
                    <button type="button" className="btn btn--secondary" onClick={addBranch}><i className="fas fa-plus"></i> Add Location</button>
                  </div>
                </div>
                {form.branches && form.branches.length > 0 && (
                  <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    {form.branches.map((b, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < form.branches.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{b.address}</div>
                        </div>
                        <button type="button" className="btn--icon" onClick={() => removeBranch(idx)}><i className="fas fa-trash" style={{ color: 'var(--red)' }}></i></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'bank' && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Bank Account Details</h3>
                <div className="form-row">
                  <div className="fg"><label>Bank Account Name</label>
                    <input className="fi" placeholder="Account Name" value={form.bankDetails?.accountName || ''} onChange={(e) => handleBankDetailsChange('accountName', e.target.value)} />
                  </div>
                  <div className="fg"><label>Bank Account Number</label>
                    <input className="fi" placeholder="Account Number" value={form.bankDetails?.accountNumber || ''} onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Bank Name</label>
                    <input className="fi" placeholder="Bank Name" value={form.bankDetails?.bankName || ''} onChange={(e) => handleBankDetailsChange('bankName', e.target.value)} />
                  </div>
                  <div className="fg"><label>IFSC Code</label>
                    <input className="fi" placeholder="IFSC Code (11 characters)" maxLength={11} value={form.bankDetails?.ifscCode || ''} onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="fg" style={{ marginTop: '12px' }}><label>UPI ID Configuration</label>
                  <input className="fi" placeholder="e.g. name@upi" value={form.upiId || ''} onChange={(e) => setForm(prev => ({ ...prev, upiId: e.target.value }))} />
                </div>
              </>
            )}

            {tab === 'printing' && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px' }}>Invoice Configuration</h3>
                <div className="form-row">
                  <div className="fg"><label>Invoice Prefix (e.g. INV, BILL, GST)</label>
                    <input className="fi" value={form.invoicePrefix || ''} onChange={(e) => setForm(prev => ({ ...prev, invoicePrefix: e.target.value }))} />
                  </div>
                  <div className="fg"><label>Invoice Starting Number</label>
                    <input type="number" className="fi" value={form.invoiceStartNumber || '1'} onChange={(e) => setForm(prev => ({ ...prev, invoiceStartNumber: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg"><label>Print Type</label>
                    <select className="fi" value={form.printType || 'A4'} onChange={(e) => setForm(prev => ({ ...prev, printType: e.target.value }))}>
                      <option value="A4">A4</option>
                      <option value="Thermal">Thermal</option>
                    </select>
                  </div>
                  <div className="fg" style={{ opacity: 0 }}><label>Spacer</label><div /></div>
                </div>
                <div className="fg"><label>Default Terms & Conditions (Invoice Footer)</label>
                  <textarea className="fi" rows={3} value={form.termsAndConditions || ''} onChange={(e) => setForm(prev => ({ ...prev, termsAndConditions: e.target.value }))} />
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '12px', marginTop: '20px' }}>Uploads & Branding</h3>
                <div className="form-row">
                  <div className="fg">
                    <label>Digital Signature</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} />
                      {form.digitalSignature && <img src={form.digitalSignature} alt="Signature Preview" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                    </div>
                  </div>
                  <div className="fg">
                    <label>Shop Stamp / Seal</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <input type="file" accept="image/*" onChange={handleStampUpload} />
                      {form.shopStamp && <img src={form.shopStamp} alt="Stamp Preview" style={{ maxHeight: '40px', borderRadius: '4px', border: '1px solid var(--border)' }} />}
                    </div>
                  </div>
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
