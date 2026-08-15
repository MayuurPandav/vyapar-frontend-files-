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
    maintenance_start_time: '',
    maintenance_end_time: '',
    broadcast_message: '',
    support_email: 'support@vyapar.com',
    support_call: '+91 98765 43210',
    help_chat: 'https://chat.vyapar.com',
    help_ai: 'https://ai.vyapar.com',
    version: '1.0.0',
    force_update: 'false',
    beta_features_enabled: 'false',
    default_language: 'English',
    default_currency: 'INR',
    default_date_format: 'DD/MM/YYYY',
    shop_storage_limit_mb: '1024',
    file_upload_limit_mb: '5',
    api_rate_limit_rpm: '60',
    default_gst_rates: '0, 5, 12, 18, 28',
    default_hsn_codes: '',
    default_invoice_template: 'classic',
    default_payment_terms: 'Net 15, Net 30, Net 60',
    default_uom_list: 'pcs, kg, litre, metre, box',
    default_item_categories: 'General, Services, Products',
    default_invoice_prefixes: 'INV, BILL, GST',
    default_thermal_print_size: '80mm',
    default_delivery_statuses: 'Pending, Assigned, Out for Delivery, Delivered, Failed',
    default_failed_delivery_reasons: 'Customer Unavailable, Address Not Found, Refused by Customer, Weather Conditions',
    default_delivery_charge_templates: 'Flat ₹50, Distance Based, Free Delivery',
    shiprocket_api_key: '',
    delhivery_api_key: '',
    dunzo_api_key: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    sms_gateway_url: '',
    sms_gateway_api_key: '',
    whatsapp_api_url: '',
    whatsapp_api_token: '',
    fcm_server_key: '',
    template_payment_reminder: 'Dear customer, your payment of {amount} is due on {date}.',
    template_invoice_share: 'Hello, please find attached your invoice {invoice_number}.',
    template_low_stock: 'Alert: Stock for {item_name} has fallen below the minimum threshold.',
    template_subscription_expiry: 'Your Vyapar subscription expires in {days_left} days. Please renew to avoid interruption.',
    policy_terms: 'Default Terms and Conditions content...',
    policy_privacy: 'Default Privacy Policy content...',
    policy_refund: 'Default Refund Policy content...',
    gdpr_compliance_enabled: 'true',
    data_retention_days: '1095'
  });
  
  // Billing States
  const [coupons, setCoupons] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [revenue, setRevenue] = useState({ daily: {}, monthly: {}, yearly: {} });
  const [gatewayConfig, setGatewayConfig] = useState({ razorpay_key: '', stripe_key: '', payu_key: '', upi_id: '', gst_rate: '' });
  const [refundRequests, setRefundRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
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
  const [mAutoRenew, setMAutoRenew] = useState(false);

  // Plan Edit/Create Form State
  const [planForm, setPlanForm] = useState({ 
    id: '', name: '', description: '', price: '', monthlyPrice: '', yearlyPrice: '', 
    yearlyDiscountPercent: '', badgeText: '', status: 'active', isFeatured: false, 
    isRecommended: false, displayOrder: 0, cycle: 'MONTHLY', features: '', modules: {}, limits: {} 
  });
  const [planTab, setPlanTab] = useState('general');
  
  // Billing Forms State
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percentage', value: '', expiry: '', maxUses: '' });
  const [overrideForm, setOverrideForm] = useState({ username: '', plan_name: '', amount: '', cycle: 'MONTHLY', method: 'MANUAL', date: '' });
  const [refundForm, setRefundForm] = useState({ paymentId: '', amount: '', reason: '' });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showBusinessesModal, setShowBusinessesModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showSystemHealthModal, setShowSystemHealthModal] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  // Shops view mode: 'list' or 'grid'
  const [shopsView, setShopsView] = useState('list');

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
        fetchConfig(),
        fetchCoupons(),
        fetchRefunds(),
        fetchRevenue(),
        fetchGatewayConfig(),
        fetchNotifications(),
        fetchRefundRequests()
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
    // use shops endpoint (alias to users with business fields)
    const res = await fetch('/api/super/shops');
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
        version: data.version || '1.0.0',
        maintenance_mode: data.maintenance_mode || 'false',
        maintenance_start_time: data.maintenance_start_time || '',
        maintenance_end_time: data.maintenance_end_time || '',
        force_update: data.force_update || 'false',
        beta_features_enabled: data.beta_features_enabled || 'false',
        default_language: data.default_language || 'English',
        default_currency: data.default_currency || 'INR',
        default_date_format: data.default_date_format || 'DD/MM/YYYY',
        shop_storage_limit_mb: data.shop_storage_limit_mb || '1024',
        file_upload_limit_mb: data.file_upload_limit_mb || '5',
        api_rate_limit_rpm: data.api_rate_limit_rpm || '60',
        default_gst_rates: data.default_gst_rates || '0, 5, 12, 18, 28',
        default_hsn_codes: data.default_hsn_codes || '',
        default_invoice_template: data.default_invoice_template || 'classic',
        default_payment_terms: data.default_payment_terms || 'Net 15, Net 30, Net 60',
        default_uom_list: data.default_uom_list || 'pcs, kg, litre, metre, box',
        default_item_categories: data.default_item_categories || 'General, Services, Products',
        default_invoice_prefixes: data.default_invoice_prefixes || 'INV, BILL, GST',
        default_thermal_print_size: data.default_thermal_print_size || '80mm',
        default_delivery_statuses: data.default_delivery_statuses || 'Pending, Assigned, Out for Delivery, Delivered, Failed',
        default_failed_delivery_reasons: data.default_failed_delivery_reasons || 'Customer Unavailable, Address Not Found, Refused by Customer, Weather Conditions',
        default_delivery_charge_templates: data.default_delivery_charge_templates || 'Flat ₹50, Distance Based, Free Delivery',
        shiprocket_api_key: data.shiprocket_api_key || '',
        delhivery_api_key: data.delhivery_api_key || '',
        dunzo_api_key: data.dunzo_api_key || '',
        smtp_host: data.smtp_host || '',
        smtp_port: data.smtp_port || '587',
        smtp_user: data.smtp_user || '',
        smtp_pass: data.smtp_pass || '',
        sms_gateway_url: data.sms_gateway_url || '',
        sms_gateway_api_key: data.sms_gateway_api_key || '',
        whatsapp_api_url: data.whatsapp_api_url || '',
        whatsapp_api_token: data.whatsapp_api_token || '',
        fcm_server_key: data.fcm_server_key || '',
        template_payment_reminder: data.template_payment_reminder || 'Dear customer, your payment of {amount} is due on {date}.',
        template_invoice_share: data.template_invoice_share || 'Hello, please find attached your invoice {invoice_number}.',
        template_low_stock: data.template_low_stock || 'Alert: Stock for {item_name} has fallen below the minimum threshold.',
        template_subscription_expiry: data.template_subscription_expiry || 'Your Vyapar subscription expires in {days_left} days. Please renew to avoid interruption.',
        policy_terms: data.policy_terms || 'Default Terms and Conditions content...',
        policy_privacy: data.policy_privacy || 'Default Privacy Policy content...',
        policy_refund: data.policy_refund || 'Default Refund Policy content...',
        gdpr_compliance_enabled: data.gdpr_compliance_enabled || 'true',
        data_retention_days: data.data_retention_days || '1095'
      }));
    }
  };

  const fetchCoupons = async () => {
    const res = await fetch('/api/super/billing/coupons');
    if (res.ok) {
      const data = await res.json();
      setCoupons(data);
    }
  };

  const fetchRefunds = async () => {
    const res = await fetch('/api/super/billing/refunds');
    if (res.ok) {
      const data = await res.json();
      setRefunds(data);
    }
  };

  const fetchRefundRequests = async () => {
    const res = await fetch('/api/super/billing/refund-requests');
    if (res.ok) {
      const data = await res.json();
      setRefundRequests(data);
    }
  };

  const fetchRevenue = async () => {
    const res = await fetch('/api/super/billing/revenue-reports');
    if (res.ok) {
      const data = await res.json();
      setRevenue(data);
    }
  };

  const fetchGatewayConfig = async () => {
    const res = await fetch('/api/super/billing/gateway-config');
    if (res.ok) {
      const data = await res.json();
      setGatewayConfig(prev => ({ ...prev, ...data }));
    }
  };

  const maskEmail = (raw) => {
    if (!raw) return '';
    try {
      if (raw.indexOf('@') !== -1) {
        const parts = raw.split('@');
        const local = parts[0];
        const domain = parts[1];
        return (local[0] || '*') + '***@' + domain;
      }
      if (raw.length <= 4) return raw.replace(/./g, '*');
      return raw.substring(0, 1) + '***' + raw.substring(raw.length - 1);
    } catch (e) { return '***'; }
  };

  const fetchAuditLogs = async (username) => {
    const url = username ? `/api/super/audit?username=${encodeURIComponent(username)}` : '/api/super/audit';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(Array.isArray(data) ? data : (data.data || []));
    }
  };

  const fetchNotifications = async () => {
    const res = await fetch('/api/super/notifications');
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch(`/api/super/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Actions ---
  const handleToggleStatus = async (username, currentStatus) => {
    if (!await window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'Block' : 'Unblock'} user ${username}?`)) return;
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

  const handleBlacklistShop = async (username) => {
    if (!await window.confirm(`Are you sure you want to blacklist ${username}? This will prevent them from logging in.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, status: 'blacklisted' })
      });
      if (res.ok) {
        await fetchTenants();
      } else {
        alert('Failed to blacklist shop');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // OTP flow: send OTP and verify
  const sendOtpToEmail = async (username) => {
    try {
      const res = await fetch('/api/super/shops/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
      if (!res.ok) {
        const t = await res.text(); throw new Error(t || 'Failed to send OTP');
      }
      return await res.json();
    } catch (e) { throw e; }
  };

  const verifyOtpForEmail = async (username, code) => {
    try {
      const res = await fetch('/api/super/shops/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, code }) });
      if (!res.ok) {
        const t = await res.text(); throw new Error(t || 'OTP verify failed');
      }
      return await res.json();
    } catch (e) { throw e; }
  };

  const handleOpenManagePlan = async (tenant) => {
    setSelectedTenant(tenant);
    setMPlanName(tenant.planName || '');
    setMExpiryDate(tenant.subscriptionExpiry || '');
    setMAutoRenew(tenant.settings?.autoRenew || false);
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

      // Update auto-renew
      const res3 = await fetch('/api/super/auto-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedTenant.username, autoRenew: mAutoRenew })
      });

      if (res1.ok && res2.ok && res3.ok) {
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
    setPlanTab('general');
    if (plan) {
      setPlanForm({
        id: plan._id,
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price ? plan.price.toString() : '',
        monthlyPrice: plan.monthlyPrice ? plan.monthlyPrice.toString() : '',
        yearlyPrice: plan.yearlyPrice ? plan.yearlyPrice.toString() : '',
        yearlyDiscountPercent: plan.yearlyDiscountPercent ? plan.yearlyDiscountPercent.toString() : '',
        badgeText: plan.badgeText || '',
        status: plan.status || 'active',
        isFeatured: !!plan.isFeatured,
        isRecommended: !!plan.isRecommended,
        displayOrder: plan.displayOrder || 0,
        cycle: plan.cycle || 'MONTHLY',
        features: plan.features || '',
        modules: plan.modules || {},
        limits: plan.limits || {}
      });
    } else {
      setPlanForm({ 
        id: '', name: '', description: '', price: '', monthlyPrice: '', yearlyPrice: '', 
        yearlyDiscountPercent: '', badgeText: '', status: 'active', isFeatured: false, 
        isRecommended: false, displayOrder: 0, cycle: 'MONTHLY', features: '', modules: {}, limits: {} 
      });
    }
    setActiveModal('edit-plan');
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name) {
      return alert('Plan name is required.');
    }
    setActionLoading(true);
    try {
      const payload = { ...planForm };
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

  const handlePlanAction = async (id, action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/plans/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        await fetchPlans();
      } else {
        alert(`Failed to ${action} plan.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedPlans = async () => {
    if (!await window.confirm('Seed default plans? This will overwrite or add standard plans.')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/plans/seed', { method: 'POST' });
      if (res.ok) {
        await fetchPlans();
      } else {
        alert('Failed to seed plans.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!await window.confirm('Are you sure you want to completely delete this SaaS Plan?')) return;
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

  // --- Billing Actions ---
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/billing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setActiveModal(null);
        await fetchCoupons();
      } else {
        alert('Failed to create coupon.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!await window.confirm('Delete this coupon?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/billing/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/billing/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundForm)
      });
      if (res.ok) {
        setActiveModal(null);
        await Promise.all([fetchRefunds(), fetchPayments()]);
      } else {
        alert('Failed to process refund.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundRequestAction = async (request, action, reasonText = '') => {
    if (action === 'approve' && !await window.confirm(`Approve refund of ₹${request.amount} for user ${request.username}?`)) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/super/billing/refund-requests/${request._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: reasonText,
          actor: user.username
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(action === 'approve' ? 'Refund approved and processed!' : 'Refund request rejected.');
        setSelectedRequest(null);
        setRejectionReason('');
        setActiveModal(null);
        await Promise.all([
          fetchRefundRequests(),
          fetchRefunds(),
          fetchPayments()
        ]);
      } else {
        alert(data.message || 'Failed to process action.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualOverride = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/billing/manual-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideForm)
      });
      if (res.ok) {
        setActiveModal(null);
        await fetchPayments();
      } else {
        alert('Failed to override payment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveGatewayConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/super/billing/gateway-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatewayConfig)
      });
      if (res.ok) {
        alert('Gateway configuration saved!');
        await fetchGatewayConfig();
      } else {
        alert('Failed to save gateway config.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatMaintenanceSchedule = (startStr, endStr) => {
    if (!startStr) return '';
    try {
      const start = new Date(startStr);
      const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      
      const startDateFormatted = start.toLocaleDateString('en-US', dateOptions);
      const startTimeFormatted = start.toLocaleTimeString('en-US', timeOptions);
      
      if (!endStr) {
        return `${startDateFormatted}, starting at ${startTimeFormatted}`;
      }
      
      const end = new Date(endStr);
      const endDateFormatted = end.toLocaleDateString('en-US', dateOptions);
      const endTimeFormatted = end.toLocaleTimeString('en-US', timeOptions);
      
      if (startDateFormatted === endDateFormatted) {
        return `${startDateFormatted}, ${startTimeFormatted} - ${endTimeFormatted}`;
      } else {
        return `${startDateFormatted}, ${startTimeFormatted} - ${endDateFormatted}, ${endTimeFormatted}`;
      }
    } catch (e) {
      return '';
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
  const renderVerifyIcons = (t) => {
    const icStyle = (ok) => ({ color: ok ? '#10b981' : '#94a3b8', fontSize: '13px' });
    return (
      <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span title={t.isEmailVerified ? 'Email verified' : 'Email not verified'} style={icStyle(t.isEmailVerified)}><i className={t.isEmailVerified ? 'fas fa-envelope' : 'fas fa-envelope-open'}></i></span>
        <span title={t.isPhoneVerified ? 'Phone verified' : 'Phone not verified'} style={icStyle(t.isPhoneVerified)}><i className="fas fa-phone"></i></span>
        <span title={t.isGstVerified ? 'GST verified' : 'GST not verified'} style={icStyle(t.isGstVerified)}><i className="fas fa-certificate"></i></span>
      </div>
    );
  };
  const renderDashboardTab = () => {
    const recentPayments = payments.slice(0, 5);

    // Use real trend data from API; show empty state if none available
    const visualTrend = stats.trend && stats.trend.length > 0 ? stats.trend : [];

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
          <div className="card card--lift" onClick={() => setShowRevenueModal(true)} style={{ cursor: 'pointer' }}>
            <div className="stat__top">
              <span className="stat__lbl">TOTAL REVENUE</span>
              <div className="stat__icon stat__icon--g"><i className="fas fa-indian-rupee-sign"></i></div>
            </div>
            <div className="stat__val">₹{stats.revenue ? stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0'}</div>
            <span className="stat__trend up" style={{ fontSize: '11px', marginTop: '6px' }}>
              <i className="fas fa-arrow-up"></i> Lifetime sales ledger
            </span>
          </div>

          <div className="card card--lift" onClick={() => setShowBusinessesModal(true)} style={{ cursor: 'pointer' }}>
            <div className="stat__top">
              <span className="stat__lbl">ACTIVE BUSINESSES</span>
              <div className="stat__icon stat__icon--b"><i className="fas fa-building"></i></div>
            </div>
            <div className="stat__val">{stats.total_users || 0}</div>
            <span className="stat__trend" style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-3)' }}>
              Registered corporate databases
            </span>
          </div>

          <div className="card card--lift" onClick={() => setShowPlansModal(true)} style={{ cursor: 'pointer' }}>
            <div className="stat__top">
              <span className="stat__lbl">SAAS FIXED PLANS</span>
              <div className="stat__icon stat__icon--y"><i className="fas fa-bolt"></i></div>
            </div>
            <div className="stat__val">{stats.total_plans || 0}</div>
            <span className="stat__trend" style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-3)' }}>
              Active feature tiers
            </span>
          </div>

          <div className="card card--lift" onClick={() => setShowSystemHealthModal(true)} style={{ cursor: 'pointer' }}>
            <div className="stat__top">
              <span className="stat__lbl">SYSTEM HEALTH</span>
              <div className="stat__icon stat__icon--r"><i className="fas fa-heartbeat"></i></div>
            </div>
            <div className="stat__val" style={{ color: '#10b981' }}>Online</div>
            <span className="stat__trend up" style={{ fontSize: '11px', marginTop: '6px' }}>
              <i className="fas fa-circle-check"></i> All services running
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
              {visualTrend.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                  <i className="fas fa-chart-line" style={{ fontSize: '32px', marginBottom: '8px', display: 'block', opacity: 0.4 }}></i>
                  <div>No growth trend data yet.</div>
                </div>
              ) : (
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
              )}
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
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{(t.isEmailVerified === 1) ? (t.email || t.username) : maskEmail(t.email || t.username)}</div>
                            {renderVerifyIcons(t)}
                          </div>
                        </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{t.planName || 'No Plan'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.planCycle || 'N/A'}</div>
                        </td>
                      <td>
                        {t.status === 'blocked' ? (
                          <span className="badge badge--red">Blocked</span>
                        ) : t.accountStatus === 'archived' ? (
                          <span className="badge" style={{ backgroundColor: '#475569', color: '#f8fafc' }}>Archived</span>
                        ) : t.accountStatus === 'locked' ? (
                          <span className="badge badge--red">Locked</span>
                        ) : t.accountStatus === 'grace' ? (
                          <span className="badge badge--yellow">Grace Period</span>
                        ) : (
                          <span className="badge badge--green">Active</span>
                        )}
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

  const renderShopsTab = () => {
    // reuse tenants list as shops; allow basic actions: impersonate, verify, block/blacklist
    return (
      <div className="view active">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-3)' }}></i>
            <input 
              type="text" 
              placeholder="Search shops by name or username..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-1)' }}
            />
          </div>
          <select className="fi" style={{ width: '150px', height: '42px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className={`btn ${shopsView === 'list' ? 'btn--primary' : ''}`} onClick={() => setShopsView('list')} title="List view">List</button>
            <button className={`btn ${shopsView === 'grid' ? 'btn--primary' : ''}`} onClick={() => setShopsView('grid')} title="Grid view">Grid</button>
          </div>
          <button className="btn btn--primary" onClick={() => setActiveModal('create-shop')}>Add Shop</button>
        </div>

        {shopsView === 'list' ? (
          <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="tbl">
            <thead>
              <tr>
                <th>SHOP / OWNER</th>
                <th>CONTACT</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-shop" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No shops found.</div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', display: 'grid', placeItems: 'center', color: 'var(--blue)', fontSize: '16px' }}>
                          <i className="fas fa-store"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-1)' }}>{t.bizName || 'Unnamed Shop'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{(t.isEmailVerified === 1) ? (t.email || t.username) : maskEmail(t.email || t.username)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{t.phone || t.email || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{t.address || ''}</div>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'blocked' || t.status === 'blacklisted' ? 'badge--red' : 'badge--green'}`}>
                        {t.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn--sm" onClick={() => loginAsTenant(t)}><i className="fas fa-eye"></i> Simulate</button>
                        
                        <button className="btn btn--sm" onClick={() => { setSelectedTenant(t); setActiveModal('edit-shop'); }}><i className="fas fa-pen"></i> Edit</button>
                        <button className="btn btn--sm" onClick={() => handleToggleStatus(t.username, t.status)}>{t.status === 'active' ? 'Block' : 'Unblock'}</button>
                        <button className="btn btn--sm btn--danger" onClick={() => handleBlacklistShop(t.username)}>Blacklist</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
        ) : (
          <section className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'start' }}>
              {filteredCompanies.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>No shops found.</div>
              ) : (
                filteredCompanies.map(t => (
                  <div key={t._id} style={{ borderRadius: '12px', padding: '18px', background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '180px', boxSizing: 'border-box', overflow: 'visible' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', display: 'grid', placeItems: 'center', color: 'var(--blue)', fontSize: '20px' }}><i className="fas fa-store"></i></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '15px' }}>{t.bizName || 'Unnamed Shop'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(t.isEmailVerified === 1) ? (t.email || t.username) : maskEmail(t.email || t.username)}</div>
                      </div>
                      <div>
                        <span className={`badge ${t.status === 'blocked' || t.status === 'blacklisted' ? 'badge--red' : 'badge--green'}`}>{t.status || 'active'}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.phone || t.email || 'N/A'}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn--sm" onClick={() => loginAsTenant(t)}><i className="fas fa-eye"></i></button>
                      
                      <button className="btn btn--sm" onClick={() => { setSelectedTenant(t); setActiveModal('edit-shop'); }}><i className="fas fa-pen"></i></button>
                      <button className="btn btn--sm" onClick={() => handleToggleStatus(t.username, t.status)}>{t.status === 'active' ? 'Block' : 'Unblock'}</button>
                      <button className="btn btn--sm btn--danger" onClick={() => handleBlacklistShop(t.username)}>Blacklist</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Create / Edit Shop Modal */}
        {activeModal === 'create-shop' && (
          <div className="modal" style={{ display: 'block', zIndex: 2000, pointerEvents: 'auto' }}>
            <div className="modal__top"><h3>Create Shop (Manual)</h3><button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button></div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input className="fi" placeholder="Username" id="new-shop-username" />
              <input className="fi" placeholder="Business / Shop Name" id="new-shop-bizname" />
              <input className="fi" placeholder="Owner Email" id="new-shop-email" />
              <input className="fi" placeholder="Phone" id="new-shop-phone" />
              <input className="fi" placeholder="Password" type="password" id="new-shop-password" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
                <button className="btn btn--primary" onClick={async () => {
                  // build payload from modal fields
                  const payload = {
                    username: document.getElementById('new-shop-username').value,
                    bizName: document.getElementById('new-shop-bizname').value,
                    email: document.getElementById('new-shop-email').value,
                    phone: document.getElementById('new-shop-phone').value,
                    password: document.getElementById('new-shop-password').value
                  };
                  try {
                    const res = await fetch('/api/super/shops', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const text = await res.text();
                    let json = null;
                    try { json = JSON.parse(text); } catch (e) { /* ignore */ }
                    if (res.ok) {
                      // Created successfully - trigger OTP send flow for email verification
                      alert('Shop created. Sending verification OTP to email.');
                      await fetchTenants();
                      setActiveModal(null);
                      try {
                        const otpResp = await sendOtpToEmail(payload.username);
                        let shownCode = null;
                        if (otpResp && otpResp.code) {
                          shownCode = otpResp.code;
                          // show code in dev mode
                          alert('Verification code (dev): ' + shownCode);
                        }
                        const entered = window.prompt('Enter the verification code sent to the shop email');
                        if (entered) {
                          await verifyOtpForEmail(payload.username, entered.trim());
                          alert('Email verified successfully');
                          await fetchTenants();
                        } else {
                          alert('OTP not entered. Email remains unverified.');
                        }
                      } catch (e) {
                        console.error('OTP error', e);
                        alert('Failed to send/verify OTP: ' + (e.message || e));
                      }
                    } else {
                      alert('Failed to create shop: ' + (json && json.message ? json.message : text));
                    }
                  } catch (e) {
                    console.error(e);
                    alert('Error creating shop: ' + (e.message || e));
                  }
                }}>Create</button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'edit-shop' && selectedTenant && (
          <div className="modal" style={{ display: 'block', zIndex: 2000, pointerEvents: 'auto' }}>
            <div className="modal__top"><h3>Edit Shop</h3><button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button></div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <input className="fi" placeholder="Business / Shop Name" defaultValue={selectedTenant.bizName || ''} id="edit-shop-bizname" />
              <input className="fi" placeholder="Owner Email" defaultValue={selectedTenant.email || ''} id="edit-shop-email" />
              <input className="fi" placeholder="Phone" defaultValue={selectedTenant.phone || ''} id="edit-shop-phone" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
                <button className="btn btn--primary" onClick={async () => {
                  const payload = {
                    username: selectedTenant.username,
                    bizName: document.getElementById('edit-shop-bizname').value,
                    email: document.getElementById('edit-shop-email').value,
                    phone: document.getElementById('edit-shop-phone').value
                  };
                  try {
                    const res = await fetch('/api/super/shops', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (res.ok) { setActiveModal(null); await fetchTenants(); } else { alert('Failed to update shop'); }
                  } catch (e) { console.error(e); alert('Error updating shop'); }
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

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
    // Filter plans based on search and status
    const displayedPlans = plans
      .filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = !statusFilter || p.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return (
      <div className="view active">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-3)' }}></i>
              <input 
                type="text" 
                placeholder="Search plans by name..." 
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
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" onClick={handleSeedPlans} disabled={actionLoading}>
              <i className="fas fa-seedling"></i> Seed Default Plans
            </button>
            <button className="btn btn--primary" onClick={() => handleOpenEditPlan(null)}>
              <i className="fas fa-plus"></i> Create Plan
            </button>
          </div>
        </div>

        <section className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>PLAN NAME & DETAILS</th>
                <th>MONTHLY (INR)</th>
                <th>YEARLY (INR)</th>
                <th>STATUS</th>
                <th>ORDER</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {displayedPlans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                    <i className="fas fa-layer-group" style={{ fontSize: '32px', marginBottom: '8px' }}></i>
                    <div>No SaaS plans match your criteria.</div>
                  </td>
                </tr>
              ) : (
                displayedPlans.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: 'var(--text-1)', fontSize: '14px' }}>{p.name}</strong>
                        {p.isFeatured && <span className="badge" style={{ background: '#3b82f6', color: '#fff' }}>Featured</span>}
                        {p.badgeText && <span className="badge" style={{ background: '#8b5cf6', color: '#fff' }}>{p.badgeText}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{p.description || 'No description provided.'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>₹{p.monthlyPrice || p.price || 0}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>₹{p.yearlyPrice || 0}</div>
                      {p.yearlyDiscountPercent > 0 && <div style={{ fontSize: '11px', color: '#10b981' }}>Save {p.yearlyDiscountPercent}%</div>}
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge--green' : p.status === 'archived' ? 'badge--red' : 'badge--blue'}`}>
                        {(p.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-input)', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '12px', color: 'var(--text-2)' }}>
                        {p.displayOrder || 0}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button className="btn btn--sm" title="Edit Plan" onClick={() => handleOpenEditPlan(p)}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn--sm" title="Duplicate Plan" onClick={() => handlePlanAction(p._id, 'duplicate')} disabled={actionLoading}>
                          <i className="fas fa-copy"></i>
                        </button>
                        {p.status === 'active' ? (
                          <button className="btn btn--sm" title="Deactivate" onClick={() => handlePlanAction(p._id, 'deactivate')} disabled={actionLoading}>
                            <i className="fas fa-pause"></i>
                          </button>
                        ) : (
                          <button className="btn btn--sm" title="Activate" style={{ color: '#10b981' }} onClick={() => handlePlanAction(p._id, 'activate')} disabled={actionLoading}>
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        {p.status !== 'archived' ? (
                          <button className="btn btn--sm" title="Archive" style={{ color: '#f59e0b' }} onClick={() => handlePlanAction(p._id, 'archive')} disabled={actionLoading}>
                            <i className="fas fa-box-archive"></i>
                          </button>
                        ) : (
                          <button className="btn btn--sm" title="Restore" style={{ color: '#3b82f6' }} onClick={() => handlePlanAction(p._id, 'restore')} disabled={actionLoading}>
                            <i className="fas fa-arrow-rotate-left"></i>
                          </button>
                        )}
                        <button 
                          className="btn btn--sm" 
                          title="Delete Permanently"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeletePlan(p._id)}
                          disabled={actionLoading}
                        >
                          <i className="fas fa-trash"></i>
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
          <button className="btn btn--primary" onClick={() => setActiveModal('manual-override')} style={{ height: '42px', marginLeft: 'auto' }}>
            <i className="fas fa-plus"></i> Manual Override
          </button>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn--sm btn--primary" onClick={() => handleOpenInvoice(p)}>
                          <i className="fas fa-file-invoice"></i> View Tax Invoice
                        </button>
                        <button className="btn btn--sm btn--danger" onClick={() => { setRefundForm({...refundForm, paymentId: p._id}); setActiveModal('process-refund'); }}>
                          <i className="fas fa-undo"></i> Refund
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

  const renderSettingsTab = () => {
    return (
      <div className="view active">
        <div className="two-col">
          {/* Left Column: All Settings Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Gateway & Tax Config Form */}
            <div className="card">
              <div className="card__head">Payment Gateway & Tax Configuration</div>
              <form onSubmit={handleSaveGatewayConfig}>
                <div className="fg">
                  <label>Razorpay API Key</label>
                  <input type="text" className="fi" value={gatewayConfig.razorpay_key || ''} onChange={(e) => setGatewayConfig({...gatewayConfig, razorpay_key: e.target.value})} placeholder="rzp_live_..." />
                </div>
                <div className="fg">
                  <label>Stripe API Key</label>
                  <input type="text" className="fi" value={gatewayConfig.stripe_key || ''} onChange={(e) => setGatewayConfig({...gatewayConfig, stripe_key: e.target.value})} placeholder="sk_live_..." />
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>PayU Key</label>
                    <input type="text" className="fi" value={gatewayConfig.payu_key || ''} onChange={(e) => setGatewayConfig({...gatewayConfig, payu_key: e.target.value})} />
                  </div>
                  <div className="fg">
                    <label>UPI ID</label>
                    <input type="text" className="fi" value={gatewayConfig.upi_id || ''} onChange={(e) => setGatewayConfig({...gatewayConfig, upi_id: e.target.value})} placeholder="merchant@upi" />
                  </div>
                </div>
                <div className="fg">
                  <label>GST/Tax Rate (%)</label>
                  <input type="number" className="fi" value={gatewayConfig.gst_rate || ''} onChange={(e) => setGatewayConfig({...gatewayConfig, gst_rate: e.target.value})} placeholder="18" />
                </div>
                <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%' }}>
                  {actionLoading ? 'Saving...' : 'Save Gateway Config'}
                </button>
              </form>
            </div>

            {/* Global SaaS Settings Form */}
            <div className="card" style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="card__head" style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '800', borderBottom: '2px solid var(--border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-sliders" style={{ color: 'var(--blue)' }}></i> Global SaaS Settings
              </div>
              <form onSubmit={handleSaveConfig}>
              
              {/* Set 1: Support & Customer Service Channels */}
              <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-headset" style={{ fontSize: '16px' }}></i> Support & Communication Channels
                </h4>
                <div className="form-row" style={{ margin: 0, gap: '16px', marginBottom: '16px' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Support & Billing Email</label>
                    <input 
                      type="email" 
                      className="fi" 
                      value={systemConfig.support_email} 
                      onChange={(e) => setSystemConfig({...systemConfig, support_email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Support Helpline Number</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.support_call} 
                      onChange={(e) => setSystemConfig({...systemConfig, support_call: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row" style={{ margin: 0, gap: '16px' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Support Chat System URL</label>
                    <input 
                      type="url" 
                      className="fi" 
                      value={systemConfig.help_chat} 
                      onChange={(e) => setSystemConfig({...systemConfig, help_chat: e.target.value})}
                      required
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
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
              </div>

              {/* Set 2: Platform Versioning & Updates */}
              <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'rgba(16, 185, 129, 0.02)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-code-branch" style={{ fontSize: '16px' }}></i> Platform Release & Feature Control
                </h4>
                <div className="form-row" style={{ margin: 0, gap: '16px', alignItems: 'center' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Active Platform Version</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.version} 
                      onChange={(e) => setSystemConfig({...systemConfig, version: e.target.value})}
                      required
                    />
                  </div>
                  <div className="fg" style={{ flex: 1, display: 'flex', gap: '20px', marginTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={systemConfig.force_update === 'true'} onChange={(e) => setSystemConfig({...systemConfig, force_update: e.target.checked ? 'true' : 'false'})} />
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Force App Update</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                      <input type="checkbox" checked={systemConfig.beta_features_enabled === 'true'} onChange={(e) => setSystemConfig({...systemConfig, beta_features_enabled: e.target.checked ? 'true' : 'false'})} />
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Enable Beta Features</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Set 3: System Maintenance Mode */}
              <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'rgba(245, 158, 11, 0.02)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-screwdriver-wrench" style={{ fontSize: '16px' }}></i> Maintenance Operations & Scheduling
                </h4>
                <div className="form-row" style={{ margin: 0, gap: '16px', marginBottom: '16px' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>System Maintenance Mode</label>
                    <select 
                      className="fi" 
                      value={systemConfig.maintenance_mode} 
                      onChange={(e) => setSystemConfig({...systemConfig, maintenance_mode: e.target.value})}
                    >
                      <option value="false">Inactive / Normal Operations</option>
                      <option value="partial">Partial Maintenance (Admins Only)</option>
                      <option value="true">Active / Block Login Portal</option>
                    </select>
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Maintenance Start Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="fi" 
                      value={systemConfig.maintenance_start_time || ''} 
                      onChange={(e) => {
                        const start = e.target.value;
                        const end = systemConfig.maintenance_end_time || '';
                        const formatted = formatMaintenanceSchedule(start, end);
                        setSystemConfig({
                          ...systemConfig,
                          maintenance_start_time: start,
                          maintenance_schedule: formatted
                        });
                      }}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Maintenance End Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="fi" 
                      value={systemConfig.maintenance_end_time || ''} 
                      onChange={(e) => {
                        const start = systemConfig.maintenance_start_time || '';
                        const end = e.target.value;
                        const formatted = formatMaintenanceSchedule(start, end);
                        setSystemConfig({
                          ...systemConfig,
                          maintenance_end_time: end,
                          maintenance_schedule: formatted
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="fg" style={{ marginBottom: '16px' }}>
                  <label>Generated Schedule Preview (Will be displayed to users)</label>
                  <input 
                    type="text" 
                    className="fi" 
                    style={{ background: 'var(--bg-body)', cursor: 'not-allowed' }}
                    value={systemConfig.maintenance_schedule || ''} 
                    readOnly 
                    placeholder="Auto-generated schedule text..."
                  />
                </div>
                <div className="fg" style={{ margin: 0 }}>
                  <label>Maintenance Message to Users</label>
                  <textarea 
                    className="fi" 
                    rows="2"
                    placeholder="Explain why the server is in maintenance..."
                    value={systemConfig.maintenance_message} 
                    onChange={(e) => setSystemConfig({...systemConfig, maintenance_message: e.target.value})}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              {/* Set 4: System Quotas & Limits */}
              <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'rgba(139, 92, 246, 0.02)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-gears" style={{ fontSize: '16px' }}></i> Regional Preferences & System Quotas
                </h4>
                <div className="form-row" style={{ margin: 0, gap: '16px', marginBottom: '16px' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Default Language</label>
                    <select 
                      className="fi" 
                      value={systemConfig.default_language} 
                      onChange={(e) => setSystemConfig({...systemConfig, default_language: e.target.value})}
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Marathi">Marathi</option>
                    </select>
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Default Currency</label>
                    <select 
                      className="fi" 
                      value={systemConfig.default_currency} 
                      onChange={(e) => setSystemConfig({...systemConfig, default_currency: e.target.value})}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Date Format Settings</label>
                    <select 
                      className="fi" 
                      value={systemConfig.default_date_format} 
                      onChange={(e) => setSystemConfig({...systemConfig, default_date_format: e.target.value})}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{ margin: 0, gap: '16px' }}>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>Storage Limit Per Shop (MB)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={systemConfig.shop_storage_limit_mb} 
                      onChange={(e) => setSystemConfig({...systemConfig, shop_storage_limit_mb: e.target.value})}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>File Upload Limit (MB)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={systemConfig.file_upload_limit_mb} 
                      onChange={(e) => setSystemConfig({...systemConfig, file_upload_limit_mb: e.target.value})}
                    />
                  </div>
                  <div className="fg" style={{ flex: 1 }}>
                    <label>API Rate Limit (Reqs/min)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={systemConfig.api_rate_limit_rpm} 
                      onChange={(e) => setSystemConfig({...systemConfig, api_rate_limit_rpm: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Set 5: Broadcast Alerts */}
              <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-bullhorn" style={{ fontSize: '16px' }}></i> Admin Portal Announcements (Banner Alert)
                </h4>
                <div className="fg" style={{ margin: 0 }}>
                  <textarea 
                    className="fi" 
                    rows="2"
                    placeholder="Announce promotions, offers, or billing warnings..."
                    value={systemConfig.broadcast_message} 
                    onChange={(e) => setSystemConfig({...systemConfig, broadcast_message: e.target.value})}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>

              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 'bold' }}>
                {actionLoading ? 'Saving Settings...' : 'Apply Configurations'}
              </button>
            </form>
          </div>

          {/* Platform-Wide Billing & Invoice Defaults */}
          <div className="card" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div className="card__head">Platform-Wide Billing & Invoice Defaults</div>
            <form onSubmit={handleSaveConfig}>
              <div className="form-row">
                <div className="fg">
                  <label>Default GST Rates (Comma separated)</label>
                  <input 
                    type="text" 
                    className="fi" 
                    value={systemConfig.default_gst_rates} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_gst_rates: e.target.value})}
                    placeholder="e.g. 0, 5, 12, 18, 28"
                  />
                </div>
                <div className="fg">
                  <label>Default Payment Terms</label>
                  <input 
                    type="text" 
                    className="fi" 
                    value={systemConfig.default_payment_terms} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_payment_terms: e.target.value})}
                    placeholder="e.g. Net 15, Net 30, Net 60"
                  />
                </div>
              </div>
              <div className="fg">
                <label>Default HSN / SAC Code Master List</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  value={systemConfig.default_hsn_codes} 
                  onChange={(e) => setSystemConfig({...systemConfig, default_hsn_codes: e.target.value})}
                  placeholder="Comma separated master list"
                ></textarea>
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Default Invoice Template</label>
                  <select 
                    className="fi" 
                    value={systemConfig.default_invoice_template} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_invoice_template: e.target.value})}
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="minimalist">Minimalist</option>
                  </select>
                </div>
                <div className="fg">
                  <label>Thermal Print Size</label>
                  <select 
                    className="fi" 
                    value={systemConfig.default_thermal_print_size} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_thermal_print_size: e.target.value})}
                  >
                    <option value="58mm">58mm</option>
                    <option value="80mm">80mm</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Default Unit of Measurement List</label>
                  <input 
                    type="text" 
                    className="fi" 
                    value={systemConfig.default_uom_list} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_uom_list: e.target.value})}
                    placeholder="e.g. pcs, kg, litre, metre"
                  />
                </div>
                <div className="fg">
                  <label>Default Invoice Prefixes</label>
                  <input 
                    type="text" 
                    className="fi" 
                    value={systemConfig.default_invoice_prefixes} 
                    onChange={(e) => setSystemConfig({...systemConfig, default_invoice_prefixes: e.target.value})}
                    placeholder="e.g. INV, BILL, GST"
                  />
                </div>
              </div>
              <div className="fg">
                <label>Default Item Category List</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  value={systemConfig.default_item_categories} 
                  onChange={(e) => setSystemConfig({...systemConfig, default_item_categories: e.target.value})}
                  placeholder="Comma separated categories"
                ></textarea>
              </div>
              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%' }}>
                {actionLoading ? 'Saving Defaults...' : 'Apply Billing Defaults'}
              </button>
            </form>
          </div>

          {/* Platform-Wide Delivery Configuration */}
          <div className="card" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div className="card__head"><i className="fas fa-truck" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Delivery Config (Platform-wide)</div>
            <form onSubmit={handleSaveConfig}>
              <div className="fg">
                <label>Default Delivery Status List</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  value={systemConfig.default_delivery_statuses} 
                  onChange={(e) => setSystemConfig({...systemConfig, default_delivery_statuses: e.target.value})}
                  placeholder="Comma separated statuses e.g. Pending, Assigned, Out for Delivery, Delivered, Failed"
                ></textarea>
              </div>
              <div className="fg">
                <label>Default Failed Delivery Reasons</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  value={systemConfig.default_failed_delivery_reasons} 
                  onChange={(e) => setSystemConfig({...systemConfig, default_failed_delivery_reasons: e.target.value})}
                  placeholder="Comma separated reasons e.g. Customer Unavailable, Address Not Found"
                ></textarea>
              </div>
              <div className="fg">
                <label>Delivery Charge Templates</label>
                <textarea 
                  className="fi" 
                  rows="2"
                  value={systemConfig.default_delivery_charge_templates} 
                  onChange={(e) => setSystemConfig({...systemConfig, default_delivery_charge_templates: e.target.value})}
                  placeholder="Comma separated templates e.g. Flat ₹50, Distance Based, Free Delivery"
                ></textarea>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-link" style={{ color: 'var(--blue)' }}></i> Third-Party Delivery Partner API Keys
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Shiprocket API Key</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.shiprocket_api_key} 
                      onChange={(e) => setSystemConfig({...systemConfig, shiprocket_api_key: e.target.value})}
                      placeholder="Enter Shiprocket API key"
                    />
                  </div>
                  <div className="fg">
                    <label>Delhivery API Key</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.delhivery_api_key} 
                      onChange={(e) => setSystemConfig({...systemConfig, delhivery_api_key: e.target.value})}
                      placeholder="Enter Delhivery API key"
                    />
                  </div>
                </div>
                <div className="fg">
                  <label>Dunzo API Key</label>
                  <input 
                    type="text" 
                    className="fi" 
                    value={systemConfig.dunzo_api_key} 
                    onChange={(e) => setSystemConfig({...systemConfig, dunzo_api_key: e.target.value})}
                    placeholder="Enter Dunzo API key"
                  />
                </div>
              </div>
              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%' }}>
                {actionLoading ? 'Saving Delivery Config...' : 'Apply Delivery Configuration'}
              </button>
            </form>
          </div>

          {/* Global Notification Configuration */}
          <div className="card" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div className="card__head"><i className="fas fa-bell" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>Notification Config</div>
            <form onSubmit={handleSaveConfig}>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-envelope" style={{ color: '#10b981' }}></i> SMTP Email Server Configuration
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>SMTP Host</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.smtp_host} 
                      onChange={(e) => setSystemConfig({...systemConfig, smtp_host: e.target.value})}
                      placeholder="e.g. smtp.gmail.com"
                    />
                  </div>
                  <div className="fg">
                    <label>SMTP Port</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.smtp_port} 
                      onChange={(e) => setSystemConfig({...systemConfig, smtp_port: e.target.value})}
                      placeholder="e.g. 587"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>SMTP Username</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.smtp_user} 
                      onChange={(e) => setSystemConfig({...systemConfig, smtp_user: e.target.value})}
                      placeholder="e.g. noreply@vyapar.com"
                    />
                  </div>
                  <div className="fg">
                    <label>SMTP Password</label>
                    <input 
                      type="password" 
                      className="fi" 
                      value={systemConfig.smtp_pass} 
                      onChange={(e) => setSystemConfig({...systemConfig, smtp_pass: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-comment-sms" style={{ color: '#f59e0b' }}></i> SMS Gateway Configuration
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>SMS Gateway URL</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.sms_gateway_url} 
                      onChange={(e) => setSystemConfig({...systemConfig, sms_gateway_url: e.target.value})}
                      placeholder="e.g. https://api.msg91.com"
                    />
                  </div>
                  <div className="fg">
                    <label>SMS Gateway API Key</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.sms_gateway_api_key} 
                      onChange={(e) => setSystemConfig({...systemConfig, sms_gateway_api_key: e.target.value})}
                      placeholder="Enter SMS API key"
                    />
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fab fa-whatsapp" style={{ color: '#25d366' }}></i> WhatsApp Business API
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>WhatsApp API URL</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={systemConfig.whatsapp_api_url} 
                      onChange={(e) => setSystemConfig({...systemConfig, whatsapp_api_url: e.target.value})}
                      placeholder="e.g. https://graph.facebook.com/v17.0"
                    />
                  </div>
                  <div className="fg">
                    <label>WhatsApp API Token</label>
                    <input 
                      type="password" 
                      className="fi" 
                      value={systemConfig.whatsapp_api_token} 
                      onChange={(e) => setSystemConfig({...systemConfig, whatsapp_api_token: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-mobile-screen-button" style={{ color: '#ef4444' }}></i> Push Notification Service (FCM)
                </div>
                <div className="fg">
                  <label>FCM Server Key</label>
                  <input 
                    type="password" 
                    className="fi" 
                    value={systemConfig.fcm_server_key} 
                    onChange={(e) => setSystemConfig({...systemConfig, fcm_server_key: e.target.value})}
                    placeholder="Enter Firebase Cloud Messaging server key"
                  />
                </div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-file-lines" style={{ color: '#3b82f6' }}></i> Default Notification Templates
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Payment Reminder Template</label>
                    <textarea 
                      className="fi" 
                      rows="2"
                      value={systemConfig.template_payment_reminder} 
                      onChange={(e) => setSystemConfig({...systemConfig, template_payment_reminder: e.target.value})}
                      placeholder="Use {amount}, {date} placeholders"
                    ></textarea>
                  </div>
                  <div className="fg">
                    <label>Invoice Share Template</label>
                    <textarea 
                      className="fi" 
                      rows="2"
                      value={systemConfig.template_invoice_share} 
                      onChange={(e) => setSystemConfig({...systemConfig, template_invoice_share: e.target.value})}
                      placeholder="Use {invoice_number} placeholders"
                    ></textarea>
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Low Stock Alert Template</label>
                    <textarea 
                      className="fi" 
                      rows="2"
                      value={systemConfig.template_low_stock} 
                      onChange={(e) => setSystemConfig({...systemConfig, template_low_stock: e.target.value})}
                      placeholder="Use {item_name} placeholders"
                    ></textarea>
                  </div>
                  <div className="fg">
                    <label>Subscription Expiry Template</label>
                    <textarea 
                      className="fi" 
                      rows="2"
                      value={systemConfig.template_subscription_expiry} 
                      onChange={(e) => setSystemConfig({...systemConfig, template_subscription_expiry: e.target.value})}
                      placeholder="Use {days_left} placeholders"
                    ></textarea>
                  </div>
                </div>
              </div>
              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%' }}>
                {actionLoading ? 'Saving Notification Config...' : 'Apply Notification Configuration'}
              </button>
            </form>
          </div>

          {/* Legal & Policy Configuration */}
          <div className="card" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div className="card__head"><i className="fas fa-scale-balanced" style={{ marginRight: '8px', color: '#10b981' }}></i>Legal & Policy</div>
            <form onSubmit={handleSaveConfig}>
              <div className="fg">
                <label>Terms & Conditions Content</label>
                <textarea 
                  className="fi" 
                  rows="3"
                  value={systemConfig.policy_terms} 
                  onChange={(e) => setSystemConfig({...systemConfig, policy_terms: e.target.value})}
                  placeholder="Enter global terms and conditions..."
                ></textarea>
              </div>
              <div className="fg">
                <label>Privacy Policy Content</label>
                <textarea 
                  className="fi" 
                  rows="3"
                  value={systemConfig.policy_privacy} 
                  onChange={(e) => setSystemConfig({...systemConfig, policy_privacy: e.target.value})}
                  placeholder="Enter global privacy policy..."
                ></textarea>
              </div>
              <div className="fg">
                <label>Refund Policy Content</label>
                <textarea 
                  className="fi" 
                  rows="3"
                  value={systemConfig.policy_refund} 
                  onChange={(e) => setSystemConfig({...systemConfig, policy_refund: e.target.value})}
                  placeholder="Enter global refund policy..."
                ></textarea>
              </div>
              <div className="form-row">
                <div className="fg" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={systemConfig.gdpr_compliance_enabled === 'true'} onChange={(e) => setSystemConfig({...systemConfig, gdpr_compliance_enabled: e.target.checked ? 'true' : 'false'})} />
                    <span style={{ fontWeight: '600' }}>Enable GDPR / Data Compliance Tools</span>
                  </label>
                </div>
                <div className="fg">
                  <label>Data Retention Policy (Days)</label>
                  <input 
                    type="number" 
                    className="fi" 
                    value={systemConfig.data_retention_days} 
                    onChange={(e) => setSystemConfig({...systemConfig, data_retention_days: e.target.value})}
                    placeholder="e.g. 1095 for 3 years"
                  />
                </div>
              </div>
              <button className="btn btn--primary" type="submit" disabled={actionLoading} style={{ width: '100%', marginTop: '16px' }}>
                {actionLoading ? 'Saving Legal & Policy Config...' : 'Apply Legal & Policy Configuration'}
              </button>
            </form>
          </div>

          </div> {/* End of Left Column */}

          {/* Right Column: Helper & Checklist Panels */}
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
          </div> {/* End of Right Column */}
        </div>
      </div>
    );
  };

  const renderCouponsTab = () => {
    return (
      <div className="view active">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Discount & Coupon Codes</h2>
          <button className="btn btn--primary" onClick={() => setActiveModal('create-coupon')}>
            <i className="fas fa-plus"></i> Add New Coupon
          </button>
        </div>
        <div className="card sa-table-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>COUPON CODE</th>
                <th>TYPE</th>
                <th>VALUE</th>
                <th>USAGE</th>
                <th>EXPIRY</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No coupons found.</td></tr>
              ) : (
                coupons.map(c => (
                  <tr key={c._id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.type}</td>
                    <td>{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                    <td>{c.uses} / {c.maxUses || 'Unlimited'}</td>
                    <td>{c.expiry ? new Date(c.expiry).toLocaleDateString() : 'Never'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn--sm btn--danger" onClick={() => handleDeleteCoupon(c._id)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRefundsTab = () => {
    return (
      <div className="view active">
        <div style={{ marginBottom: '20px' }}>
          <h2>Refund Management</h2>
        </div>

        {/* 1. Pending / Requested Refunds */}
        <div className="card sa-table-card" style={{ marginBottom: '30px', padding: '20px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-1)' }}>
            Refund Requests Queue
          </h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>REQUEST DATE</th>
                <th>USERNAME</th>
                <th>PAYMENT ID</th>
                <th>AMOUNT REQUESTED</th>
                <th>REASON</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {refundRequests.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No refund requests in queue.</td></tr>
              ) : (
                refundRequests.map(req => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td><strong>{req.username}</strong></td>
                    <td>VYP-SUB-{req.paymentId ? req.paymentId.substring(0, 8).toUpperCase() : 'N/A'}</td>
                    <td style={{ color: '#f59e0b', fontWeight: 'bold' }}>₹{req.amount}</td>
                    <td>{req.reason}</td>
                    <td>
                      {req.status === 'pending' ? (
                        <span className="badge badge--yellow">Pending</span>
                      ) : req.status === 'approved' ? (
                        <span className="badge badge--green">Approved</span>
                      ) : (
                        <span className="badge badge--red" title={`Reason: ${req.rejectionReason}`}>Rejected</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn--sm btn--primary" 
                            style={{ padding: '4px 10px', fontSize: '12px', background: '#10b981', borderColor: '#059669' }}
                            onClick={() => handleRefundRequestAction(req, 'approve')}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn--sm btn--danger" 
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => {
                              setSelectedRequest(req);
                              setRejectionReason('');
                              setActiveModal('reject-refund-request');
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ) : req.status === 'rejected' ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }} title={req.rejectionReason}>
                          Reason: {req.rejectionReason ? (req.rejectionReason.substring(0, 20) + '...') : 'N/A'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                          Processed by {req.processedBy}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Processed Refunds History Log */}
        <div className="card sa-table-card" style={{ padding: '20px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-1)' }}>
            Completed Refunds Log
          </h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>COMPLETED DATE</th>
                <th>USERNAME</th>
                <th>PAYMENT ID</th>
                <th>AMOUNT REFUNDED</th>
                <th>REASON</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No completed refunds found.</td></tr>
              ) : (
                refunds.map(r => (
                  <tr key={r._id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.username}</td>
                    <td>VYP-SUB-{r.paymentId ? r.paymentId.substring(0, 8).toUpperCase() : 'N/A'}</td>
                    <td style={{ color: '#ef4444', fontWeight: 'bold' }}>₹{r.amount}</td>
                    <td>{r.reason}</td>
                    <td><span className="badge badge--green">Refunded</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRevenueTab = () => {
    return (
      <div className="view active">
        <div style={{ marginBottom: '20px' }}>
          <h2>Revenue Reports</h2>
        </div>
        <div className="card">
           <div className="card__head">Monthly Revenue</div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
             {Object.keys(revenue.monthly || {}).length === 0 ? (
               <div style={{ color: 'var(--text-3)' }}>No data available</div>
             ) : (
               Object.keys(revenue.monthly).sort().reverse().map(month => (
                 <div key={month} style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                   <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{month}</div>
                   <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>₹{revenue.monthly[month].toFixed(2)}</div>
                 </div>
               ))
             )}
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
      case 'shops':
        return renderShopsTab();
      case 'users':
        return renderUsersTab();
      case 'plans':
        return renderPlansTab();
      case 'payments':
        return renderPaymentsTab();
      case 'coupons':
        return renderCouponsTab();
      case 'refunds':
        return renderRefundsTab();
      case 'revenue':
        return renderRevenueTab();
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
      case 'shops': return { title: 'Shop Management', subtitle: 'Create, approve, impersonate and moderate shops.' };
      case 'users': return { title: 'Global Users', subtitle: 'Platform-wide user authentication credentials.' };
      case 'plans': return { title: 'Subscription Management', subtitle: 'Plan Management' };
      case 'payments': return { title: 'Payment History', subtitle: 'Consolidated subscription transaction records.' };
      case 'coupons': return { title: 'Discount & Coupon Codes', subtitle: 'Manage promotional pricing and usage rules.' };
      case 'refunds': return { title: 'Refund Management', subtitle: 'Process and track customer financial reversals.' };
      case 'revenue': return { title: 'Revenue Reports', subtitle: 'Business performance and billing analytics.' };
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
          <div style={{ position: 'relative' }}>
            <button className="topbar__bell" onClick={() => setShowNotifications(!showNotifications)}>
              <i className="fas fa-bell"></i>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="topbar__bell-dot"></span>
              )}
            </button>
            {showNotifications && (
              <div style={{ position: 'absolute', top: '100%', right: '0', width: '320px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notifications</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>Close</span>
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div key={n._id} onClick={() => !n.read && handleMarkNotificationRead(n._id)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(16, 185, 129, 0.05)', cursor: n.read ? 'default' : 'pointer' }}>
                      <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: 'var(--text-1)', marginBottom: '4px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '6px' }}>
                        {new Date(n.createdAt).toLocaleString()} • {n.username}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s' }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ textAlign: 'right' }}>
                <div className="topbar__name" style={{ fontWeight: 'bold' }}>Master System Admin</div>
                <div style={{ fontSize: '10px', color: '#f64e60', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Platform Owner</div>
              </div>
              <img src="https://ui-avatars.com/api/?name=MA&background=f64e60&color=fff" className="topbar__avatar" alt="Avatar" style={{ pointerEvents: 'none' }} />
            </div>

            {showProfileMenu && (
              <div style={{ position: 'absolute', top: '100%', right: '0', width: '240px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '8px', overflow: 'hidden' }}>
                
                {/* Profile Details Header */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="https://ui-avatars.com/api/?name=MA&background=f64e60&color=fff" style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="Avatar" />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-1)' }}>System Admin</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>admin@vyapar.com</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-3)' }}>Role:</span>
                    <span style={{ fontWeight: '600', color: '#10b981' }}>Super Admin</span>
                  </div>
                </div>

                <div 
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-1)', fontWeight: '500', fontSize: '13px', transition: 'background 0.2s' }}
                  onClick={() => { setShowProfileMenu(false); setCurrentView('settings'); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-cog" style={{ color: 'var(--text-3)' }}></i> System Settings
                </div>
                
                <div style={{ borderTop: '1px solid var(--border)' }}></div>

                <div 
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--red)', fontWeight: '600', fontSize: '13px', transition: 'background 0.2s' }}
                  onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <i className="fas fa-sign-out-alt"></i> Logout
                </div>
              </div>
            )}
          </div>
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
      {activeModal && <div className="overlay" style={{ display: 'block', zIndex: 1100, pointerEvents: 'none' }} onClick={() => setActiveModal(null)}></div>}

      {/* 5. Create Coupon Modal */}
      {activeModal === 'create-coupon' && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>Create Discount Coupon</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleCreateCoupon}>
            <div className="fg">
              <label>Coupon Code</label>
              <input type="text" className="fi" required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER50" />
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Discount Type</label>
                <select className="fi" value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value})}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="fg">
                <label>Discount Value</label>
                <input type="number" className="fi" required value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} placeholder="e.g. 50" />
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Expiry Date</label>
                <input type="date" className="fi" value={couponForm.expiry} onChange={e => setCouponForm({...couponForm, expiry: e.target.value})} />
              </div>
              <div className="fg">
                <label>Max Uses</label>
                <input type="number" className="fi" value={couponForm.maxUses} onChange={e => setCouponForm({...couponForm, maxUses: e.target.value})} placeholder="Leave blank for unlimited" />
              </div>
            </div>
            <button className="btn btn--primary" style={{ width: '100%', marginTop: '10px' }} disabled={actionLoading}>
              {actionLoading ? 'Creating...' : 'Create Coupon'}
            </button>
          </form>
        </div>
      )}

      {/* 6. Process Refund Modal */}
      {activeModal === 'process-refund' && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>Process Refund</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleProcessRefund}>
            <div className="fg">
              <label>Payment ID</label>
              <input type="text" className="fi" required value={refundForm.paymentId} onChange={e => setRefundForm({...refundForm, paymentId: e.target.value})} readOnly />
            </div>
            <div className="fg">
              <label>Refund Amount (₹)</label>
              <input type="number" className="fi" required value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: e.target.value})} />
            </div>
            <div className="fg">
              <label>Reason for Refund</label>
              <textarea className="fi" required rows="2" value={refundForm.reason} onChange={e => setRefundForm({...refundForm, reason: e.target.value})}></textarea>
            </div>
            <button className="btn btn--danger" style={{ width: '100%', marginTop: '10px' }} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Issue Refund'}
            </button>
          </form>
        </div>
      )}

      {/* 6.5 Reject Refund Request Modal */}
      {activeModal === 'reject-refund-request' && selectedRequest && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>Reject Refund Request</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleRefundRequestAction(selectedRequest, 'reject', rejectionReason);
          }}>
            <div className="fg">
              <label>Request ID</label>
              <input type="text" className="fi" value={selectedRequest._id} readOnly />
            </div>
            <div className="fg">
              <label>Amount (₹)</label>
              <input type="text" className="fi" value={selectedRequest.amount} readOnly />
            </div>
            <div className="fg">
              <label>Reason for Rejection</label>
              <textarea 
                className="fi" 
                required 
                rows="3" 
                placeholder="State the reason why you are rejecting this refund request..." 
                value={rejectionReason} 
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
            <button className="btn btn--danger" style={{ width: '100%', marginTop: '10px' }} disabled={actionLoading}>
              {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </form>
        </div>
      )}

      {/* 7. Manual Override Modal */}
      {activeModal === 'manual-override' && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal__top">
            <h3>Manual Payment Override</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          <form onSubmit={handleManualOverride}>
            <div className="fg">
              <label>Username / Tenant</label>
              <select className="fi" required value={overrideForm.username} onChange={e => setOverrideForm({...overrideForm, username: e.target.value})}>
                <option value="">Select Tenant</option>
                {tenants.map(t => (
                  <option key={t.username} value={t.username}>{t.bizName} ({t.username})</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Plan Name</label>
                <select className="fi" required value={overrideForm.plan_name} onChange={e => setOverrideForm({...overrideForm, plan_name: e.target.value})}>
                  <option value="">Select Plan</option>
                  {plans.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label>Billing Cycle</label>
                <select className="fi" value={overrideForm.cycle} onChange={e => setOverrideForm({...overrideForm, cycle: e.target.value})}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="fg">
                <label>Amount (₹)</label>
                <input type="number" className="fi" required value={overrideForm.amount} onChange={e => setOverrideForm({...overrideForm, amount: e.target.value})} />
              </div>
              <div className="fg">
                <label>Date</label>
                <input type="date" className="fi" required value={overrideForm.date} onChange={e => setOverrideForm({...overrideForm, date: e.target.value})} />
              </div>
            </div>
            <button className="btn btn--primary" style={{ width: '100%', marginTop: '10px' }} disabled={actionLoading}>
              {actionLoading ? 'Recording...' : 'Record Manual Payment'}
            </button>
          </form>
        </div>
      )}

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
            <div className="form-row">
              <div className="fg">
                <label>Subscription Expiry Date</label>
                <input 
                  type="date" 
                  className="fi" 
                  value={mExpiryDate} 
                  onChange={(e) => setMExpiryDate(e.target.value)} 
                />
              </div>
              <div className="fg" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, marginTop: '24px' }}>
                  <input type="checkbox" checked={mAutoRenew} onChange={(e) => setMAutoRenew(e.target.checked)} />
                  <span style={{ fontWeight: '600' }}>Enable Auto-Renewal</span>
                </label>
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn--sm btn--danger" 
                onClick={async () => {
                  if(!await window.confirm('Cancel/Revoke Subscription?')) return;
                  const res = await fetch('/api/super/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: selectedTenant.username }) });
                  if (res.ok) { setActiveModal(null); await fetchTenants(); }
                }}
              >
                <i className="fas fa-ban"></i> Revoke Subscription / End Trial
              </button>
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
              <i className="fas fa-print"></i> Print / Download PDF Tax Invoice
            </button>
          </div>
        </div>
      )}

      {/* 4. Edit/Create Plan Modal */}
      {activeModal === 'edit-plan' && (
        <div className="modal" style={{ display: 'block', maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="modal__top" style={{ paddingBottom: 0, borderBottom: 'none' }}>
            <h3>{planForm.id ? 'Modify SaaS Offering Plan' : 'Create SaaS Pricing Plan'}</h3>
            <button className="btn--icon" onClick={() => setActiveModal(null)}><i className="fas fa-times"></i></button>
          </div>
          
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', padding: '0 24px' }}>
            <button 
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: planTab === 'general' ? '2px solid #f64e60' : '2px solid transparent', color: planTab === 'general' ? '#f64e60' : 'var(--text-2)', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setPlanTab('general')}
            >General Details</button>
            <button 
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: planTab === 'pricing' ? '2px solid #f64e60' : '2px solid transparent', color: planTab === 'pricing' ? '#f64e60' : 'var(--text-2)', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setPlanTab('pricing')}
            >Pricing & Billing</button>
            <button 
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: planTab === 'modules' ? '2px solid #f64e60' : '2px solid transparent', color: planTab === 'modules' ? '#f64e60' : 'var(--text-2)', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setPlanTab('modules')}
            >Module Access</button>
            <button 
              style={{ padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: planTab === 'limits' ? '2px solid #f64e60' : '2px solid transparent', color: planTab === 'limits' ? '#f64e60' : 'var(--text-2)', fontWeight: '600', cursor: 'pointer' }}
              onClick={() => setPlanTab('limits')}
            >Plan Limits</button>
          </div>

          <form onSubmit={handleSavePlan} style={{ padding: '0 24px 24px 24px' }}>
            {planTab === 'general' && (
              <div>
                <div className="form-row">
                  <div className="fg">
                    <label>Plan Name</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={planForm.name} 
                      onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                      placeholder="e.g. Starter, Premium"
                      required
                    />
                  </div>
                  <div className="fg">
                    <label>Display Order (Sorting)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={planForm.displayOrder} 
                      onChange={(e) => setPlanForm({...planForm, displayOrder: e.target.value})}
                    />
                  </div>
                </div>
                <div className="fg">
                  <label>Description</label>
                  <textarea 
                    className="fi" 
                    rows="2"
                    value={planForm.description} 
                    onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                    placeholder="Short description of who this plan is for"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Badge Text</label>
                    <input 
                      type="text" 
                      className="fi" 
                      value={planForm.badgeText} 
                      onChange={(e) => setPlanForm({...planForm, badgeText: e.target.value})}
                      placeholder="e.g. Most Popular"
                    />
                  </div>
                  <div className="fg">
                    <label>Status</label>
                    <select className="fi" value={planForm.status} onChange={(e) => setPlanForm({...planForm, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={planForm.isFeatured} onChange={(e) => setPlanForm({...planForm, isFeatured: e.target.checked})} />
                    <span style={{ fontWeight: '600' }}>Featured Plan</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                    <input type="checkbox" checked={planForm.isRecommended} onChange={(e) => setPlanForm({...planForm, isRecommended: e.target.checked})} />
                    <span style={{ fontWeight: '600' }}>Recommended Plan</span>
                  </label>
                </div>
              </div>
            )}

            {planTab === 'pricing' && (
              <div>
                <div className="form-row">
                  <div className="fg">
                    <label>Monthly Price (INR)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={planForm.monthlyPrice} 
                      onChange={(e) => setPlanForm({...planForm, monthlyPrice: e.target.value})}
                      placeholder="e.g. 499"
                    />
                  </div>
                  <div className="fg">
                    <label>Yearly Price (INR)</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={planForm.yearlyPrice} 
                      onChange={(e) => setPlanForm({...planForm, yearlyPrice: e.target.value})}
                      placeholder="e.g. 4990"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="fg">
                    <label>Yearly Discount %</label>
                    <input 
                      type="number" 
                      className="fi" 
                      value={planForm.yearlyDiscountPercent} 
                      onChange={(e) => setPlanForm({...planForm, yearlyDiscountPercent: e.target.value})}
                      placeholder="e.g. 16"
                    />
                  </div>
                  <div className="fg">
                    <label>Default Billing Frequency</label>
                    <select 
                      className="fi" 
                      value={planForm.cycle} 
                      onChange={(e) => setPlanForm({...planForm, cycle: e.target.value})}
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="fg">
                  <label>Additional Highlights (Comma separated list)</label>
                  <textarea 
                    className="fi" 
                    rows="2"
                    value={planForm.features} 
                    onChange={(e) => setPlanForm({...planForm, features: e.target.value})}
                    placeholder="e.g. 24/7 Support, Free Setup"
                  ></textarea>
                </div>
              </div>
            )}

            {planTab === 'modules' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {[
                    'Billing & Invoicing', 'Purchase Management', 'Inventory Management',
                    'Party Management', 'Accounting / Khata', 'GST & Tax',
                    'Expense Management', 'Payment Management', 'Offers & Discounts',
                    'Delivery Management', 'Barcode / QR', 'Reports & Analytics',
                    'Staff Management', 'Data Management', 'Notifications & Alerts'
                  ].map(mod => (
                    <div key={mod} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{mod}</span>
                      <select 
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', fontSize: '12px', outline: 'none' }}
                        value={planForm.modules[mod] || 'enabled'}
                        onChange={(e) => setPlanForm({
                          ...planForm,
                          modules: { ...planForm.modules, [mod]: e.target.value }
                        })}
                      >
                        <option value="enabled">Enabled</option>
                        <option value="readonly">Read Only</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {planTab === 'limits' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {[
                    { key: 'maxInvoices', label: 'Max Invoices per Month' },
                    { key: 'maxProducts', label: 'Max Products / Items' },
                    { key: 'maxCustomers', label: 'Max Customers' },
                    { key: 'maxSuppliers', label: 'Max Suppliers' },
                    { key: 'maxStaff', label: 'Max Staff Users' },
                    { key: 'maxBranches', label: 'Max Branches' },
                    { key: 'storageLimit', label: 'Storage Limit (MB)' },
                  ].map(limit => (
                    <div key={limit.key} className="fg" style={{ margin: 0 }}>
                      <label style={{ fontSize: '13px' }}>{limit.label}</label>
                      <input 
                        type="number" 
                        className="fi" 
                        placeholder="Unlimited if empty"
                        value={planForm.limits[limit.key] || ''}
                        onChange={(e) => setPlanForm({
                          ...planForm,
                          limits: { ...planForm.limits, [limit.key]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>Cancel</button>
              <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={actionLoading}>
                {actionLoading ? 'Saving Plan...' : 'Save Plan Product'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* SAAS REVENUE/PAYMENTS DETAIL MODAL */}
      {showRevenueModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '800px', width: '90%' }}>
            <div className="modal__top">
              <h3>SaaS Revenue & Payments</h3>
              <button className="btn--icon" onClick={() => setShowRevenueModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Subscribed User</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount Paid</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Plan Tier</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Payment Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No payment records found.</td></tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-3)' }}>#{p._id}</td>
                        <td style={{ padding: '12px', fontWeight: '700', color: 'var(--text-1)' }}>{p.username}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>₹{p.amount?.toLocaleString()}</td>
                        <td style={{ padding: '12px' }}>{p.plan_name}</td>
                        <td style={{ padding: '12px' }}>{p.date}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}><span className="badge badge--blue">{p.method}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowRevenueModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE BUSINESSES (GENERAL) DETAIL MODAL */}
      {showBusinessesModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '800px', width: '90%' }}>
            <div className="modal__top">
              <h3>Active Corporate Businesses</h3>
              <button className="btn--icon" onClick={() => setShowBusinessesModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Company / Business</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>SaaS Plan</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Expiry Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No active companies found.</td></tr>
                  ) : (
                    tenants.map(t => (
                      <tr key={t.username} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{t.bizName || t.settings?.bizName || 'Unnamed Business'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>@{t.username}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{t.settings?.planName || t.planName || '—'}</td>
                        <td style={{ padding: '12px' }}>{t.settings?.subscriptionExpiry || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span className={`badge ${t.status === 'active' ? 'badge--green' : t.status === 'blocked' ? 'badge--red' : 'badge--yellow'}`}>
                            {t.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowBusinessesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SAAS FIXED PLANS (PLAN MANAGEMENT) DETAIL MODAL */}
      {showPlansModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '800px', width: '90%' }}>
            <div className="modal__top">
              <h3>SaaS Fixed Plans</h3>
              <button className="btn--icon" onClick={() => setShowPlansModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Plan Name & Description</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Monthly Price</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Yearly Price</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No SaaS plans found.</td></tr>
                  ) : (
                    plans.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-1)' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{p.description || 'No description'}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{p.monthlyPrice || p.price || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>₹{p.yearlyPrice || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span className={`badge ${p.status === 'active' ? 'badge--green' : 'badge--red'}`}>
                            {p.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowPlansModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM HEALTH DETAIL MODAL */}
      {showSystemHealthModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '750px', width: '90%' }}>
            <div className="modal__top">
              <h3>Vyapar System Health & Configs</h3>
              <button className="btn--icon" onClick={() => setShowSystemHealthModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '420px', overflowY: 'auto', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Health checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-circle-check" style={{ color: '#10b981' }}></i>
                  <span style={{ fontSize: '13px' }}>Server Connectivity: <b>ONLINE</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-circle-check" style={{ color: '#10b981' }}></i>
                  <span style={{ fontSize: '13px' }}>SSL Handshake: <b>SECURE</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-circle-check" style={{ color: '#10b981' }}></i>
                  <span style={{ fontSize: '13px' }}>Database State: <b>CONNECTED</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-circle-check" style={{ color: '#10b981' }}></i>
                  <span style={{ fontSize: '13px' }}>Audit Logging: <b>ACTIVE</b></span>
                </div>
              </div>

              {/* System Config Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>System Configuration Parameters</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Platform Version:</span>
                    <span style={{ fontWeight: 600 }}>{systemConfig.version || '1.0.0'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Maintenance Mode:</span>
                    <span style={{ fontWeight: 600, color: systemConfig.maintenance_mode === 'true' ? 'var(--red)' : '#10b981' }}>{systemConfig.maintenance_mode === 'true' ? 'ON' : 'OFF'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Storage Limit:</span>
                    <span style={{ fontWeight: 600 }}>{systemConfig.shop_storage_limit_mb || 1024} MB</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Rate Limit:</span>
                    <span style={{ fontWeight: 600 }}>{systemConfig.api_rate_limit_rpm || 60} RPM</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Support Email:</span>
                    <span style={{ fontWeight: 600 }}>{systemConfig.support_email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-3)' }}>Helpline:</span>
                    <span style={{ fontWeight: 600 }}>{systemConfig.support_call || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowSystemHealthModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
