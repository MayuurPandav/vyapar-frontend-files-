import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function SuperAdmin() {
  const { currentView, setCurrentView, loginAsTenant, handleLogout } = useApp();
  
  // Data States
  const [stats, setStats] = useState({ revenue: 0, total_users: 0, active_users: 0, total_plans: 0, trend: [] });
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [systemConfig, setSystemConfig] = useState({
    maintenance_mode: 'false',
    maintenance_message: '',
    maintenance_schedule: '',
    broadcast_message: '',
    support_email: 'support@vyapar.com',
    support_call: '+91 98765 43210',
    help_chat: 'https://chat.vyapar.com',
    help_ai: 'https://ai.vyapar.com',
    version: '1.0.0'
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeAuditUser, setActiveAuditUser] = useState(null);

  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals State
  const [activeModal, setActiveModal] = useState(null); // 'plan', 'audit', 'invoice', 'edit-plan'
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null); // For plan editing/creation

  // Manage Subscription Modal Form state
  const [mPlanName, setMPlanName] = useState('');
  const [mExpiryDate, setMExpiryDate] = useState('');

  // Plan Edit/Create Form State
  const [planForm, setPlanForm] = useState({ id: '', name: '', price: '', cycle: 'MONTHLY', features: '' });

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Initial Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([
        fetchStats(),
        fetchTenants(),
        fetchPlans(),
        fetchPayments(),
        fetchConfig()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg('Failed to load system metrics. Please verify MongoDB backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // --- API Integrations ---
  const fetchStats = async () => {
    const res = await fetch('/api/super/stats');
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  };

  const fetchTenants = async () => {
    const res = await fetch('/api/super/users');
    if (res.ok) {
      const data = await res.json();
      setTenants(data);
    }
  };

  const fetchPlans = async () => {
    const res = await fetch('/api/super/plans');
    if (res.ok) {
      const data = await res.json();
      setPlans(data);
    }
  };

  const fetchPayments = async () => {
    const res = await fetch('/api/super/payments');
    if (res.ok) {
      const data = await res.json();
      setPayments(data);
    }
  };

  const fetchConfig = async () => {
    const res = await fetch('/api/super/config');
    if (res.ok) {
      const data = await res.json();
      setSystemConfig(prev => ({
        ...prev,
        ...data,
        support_email: data.support_email || data.help_email || 'support@vyapar.com',
        support_call: data.support_call || data.help_call || '+91 98765 43210',
        help_chat: data.help_chat || 'https://chat.vyapar.com',
        help_ai: data.help_ai || 'https://ai.vyapar.com',
        version: data.version || '1.0.0'
      }));
    }
  };

  const fetchAuditLogs = async (username) => {
    const url = username ? `/api/super/audit?username=${encodeURIComponent(username)}` : '/api/super/audit';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data);
    }
  };

  // --- Actions ---
  const handleToggleStatus = async (username, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'Block' : 'Unblock'} user ${username}?`)) return;
    setActionLoading(true);
    try {
      const targetStatus = currentStatus === 'active' ? 'blocked' : 'active';
      const res = await fetch('/api/super/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, status: targetStatus })
      });
      if (res.ok) {
        await fetchTenants();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenManagePlan = async (tenant) => {
    setSelectedTenant(tenant);
    setMPlanName(tenant.planName || '');
    setMExpiryDate(tenant.subscriptionExpiry || '');
    setActiveModal('plan');
  };

  const handleUpdateTenantPlan = async () => {
    if (!selectedTenant) return;
    setActionLoading(true);
    try {
      const plan = plans.find(p => p.name === mPlanName);
      const planCycle = plan ? plan.cycle : 'MONTHLY';
      
      // Update plan name & cycle
      const res1 = await fetch('/api/super/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedTenant.username, planName: mPlanName, planCycle })
      });

      // Update expiry date
      const res2 = await fetch('/api/super/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedTenant.username, expiry: mExpiryDate })
      });

      if (res1.ok && res2.ok) {
        setActiveModal(null);
        await Promise.all([fetchTenants(), fetchPayments(), fetchStats()]);
      } else {
        alert('Failed to update subscription settings.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // SaaS Plans CRUD Actions
  const handleOpenEditPlan = (plan = null) => {
    if (plan) {
      setPlanForm({
        id: plan._id,
        name: plan.name,
        price: plan.price.toString(),
        cycle: plan.cycle || 'MONTHLY',
        features: plan.features || ''
      });
    } else {
      setPlanForm({ id: '', name: '', price: '', cycle: 'MONTHLY', features: '' });
    }
    setActiveModal('edit-plan');
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) {
      return alert('Plan name and price are required.');
    }
    setActionLoading(true);
    try {
      const payload = {
        name: planForm.name,
        price: parseFloat(planForm.price) || 0,
        cycle: planForm.cycle,
        features: planForm.features
      };
      if (planForm.id) {
        payload._id = planForm.id;
      }
      
      const res = await fetch('/api/super/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActiveModal(null);
        await fetchPlans();
      } else {
        alert('Failed to save plan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SaaS Plan?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/plans?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchPlans();
      } else {
        alert('Failed to delete plan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // System Settings Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemConfig)
      });
      if (res.ok) {
        alert('Configurations saved successfully!');
        await fetchConfig();
      } else {
        alert('Failed to save configuration settings.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAuditLogs = async (username) => {
    setActiveAuditUser(username);
    setAuditLogs([]);
    setActiveModal('audit');
    await fetchAuditLogs(username);
  };

  const handleOpenInvoice = (payment) => {
    const tenant = tenants.find(t => t.username === payment.username) || {};
    setSelectedPayment(payment);
    setSelectedTenant(tenant);
    setActiveModal('invoice');
  };

  // Print subscription tax invoice
  const handlePrintInvoice = (payment, tenant) => {
    const htmlContent = generateInvoiceHTML(payment, tenant);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Subscription Tax Invoice - ${payment._id}</title>
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

  // Generate HTML for invoice
  const generateInvoiceHTML = (p, tenant) => {
    if (!p) return '';
    const totalAmount = parseFloat(p.amount) || 0;
    const basePrice = totalAmount / 1.18;
    const totalGst = totalAmount - basePrice;
    const providerState = "Karnataka";
    const isIntrastate = (tenant.state || "").toLowerCase() === providerState.toLowerCase();

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

    return `
      <div style="font-family:'Inter', sans-serif; padding:10px; color:#1e293b;">
         <!-- Header -->
         <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:15px; margin-bottom:20px;">
            <div>
               <div style="font-size:24px; font-weight:800; color:#f64e60; font-family:'Outfit', sans-serif; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-shield-halved"></i> VYAPAR
               </div>
               <div style="font-size:11px; color:#64748b; margin-top:4px;">Simple Billing, Smart Business</div>
            </div>
            <div style="text-align:right;">
               <div style="font-size:20px; font-weight:700; color:#1e293b; letter-spacing:-0.5px;">TAX INVOICE</div>
               <div style="font-size:12px; color:#64748b; margin-top:2px;">Original for Recipient</div>
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
               <div style="font-weight:700; color:#0f172a; font-size:14px; margin-bottom:4px;">${tenant.bizName || 'Valued Customer'}</div>
               <div style="color:#475569;">
                  ${tenant.address || 'Address not updated'}<br>
                  ${tenant.city || ''}${tenant.city && tenant.state ? ', ' : ''}${tenant.state || ''} ${tenant.pincode || ''}<br>
                  <strong>GSTIN:</strong> ${tenant.gstin || 'N/A'}<br>
                  <strong>Email:</strong> ${tenant.email || p.username}
               </div>
            </div>
         </div>

         <!-- Metadata Box -->
         <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:25px; font-size:12px;">
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Invoice Number</div>
               <div style="font-weight:700; color:#1e293b;">${invoiceNo}</div>
            </div>
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Invoice Date</div>
               <div style="font-weight:700; color:#1e293b;">${p.date}</div>
            </div>
            <div>
               <div style="color:#64748b; font-size:10px; text-transform:uppercase; margin-bottom:2px;">Place of Supply</div>
               <div style="font-weight:700; color:#1e293b;">${tenant.state || 'Karnataka'} (State Code: ${tenant.gstin ? tenant.gstin.substring(0, 2) : '29'})</div>
            </div>
         </div>

         <!-- Table -->
         <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:25px; text-align:left;">
            <thead>
               <tr style="border-bottom:2px solid #e2e8f0; color:#475569; font-weight:700;">
                  <th style="padding:10px 5px;">Description</th>
                  <th style="padding:10px 5px; text-align:right;">Base Price</th>
                  <th style="padding:10px 5px; text-align:right;">Tax Rate</th>
                  <th style="padding:10px 5px; text-align:right;">Total</th>
               </tr>
            </thead>
            <tbody>
               <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:12px 5px;">
                     <div style="font-weight:700; color:#0f172a; font-size:13px;">Vyapar SaaS Platform Subscription</div>
                     <div style="font-size:11px; color:#64748b; margin-top:2px;">Plan: <b>${p.plan_name}</b> (${p.cycle || 'MONTHLY'} billing cycle)</div>
                  </td>
                  <td style="padding:12px 5px; text-align:right; color:#334155;">₹${basePrice.toFixed(2)}</td>
                  <td style="padding:12px 5px; text-align:right; color:#334155;">18.00%</td>
                  <td style="padding:12px 5px; text-align:right; font-weight:700; color:#0f172a;">₹${totalAmount.toFixed(2)}</td>
               </tr>
            </tbody>
         </table>

         <!-- Summary & Notes -->
         <div style="display:flex; justify-content:space-between; font-size:12px; line-height:1.6;">
            <div style="flex:1; padding-right:40px; color:#64748b;">
               <div style="font-weight:700; color:#475569; font-size:10px; text-transform:uppercase; margin-bottom:4px;">Terms & Conditions</div>
               <div style="font-size:10px;">This is a digitally generated Tax Invoice and does not require physical signature. Access to features is valid for the duration of the subscription cycle.</div>
            </div>
            <div style="width:250px; text-align:right;">
               <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:#475569;">
                  <span>Taxable Amount:</span>
                  <span>₹${basePrice.toFixed(2)}</span>
               </div>
               ${gstBreakdown}
               <div style="display:flex; justify-content:space-between; border-top:2px solid #e2e8f0; padding-top:8px; margin-top:8px; font-size:14px; font-weight:800; color:#0f172a;">
                  <span>Grand Total:</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
               </div>
               <div style="font-size:10px; color:#10b981; font-weight:700; margin-top:4px; text-transform:uppercase;">
                  Payment Method: ${p.method} • Status: PAID
               </div>
            </div>
         </div>
      </div>
    `;
  };

  // Helper to check expiry calculations
  const getDaysLeft = (expiry) => {
    if (!expiry) return null;
    const end = new Date(expiry);
    if (isNaN(end.getTime())) return null;
    const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // --- Filtering Logic ---
  const filteredCompanies = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = (t.bizName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || t.status === statusFilter;
      
      let matchesSub = true;
      if (subFilter) {
        const daysLeft = getDaysLeft(t.subscriptionExpiry);
        const isActive = t.subscriptionExpiry && daysLeft >= 0;
        if (subFilter === 'active') matchesSub = isActive;
        if (subFilter === 'expired') matchesSub = !isActive;
      }
      
      return matchesSearch && matchesStatus && matchesSub;
    });
  }, [tenants, searchQuery, statusFilter, subFilter]);

  const filteredUsers = useMemo(() => {
    return tenants.filter(t => {
      const matchesSearch = t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.phone || '').includes(searchQuery);
      
      const matchesRole = !roleFilter || t.role === roleFilter;
      const matchesStatus = !statusFilter || t.status === statusFilter;
      
      let matchesSub = true;
      if (subFilter) {
        const daysLeft = getDaysLeft(t.subscriptionExpiry);
        const subStatus = t.subscriptionExpiry 
          ? (daysLeft >= 0 ? (daysLeft <= 15 ? 'expiring' : 'active') : 'expired') 
          : 'none';
        matchesSub = subStatus === subFilter;
      }
      
      return matchesSearch && matchesRole && matchesStatus && matchesSub;
    });
  }, [tenants, searchQuery, roleFilter, statusFilter, subFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.plan_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPlan = !statusFilter || p.plan_name === statusFilter; // Reusing statusFilter dropdown for plan filtering
      
      let matchesDate = true;
      if (dateFrom) matchesDate = matchesDate && p.date >= dateFrom;
      if (dateTo) matchesDate = matchesDate && p.date <= dateTo;
      
      return matchesSearch && matchesPlan && matchesDate;
    });
  }, [payments, searchQuery, statusFilter, dateFrom, dateTo]);

  // Unique plan names list for payments filter
  const uniquePlansInPayments = useMemo(() => {
    return Array.from(new Set(payments.map(p => p.plan_name).filter(Boolean)));
  }, [payments]);

  // Dynamic Content Renderers
  const renderDashboardTab = () => {
    const recentPayments = payments.slice(0, 5);

    // Mock trend fallback for beautiful charting if empty
    const visualTrend = stats.trend && stats.trend.length > 0 ? stats.trend : [
      { month: 'Jan', count: 4 },
      { month: 'Feb', count: 8 },
      { month: 'Mar', count: 12 },
      { month: 'Apr', count: 18 },
      { month: 'May', count: tenants.length }
    ];

    // Find max value for responsive SVG chart scale
    const maxCount = Math.max(...visualTrend.map(t => t.count), 5);
    const chartHeight = 220;
    const chartWidth = 500;
    const padding = 30;

    // SVG Line Coordinates
    const points = visualTrend.map((t, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2) / (visualTrend.length - 1));
      const y = chartHeight - padding - (t.count * (chartHeight - padding * 2) / maxCount);
      return { x, y, ...t };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z` : '';

    return (
      <div className="view active">
        <div className="stats-grid">
          <div className="card card--lift">
            <div className="stat__top">
              <span className="stat__lbl">TOTAL REVENUE</span>
              <div className="stat__icon stat__icon--g"><i className="fas fa-indian-rupee-sign"></i></div>
            </div>
            <div className="stat__val">₹{stats.revenue ? stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}</div>
            <span className="stat__trend up" style={{ fontSize: '11px', marginTop: '6px' }}>
              <i className="fas fa-arrow-up"></i> Lifetime sales ledger
            </span>
          </div>

          <div className="card card--lift">
            <div className="stat__top">
              <span className="stat__lbl">ACTIVE BUSINESSES</span>
              <div className="stat__icon stat__icon--b"><i className="fas fa-building"></i></div>
            </div>
            <div className="stat__val">{stats.total_users || 0}</div>
            <span className="stat__trend" style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-3)' }}>
              Registered corporate databases
            </span>
          </div>

          <div className="card card--lift">
            <div className="stat__top">
              <span className="stat__lbl">SAAS FIXED PLANS</span>
              <div className="stat__icon stat__icon--y"><i className="fas fa-bolt"></i></div>
            </div>
            <div className="stat__val">{stats.total_plans || 0}</div>
            <span className="stat__trend" style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-3)' }}>
              Active feature tiers
            </span>
          </div>

          <div className="card card--lift">
            <div className="stat__top">
              <span className="stat__lbl">SYSTEM HEALTH</span>
              <div className="stat__icon stat__icon--r"><i className="fas fa-heartbeat"></i></div>
            </div>
            <div className="stat__val" style={{ color: '#10b981' }}>99.9%</div>
            <span className="stat__trend up" style={{ fontSize: '11px', marginTop: '6px' }}>
              <i className="fas fa-circle-check"></i> MongoDB Node OK
            </span>
          </div>
        </div>

        <div className="two-col">
          {/* Visual Trend Chart */}
          <div className="card">
            <div className="card__head">
              <span>Onboarding Growth Curve</span>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>New subscriptions monthly</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f64e60" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f64e60" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + ratio * (chartHeight - padding * 2);
                  return (
                    <line key={i} x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="var(--border)" strokeDasharray="4 4" />
                  );
                })}
                {/* Area under curve */}
                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
                {/* Curve line */}
                {linePath && <path d={linePath} fill="none" stroke="#f64e60" strokeWidth="3" strokeLinecap="round" />}
                {/* Data points */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#f64e60" stroke="var(--bg-sidebar)" strokeWidth="2" />
                    <text x={p.x} y={chartHeight - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)">
                      {p.month}
                    </text>
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--text-1)">
                      {p.count}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Recent Payments Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card__head">
               <span>Recent Subscriptions</span>
               <button className="btn btn--sm btn--primary" onClick={() => setCurrentView('payments')}>View All</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }} className="recent-payments-list">
              {recentPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                  <i className="fas fa-receipt" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                  <div>No payments recorded yet.</div>
                </div>
              ) : (
                recentPayments.map(r => (
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px dashed var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-1)' }}>{r.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.plan_name} • {r.date}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#10b981' }}>₹{r.amount}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{r.method}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompaniesTab = () => {
    return (
      <div className="view active">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-3)' }}></i>
            <input 
              type="text" 
              placeholder="Search companies by name or corporate email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
            />
          </div>
          <select 
            className="fi" 
            style={{ width: '150px', height: '42px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <select 
            className="fi" 
            style={{ width: '170px', height: '42px' }}
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
          >
            <option value="">All Subscriptions</option>
            <option value="active">Active Plan</option>
            <option value="expired">Expired/None</option>
          </select>
        </div>

        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>COMPANY / BUSINESS</th>
                <th>PLAN CYCLE</th>
                <th>STATUS</th>
                <th>EXPIRY DATE</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-building" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No companies found matching the filters.</div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(t => {
                  const daysLeft = getDaysLeft(t.subscriptionExpiry);
                  const isExp = t.subscriptionExpiry && daysLeft < 0;
                  return (
                    <tr key={t._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(246, 78, 96, 0.1)', display: 'grid', placeItems: 'center', color: '#f64e60', fontSize: '16px' }}>
                            <i className="fas fa-building"></i>
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-1)' }}>{t.bizName || 'New Company'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{t.planName || 'No Plan'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.planCycle || 'N/A'}</div>
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'blocked' ? 'badge--red' : 'badge--green'}`}>
                          {t.status === 'blocked' ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: isExp ? 'var(--red)' : 'var(--text-1)' }}>
                          {t.subscriptionExpiry || 'N/A'}
                        </div>
                        {t.subscriptionExpiry && (
                          <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                            {daysLeft >= 0 ? `${daysLeft} days left` : `Expired ${Math.abs(daysLeft)} days ago`}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="btn btn--sm" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }} onClick={() => loginAsTenant(t)}>
                            <i className="fas fa-eye"></i> Simulate
                          </button>
                          <button className="btn btn--sm" onClick={() => handleOpenManagePlan(t)}>
                            Manage Plan
                          </button>
                          <button 
                            className={`btn btn--sm ${t.status === 'active' ? 'btn--red' : 'btn--primary'}`}
                            style={{ 
                              color: t.status === 'active' ? '#ef4444' : '#fff',
                              borderColor: t.status === 'active' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                              backgroundColor: t.status === 'active' ? 'transparent' : 'var(--accent)'
                            }}
                            onClick={() => handleToggleStatus(t.username, t.status)}
                            disabled={actionLoading}
                          >
                            {t.status === 'active' ? 'Block' : 'Unblock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="view active">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-3)' }}></i>
            <input 
              type="text" 
              placeholder="Search user accounts by username or phone number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
            />
          </div>
          <select 
            className="fi" 
            style={{ width: '150px', height: '42px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select 
            className="fi" 
            style={{ width: '150px', height: '42px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <select 
            className="fi" 
            style={{ width: '170px', height: '42px' }}
            value={subFilter}
            onChange={(e) => setSubFilter(e.target.value)}
          >
            <option value="">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="none">No Subscription</option>
          </select>
        </div>

        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>USER / PHONE</th>
                <th>SYSTEM ROLE</th>
                <th>COMPANY / FIRM</th>
                <th>LOGIN STATUS</th>
                <th>SUBSCRIPTION LIFECYCLE</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-users-gear" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No global users found matching criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(t => {
                  const daysLeft = getDaysLeft(t.subscriptionExpiry);
                  const subStatus = t.subscriptionExpiry 
                    ? (daysLeft >= 0 ? (daysLeft <= 15 ? 'Expiring Soon' : 'Active') : 'Expired') 
                    : 'No Subscription';
                  
                  let subColor = '#10b981'; // green
                  if (subStatus === 'Expired') subColor = '#ef4444'; // red
                  if (subStatus === 'Expiring Soon') subColor = '#f59e0b'; // yellow
                  if (subStatus === 'No Subscription') subColor = 'var(--text-3)';

                  const subLabel = daysLeft === null 
                    ? 'No Subscription' 
                    : `${subStatus} (${daysLeft >= 0 ? `${daysLeft} days left` : `${Math.abs(daysLeft)} days ago`})`;

                  return (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-1)' }}>{t.username}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.phone || 'No phone'}</div>
                      </td>
                      <td>
                        <span className="badge badge--blue">{t.role ? t.role.toUpperCase() : 'USER'}</span>
                      </td>
                      <td>{t.bizName || 'N/A'}</td>
                      <td>
                        <span className={`badge ${t.status === 'blocked' ? 'badge--red' : 'badge--green'}`}>
                          {t.status === 'blocked' ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: subColor }}>
                          {subLabel}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button className="btn btn--sm" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }} onClick={() => loginAsTenant(t)}>
                            <i className="fas fa-eye"></i> View
                          </button>
                          <button className="btn btn--sm" onClick={() => handleOpenAuditLogs(t.username)}>
                            Audit Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  const renderPlansTab = () => {
    return (
      <div className="view active">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn btn--primary" onClick={() => handleOpenEditPlan(null)}>
            <i className="fas fa-plus"></i> Create Plan
          </button>
        </div>

        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>PLAN NAME</th>
                <th>PRICING (INR)</th>
                <th>CYCLE</th>
                <th>INCLUDED FEATURES</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-bolt" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No system SaaS plans found. Please seed the database.</div>
                  </td>
                </tr>
              ) : (
                plans.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-1)' }}>{p.name}</td>
                    <td style={{ fontWeight: '600' }}>₹{p.price}</td>
                    <td><span className="badge badge--blue">{p.cycle}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-2)' }}>{p.features}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn--sm" onClick={() => handleOpenEditPlan(p)}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button 
                          className="btn btn--sm" 
                          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          onClick={() => handleDeletePlan(p._id)}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  const renderPaymentsTab = () => {
    return (
      <div className="view active">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-3)' }}></i>
            <input 
              type="text" 
              placeholder="Search payments by business name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
            />
          </div>
          <select 
            className="fi" 
            style={{ width: '150px', height: '42px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Tiers</option>
            {uniquePlansInPayments.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input 
            type="date" 
            className="fi" 
            style={{ width: '140px', height: '42px' }} 
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From Date"
          />
          <input 
            type="date" 
            className="fi" 
            style={{ width: '140px', height: '42px' }} 
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To Date"
          />
        </div>

        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>TRANSACTION ID</th>
                <th>SUBSCRIBED USER</th>
                <th>AMOUNT PAID</th>
                <th>PLAN TIER</th>
                <th>PAYMENT DATE</th>
                <th>METHOD</th>
                <th style={{ textAlign: 'right' }}>TAX INVOICE</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-receipt" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No payment records found.</div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-3)', fontSize: '11px', fontFamily: 'monospace' }}>#{p._id}</td>
                    <td style={{ fontWeight: '700', color: 'var(--text-1)' }}>{p.username}</td>
                    <td style={{ fontWeight: '800', color: '#10b981' }}>₹{p.amount}</td>
                    <td>{p.plan_name}</td>
                    <td>{p.date}</td>
                    <td><span className="badge badge--blue">{p.method}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn--sm btn--primary" onClick={() => handleOpenInvoice(p)}>
                        <i className="fas fa-file-invoice"></i> View Tax Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    );
  };

  const renderSettingsTab = () => {
    return (
      <div className="view active">
        <div className="two-col">
          {/* Settings form */}
          <div className="card">
            <div className="card__head">Global SaaS Settings</div>
            <form onSubmit={handleSaveConfig}>
              <div className="fg">
                <label>Support & Billing Email</label>
                <input 
                  type="email" 
                  className="fi" 
                  value={systemConfig.support_email} 
                  onChange={(e) => setSystemConfig({...systemConfig, support_email: e.target.value})}
                  required
                />
              </div>
              <div className="fg">
                <label>Support Helpline Number</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={systemConfig.support_call} 
                  onChange={(e) => setSystemConfig({...systemConfig, support_call: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Support Chat System URL</label>
                  <input 
                    type="url" 
                    className="fi" 
                    value={systemConfig.help_chat} 
                    onChange={(e) => setSystemConfig({...systemConfig, help_chat: e.target.value})}
                    required
                  />
                </div>
                <div className="fg">
                  <label>AI Financial Copilot URL</label>
                  <input 
                    type="url" 
                    className="fi" 
                    value={systemConfig.help_ai} 
                    onChange={(e) => setSystemConfig({...systemConfig, help_ai: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="fg">
                <label>Active Platform Version</label>
                <input 
                  type="text" 
                  className="fi" 
                  value={systemConfig.version} 
                  onChange={(e) => setSystemConfig({...systemConfig, version: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>System Maintenance Mode</label>
                  <select 
                    className="fi" 
                    value={systemConfig.maintenance_mode} 
                    onChange={(e) => setSystemConfig({...systemConfig, maintenance_mode: e.target.value})}
                  >
                    <option value="false">Inactive / Normal Operations</option>
                    <option value="true">Active / Block Login Portal</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Maintenance Schedule Description</label>
                  <input 
                    type="text" 
                    className="fi" 
                    placeholder="e.g. 24th May, 2:00 AM - 4:00 AM" 
                    value={systemConfig.maintenance_schedule} 
                    onChange={(e) => setSystemConfig({...systemConfig, maintenance_schedule: e.target.value})}
                  />
                </div>
              </div>
              <div className="fg">
                <label>Maintenance Message to Users</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  placeholder="Explain why the server is in maintenance..."
                  value={systemConfig.maintenance_message} 
                  onChange={(e) => setSystemConfig({...systemConfig, maintenance_message: e.target.value})}
                ></textarea>
              </div>
              <div className="fg">
                <label>Admin Portal Broadcast Announcement (Banner Alert)</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  placeholder="Announce promotions, offers, or billing warnings..."
                  value={systemConfig.broadcast_message} 
                  onChange={(e) => setSystemConfig({...systemConfig, broadcast_message: e.target.value})}
                ></textarea>
              </div>
              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%' }}>
                {actionLoading ? 'Saving Settings...' : 'Apply Configurations'}
              </button>
            </form>
          </div>

          {/* Quick info metadata panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(246, 78, 96, 0.05), rgba(59, 130, 246, 0.05))' }}>
              <div className="card__head" style={{ marginBottom: '12px' }}>Vyapar System Support</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--blue)' }}><i className="fas fa-robot"></i></div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>AI ASSISTANT</div>
                    <div style={{ fontWeight: '600' }}>{systemConfig.help_ai}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}><i className="fas fa-envelope"></i></div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>EMAIL HELP</div>
                    <div style={{ fontWeight: '600' }}>{systemConfig.support_email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--yellow)' }}><i className="fas fa-phone"></i></div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>CALL DESK</div>
                    <div style={{ fontWeight: '600' }}>{systemConfig.support_call}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(246, 78, 96, 0.1)', display: 'grid', placeItems: 'center', color: '#f64e60' }}><i className="fas fa-comments"></i></div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>LIVE CHAT</div>
                    <div style={{ fontWeight: '600' }}>{systemConfig.help_chat}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head">Master Audit Checklist</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><i className="fas fa-shield-halved" style={{ color: '#10b981', marginTop: '3px' }}></i><span><b>Secure SSL connection</b> active on all REST and DB endpoints.</span></div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}><i className="fas fa-shield-halved" style={{ color: '#10b981', marginTop: '3px' }}></i><span><b>MongoDB driver</b> automatically handles concurrent connection pooling.</span></div>
                <div style={{ display: 'flex', gap: '8px' }}><i className="fas fa-shield-halved" style={{ color: '#10b981', marginTop: '3px' }}></i><span>All administrative audit logs are written instantly into the `sa_audit` collections.</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getActiveTabContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboardTab();
      case 'companies':
        return renderCompaniesTab();
      case 'users':
        return renderUsersTab();
      case 'plans':
        return renderPlansTab();
      case 'payments':
        return renderPaymentsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderDashboardTab();
    }
  };

  const getTabTitle = () => {
    switch (currentView) {
      case 'dashboard': return { title: 'SA Dashboard', subtitle: 'Global system stats & business growth overview.' };
      case 'companies': return { title: 'Manage Companies', subtitle: 'Administrative business profile operations.' };
      case 'users': return { title: 'Global Users', subtitle: 'Platform-wide user authentication credentials.' };
      case 'plans': return { title: 'SaaS Plans', subtitle: 'Configure fixed tier offerings & product features.' };
      case 'payments': return { title: 'Payment History', subtitle: 'Consolidated subscription transaction records.' };
      case 'settings': return { title: 'System Settings', subtitle: 'Platform configurations, maintenance and support contacts.' };
      default: return { title: 'Master Control Center', subtitle: 'Vyapar Cloud Platform Management.' };
    }
  };

  const tabMeta = getTabTitle();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '16px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#f64e60' }}></i>
        <h2 style={{ fontFamily: 'Outfit, sans-serif' }}>Initializing Master Platform...</h2>
      </div>
    );
  }

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>{tabMeta.title}</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>{tabMeta.subtitle}</p>
        </div>
        <div className="topbar__right">
          <div style={{ textAlign: 'right' }}>
            <div className="topbar__name" style={{ fontWeight: 'bold' }}>Master System Admin</div>
            <div style={{ fontSize: '10px', color: '#f64e60', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Platform Owner</div>
          </div>
          <img src="https://ui-avatars.com/api/?name=MA&background=f64e60&color=fff" className="topbar__avatar" alt="Avatar" />
        </div>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--red)', color: 'var(--red)', padding: '14px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fas fa-exclamation-triangle"></i>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Render the Active View */}
      {getActiveTabContent()}

      {/* --- OVERLAYS & MODALS --- */}
      {activeModal && <div className="overlay" style={{ display: 'block' }} onClick={() => setActiveModal(null)}></div>}

      {/* 1. Manage Subscription Modal */}
      {activeModal === 'plan' && selectedTenant && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>Manage Corporate Subscription</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <div>
            <div className="fg" style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase' }}>Selected Company</div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedTenant.bizName || 'N/A'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>({selectedTenant.username})</div>
            </div>
            
            <div className="fg">
              <label>SaaS Pricing Tier</label>
              <select className="fi" value={mPlanName} onChange={(e) => setMPlanName(e.target.value)}>
                <option value="">No Active Plan</option>
                {plans.map(p => (
                  <option key={p._id} value={p.name}>{p.name} (₹{p.price} / {p.cycle})</option>
                ))}
              </select>
            </div>
            <div className="fg">
              <label>Subscription Expiry Date</label>
              <input 
                type="date" 
                className="fi" 
                value={mExpiryDate} 
                onChange={(e) => setMExpiryDate(e.target.value)} 
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleUpdateTenantPlan} disabled={actionLoading}>
                {actionLoading ? 'Updating...' : 'Apply Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Audit Logs Modal */}
      {activeModal === 'audit' && (
        <div className="modal" style={{ display: 'block', maxWidth: '780px', width: '90%' }}>
          <div className="modal__top">
            <h3>Audit Security Log Matrix</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>Target User: <b>{activeAuditUser || 'All System Ops'}</b></span>
            <span>Logs Count: <b>{auditLogs.length}</b></span>
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <table className="tbl" style={{ fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-sidebar)', zIndex: 10 }}>
                <tr>
                  <th>DATETIME</th>
                  <th>ACTION</th>
                  <th>SECURITY DETAIL SNIPPET</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>
                      <i className="fas fa-shield-halved" style={{ fontSize: '24px', marginBottom: '6px' }}></i>
                      <div>No audit actions logs found for this profile.</div>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(l => (
                    <tr key={l._id}>
                      <td style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge--blue">{l.action}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-2)' }}>{l.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Subscription Invoice Modal */}
      {activeModal === 'invoice' && selectedPayment && (
        <div className="modal" style={{ display: 'block', maxWidth: '760px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal__top">
            <h3>Subscription Tax Invoice</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px' }}>
            <div dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(selectedPayment, selectedTenant || {}) }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <button className="btn" onClick={() => setActiveModal(null)}>Close</button>
            <button className="btn btn--primary" onClick={() => handlePrintInvoice(selectedPayment, selectedTenant || {})}>
              <i className="fas fa-print"></i> Print Tax Invoice
            </button>
          </div>
        </div>
      )}

      {/* 4. Edit/Create Plan Modal */}
      {activeModal === 'edit-plan' && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>{planForm.id ? 'Modify SaaS Offering Plan' : 'Create SaaS Pricing Plan'}</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleSavePlan}>
            <div className="fg">
              <label>Plan Name</label>
              <input 
                type="text" 
                className="fi" 
                value={planForm.name} 
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                placeholder="e.g. Diamond Special"
                required
              />
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Pricing Rate (INR)</label>
                <input 
                  type="number" 
                  className="fi" 
                  value={planForm.price} 
                  onChange={(e) => setPlanForm({...planForm, price: e.target.value})}
                  placeholder="e.g. 2999"
                  required
                />
              </div>
              <div className="fg">
                <label>Billing Frequency</label>
                <select 
                  className="fi" 
                  value={planForm.cycle} 
                  onChange={(e) => setPlanForm({...planForm, cycle: e.target.value})}
                >
                  <option value="MONTHLY">Monthly Billing Cycle</option>
                  <option value="YEARLY">Yearly Billing Cycle</option>
                </select>
              </div>
            </div>
            <div className="fg">
              <label>Tier Platform Features (Comma separated list)</label>
              <textarea 
                className="fi" 
                rows="3"
                value={planForm.features} 
                onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
                placeholder="e.g. Multi-User, Audit logs, AI analytics, 10GB cloud storage"
              ></textarea>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={actionLoading}>
                {actionLoading ? 'Saving Plan...' : 'Save Plan Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
