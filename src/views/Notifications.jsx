import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Notifications() {
  const { token, user, setCurrentView, dbData } = useApp();
  const username = user?.username || '';

  // Tab views: 'overview', 'config', 'low_stock', 'out_of_stock', 'expiry', 'payment_due'
  const [tab, setTab] = useState('overview');
  const [config, setConfig] = useState(null);
  const [alerts, setAlerts] = useState({
    lowStock: [],
    outOfStock: [],
    expiryAlerts: [],
    paymentDue: [],
    overdueInvoices: [],
    subscriptionAlert: null,
    gstDeadlines: [],
    staffLogins: []
  });
  const [loading, setLoading] = useState(false);

  // Search/Filters inside tabs
  const [filterQ, setFilterQ] = useState('');

  // Reminder Modal state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reminderChannel, setReminderChannel] = useState('email');
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    fetchCfg();
    fetchActiveAlerts();
  }, []);

  const fetchCfg = async () => {
    try {
      const res = await fetch(`/api/admin/notifications/config?username=${encodeURIComponent(username)}`);
      const j = await res.json();
      if (j.status === 'success') {
        setConfig(j.config);
      } else {
        setConfig(j.config || {
          notifyVia: { email: true, whatsapp: false, sms: false },
          lowStockThreshold: 5
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications/active?username=${encodeURIComponent(username)}`);
      const j = await res.json();
      if (j.status === 'success') {
        setAlerts({
          lowStock: j.alerts?.lowStock || [],
          outOfStock: j.alerts?.outOfStock || [],
          expiryAlerts: j.alerts?.expiryAlerts || [],
          paymentDue: j.alerts?.paymentDue || [],
          overdueInvoices: j.alerts?.overdueInvoices || [],
          subscriptionAlert: j.alerts?.subscriptionAlert || null,
          gstDeadlines: j.alerts?.gstDeadlines || [],
          staffLogins: j.alerts?.staffLogins || []
        });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    try {
      const payload = { username, config };
      const res = await fetch('/api/admin/notifications/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Notification settings updated successfully!');
        fetchActiveAlerts(); // reload alerts under new threshold
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating configuration');
    }
  };

  const triggerTestReminders = async () => {
    try {
      const res = await fetch('/api/admin/notifications/trigger/expiry-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7 })
      });
      const j = await res.json();
      if (j.status === 'success') {
        alert(`Expiry reminder trigger complete. Active reminders: ${j.notified || 0}`);
      } else {
        alert('Failed to trigger scan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendTestAdHoc = async () => {
    try {
      const payload = {
        to: user.email || user.phone || 'merchant@vyapar.com',
        title: 'Test Notification Alert',
        message: 'This is a test immediate alert dispatched from your Vypar merchant profile settings.',
        via: { email: true }
      };
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (j.status === 'success') {
        alert('Test notification dispatched via default channel. Check dry-run logs.');
      } else {
        alert('Dispatch failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error');
    }
  };

  const dispatchReminder = async () => {
    if (!selectedAlert) return;
    setSendingReminder(true);
    try {
      const payload = {
        username,
        partyName: selectedAlert.partyName || selectedAlert.customer,
        email: selectedAlert.email,
        phone: selectedAlert.phone,
        amount: selectedAlert.balanceDue || selectedAlert.balance,
        daysOverdue: selectedAlert.daysOverdue,
        typeRole: selectedAlert.typeRole || 'Customer',
        channel: reminderChannel,
        invoiceNumber: selectedAlert.invoiceNumber || null
      };
      const res = await fetch('/api/admin/notifications/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (j.status === 'success') {
        alert(`Payment reminder sent via ${reminderChannel.toUpperCase()} successfully!`);
        setSelectedAlert(null);
      } else {
        alert('Failed: ' + j.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error sending reminder');
    }
    setSendingReminder(false);
  };

  const dispatchDigest = async () => {
    const summary = `
      <h3>Active Alerts Snapshot</h3>
      <ul>
        <li><strong>Low Stock:</strong> ${alerts.lowStock.length} items</li>
        <li><strong>Out of Stock:</strong> ${alerts.outOfStock.length} items</li>
        <li><strong>Expired/Expiring:</strong> ${alerts.expiryAlerts.length} products</li>
        <li><strong>Overdue Payments:</strong> ${alerts.paymentDue.length} parties</li>
        <li><strong>Overdue Invoices:</strong> ${alerts.overdueInvoices?.length || 0} invoices</li>
        <li><strong>GST Filing:</strong> ${alerts.gstDeadlines?.map(g => `${g.form} due in ${g.daysRemaining} days`).join(', ')}</li>
      </ul>
      <p>Please check the merchant control panel to action these alerts.</p>
    `;

    try {
      const payload = {
        username,
        email: user.email || 'merchant@vyapar.com',
        channel: 'digest',
        digestSummaryHtml: summary
      };
      const res = await fetch('/api/admin/notifications/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json();
      if (j.status === 'success') {
        alert('Digest email dispatched successfully to: ' + (user.email || 'merchant@vyapar.com'));
      } else {
        alert('Digest dispatch failed: ' + j.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error dispatching digest');
    }
  };

  const handleRestock = (product) => {
    const parties = dbData?.parties || [];
    const purchases = dbData?.purchases || [];
    let supplierName = '';

    // 1st Preference: Find the most recent historical supplier for this product
    const productPurchases = purchases.filter(p => 
      p.active !== false && 
      p.purchaseType !== 'Purchase Order' && 
      p.items && p.items.some(item => (item.name || '').toLowerCase() === (product.name || '').toLowerCase())
    );
    
    if (productPurchases.length > 0) {
      // Sort by date descending to get the most recent one
      const sortedPurchases = productPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
      supplierName = sortedPurchases[0].supplier || '';
    }

    // 2nd Preference: If no history, search for a supplier containing "whole" or "wholesale"
    if (!supplierName) {
      const wholesaleSupplier = parties.find(p => (p.type || '').toLowerCase() === 'supplier' && p.name.toLowerCase().includes('whole'));
      if (wholesaleSupplier) {
        supplierName = wholesaleSupplier.name;
      }
    }

    // 3rd Preference: Any supplier in parties
    if (!supplierName) {
      const anySupplier = parties.find(p => (p.type || '').toLowerCase() === 'supplier');
      supplierName = anySupplier ? anySupplier.name : 'Wholesaler';
    }

    const suggestedQty = product.lowStockLevel ? (product.lowStockLevel * 2) : 10;
    const prefill = {
      supplier: supplierName,
      purchaseType: 'Purchase Order',
      items: [{
        name: product.name,
        qty: suggestedQty,
        rate: product.purchasePrice || product.price || 0,
        taxSlab: product.taxSlab || '18%',
        isTaxInclusive: product.isTaxInclusive === true || product.isTaxInclusive === 'true',
        hsnSac: product.hsnSac || '',
        discount: 0,
        unit: product.unit || 'pcs',
        serialNumbers: []
      }]
    };
    localStorage.setItem('prefill_purchase', JSON.stringify(prefill));
    setCurrentView('purchase');
  };

  const fmt = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (!config) return <div className="card" style={{ padding: '20px' }}>Loading Alerts Engine...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04), rgba(245, 158, 11, 0.02))', borderLeft: '4px solid #ef4444' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-1)' }}>Notification & Alerts Center</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-3)' }}>Real-time inventory thresholds, product batch expiries, and automated party payment dues.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn--outline" onClick={dispatchDigest} style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-envelope-open-text" style={{ color: '#3b82f6' }}></i> Send Digest
            </button>
            <button className="btn btn--primary" onClick={fetchActiveAlerts} style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-rotate" style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}></i> Refresh Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="four-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" onClick={() => setTab('low_stock')} style={{ padding: '16px', cursor: 'pointer', borderLeft: '4px solid #f59e0b', transition: 'transform 0.15s ease' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Low Stock Items</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', color: '#f59e0b', margin: 0, fontWeight: '800' }}>{alerts.lowStock.length}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Threshold: {config.lowStockThreshold}</span>
          </div>
        </div>

        <div className="card" onClick={() => setTab('out_of_stock')} style={{ padding: '16px', cursor: 'pointer', borderLeft: '4px solid #ef4444', transition: 'transform 0.15s ease' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Out of Stock</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', color: '#ef4444', margin: 0, fontWeight: '800' }}>{alerts.outOfStock.length}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Critical Reorders</span>
          </div>
        </div>

        <div className="card" onClick={() => setTab('expiry')} style={{ padding: '16px', cursor: 'pointer', borderLeft: '4px solid #8b5cf6', transition: 'transform 0.15s ease' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Expiry Tracker</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', color: '#8b5cf6', margin: 0, fontWeight: '800' }}>{alerts.expiryAlerts.length}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Expired or 30-Day Dues</span>
          </div>
        </div>

        <div className="card" onClick={() => setTab('payment_due')} style={{ padding: '16px', cursor: 'pointer', borderLeft: '4px solid #2563eb', transition: 'transform 0.15s ease' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Payment Overdues</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', color: '#2563eb', margin: 0, fontWeight: '800' }}>{alerts.paymentDue.length}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Ageing Outstanding</span>
          </div>
        </div>

        <div className="card" onClick={() => setTab('overdue_invoices')} style={{ padding: '16px', cursor: 'pointer', borderLeft: '4px solid #f43f5e', transition: 'transform 0.15s ease' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 'bold', textTransform: 'uppercase' }}>Overdue Invoices</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
            <h3 style={{ fontSize: '24px', color: '#f43f5e', margin: 0, fontWeight: '800' }}>{alerts.overdueInvoices?.length || 0}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>Unpaid Sales</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px', paddingBottom: '10px', flexWrap: 'wrap' }}>
          <button className={`btn ${tab === 'overview' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('overview'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-bell"></i> Alerts Dashboard
          </button>
          <button className={`btn ${tab === 'low_stock' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('low_stock'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-boxes-stacked" style={{ color: '#f59e0b' }}></i> Low Stock ({alerts.lowStock.length})
          </button>
          <button className={`btn ${tab === 'out_of_stock' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('out_of_stock'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-triangle-exclamation" style={{ color: '#ef4444' }}></i> Out of Stock ({alerts.outOfStock.length})
          </button>
          <button className={`btn ${tab === 'expiry' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('expiry'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-hourglass-end" style={{ color: '#8b5cf6' }}></i> Batch Expiries ({alerts.expiryAlerts.length})
          </button>
          <button className={`btn ${tab === 'payment_due' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('payment_due'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-file-invoice-dollar" style={{ color: '#2563eb' }}></i> Payment Overdues ({alerts.paymentDue.length})
          </button>
          <button className={`btn ${tab === 'overdue_invoices' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('overdue_invoices'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-file-invoice" style={{ color: '#f43f5e' }}></i> Overdue Invoices ({alerts.overdueInvoices?.length || 0})
          </button>
          <button className={`btn ${tab === 'gst_deadlines' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('gst_deadlines'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-calendar-days" style={{ color: '#3b82f6' }}></i> GST Deadlines
          </button>
          <button className={`btn ${tab === 'staff_logins' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('staff_logins'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-user-shield" style={{ color: '#10b981' }}></i> Staff Logins ({alerts.staffLogins?.length || 0})
          </button>
          <button className={`btn ${tab === 'config' ? 'btn--primary' : 'btn--outline'}`} onClick={() => { setTab('config'); setFilterQ(''); }} style={{ padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-sliders"></i> Configuration
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-3)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px' }}></i> Syncing active alerts...
          </div>
        )}

        {!loading && (
          <div>
            {/* Overview / Alerts Dashboard Tab */}
            {tab === 'overview' && (
              <div>
                {/* Subscription Expiry Banner */}
                {alerts.subscriptionAlert && (
                  <div className="card" style={{ padding: '16px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(244, 63, 94, 0.04))', borderLeft: '4px solid #8b5cf6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                      <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', marginRight: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        SUBSCRIPTION {alerts.subscriptionAlert.status === 'expired' ? 'EXPIRED' : 'EXPIRY WARNING'}
                      </span>
                      <strong style={{ fontSize: '14px' }}>Plan "{alerts.subscriptionAlert.planName}" is {alerts.subscriptionAlert.status === 'expired' ? 'Expired' : `Expiring in ${alerts.subscriptionAlert.daysRemaining} days`}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Plan expiry date: {alerts.subscriptionAlert.expiryDate}. Please renew to prevent service disruption.</p>
                    </div>
                    <button className="btn btn--sm btn--primary" onClick={() => alert('Redirecting to subscription renewal portal...')} style={{ background: '#8b5cf6', borderColor: '#8b5cf6', fontSize: '12px' }}>Renew Plan</button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', alignItems: 'start' }}>
                  {/* Left Column: Active Alerts Feed */}
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Critical Alerts Log</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {alerts.outOfStock.length === 0 && alerts.lowStock.length === 0 && alerts.expiryAlerts.length === 0 && alerts.paymentDue.length === 0 && (!alerts.overdueInvoices || alerts.overdueInvoices.length === 0) ? (
                        <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-3)', border: '1px dashed var(--border)' }}>
                          <i className="fas fa-check-circle" style={{ fontSize: '36px', color: 'var(--green)', marginBottom: '10px' }}></i>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>All systems operational! No outstanding alerts detected.</p>
                        </div>
                      ) : (
                        <>
                          {/* Critical stockouts first */}
                          {alerts.outOfStock.map((item, idx) => (
                            <div key={`oos-${idx}`} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #ef4444', background: 'var(--bg-1)' }}>
                              <div>
                                <span className="badge" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', marginRight: '8px', fontSize: '10px', fontWeight: 'bold' }}>CRITICAL STOCKOUT</span>
                                <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>SKU: <code>{item.sku}</code> | Item is completely out of stock. Immediate reorder required.</p>
                              </div>
                              <button className="btn btn--sm btn--outline" onClick={() => { setTab('out_of_stock'); }} style={{ fontSize: '12px' }}>Reorder</button>
                            </div>
                          ))}

                          {/* Overdue Invoices */}
                          {alerts.overdueInvoices?.map((item, idx) => (
                            <div key={`inv-${idx}`} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #f43f5e', background: 'var(--bg-1)' }}>
                              <div>
                                <span className="badge" style={{ backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e', marginRight: '8px', fontSize: '10px', fontWeight: 'bold' }}>OVERDUE INVOICE</span>
                                <strong style={{ fontSize: '14px' }}>Invoice {item.invoiceNumber} - {item.customer}</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>
                                  Outstanding: <strong>{fmt(item.balanceDue)}</strong> (Total: {fmt(item.amount)}) | Due: <strong>{item.dueDate}</strong> ({item.daysOverdue} days past due)
                                </p>
                              </div>
                              <button className="btn btn--sm btn--primary" onClick={() => setSelectedAlert({ ...item, partyName: item.customer, balance: item.balanceDue, typeRole: 'Customer' })} style={{ fontSize: '12px', background: '#f43f5e', borderColor: '#f43f5e' }}>Send Reminder</button>
                            </div>
                          ))}

                          {/* Expiry alerts */}
                          {alerts.expiryAlerts.filter(a => a.status === 'expired').map((item, idx) => (
                            <div key={`exp-${idx}`} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #8b5cf6', background: 'var(--bg-1)' }}>
                              <div>
                                <span className="badge" style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', marginRight: '8px', fontSize: '10px', fontWeight: 'bold' }}>EXPIRED STOCK</span>
                                <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>SKU: <code>{item.sku}</code> | Expiration reached on {item.expiryDate}. Mark for disposal.</p>
                              </div>
                              <button className="btn btn--sm btn--outline" onClick={() => { setTab('expiry'); }} style={{ fontSize: '12px' }}>View Expiries</button>
                            </div>
                          ))}

                          {/* Overdue Payments */}
                          {alerts.paymentDue.map((item, idx) => (
                            <div key={`due-${idx}`} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #2563eb', background: 'var(--bg-1)' }}>
                              <div>
                                <span className="badge" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#2563eb', marginRight: '8px', fontSize: '10px', fontWeight: 'bold' }}>{item.typeRole.toUpperCase()} OVERDUE</span>
                                <strong style={{ fontSize: '14px' }}>{item.partyName} ({item.typeRole})</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>
                                  Outstanding: <strong>{fmt(item.balance)}</strong> | Days Overdue: <strong>{item.daysOverdue}</strong> (Limit: {item.creditPeriod} Days)
                                </p>
                              </div>
                              <button className="btn btn--sm btn--primary" onClick={() => setSelectedAlert(item)} style={{ fontSize: '12px' }}>Send Reminder</button>
                            </div>
                          ))}

                          {/* Low Stock alerts */}
                          {alerts.lowStock.map((item, idx) => (
                            <div key={`low-${idx}`} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #f59e0b', background: 'var(--bg-1)' }}>
                              <div>
                                <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', marginRight: '8px', fontSize: '10px', fontWeight: 'bold' }}>LOW STOCK WARNING</span>
                                <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>SKU: <code>{item.sku}</code> | Current Stock: <strong>{item.stock}</strong> (Alert limit: {item.lowStockLevel})</p>
                              </div>
                              <button className="btn btn--sm btn--outline" onClick={() => { setTab('low_stock'); }} style={{ fontSize: '12px' }}>Reorder</button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: GST deadlines & Staff Login Logs */}
                  <div>
                    <h4 style={{ marginBottom: '15px' }}>Filing Deadlines</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {alerts.gstDeadlines?.map((g, idx) => (
                        <div key={idx} className="card" style={{ padding: '12px 16px', background: 'var(--bg-1)', borderLeft: '4px solid #3b82f6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px' }}>{g.form} Deadline</strong>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: g.daysRemaining <= 5 ? 'var(--red)' : 'var(--green)' }}>{g.daysRemaining} days left</span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-3)' }}>Due date: {g.dueDate} ({g.description})</p>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ marginBottom: '15px' }}>Recent Staff Activity</h4>
                    <div className="card" style={{ padding: '15px', background: 'var(--bg-1)' }}>
                      {alerts.staffLogins && alerts.staffLogins.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                          {alerts.staffLogins.slice(0, 5).map((log, idx) => (
                            <div key={idx} style={{ fontSize: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{log.email.split('@')[0]}</span>
                                <span className={`badge ${log.successful ? 'badge--green' : 'badge--red'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                  {log.successful ? 'Success' : 'Fail'}
                                </span>
                              </div>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-3)' }}>
                                IP: {log.ipAddress} | {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                              </p>
                            </div>
                          ))}
                          <button className="btn btn--sm btn--outline" onClick={() => setTab('staff_logins')} style={{ width: '100%', fontSize: '11px', marginTop: '5px' }}>
                            View Full Log
                          </button>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>No staff logins recorded yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Low Stock Tab */}
            {tab === 'low_stock' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Low Stock Warning Logs</h4>
                  <input className="fi" placeholder="Search product..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '200px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Current Stock</th>
                      <th style={{ textAlign: 'right' }}>Low Stock Level</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.lowStock.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.lowStock.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><code>{p.sku}</code></td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>{p.stock}</td>
                          <td style={{ textAlign: 'right' }}>{p.lowStockLevel}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--sm btn--outline" onClick={() => handleRestock(p)}>
                              Create PO
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No low stock products match the filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Out of Stock Tab */}
            {tab === 'out_of_stock' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Out of Stock Catalog list</h4>
                  <input className="fi" placeholder="Search product..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '200px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Current Stock</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.outOfStock.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.outOfStock.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--red)' }}>{p.name}</td>
                          <td><code>{p.sku}</code></td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{p.stock}</td>
                          <td>{fmt(p.price)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--sm btn--primary" onClick={() => handleRestock(p)}>
                              Reorder Now
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No products currently out of stock.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expiry Tab */}
            {tab === 'expiry' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Product Batch Expirations Tracker</h4>
                  <input className="fi" placeholder="Search product..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '200px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Batch/Product Name</th>
                      <th>SKU</th>
                      <th>Type</th>
                      <th>Expiration Date</th>
                      <th>Alert Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.expiryAlerts.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.expiryAlerts.filter(p => !filterQ.trim() || p.name.toLowerCase().includes(filterQ.toLowerCase()) || p.sku.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><code>{p.sku}</code></td>
                          <td>{p.type}</td>
                          <td style={{ fontWeight: 'bold', color: p.status === 'expired' ? 'var(--red)' : '#f59e0b' }}>{p.expiryDate}</td>
                          <td>
                            <span className={`badge ${p.status === 'expired' ? 'badge--red' : 'badge--yellow'}`}>
                              {p.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--sm btn--outline" onClick={() => alert(`Stock clearance action triggered for ${p.name}!`)}>
                              Clearance
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No expired or expiring products found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Payment Due Tab */}
            {tab === 'payment_due' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Outstanding Balance Overdues</h4>
                  <input className="fi" placeholder="Search party..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '200px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Party Name</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Outstanding Amount</th>
                      <th style={{ textAlign: 'right' }}>Overdue Days</th>
                      <th>Credit Terms</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.paymentDue.filter(p => !filterQ.trim() || p.partyName.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.paymentDue.filter(p => !filterQ.trim() || p.partyName.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.partyName}</td>
                          <td>
                            <span className={`badge ${p.typeRole === 'Customer' ? 'badge--green' : 'badge--red'}`}>{p.typeRole}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: p.typeRole === 'Customer' ? 'var(--green)' : 'var(--red)' }}>
                            {fmt(p.balance)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.daysOverdue} Days</td>
                          <td>{p.creditPeriod} Days limit</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--sm btn--primary" onClick={() => setSelectedAlert(p)}>
                              <i className="fas fa-paper-plane"></i> Remind
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No overdue party payments.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Overdue Invoices Tab */}
            {tab === 'overdue_invoices' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Overdue Invoices</h4>
                  <input className="fi" placeholder="Search customer or invoice..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '220px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer Name</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance Due</th>
                      <th style={{ textAlign: 'right' }}>Days Overdue</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.overdueInvoices?.filter(p => !filterQ.trim() || p.customer.toLowerCase().includes(filterQ.toLowerCase()) || p.invoiceNumber.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.overdueInvoices.filter(p => !filterQ.trim() || p.customer.toLowerCase().includes(filterQ.toLowerCase()) || p.invoiceNumber.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.invoiceNumber}</td>
                          <td>{p.customer}</td>
                          <td style={{ color: 'var(--red)', fontWeight: '600' }}>{p.dueDate}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(p.amount)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--red)' }}>{fmt(p.balanceDue)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{p.daysOverdue} Days</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--sm btn--primary" onClick={() => setSelectedAlert({ ...p, partyName: p.customer, balance: p.balanceDue, typeRole: 'Customer' })} style={{ background: '#f43f5e', borderColor: '#f43f5e' }}>
                              <i className="fas fa-paper-plane"></i> Remind
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No overdue invoices found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* GST Deadlines Tab */}
            {tab === 'gst_deadlines' && (
              <div>
                <h4 style={{ marginBottom: '15px' }}>Indian GST Filing Calendar</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {alerts.gstDeadlines?.map((item, idx) => (
                    <div key={idx} className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', background: 'var(--bg-1)', position: 'relative' }}>
                      <span className="badge badge--blue" style={{ position: 'absolute', top: '20px', right: '20px' }}>MONTHLY</span>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-1)' }}>{item.form}</h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-3)' }}>{item.description}</p>
                      <hr style={{ margin: '12px 0', borderColor: 'var(--border)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Upcoming Deadline</span>
                          <strong style={{ fontSize: '15px', color: 'var(--text-2)' }}>{item.dueDate}</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Countdown</span>
                          <strong style={{ fontSize: '20px', color: item.daysRemaining <= 5 ? 'var(--red)' : 'var(--green)' }}>{item.daysRemaining} Days</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}><i className="fas fa-circle-info" style={{ color: '#3b82f6' }}></i> Compliance Information</h5>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                    GSTR-1 includes all details of outward supplies of goods and services and must be filed by the 11th of every month. 
                    GSTR-3B is a monthly self-declaration summary return and must be filed by the 20th of every month. Failing to file on time attracts late fees and interest under Indian GST laws.
                  </p>
                </div>
              </div>
            )}

            {/* Staff Logins Tab */}
            {tab === 'staff_logins' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ margin: 0 }}>Staff Login History & Audits</h4>
                  <input className="fi" placeholder="Search staff email..." value={filterQ} onChange={e => setFilterQ(e.target.value)} style={{ width: '220px', height: '34px', fontSize: '13px' }} />
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Staff Member Email</th>
                      <th>IP Address</th>
                      <th>Browser / OS User Agent</th>
                      <th>Result</th>
                      <th>Login Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.staffLogins?.filter(p => !filterQ.trim() || p.email.toLowerCase().includes(filterQ.toLowerCase())).length > 0 ? (
                      alerts.staffLogins.filter(p => !filterQ.trim() || p.email.toLowerCase().includes(filterQ.toLowerCase())).map((p, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{p.email}</td>
                          <td><code>{p.ipAddress}</code></td>
                          <td style={{ fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.userAgent}>
                            {p.userAgent}
                          </td>
                          <td>
                            <span className={`badge ${p.successful ? 'badge--green' : 'badge--red'}`}>
                              {p.successful ? 'Successful' : 'Failed Attempt'}
                            </span>
                          </td>
                          <td>{new Date(p.timestamp).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '15px', color: 'var(--text-3)' }}>No staff logins recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Configurations Settings Tab */}
            {tab === 'config' && (
              <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Alert Channels & Stock Limits</h4>
                
                {/* Channels selection */}
                <div className="card" style={{ padding: '16px', background: 'var(--bg-1)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-2)' }}>ALERTS DISPATCH CHANNELS</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0 0 12px 0' }}>Configure which automated message integrations are utilized when broadcasting reminders.</p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['email', 'whatsapp', 'sms'].map((k) => {
                      const checked = !!(config.notifyVia && config.notifyVia[k]);
                      return (
                        <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: checked ? 'rgba(37,99,235,0.06)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                          <input type="checkbox" checked={checked} onChange={e => setConfig(c => ({ ...c, notifyVia: { ...(c.notifyVia || {}), [k]: e.target.checked } }))} />
                          <span style={{ textTransform: 'capitalize', fontSize: '13px', fontWeight: 'bold' }}>
                            {k === 'sms' ? 'SMS Text' : (k === 'whatsapp' ? 'WhatsApp Business' : 'Email SMTP')}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Stock Level settings */}
                <div className="card" style={{ padding: '16px', background: 'var(--bg-1)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-2)' }}>LOW STOCK ALERTS THRESHOLD</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0 0 12px 0' }}>Default quantity boundary level. Products with stocks at or below this count trigger warnings.</p>
                  <input type="number" value={config.lowStockThreshold || 5} onChange={e => setConfig(c => ({ ...c, lowStockThreshold: Number(e.target.value) }))} style={{ width: '150px', height: '36px', padding: '6px 10px', fontSize: '14px' }} />
                </div>

                {/* Maintenance trigger hooks */}
                <div className="card" style={{ padding: '16px', background: 'var(--bg-1)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-2)' }}>SYSTEM UTILITIES</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0 0 12px 0' }}>Manually execute cron schedules or send test payloads to inspect your delivery channels.</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn--outline btn--sm" onClick={triggerTestReminders}>
                      Run Expiry Cron Check
                    </button>
                    <button className="btn btn--outline btn--sm" onClick={sendTestAdHoc}>
                      Send Test Alert Msg
                    </button>
                  </div>
                </div>

                <button className="btn btn--primary" onClick={saveConfig} style={{ width: '150px', height: '38px', fontWeight: 'bold', marginTop: '10px' }}>
                  <i className="fas fa-save"></i> Save Settings
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reminder Dispatch Modal */}
      {selectedAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, animation: 'fadeIn 0.15s ease' }}>
          <div className="card" style={{ width: '450px', padding: '24px', position: 'relative' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Send Outstanding Payment Reminder</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '15px' }}>
              Select delivery channel to contact <strong>{selectedAlert.partyName}</strong> regarding overdue balance of <strong>{fmt(selectedAlert.balance)}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="channel" checked={reminderChannel === 'email'} onChange={() => setReminderChannel('email')} />
                <span>Email SMTP (Recipient: <code>{selectedAlert.email}</code>)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="channel" checked={reminderChannel === 'sms'} onChange={() => setReminderChannel('sms')} />
                <span>SMS text (Recipient: <code>{selectedAlert.phone}</code>)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="radio" name="channel" checked={reminderChannel === 'whatsapp'} onChange={() => setReminderChannel('whatsapp')} />
                <span>WhatsApp message (Recipient: <code>{selectedAlert.phone}</code>)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setSelectedAlert(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={dispatchReminder} disabled={sendingReminder}>
                {sendingReminder ? 'Sending...' : 'Dispatch Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
