import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Subscription() {
  const { user, updateUser, dbData } = useApp();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [refundRequests, setRefundRequests] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({ paymentId: '', amount: '', reason: '' });
  
  // Coupon and Pricing Calculations
  const [couponInput, setCouponInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const [infoRes, plansRes, paymentsRes, requestsRes] = await Promise.all([
        fetch(`/api/super/subscription-info?username=${encodeURIComponent(user.username)}`),
        fetch('/api/super/plans'),
        fetch(`/api/user/payments?username=${encodeURIComponent(user.username)}`),
        fetch(`/api/user/refund-requests?username=${encodeURIComponent(user.username)}`)
      ]);

      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setInfo(infoData);
        setAutoRenew(!!infoData.autoRenew || (dbData.settings && !!dbData.settings.autoRenew));
      }
      if (plansRes.ok) {
        setPlans(await plansRes.json());
      }
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }
      if (requestsRes.ok) {
        setRefundRequests(await requestsRes.json());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load subscription metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getDaysRemaining = (expiryStr) => {
    if (!expiryStr) return 0;
    const expiry = new Date(expiryStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleToggleAutoRenew = async (newVal) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, autoRenew: newVal })
      });
      if (res.ok) {
        setAutoRenew(newVal);
        setSuccessMsg(`Auto-renew has been turned ${newVal ? 'ON' : 'OFF'}.`);
      } else {
        setErrorMsg('Failed to toggle auto-renew settings.');
      }
    } catch (err) {
      setErrorMsg('Network error updating auto-renew settings.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!selectedPlan) {
      setErrorMsg('Please select a plan before applying a coupon.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          username: user.username,
          planName: selectedPlan.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDiscount(data.discount);
        setAppliedCoupon(data.coupon);
        setSuccessMsg(`Coupon '${data.coupon}' applied! Discount: ₹${data.discount}`);
      } else {
        setErrorMsg(data.message || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setErrorMsg('Network error applying coupon code.');
    }
  };

  const handleClearCoupon = () => {
    setCouponInput('');
    setDiscount(0);
    setAppliedCoupon('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentMethod('UPI');
    handleClearCoupon();
  };

  const handlePayAndActivate = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          planName: selectedPlan.name,
          coupon: appliedCoupon,
          paymentMethod
        })
      });
      if (res.ok) {
        const j = await res.json();
        setSuccessMsg(`Congratulations! The ${selectedPlan.name} Plan is active.`);
        // Refresh component
        await loadData();
        // Update user state context
        if (updateUser) {
          updateUser({
            onboardingRequired: false,
            subscription: j.subscription || { active: true, expiry: j.subscriptionExpiry || null }
          });
        }
        setSelectedPlan(null);
        handleClearCoupon();
      } else {
        const e = await res.json();
        setErrorMsg(e.message || 'Activation failed.');
      }
    } catch (err) {
      setErrorMsg('Network error processing checkout.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewCurrentPlan = async () => {
    if (!info || !info.planName) return;
    if (!await window.confirm(`Are you sure you want to renew your current ${info.planName} plan for another cycle?`)) return;
    
    // Find price from existing plans, default to 499 if starter / fallback
    const matchedPlan = plans.find(p => p.name === info.planName);
    const price = matchedPlan ? matchedPlan.price : 499;
    const daysToAdd = info.planCycle === 'YEARLY' ? 365 : 30;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          amount: price,
          days: daysToAdd,
          method: 'Online Payment',
          note: `Self-renewal for ${info.planName}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Subscription successfully extended! New Expiry: ${data.subscriptionExpiry}`);
        await loadData();
      } else {
        setErrorMsg('Failed to renew subscription.');
      }
    } catch (err) {
      setErrorMsg('Network error executing renewal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!info || !info.active) return;
    if (!await window.confirm('⚠️ WARNING: Are you sure you want to cancel your subscription? You will lose access to billing and synchronization features immediately.')) return;
    
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/super/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      if (res.ok) {
        setSuccessMsg('Subscription has been successfully cancelled.');
        await loadData();
        // Update user state context
        if (updateUser) {
          updateUser({
            onboardingRequired: true,
            subscription: { active: false, expiry: null }
          });
        }
      } else {
        setErrorMsg('Failed to cancel subscription.');
      }
    } catch (err) {
      setErrorMsg('Network error executing cancellation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundForm.reason.trim()) {
      setErrorMsg('Please provide a reason for the refund.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/user/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: refundForm.paymentId,
          amount: Number(refundForm.amount),
          reason: refundForm.reason,
          username: user.username
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Refund request submitted successfully!');
        setShowRefundModal(false);
        await loadData();
      } else {
        setErrorMsg(data.message || 'Failed to submit refund request.');
      }
    } catch (err) {
      setErrorMsg('Network error submitting refund request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintReceipt = (p) => {
    const totalAmount = parseFloat(p.amount) || 0;
    const basePrice = totalAmount / 1.18;
    const totalGst = totalAmount - basePrice;
    const providerState = "Karnataka"; 
    const tenantState = (dbData.settings && dbData.settings.state) || "Karnataka";
    const isIntrastate = (tenantState || "").toLowerCase() === providerState.toLowerCase();

    let gstBreakdown = "";
    if (isIntrastate) {
      const cgst = totalGst / 2;
      const sgst = totalGst / 2;
      gstBreakdown = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-weight: 500;">
           <span>CGST (9%):</span>
           <span>₹${cgst.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight: 500;">
           <span>SGST (9%):</span>
           <span>₹${sgst.toFixed(2)}</span>
        </div>
      `;
    } else {
      gstBreakdown = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-weight: 500;">
           <span>IGST (18%):</span>
           <span>₹${totalGst.toFixed(2)}</span>
        </div>
      `;
    }

    const invoiceNo = `VYP-SUB-${String(p._id || '').substring(0, 8).toUpperCase()}`;

    const htmlContent = `
      <div style="font-family:'Inter', sans-serif; padding:20px; color:#1e293b; max-width:800px; margin:0 auto; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.02);">
         <!-- Header -->
         <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:15px; margin-bottom:20px;">
            <div>
               <div style="font-size:24px; font-weight:800; color:#10b981; font-family:'Outfit', sans-serif;">
                  <i class="fas fa-cube" style="margin-right:8px;"></i>VYAPAR
               </div>
               <div style="font-size:11px; color:#64748b; margin-top:4px;">Simple Billing, Smart Business</div>
            </div>
            <div style="text-align:right;">
               <div style="font-size:20px; font-weight:700; color:#1e293b;">SUBSCRIPTION RECEIPT</div>
               <div style="font-size:12px; color:#64748b; margin-top:2px;">Tax Invoice</div>
            </div>
         </div>

         <!-- Address Grid -->
         <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:25px; font-size:12px; line-height:1.5;">
            <!-- Provider Info -->
            <div>
               <div style="font-weight:700; color:#475569; text-transform:uppercase; font-size:10px; letter-spacing:0.5px; margin-bottom:6px;">Billed By</div>
               <div style="font-weight:700; color:#0f172a; font-size:14px; margin-bottom:4px;">Vyapar Cloud Solutions Pvt. Ltd.</div>
               <div style="color:#475569;">
                  123 Tech Hub, Sector V, HSR Layout<br>
                  Bangalore, Karnataka - 560102<br>
                  <strong>GSTIN:</strong> 29AABCU9603R1ZM<br>
                  <strong>Email:</strong> billing@vyapar.com
               </div>
            </div>
            <!-- Customer Info -->
            <div>
               <div style="font-weight:700; color:#475569; text-transform:uppercase; font-size:10px; letter-spacing:0.5px; margin-bottom:6px;">Billed To</div>
               <div style="font-weight:700; color:#0f172a; font-size:14px; margin-bottom:4px;">${(dbData.settings && dbData.settings.bizName) || 'Valued Partner'}</div>
               <div style="color:#475569;">
                  ${(dbData.settings && dbData.settings.addressLine1) || 'Address not updated'}<br>
                  ${(dbData.settings && dbData.settings.city) || ''}${(dbData.settings && dbData.settings.city && dbData.settings.state) ? ', ' : ''}${(dbData.settings && dbData.settings.state) || ''} ${(dbData.settings && dbData.settings.pincode) || ''}<br>
                  <strong>GSTIN:</strong> ${(dbData.settings && dbData.settings.gstin) || 'N/A'}<br>
                  <strong>Email:</strong> ${(dbData.settings && dbData.settings.email) || user.username}
               </div>
            </div>
         </div>

         <!-- Metadata Box -->
         <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:25px; font-size:12px;">
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Receipt Number</div>
               <div style="font-weight:700; color:#1e293b;">${invoiceNo}</div>
            </div>
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Payment Date</div>
               <div style="font-weight:700; color:#1e293b;">${p.date}</div>
            </div>
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Method / Reference</div>
               <div style="font-weight:700; color:#1e293b;">${p.method || 'Online'}</div>
            </div>
         </div>

         <!-- Details Table -->
         <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px; margin-bottom:25px;">
            <thead>
               <tr style="border-bottom:2px solid #e2e8f0; color:#475569; font-weight:700;">
                  <th style="padding:10px 0;">Description</th>
                  <th style="padding:10px 0; text-align:right;">Billing Period</th>
                  <th style="padding:10px 0; text-align:right;">Subtotal</th>
               </tr>
            </thead>
            <tbody>
               <tr style="border-bottom:1px solid #e2e8f0; color:#0f172a;">
                  <td style="padding:12px 0;">
                     <strong style="font-size:13px; color:#1e293b;">Vyapar Premium Plan - ${p.plan_name || 'SaaS Plan'}</strong>
                     <div style="font-size:11px; color:#64748b; margin-top:4px;">Full Platform Access License key</div>
                  </td>
                  <td style="padding:12px 0; text-align:right;">${p.cycle || 'Monthly'}</td>
                  <td style="padding:12px 0; text-align:right; font-weight:600;">₹${basePrice.toFixed(2)}</td>
               </tr>
            </tbody>
         </table>

         <!-- Calculation Summary -->
         <div style="display:flex; justify-content:flex-end; font-size:12px;">
            <div style="width:250px;">
               <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#64748b;">
                  <span>Subtotal (Excl. Tax):</span>
                  <span>₹${basePrice.toFixed(2)}</span>
               </div>
               ${gstBreakdown}
               <div style="display:flex; justify-content:space-between; border-top:2px solid #e2e8f0; padding-top:8px; font-weight:800; font-size:14px; color:#0f172a;">
                  <span>Total Paid:</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
               </div>
            </div>
         </div>

         <!-- Footer note -->
         <div style="margin-top:40px; border-top:1px solid #e2e8f0; padding-top:15px; text-align:center; font-size:10px; color:#94a3b8;">
            This is a computer-generated tax receipt. No physical signature is required. For support, reach out to billing@vyapar.com
         </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Vyapar Subscription Receipt - ${p._id}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: #fff; color: #333; margin: 0; padding: 40px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '36px', color: '#4f46e5' }}></i>
      </div>
    );
  }

  const daysRemaining = info ? getDaysRemaining(info.subscriptionExpiry) : 0;
  const planCycle = info ? info.planCycle : 'MONTHLY';
  const totalDays = planCycle === 'YEARLY' ? 365 : 30;
  const meterPercent = Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100));

  // Determine progress color
  const progressColor = daysRemaining > 15 ? '#10b981' : daysRemaining > 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-content" style={{ padding: '24px 30px', fontFamily: "'Outfit', sans-serif" }}>
      {/* Toast Alert Messages */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#10b981', color: 'white', padding: '12px 24px',
          borderRadius: '10px', boxShadow: '0 4px 12px rgba(16,185,129,0.15)',
          fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className="fas fa-check-circle"></i>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#ef4444', color: 'white', padding: '12px 24px',
          borderRadius: '10px', boxShadow: '0 4px 12px rgba(239,68,68,0.15)',
          fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <i className="fas fa-exclamation-circle"></i>
          {errorMsg}
        </div>
      )}

      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-1)' }}>Subscription Management</h2>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '4px' }}>Review licensing terms, change plan tiers, and manage automatic renewals.</p>
      </header>

      {/* Plans Pricing Grid */}
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>SaaS Plan Deck</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {plans.map(p => {
            const isCurrent = info?.planName === p.name;
            const isSelected = selectedPlan?.name === p.name;
            return (
              <div 
                key={p._id}
                className="card card--lift"
                style={{
                  display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px',
                  border: isSelected ? '2px solid #4f46e5' : isCurrent ? '2px solid #10b981' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(79, 70, 229, 0.01)' : '#ffffff',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {p.isFeatured && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '-35px',
                    background: '#f59e0b', color: '#fff', fontSize: '10px',
                    fontWeight: 'bold', padding: '4px 40px', transform: 'rotate(45deg)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    POPULAR
                  </div>
                )}

                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-1)' }}>{p.name}</h4>
                <p style={{ margin: '4px 0 16px 0', fontSize: '12px', color: 'var(--text-3)' }}>{p.description}</p>
                
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-1)' }}>₹{p.price}</span>
                  <span style={{ color: 'var(--text-3)', fontSize: '13px' }}> / {p.cycle === 'YEARLY' ? 'year' : 'month'}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', flexGrow: 1 }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-2)' }}>
                    {(p.features || '').split(',').map((feat, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-check" style={{ color: '#10b981', fontSize: '10px' }}></i>
                        {feat.trim()}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: '24px' }}>
                  {isCurrent ? (
                    <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '13.5px', padding: '10px' }}>
                      <i className="fas fa-circle-check" style={{ marginRight: '6px' }}></i>
                      Your Active Plan
                    </div>
                  ) : (
                    <button 
                      className={`btn ${isSelected ? 'btn--primary' : 'btn--outline'}`} 
                      style={{ width: '100%' }}
                      onClick={() => handleSelectPlan(p)}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Grid Layout: Current Plan Summary & Auto-Renew */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Current Plan Summary Card */}
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', color: '#ffffff', border: 'none', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: '700' }}>Active License</span>
              <h3 style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0 0 0', fontFamily: "'Outfit', sans-serif" }}>
                {info?.planName || 'Free Trial'} Plan
              </h3>
            </div>
            <span style={{
              background: info?.active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              color: info?.active ? '#34d399' : '#f87171',
              padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <i className={info?.active ? 'fas fa-check-circle' : 'fas fa-triangle-exclamation'} style={{ marginRight: '6px' }}></i>
              {info?.active ? 'Active' : 'Expired'}
            </span>
          </div>

          <div style={{ margin: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Remaining Duration: <b>{daysRemaining} Days Left</b></span>
              <span>{Math.round(meterPercent)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${meterPercent}%`, height: '100%', background: progressColor, borderRadius: '10px', transition: 'width 0.5s' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
            <div>
              <span style={{ opacity: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Expiration Date</span>
              <strong style={{ fontSize: '14px' }}>{info?.subscriptionExpiry || '—'}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.75, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Billing Cycle</span>
              <strong style={{ fontSize: '14px' }}>{info?.planCycle || 'MONTHLY'}</strong>
            </div>
          </div>
        </div>

        {/* Action Panel: Quick Renew & Auto-Renew settings */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0' }}>Licensing Actions</h4>
            <p style={{ color: 'var(--text-3)', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Extend your license immediately or toggle automatic credit card charge cycles for uninterrupted backend syncing.
            </p>

            {/* Auto-Renew slide switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <button 
                onClick={() => handleToggleAutoRenew(!autoRenew)}
                style={{
                  position: 'relative',
                  width: '50px',
                  height: '26px',
                  borderRadius: '20px',
                  background: autoRenew ? '#10b981' : '#cbd5e1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  padding: '2px',
                  flexShrink: 0
                }}
                disabled={actionLoading}
              >
                <div 
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'transform 0.3s',
                    transform: autoRenew ? 'translateX(24px)' : 'translateX(0px)'
                  }}
                />
              </button>
              <div>
                <span style={{ fontWeight: '700', fontSize: '14px', display: 'block', color: 'var(--text-1)' }}>
                  Auto-Renewal: {autoRenew ? 'ON' : 'OFF'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Charge platform fee automatically.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <button 
              className="btn btn--primary" 
              style={{ width: '100%', padding: '12px' }} 
              onClick={handleRenewCurrentPlan}
              disabled={actionLoading || !info?.planName}
            >
              <i className="fas fa-arrows-rotate" style={{ marginRight: '8px' }}></i>
              Renew Current Plan (₹{(plans.find(p => p.name === info?.planName)?.price) || 499})
            </button>
            
            <button 
              className="btn btn--outline" 
              style={{ width: '100%', padding: '10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} 
              onClick={handleCancelSubscription}
              disabled={actionLoading || !info?.active}
            >
              <i className="fas fa-ban" style={{ marginRight: '8px' }}></i>
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Summary Modal */}
      {selectedPlan && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 999 }} onClick={() => handleSelectPlan(null)}></div>
          <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '640px', width: '90%' }}>
            <div className="modal__top">
              <h3>Confirm Subscription Plan</h3>
              <button className="btn--icon" onClick={() => handleSelectPlan(null)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', color: 'var(--text-2)' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '500' }}>Upgrading to:</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700' }}>{selectedPlan.name} Plan</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '500' }}>Billing Duration:</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>{selectedPlan.cycle === 'YEARLY' ? '1 Year (365 Days)' : '1 Month (30 Days)'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '500' }}>Plan Base Price:</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>₹{(selectedPlan.price / 1.18).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0', fontWeight: '500' }}>GST Tax (18% Included):</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>₹{(selectedPlan.price - (selectedPlan.price / 1.18)).toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--border)', color: '#10b981' }}>
                        <td style={{ padding: '10px 0', fontWeight: '500' }}>Coupon Discount Applied:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700' }}>-₹{discount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr style={{ color: 'var(--text-1)', fontSize: '16px' }}>
                      <td style={{ padding: '12px 0 0 0', fontWeight: '800' }}>Total Checkout Amount:</td>
                      <td style={{ padding: '12px 0 0 0', textAlign: 'right', fontWeight: '800' }}>
                        ₹{(selectedPlan.price - discount).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
                    PROMOTIONAL COUPON
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      className="fi" 
                      placeholder="ENTER PROMO CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      style={{ letterSpacing: '1px', fontWeight: 'bold' }}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <button className="btn btn--outline" onClick={handleClearCoupon} style={{ color: 'var(--red)' }}>Clear</button>
                    ) : (
                      <button className="btn" onClick={handleApplyCoupon} disabled={!couponInput}>Apply</button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
                    PAYMENT METHOD
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['UPI', 'Card', 'Net Banking'].map(method => (
                      <button
                        key={method}
                        type="button"
                        className={`btn ${paymentMethod === method ? 'btn--primary' : 'btn--outline'}`}
                        style={{ flex: 1, padding: '8px 4px', fontSize: '12px', transition: 'all 0.2s ease' }}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method === 'UPI' ? '📱 UPI' : method === 'Card' ? '💳 Card' : '🏦 Net Banking'}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic payment form depending on paymentMethod */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    {paymentMethod === 'Card' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 91, 255, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 91, 255, 0.15)', fontSize: '11px', color: '#635bff', fontWeight: 600 }}>
                          <i className="fab fa-stripe" style={{ fontSize: '18px' }}></i>
                          <span>Stripe Sandbox Simulator</span>
                        </div>
                        <div className="fg">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>Card Email</label>
                          <input type="email" className="fi" placeholder="billing@company.com" required defaultValue={user?.email || 'billing@company.com'} style={{ fontSize: '12px', padding: '8px', background: 'var(--bg-input)' }} />
                        </div>
                        <div className="fg">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>Card Details</label>
                          <input className="fi" placeholder="4242 4242 4242 4242" required maxLength={19} defaultValue="4242 4242 4242 4242" style={{ fontSize: '12px', padding: '8px', background: 'var(--bg-input)' }} />
                          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <input className="fi" placeholder="MM / YY" required maxLength={5} style={{ width: '80px', fontSize: '12px', padding: '8px', background: 'var(--bg-input)' }} defaultValue="12/29" />
                            <input className="fi" placeholder="CVC" required maxLength={3} style={{ width: '80px', fontSize: '12px', padding: '8px', background: 'var(--bg-input)' }} defaultValue="123" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'UPI' && (
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', textAlign: 'left', background: 'var(--bg-input)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=billing@vyapar&pn=Vyapar%20Licensing&am=${Math.round(selectedPlan.price - discount)}&cu=INR`)}`}
                          alt="UPI QR Code" 
                          style={{ width: '100px', height: '100px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff' }}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(51, 151, 226, 0.08)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(51, 151, 226, 0.15)', fontSize: '10px', color: '#3397e2', fontWeight: 600, width: 'fit-content' }}>
                            <i className="fas fa-credit-card"></i>
                            <span>Razorpay UPI Sandbox</span>
                          </div>
                          <strong style={{ fontSize: '13px', color: 'var(--text-1)' }}>Scan to Pay with UPI App</strong>
                          <span>Amount: <b>₹{(selectedPlan.price - discount).toFixed(2)}</b></span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>VPA: billing@vyapar</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'Net Banking' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.15)', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          <i className="fas fa-building-columns"></i>
                          <span>Net Banking Gateway</span>
                        </div>
                        <div className="fg">
                          <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '4px' }}>Select Bank</label>
                          <select className="fi" style={{ fontSize: '12px', padding: '8px', background: 'var(--bg-input)' }} defaultValue="SBI">
                            <option value="SBI">State Bank of India</option>
                            <option value="HDFC">HDFC Bank</option>
                            <option value="ICICI">ICICI Bank</option>
                            <option value="AXIS">Axis Bank</option>
                            <option value="KOTAK">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                    <i className="fas fa-circle-info" style={{ color: '#4f46e5' }}></i>
                    <span>After payment, the plan will be activated.</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => handleSelectPlan(null)}>Cancel</button>
                <button 
                  className="btn btn--primary" 
                  style={{ flex: 2 }} 
                  onClick={handlePayAndActivate}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Activating...' : 'Pay & Activate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment History Log */}
      <section>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Billing History & Receipts</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt Date</th>
                <th>Receipt Invoice No</th>
                <th>License Description</th>
                <th>Cycle</th>
                <th>Amount Paid</th>
                <th>Method</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>
                    No payment history recorded.
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  const request = refundRequests.find(r => r.paymentId === String(p._id));
                  let payDate = p.createdAt ? new Date(p.createdAt) : new Date(p.date);
                  const diffTime = Math.abs(new Date() - payDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isEligible = diffDays <= 30 && p.refund_status !== 'refunded';
                  
                  return (
                    <tr key={p._id}>
                      <td style={{ fontWeight: '500' }}>{p.date}</td>
                      <td>VYP-SUB-{String(p._id).substring(0, 8).toUpperCase()}</td>
                      <td><strong style={{ color: 'var(--text-1)' }}>{p.plan_name || 'Renewal'}</strong> Plan</td>
                      <td>{p.cycle || 'Monthly'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--text-1)' }}>
                        ₹{(parseFloat(p.amount) || 0).toLocaleString()}
                        {p.refund_status === 'refunded' && (
                          <span style={{ fontSize: '10px', color: '#ef4444', display: 'block', fontWeight: '500' }}>
                            (Refunded: ₹{p.refunded_amount || p.amount})
                          </span>
                        )}
                      </td>
                      <td>{p.method || 'Online'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            className="btn--icon" 
                            onClick={() => handlePrintReceipt(p)} 
                            title="Print Receipt"
                            style={{ color: '#4f46e5', cursor: 'pointer' }}
                          >
                            <i className="fas fa-print" style={{ fontSize: '14px' }}></i>
                          </button>

                          {p.refund_status === 'refunded' ? (
                            <span className="badge badge--green" style={{ fontSize: '11px', padding: '2px 6px' }}>Refunded</span>
                          ) : request ? (
                            request.status === 'pending' ? (
                              <span className="badge badge--yellow" style={{ fontSize: '11px', padding: '2px 6px' }} title="Awaiting review">Pending Refund</span>
                            ) : request.status === 'approved' ? (
                              <span className="badge badge--green" style={{ fontSize: '11px', padding: '2px 6px' }}>Approved</span>
                            ) : (
                              <span className="badge badge--red" style={{ fontSize: '11px', padding: '2px 6px' }} title={`Rejection Reason: ${request.rejectionReason}`}>Rejected</span>
                            )
                          ) : isEligible ? (
                            <button
                              className="btn btn--sm btn--outline"
                              style={{ padding: '4px 8px', fontSize: '11px', color: '#d97706', borderColor: '#f59e0b', cursor: 'pointer' }}
                              onClick={() => {
                                setRefundForm({ paymentId: String(p._id), amount: String(p.amount), reason: '' });
                                setShowRefundModal(true);
                              }}
                            >
                              Request Refund
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Request Refund Modal */}
      {showRefundModal && (
        <>
          <div className="overlay" style={{ display: 'block', zIndex: 999 }} onClick={() => setShowRefundModal(false)}></div>
          <div className="modal" style={{ display: 'block', zIndex: 1000, maxWidth: '480px', width: '95%' }}>
            <div className="modal__top">
              <h3>Request Subscription Refund</h3>
              <button className="btn--icon" onClick={() => setShowRefundModal(false)}><i className="fas fa-xmark" style={{ fontSize: '18px' }}></i></button>
            </div>
            
            <form onSubmit={handleRequestRefundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: 0 }}>
                You are requesting a refund for subscription payment receipt <b>VYP-SUB-{refundForm.paymentId.substring(0,8).toUpperCase()}</b>.
              </p>
              
              <div className="fg">
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>Refund Amount (₹)</label>
                <input 
                  type="number" 
                  className="fi" 
                  value={refundForm.amount} 
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })} 
                  max={payments.find(p => String(p._id) === refundForm.paymentId)?.amount || ''}
                  min={1}
                  required 
                  style={{ background: 'var(--bg-input)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Maximum allowed: ₹{payments.find(p => String(p._id) === refundForm.paymentId)?.amount || ''}</span>
              </div>
              
              <div className="fg">
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>Reason for Refund</label>
                <textarea 
                  className="fi" 
                  rows="3" 
                  placeholder="Please state why you are requesting a refund..." 
                  value={refundForm.reason} 
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })} 
                  required
                  style={{ background: 'var(--bg-input)' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn--outline" style={{ flex: 1 }} onClick={() => setShowRefundModal(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn--primary" 
                  style={{ flex: 2, backgroundColor: '#f59e0b', borderColor: '#d97706' }} 
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
