import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Onboarding() {
  const { user, dbData, saveDB, updateUser, setCurrentView, handleLogout, token } = useApp();
  const [form, setForm] = useState({});
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  useEffect(() => {
    setForm({ ...(dbData.settings || {}) });
  }, [dbData.settings]);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch('/api/super/plans');
        if (res.ok) setPlans(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadPlans();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const updated = { ...dbData, settings: { ...dbData.settings, ...form } };
      await saveDB(updated);
      setProfileSaved(true);
      alert('Profile saved');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const addBranch = () => {
    const name = (form.newBranchName || '').trim();
    const address = (form.newBranchAddress || '').trim();
    if (!name || !address) return alert('Enter branch name and address');
    const branches = (form.branches || []).concat({ name, address });
    setForm(prev => ({ ...prev, branches, newBranchName: '', newBranchAddress: '' }));
  };

  const removeBranch = (idx) => {
    const branches = (form.branches || []).filter((_, i) => i !== idx);
    setForm(prev => ({ ...prev, branches }));
  };

  const handleBack = () => {
    console.log('Onboarding: back pressed');
    // Force show login: prefer logout if available, otherwise set view to login
    if (handleLogout) {
      handleLogout();
      return;
    }
    if (setCurrentView) setCurrentView('login');
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return alert('Choose a plan');
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, planName: selectedPlan })
      });
      if (res.ok) {
        const j = await res.json();
        // Update local user and continue
        updateUser({ onboardingRequired: false, subscription: j.subscription || { active: true, expiry: (j.subscription && j.subscription.expiry) || null } });
        alert('Subscription activated');
        setCurrentView('dashboard');
      } else {
        const err = await res.json();
        alert(err.message || 'Subscription failed');
      }
    } catch (err) {
      console.error(err);
      alert('Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view active" id="view-onboarding">
      <div className="sec-header" style={{ position: 'relative', paddingLeft: 72, paddingTop: 12, minHeight: 64 }}>
        <button
          type="button"
          className="btn btn--sm"
          style={{ position: 'absolute', left: 16, top: 16, zIndex: 60, cursor: 'pointer', touchAction: 'manipulation' }}
          onClick={handleBack}
          onTouchStart={handleBack}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBack(); }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Business Profile</h2>
        <p>Complete your business details and choose a subscription plan to continue.</p>
      </div>

      <div className="two-col" style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <div className="card" style={{ padding: 12 }}>
          <div className="card__head" style={{ borderLeft: '6px solid #4f46e5', paddingLeft: 10 }}><span>Business Profile</span></div>
          <div style={{ paddingTop: 8 }}>
            <div className="fg"><label>Business Name</label>
              <input className="fi" value={form.bizName || ''} onChange={e=>setForm(prev=>({...prev, bizName: e.target.value}))} />
            </div>
            <div className="fg"><label>Owner Name</label>
              <input className="fi" value={form.ownerName || ''} onChange={e=>setForm(prev=>({...prev, ownerName: e.target.value}))} />
            </div>
            <div className="fg"><label>Email <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="fi" value={form.email || ''} onChange={e=>{ setForm(prev=>({...prev, email: e.target.value})); setEmailVerified(false); }} />
                <button className="btn" onClick={async ()=>{
                  if (!form.email) return alert('Enter email');
                  const res = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, field: 'email', value: form.email }) });
                  if (res.ok) alert('OTP sent (logged to server in dev).'); else alert('Failed to send OTP');
                }} style={{ whiteSpace: 'nowrap' }}>Send OTP</button>
              </div>
              {!emailVerified && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <input className="fi" placeholder="Enter email OTP" value={emailOtp} onChange={e=>setEmailOtp(e.target.value)} />
                  <button className="btn" onClick={async ()=>{
                    if (!emailOtp) return alert('Enter OTP');
                    const res = await fetch('/api/verify-otp', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, field: 'email', code: emailOtp }) });
                    const j = await res.json();
                    if (res.ok) { setEmailVerified(true); alert('Email verified'); } else alert(j.message || 'Verification failed');
                  }}>Verify</button>
                </div>
              )}
              {emailVerified && <div style={{ color: 'green', marginTop: 8 }}>Email verified ✓</div>}
            </div>
            <div className="fg"><label>Phone <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="fi" value={form.phone || ''} onChange={e=>{ setForm(prev=>({...prev, phone: e.target.value})); setPhoneVerified(false); }} />
                <button className="btn" onClick={async ()=>{
                  if (!form.phone) return alert('Enter phone');
                  const res = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, field: 'phone', value: form.phone }) });
                  if (res.ok) alert('OTP sent (logged to server in dev).'); else alert('Failed to send OTP');
                }} style={{ whiteSpace: 'nowrap' }}>Send OTP</button>
              </div>
              {!phoneVerified && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <input className="fi" placeholder="Enter phone OTP" value={phoneOtp} onChange={e=>setPhoneOtp(e.target.value)} />
                  <button className="btn" onClick={async ()=>{
                    if (!phoneOtp) return alert('Enter OTP');
                    const res = await fetch('/api/verify-otp', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: user.username, field: 'phone', code: phoneOtp }) });
                    const j = await res.json();
                    if (res.ok) { setPhoneVerified(true); alert('Phone verified'); } else alert(j.message || 'Verification failed');
                  }}>Verify</button>
                </div>
              )}
              {phoneVerified && <div style={{ color: 'green', marginTop: 8 }}>Phone verified ✓</div>}
            </div>

            <div className="fg"><label>GSTIN <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="fi" value={form.gstin || ''} onChange={e=>{ setForm(prev=>({...prev, gstin: e.target.value})); setGstVerified(false); }} />
                <button className="btn" onClick={async () => {
                  const g = (form.gstin || '').trim().toUpperCase();
                  if (!g) return alert('Enter GSTIN');
                  try {
                    const res = await fetch('/api/verify-gstin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gstin: g }) });
                    const j = await res.json();
                    if (res.ok) {
                      setGstVerified(true);
                      if (j.authoritative) alert('GST verified with external provider'); else alert('GST format valid (no external provider configured)');
                    } else {
                      alert(j.message || 'GST verification failed');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('GST verification failed');
                  }
                }}>Verify GSTIN</button>
              </div>
              {gstVerified && <div style={{ color: 'green', marginTop: 8 }}>GSTIN format valid ✓</div>}
            </div>

            <div className="fg"><label>Invoice Prefix</label>
              <input className="fi" value={form.invoicePrefix || ''} onChange={e=>setForm(prev=>({...prev, invoicePrefix: e.target.value}))} />
            </div>

            <div className="fg"><label>Print Type</label>
              <select className="fi" value={form.printType || 'A4'} onChange={e=>setForm(prev=>({...prev, printType: e.target.value}))}>
                <option value="A4">A4</option>
                <option value="Thermal">Thermal</option>
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}><strong>Branches</strong></div>
              {(form.branches || []).map((b, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{b.name}</div><div style={{ color: '#94a3b8' }}>{b.address}</div></div>
                  <div><button className="btn" onClick={() => removeBranch(idx)}>Remove</button></div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input className="fi" placeholder="Branch name" value={form.newBranchName || ''} onChange={e=>setForm(prev=>({...prev, newBranchName: e.target.value}))} />
                <input className="fi" placeholder="Branch address" value={form.newBranchAddress || ''} onChange={e=>setForm(prev=>({...prev, newBranchAddress: e.target.value}))} />
                <button className="btn" onClick={addBranch}>Add</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn btn--primary" onClick={handleSaveProfile} disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="card__head" style={{ borderLeft: '6px solid #059669', paddingLeft: 10 }}><span>Choose a Plan</span></div>
          <div style={{ paddingTop: 8 }}>
            {plans.length ? plans.map(p => (
              <div key={p._id} className={`plan-row ${selectedPlan === p.name ? 'selected' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.name} <span style={{ fontSize: 12, color: '#94a3b8' }}>({p.cycle})</span></div>
                  <div style={{ color: '#94a3b8' }}>{p.features}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>₹{p.price}</div>
                  <div style={{ marginTop: 8 }}>
                    <button className={selectedPlan === p.name ? 'btn btn--primary' : 'btn btn--sm'} onClick={() => setSelectedPlan(p.name)}>{selectedPlan === p.name ? 'Selected' : 'Select'}</button>
                  </div>
                </div>
              </div>
            )) : <div>Loading plans...</div>}

            <div style={{ marginTop: 12 }}>
              <button className="btn btn--primary" onClick={handleSubscribe} disabled={loading || !profileSaved || !selectedPlan}>{loading ? 'Processing...' : (!profileSaved ? 'Save profile first' : 'Activate & Continue')}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
