import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DeliveryLogs from '../components/DeliveryLogs';
import NotificationsAnalytics from '../components/NotificationsAnalytics';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
const fmt = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Lightweight CSS Bar Chart — clickable bars
function BarChart({ data, height = 200, onBarClick }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px' }}>No data</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max((d.value / maxVal) * (height - 30), 4);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: onBarClick ? 'pointer' : 'default' }} onClick={() => onBarClick && onBarClick(d)}>
            <div style={{ fontSize: '10px', color: 'var(--text-2)', fontWeight: 600 }}>{d.value > 0 ? (d.isCurrency ? fmt(d.value) : d.value) : ''}</div>
            <div style={{ width: '100%', maxWidth: '44px', height: h, borderRadius: '6px 6px 2px 2px', background: `linear-gradient(180deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)`, transition: 'height 0.5s ease, transform 0.2s ease' }} title={`${d.label}: ${d.isCurrency ? fmt(d.value) : d.value}`} onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'}></div>
            <div style={{ fontSize: '9px', color: 'var(--text-3)', textAlign: 'center', lineHeight: '1.2', maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Lightweight CSS Pie Chart — clickable legend items
function PieChart({ data, size = 180, onSliceClick }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px' }}>No data</div>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumPercent = 0;
  const stops = data.map((d, i) => {
    const start = cumPercent;
    cumPercent += (d.value / total) * 100;
    return `${COLORS[i % COLORS.length]} ${start}% ${cumPercent}%`;
  });
  const bg = `conic-gradient(${stops.join(', ')})`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: onSliceClick ? 'pointer' : 'default', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.2s' }}
            onClick={() => onSliceClick && onSliceClick(d)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }}></div>
            <span style={{ color: 'var(--text-2)' }}>{d.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini sparkline
function Sparkline({ data, height = 50, width = 200 }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - (d.revenue / maxVal) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparkGrad)" />
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// MetricCard helper component
function MetricCard({ title, value, sub, icon, color, onClick }) {
  return (
    <div 
      className="card card--lift" 
      style={{
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '14px', 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      onClick={onClick}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      <div style={{
        width: '44px', 
        height: '44px', 
        borderRadius: '12px', 
        background: `${color}12`, 
        display: 'grid', 
        placeItems: 'center', 
        color, 
        fontSize: '18px', 
        flexShrink: 0
      }}>
        <i className={icon}></i>
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{title}</div>
        {sub && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{sub}</div>}
      </div>
      {onClick && <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)', opacity: 0.5 }}></i>}
    </div>
  );
}

// Shared modal styles
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 3000 };
const modalBox = { background: 'var(--bg-card)', borderRadius: '16px', padding: '28px', width: '95%', maxWidth: '700px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' };
const modalHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };

export default function SADashboard() {
  const { setCurrentView } = useApp();
  const [shopStats, setShopStats] = useState(null);
  const [revStats, setRevStats] = useState(null);

  const [showInvoicesListModal, setShowInvoicesListModal] = useState(false);
  const [showEmployeesListModal, setShowEmployeesListModal] = useState(false);
  const [modalInvoices, setModalInvoices] = useState([]);
  const [modalEmployees, setModalEmployees] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const handleOpenInvoicesModal = async (filterType) => {
    setShowInvoicesListModal(true);
    setInvoicesLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/analytics/invoices');
      if (res.ok) {
        let list = await res.json();
        const todayStr = new Date().toISOString().substring(0, 10);
        const monthStr = todayStr.substring(0, 7);
        if (filterType === 'today') {
          list = list.filter(inv => inv.date === todayStr);
        } else if (filterType === 'month') {
          list = list.filter(inv => inv.date && inv.date.startsWith(monthStr));
        }
        setModalInvoices(list);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleOpenEmployeesModal = async (roleFilter) => {
    setShowEmployeesListModal(true);
    setEmployeesLoading(true);
    try {
      const res = await fetch('/api/super/shop-profile/analytics/employees');
      if (res.ok) {
        let list = await res.json();
        if (roleFilter && roleFilter !== 'all') {
          list = list.filter(emp => emp.role && emp.role.toLowerCase() === roleFilter.toLowerCase());
        }
        setModalEmployees(list);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const [businessStats, setBusinessStats] = useState(null);
  const [staffStats, setStaffStats] = useState(null);
  const [appUsage, setAppUsage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shops');

  // Drill-down state
  const [drillModal, setDrillModal] = useState(null); // { title, icon, color, rows[] }
  const [showDeliveryLogs, setShowDeliveryLogs] = useState(false);
  const [showNotificationsAnalytics, setShowNotificationsAnalytics] = useState(false);
  const [allShops, setAllShops] = useState([]);
  const [allPayments, setAllPayments] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [shopRes, revRes, shopsListRes, paymentsRes] = await Promise.all([
        fetch('/api/super/dashboard/shop-stats'),
        fetch('/api/super/dashboard/revenue-stats'),
        fetch('/api/super/shops'),
        fetch('/api/super/payments')
      ]);
      if (shopRes.ok) setShopStats(await shopRes.json());
      if (revRes.ok) setRevStats(await revRes.json());
      if (shopsListRes.ok) setAllShops(await shopsListRes.json());
      if (paymentsRes.ok) {
        const pData = await paymentsRes.json();
        setAllPayments(Array.isArray(pData) ? pData : pData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);

      fetch('http://localhost:5000/api/super/dashboard/business-stats').then(res => res.json()).then(data => setBusinessStats(data)).catch(console.error);
      fetch('http://localhost:5000/api/super/dashboard/staff-stats').then(res => res.json()).then(data => setStaffStats(data)).catch(console.error);
      fetch('http://localhost:5000/api/super/dashboard/app-usage').then(res => res.json()).then(data => setAppUsage(data)).catch(console.error);

    }
  };

  // --- Drill-down helpers ---
  const getShopDate = (o) => {
    if (o.createdAt) return new Date(o.createdAt).toLocaleDateString('en-IN');
    if (o._id && typeof o._id === 'string' && o._id.length === 24) {
      try { return new Date(parseInt(o._id.substring(0, 8), 16) * 1000).toLocaleDateString('en-IN'); } catch (e) {}
    }
    return 'N/A';
  };

  const openShopDrill = (title, icon, color, filterFn) => {
    const filtered = allShops.filter(filterFn);
    setDrillModal({
      title, icon, color, type: 'shops',
      rows: filtered.map(o => ({
        name: o.bizName || o.settings?.bizName || 'Unnamed',
        username: o.username,
        status: o.status || 'active',
        plan: o.settings?.planName || o.planName || '—',
        expiry: o.settings?.subscriptionExpiry || '—',
        city: o.settings?.city || o.city || '—',
        joined: getShopDate(o)
      }))
    });
  };

  const openPaymentDrill = (title, icon, color, filterFn) => {
    const filtered = allPayments.filter(filterFn);
    setDrillModal({
      title, icon, color, type: 'payments',
      rows: filtered.map(p => ({
        username: p.username || '—',
        plan: p.plan_name || '—',
        amount: fmt(p.amount),
        date: p.date || '—',
        method: p.method || '—',
        status: p.status || p.type || 'paid'
      }))
    });
  };

  // Click handlers for shop metric cards
  const shopCardClick = (label) => {
    const today = new Date();
    switch (label) {
      case 'Total Shops':
        openShopDrill('All Shops', 'fa-store', '#3b82f6', () => true); break;
      case 'Active':
        openShopDrill('Active Shops', 'fa-circle-check', '#10b981', o => o.status === 'active'); break;
      case 'Expired':
        openShopDrill('Expired Shops', 'fa-clock', '#f59e0b', o => {
          const exp = o.settings?.subscriptionExpiry;
          return exp && new Date(exp) < today && o.status === 'active';
        }); break;
      case 'Blocked':
        openShopDrill('Blocked Shops', 'fa-ban', '#ef4444', o => o.status === 'blocked'); break;
      case 'Deleted':
        openShopDrill('Deleted/Merged Shops', 'fa-trash', '#64748b', o => o.status === 'deleted' || o.status === 'merged'); break;
      case 'Suspended':
        openShopDrill('Suspended Shops', 'fa-pause-circle', '#8b5cf6', o => o.status === 'suspended'); break;
      default: break;
    }
  };

  // Click handler for revenue metric cards
  const revCardClick = (label) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const monthStr = todayStr.substring(0, 7);
    const yearStr = todayStr.substring(0, 4);
    const getDate = (p) => p.date || (p.createdAt ? new Date(p.createdAt).toISOString().substring(0, 10) : '');
    switch (label) {
      case "Today's Revenue":
        openPaymentDrill("Today's Payments", 'fa-indian-rupee-sign', '#10b981', p => getDate(p) === todayStr && (parseFloat(p.amount) || 0) > 0); break;
      case 'Monthly Revenue':
        openPaymentDrill('This Month\'s Payments', 'fa-calendar', '#3b82f6', p => getDate(p).startsWith(monthStr) && (parseFloat(p.amount) || 0) > 0); break;
      case 'Yearly Revenue':
        openPaymentDrill('This Year\'s Payments', 'fa-chart-line', '#8b5cf6', p => getDate(p).startsWith(yearStr) && (parseFloat(p.amount) || 0) > 0); break;
      case 'MRR':
        openShopDrill('Monthly Subscribers (MRR)', 'fa-arrows-spin', '#06b6d4', o => {
          const s = o.settings || {};
          return s.planCycle === 'MONTHLY' && s.subscriptionExpiry && new Date(s.subscriptionExpiry) >= new Date() && !s.subscriptionCancelled;
        }); break;
      case 'ARR':
        openShopDrill('Active Subscribers (ARR)', 'fa-rotate', '#ec4899', o => {
          const s = o.settings || {};
          return s.subscriptionExpiry && new Date(s.subscriptionExpiry) >= new Date() && !s.subscriptionCancelled;
        }); break;
      case 'Avg Revenue/Shop':
        openShopDrill('Active Shops (ARPU)', 'fa-store', '#f59e0b', o => {
          const s = o.settings || {};
          return s.subscriptionExpiry && new Date(s.subscriptionExpiry) >= new Date();
        }); break;
      default: break;
    }
  };

  // Click handlers for bottom revenue cards
  const pendingClick = () => openPaymentDrill('Pending Payments', 'fa-clock', '#f59e0b', p => (p.status || '').toLowerCase() === 'pending');
  const renewalClick = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    openShopDrill('Upcoming Renewals', 'fa-calendar-check', '#3b82f6', o => {
      const s = o.settings || {};
      if (!s.subscriptionExpiry || s.subscriptionCancelled) return false;
      const exp = new Date(s.subscriptionExpiry);
      return exp >= today && exp <= endOfMonth;
    });
  };
  const refundClick = () => openPaymentDrill('Refunded Payments', 'fa-rotate-left', '#8b5cf6', p => p.refund_status === 'refunded');
  const failedClick = () => openPaymentDrill('Failed Payments', 'fa-xmark-circle', '#ef4444', p => (p.status || '').toLowerCase() === 'failed');

  // Geo drill-down
  const geoStateDrill = (state) => openShopDrill(`Shops in ${state}`, 'fa-map-location-dot', '#3b82f6', o => (o.settings?.state || o.state || 'Unknown') === state);
  const geoCityDrill = (city) => openShopDrill(`Shops in ${city}`, 'fa-city', '#10b981', o => (o.settings?.city || o.city || 'Unknown') === city);

  // Plan pie click
  const planPieClick = (d) => openShopDrill(`Shops on "${d.label}"`, 'fa-layer-group', '#8b5cf6', o => (o.settings?.planName || o.planName || 'No Plan') === d.label);
  // Type bar click
  const typeBarClick = (d) => openShopDrill(`${d.label} Shops`, 'fa-tags', '#06b6d4', o => (o.settings?.shopType || 'Unknown') === d.label);
  // Revenue-by-plan bar click
  const revPlanBarClick = (d) => openPaymentDrill(`Payments for "${d.label}" Plan`, 'fa-chart-bar', '#8b5cf6', p => (p.plan_name || 'Unknown') === d.label);

  // Registration period click
  const regClick = (period) => {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - 7);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const filterFn = (o) => {
      let ca = o.createdAt || o.settings?.createdAt;
      if (!ca && o._id && typeof o._id === 'string' && o._id.length === 24) {
        try { ca = new Date(parseInt(o._id.substring(0, 8), 16) * 1000).toISOString(); } catch (e) {}
      }
      if (!ca) return false;
      if (period === 'today') return ca.substring(0, 10) === todayStr;
      if (period === 'week') return new Date(ca) >= startOfWeek;
      if (period === 'month') return new Date(ca) >= startOfMonth;
      return false;
    };
    const labels = { today: 'Today', week: 'This Week', month: 'This Month' };
    openShopDrill(`New Shops — ${labels[period]}`, 'fa-user-plus', '#10b981', filterFn);
  };

  // Navigate to user management
  const navToUser = (username) => {
    setDrillModal(null);
    setCurrentView('user-management');
  };

  const handleOpenBusinessDetailModal = async (type, title, icon, color) => {
    try {
      const res = await fetch(`/api/super/dashboard/business-detail-list?type=${type}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        
        let cols = [];
        let rows = [];
        
        if (type === 'purchases') {
          cols = ['Purchase ID', 'Supplier', 'Date', 'Total Amount', 'Status', 'Outstanding', 'Shop'];
          rows = data.map(p => [
            p.invoiceNumber || p.id || '—',
            p.supplier || p.customer || '—',
            p.date || '—',
            '₹' + (p.amount || p.totalAmount || 0).toLocaleString(),
            p.status || 'Pending',
            '₹' + (p.outstanding || 0).toLocaleString(),
            p.username || '—'
          ]);
        } else if (type === 'products') {
          cols = ['SKU/ID', 'Name', 'Category', 'Price', 'Stock', 'Shop'];
          rows = data.map(p => [
            p.sku || p.barcode || '—',
            p.name || '—',
            p.category || '—',
            '₹' + (p.price || p.salePrice || 0).toLocaleString(),
            (p.stock || p.qty || 0).toString(),
            p.username || '—'
          ]);
        } else if (type === 'customers' || type === 'suppliers') {
          cols = ['Party ID', 'Name', 'Phone', 'Email', 'State', 'Balance', 'Shop'];
          rows = data.map(p => [
            p.id || '—',
            p.name || '—',
            p.phone || '—',
            p.email || '—',
            p.state || '—',
            '₹' + (p.balance || 0).toLocaleString(),
            p.username || '—'
          ]);
        } else if (type === 'deliveries') {
          cols = ['Delivery ID', 'Agent', 'Customer', 'Status', 'Date', 'Shop'];
          rows = data.map(d => [
            d.deliveryId || d.id || '—',
            d.deliveryBoyName || d.driverName || '—',
            d.customerName || d.customer || '—',
            d.status || '—',
            d.date || (d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'),
            d.username || '—'
          ]);
        } else if (type === 'expenses') {
          cols = ['Expense ID', 'Category', 'Amount', 'Date', 'Notes', 'Shop'];
          rows = data.map(e => [
            e.expenseId || e.id || '—',
            e.category || '—',
            '₹' + (e.amount || 0).toLocaleString(),
            e.date || '—',
            e.notes || '—',
            e.username || '—'
          ]);
        } else if (type === 'gst') {
          cols = ['Transaction ID', 'Customer/Supplier', 'Date', 'Amount', 'GST Amount', 'Shop'];
          rows = data.map(x => [
            x.id || x.invoiceNumber || '—',
            x.customer || x.supplier || '—',
            x.date || '—',
            '₹' + (x.amount || x.totalAmount || 0).toLocaleString(),
            '₹' + (x.totalTax || x.gstAmount || x.taxAmount || 0).toLocaleString(),
            x.username || '—'
          ]);
        } else if (type === 'credit-notes') {
          cols = ['Credit Note ID', 'Customer', 'Date', 'Amount', 'Status', 'Shop'];
          rows = data.map(x => [
            x.id || x.invoiceNumber || '—',
            x.customer || '—',
            x.date || '—',
            '₹' + (x.amount || x.totalAmount || 0).toLocaleString(),
            x.status || '—',
            x.username || '—'
          ]);
        } else if (type === 'receivables') {
          cols = ['Invoice ID', 'Customer', 'Date', 'Total Amount', 'Outstanding Balance', 'Shop'];
          rows = data.map(x => {
            const amt = parseFloat(x.amount !== undefined ? x.amount : (x.totalAmount !== undefined ? x.totalAmount : (x.total !== undefined ? x.total : 0))) || 0;
            const outstandingVal = parseFloat(x.outstanding) || 0;
            const pd = x.outstanding !== undefined ? (amt - outstandingVal) : (parseFloat(x.paidAmount || x.received || 0) || 0);
            return [
              x.id || x.invoiceNumber || '—',
              x.customer || '—',
              x.date || '—',
              '₹' + amt.toLocaleString(),
              '₹' + (amt - pd).toLocaleString(),
              x.username || '—'
            ];
          });
        } else if (type === 'payables') {
          cols = ['Purchase ID', 'Supplier', 'Date', 'Total Amount', 'Outstanding Balance', 'Shop'];
          rows = data.map(x => {
            const amt = parseFloat(x.amount !== undefined ? x.amount : (x.totalAmount !== undefined ? x.totalAmount : (x.total !== undefined ? x.total : 0))) || 0;
            const outstandingVal = parseFloat(x.outstanding) || 0;
            const pd = x.outstanding !== undefined ? (amt - outstandingVal) : (parseFloat(x.paidAmount || x.paid || 0) || 0);
            return [
              x.id || x.invoiceNumber || '—',
              x.supplier || '—',
              x.date || '—',
              '₹' + amt.toLocaleString(),
              '₹' + (amt - pd).toLocaleString(),
              x.username || '—'
            ];
          });
        }
        
        setDrillModal({
          title, icon, color, type: 'generic', cols, rows
        });
      }
    } catch (err) {
      console.error('Error loading business details:', err);
    }
  };

  const cardStyle = { padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' };
  const metricLabel = { fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' };
  const metricVal = { fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' };
  const iconBox = (color) => ({ width: '44px', height: '44px', borderRadius: '12px', background: `${color}12`, display: 'grid', placeItems: 'center', color, fontSize: '18px', flexShrink: 0 });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
        <div style={{ color: 'var(--text-3)' }}>Loading analytics...</div>
      </div>
    );
  }

  const ss = shopStats || {};
  const rs = revStats || {};

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar">
        <div className="topbar__left">
          <h1>Dashboard & Analytics</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '2px' }}>
            Platform-wide shop performance and revenue analytics. <strong>Click any card</strong> to drill down.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowNotificationsAnalytics(true)}>Notifications Analytics</button>
          <button className="btn" onClick={() => setShowDeliveryLogs(true)}>Delivery Logs</button>
        </div>
      </header>

      <div style={{ marginTop: '20px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border)', marginBottom: '24px', paddingBottom: '8px' }}>
          {[
            { key: 'shops', label: 'Shop Stats', icon: 'fa-store' },
            { key: 'revenue', label: 'Revenue Stats', icon: 'fa-chart-line' },
            { key: 'business', label: 'Business Activity', icon: 'fa-briefcase' },
            { key: 'staff', label: 'Staff Stats', icon: 'fa-user-friends' },
            { key: 'appUsage', label: 'App Usage', icon: 'fa-mobile-screen' }
          ].map(t => (
            <button key={t.key}
              style={{ padding: '12px 16px', background: 'none', border: 'none', color: activeTab === t.key ? 'var(--accent)' : 'var(--text-2)', borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
              onClick={() => setActiveTab(t.key)}
            >
              <i className={`fas ${t.icon}`} style={{ marginRight: '8px' }}></i>{t.label}
            </button>
          ))}
        </div>

        {/* =================== SHOP STATS TAB =================== */}
        {activeTab === 'shops' && ss.totals && (
          <>
            {/* Headline Metrics — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Total Shops', value: ss.totals.total, icon: 'fa-store', color: '#3b82f6' },
                { label: 'Active', value: ss.totals.active, icon: 'fa-circle-check', color: '#10b981' },
                { label: 'Expired', value: ss.totals.expired, icon: 'fa-clock', color: '#f59e0b' },
                { label: 'Blocked', value: ss.totals.blocked, icon: 'fa-ban', color: '#ef4444' },
                { label: 'Deleted', value: ss.totals.deleted, icon: 'fa-trash', color: '#64748b' },
                { label: 'Suspended', value: ss.totals.suspended, icon: 'fa-pause-circle', color: '#8b5cf6' },
              ].map((m, i) => (
                <div key={i} className="card card--lift" style={cardStyle} onClick={() => shopCardClick(m.label)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={iconBox(m.color)}><i className={`fas ${m.icon}`}></i></div>
                  <div>
                    <div style={metricVal}>{m.value}</div>
                    <div style={metricLabel}>{m.label}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)', opacity: 0.5 }}></i>
                </div>
              ))}
            </div>

            {/* Registration + Churn + Expiring Row — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-user-plus" style={{ marginRight: '8px', color: '#10b981' }}></i>New Registrations
                </h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { label: 'Today', val: ss.newRegistrations?.today, period: 'today' },
                    { label: 'This Week', val: ss.newRegistrations?.week, period: 'week' },
                    { label: 'This Month', val: ss.newRegistrations?.month, period: 'month' }
                  ].map((r, i) => (
                    <div key={i} style={{ textAlign: 'center', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                      onClick={() => regClick(r.period)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' }}>{r.val || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase' }}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '20px', cursor: 'pointer' }}
                onClick={() => openShopDrill('Churned Shops', 'fa-chart-pie', '#ef4444', o => {
                  const s = o.settings || {};
                  const today = new Date();
                  return s.subscriptionCancelled === true || (s.subscriptionExpiry && new Date(s.subscriptionExpiry) < today && (today - new Date(s.subscriptionExpiry)) > 30 * 24 * 3600 * 1000);
                })}>
                <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-chart-pie" style={{ marginRight: '8px', color: '#ef4444' }}></i>Churn
                </h4>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{ss.churn?.churnRate || '0.0'}%</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>CHURN RATE</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-1)' }}>{ss.churn?.churned || 0}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>CHURNED SHOPS</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-hourglass-half" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Expiring Soon
                </h4>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {[
                    { label: 'THIS WEEK', val: ss.expiring?.week, days: 7, color: '#f59e0b' },
                    { label: 'THIS MONTH', val: ss.expiring?.month, days: 30, color: 'var(--text-1)' }
                  ].map((e, i) => (
                    <div key={i} style={{ textAlign: 'center', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}
                      onClick={() => {
                        const today = new Date();
                        const end = new Date(today); end.setDate(today.getDate() + e.days);
                        openShopDrill(`Expiring ${e.label.toLowerCase()}`, 'fa-hourglass-half', '#f59e0b', o => {
                          const exp = o.settings?.subscriptionExpiry;
                          if (!exp) return false;
                          const d = new Date(exp);
                          return d >= today && d <= end;
                        });
                      }}
                      onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: e.color }}>{e.val || 0}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{e.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Plan Distribution (Pie) + Shops by Type (Bar) — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-chart-pie" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>Shops by Plan <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 400 }}>click legend</span>
                </h4>
                <PieChart data={ss.byPlan ? Object.entries(ss.byPlan).map(([k, v]) => ({ label: k, value: v })) : []} onSliceClick={planPieClick} />
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-tags" style={{ marginRight: '8px', color: '#06b6d4' }}></i>Shops by Type <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 400 }}>click bars</span>
                </h4>
                <BarChart data={ss.byType ? Object.entries(ss.byType).map(([k, v]) => ({ label: k, value: v })) : []} height={180} onBarClick={typeBarClick} />
              </div>
            </div>

            {/* Geography — CLICKABLE rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-map-location-dot" style={{ marginRight: '8px', color: '#3b82f6' }}></i>Shops by State
                </h4>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {(ss.byState || []).map(([state, count], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.15s' }}
                      onClick={() => geoStateDrill(state)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-1)' }}>{state}</div>
                      <div style={{ flex: 2, background: 'var(--bg-input)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((count / (ss.totals?.total || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '6px' }}></div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)', minWidth: '30px', textAlign: 'right' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-city" style={{ marginRight: '8px', color: '#10b981' }}></i>Top Cities
                </h4>
                <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {(ss.byCity || []).slice(0, 15).map(([city, count], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.15s' }}
                      onClick={() => geoCityDrill(city)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-1)' }}>{city}</div>
                      <div style={{ flex: 2, background: 'var(--bg-input)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((count / (ss.totals?.total || 1)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '6px' }}></div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-1)', minWidth: '30px', textAlign: 'right' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grace Period Alert — CLICKABLE rows */}
            {ss.grace?.count > 0 && (
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                  <i className="fas fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                  {ss.grace.count} Shop(s) in Grace Period — Urgent Attention
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {ss.grace.shops.map((g, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '13px', padding: '8px 12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => navToUser(g.username)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}>
                      <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{g.bizName}</span>
                      <span style={{ color: 'var(--text-3)' }}>@{g.username}</span>
                      <span style={{ marginLeft: 'auto', color: '#ef4444', fontWeight: 600 }}>Expired: {g.expiry}</span>
                      <i className="fas fa-arrow-right" style={{ color: '#ef4444', fontSize: '11px', alignSelf: 'center' }}></i>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* =================== REVENUE STATS TAB =================== */}
        {activeTab === 'revenue' && rs.totals && (
          <>
            {/* Headline Revenue Metrics — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: "Today's Revenue", value: fmt(rs.totals.today), icon: 'fa-indian-rupee-sign', color: '#10b981' },
                { label: 'Monthly Revenue', value: fmt(rs.totals.month), icon: 'fa-calendar', color: '#3b82f6' },
                { label: 'Yearly Revenue', value: fmt(rs.totals.year), icon: 'fa-chart-line', color: '#8b5cf6' },
                { label: 'MRR', value: fmt(rs.mrr), icon: 'fa-arrows-spin', color: '#06b6d4' },
                { label: 'ARR', value: fmt(rs.arr), icon: 'fa-rotate', color: '#ec4899' },
                { label: 'Avg Revenue/Shop', value: fmt(rs.arpu), icon: 'fa-store', color: '#f59e0b' },
              ].map((m, i) => (
                <div key={i} className="card card--lift" style={cardStyle} onClick={() => revCardClick(m.label)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={iconBox(m.color)}><i className={`fas ${m.icon}`}></i></div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-1)' }}>{m.value}</div>
                    <div style={metricLabel}>{m.label}</div>
                  </div>
                  <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)', opacity: 0.5 }}></i>
                </div>
              ))}
            </div>

            {/* Revenue Trend + Revenue by Plan — bar is CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-chart-area" style={{ marginRight: '8px', color: '#3b82f6' }}></i>Revenue Trend (12 Months)
                </h4>
                <Sparkline data={rs.trend || []} height={120} width={400} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-3)' }}>
                  {(rs.trend || []).filter((_, i) => i % 3 === 0).map((d, i) => (
                    <span key={i}>{d.month}</span>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-1)' }}>
                  <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>Revenue by Plan <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 400 }}>click bars</span>
                </h4>
                <BarChart data={rs.byPlan ? Object.entries(rs.byPlan).map(([k, v]) => ({ label: k, value: v, isCurrency: true })) : []} height={180} onBarClick={revPlanBarClick} />
              </div>
            </div>

            {/* Pending / Upcoming / Refunds / Failed — CLICKABLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', cursor: 'pointer', transition: 'transform 0.15s' }} onClick={pendingClick}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Pending Payments</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>{rs.pending?.count || 0}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>Amount: {fmt(rs.pending?.amount)}</div>
              </div>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6', cursor: 'pointer', transition: 'transform 0.15s' }} onClick={renewalClick}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Upcoming Renewals</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6' }}>{rs.upcomingRenewals || 0}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>Due this month</div>
              </div>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6', cursor: 'pointer', transition: 'transform 0.15s' }} onClick={refundClick}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Refunds Issued</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6' }}>{rs.refunds?.count || 0}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>Amount: {fmt(rs.refunds?.amount)}</div>
              </div>
              <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444', cursor: 'pointer', transition: 'transform 0.15s' }} onClick={failedClick}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '8px' }}>Failed Payments</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444' }}>{rs.failedCount || 0}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>Require attention</div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* =================== DRILL-DOWN MODAL =================== */}
      

      {/* Business Activity Tab */}
      {activeTab === 'business' && businessStats && (
        <div className="tab-content fade-in">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <MetricCard title="Invoices Today" value={businessStats.invoices?.today || 0} sub={`Total: ${businessStats.invoices?.totalCount || 0}`} icon="fas fa-file-invoice" color="var(--primary)" onClick={() => handleOpenInvoicesModal('today')} />
            <MetricCard title="Invoices This Month" value={businessStats.invoices?.month || 0} sub={`Total: ${businessStats.invoices?.totalCount || 0}`} icon="fas fa-file-alt" color="#6366f1" onClick={() => handleOpenInvoicesModal('month')} />
            <MetricCard title="Total Sales" value={fmt(businessStats.totalSalesAmt)} sub="Platform wide" icon="fas fa-rupee-sign" color="#10b981" onClick={() => handleOpenInvoicesModal('all')} />
            <MetricCard title="Total Purchases" value={businessStats.purchaseOrders || 0} sub="PO across shops" icon="fas fa-shopping-cart" color="#f59e0b" onClick={() => handleOpenBusinessDetailModal('purchases', 'Total Purchases', 'fa-shopping-cart', '#f59e0b')} />
            <MetricCard title="Total Products" value={businessStats.totalProducts || 0} sub="Listed catalog items" icon="fas fa-box" color="#8b5cf6" onClick={() => handleOpenBusinessDetailModal('products', 'Total Products', 'fa-box', '#8b5cf6')} />
            <MetricCard title="Total Customers" value={businessStats.totalCustomers || 0} sub="Registered platform wide" icon="fas fa-users" color="#06b6d4" onClick={() => handleOpenBusinessDetailModal('customers', 'Total Customers', 'fa-users', '#06b6d4')} />
            <MetricCard title="Total Suppliers" value={businessStats.totalSuppliers || 0} sub="Parties (Suppliers)" icon="fas fa-truck-loading" color="#ec4899" onClick={() => handleOpenBusinessDetailModal('suppliers', 'Total Suppliers', 'fa-truck-loading', '#ec4899')} />
            <MetricCard title="Deliveries" value={businessStats.totalDeliveries || 0} sub="Completed Deliveries" icon="fas fa-motorcycle" color="#84cc16" onClick={() => handleOpenBusinessDetailModal('deliveries', 'Total Deliveries', 'fa-motorcycle', '#84cc16')} />
            <MetricCard title="Total Expenses" value={fmt(businessStats.totalExpenses)} sub="Platform wide" icon="fas fa-wallet" color="#ef4444" onClick={() => handleOpenBusinessDetailModal('expenses', 'Total Expenses', 'fa-wallet', '#ef4444')} />
          </div>
          
          <div className="grid" style={{ marginTop: '24px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Financial Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <MetricCard title="GST Generated" value={fmt(businessStats.totalGst)} sub="Total Taxes" icon="fas fa-percent" color="#3b82f6" onClick={() => handleOpenBusinessDetailModal('gst', 'GST Transactions', 'fa-percent', '#3b82f6')} />
                <MetricCard title="Credit Notes" value={fmt(businessStats.creditNotes)} sub="Issued Notes" icon="fas fa-undo" color="#f59e0b" onClick={() => handleOpenBusinessDetailModal('credit-notes', 'Credit Notes', 'fa-undo', '#f59e0b')} />
                <MetricCard title="Outstanding Receivables" value={fmt(businessStats.outstandingReceivables)} sub="Platform wide" icon="fas fa-hand-holding-usd" color="#ef4444" onClick={() => handleOpenBusinessDetailModal('receivables', 'Outstanding Receivables', 'fa-hand-holding-usd', '#ef4444')} />
                <MetricCard title="Outstanding Payables" value={fmt(businessStats.outstandingPayables)} sub="Platform wide" icon="fas fa-file-invoice-dollar" color="#8b5cf6" onClick={() => handleOpenBusinessDetailModal('payables', 'Outstanding Payables', 'fa-file-invoice-dollar', '#8b5cf6')} />
              </div>
            </div>
            
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Payment Collection Modes</h3>
              {businessStats.paymentModes ? (
                <PieChart data={[
                  { label: 'UPI', value: businessStats.paymentModes.upi },
                  { label: 'Cash', value: businessStats.paymentModes.cash },
                  { label: 'Card', value: businessStats.paymentModes.card },
                  { label: 'Cheque', value: businessStats.paymentModes.cheque }
                ]} onSliceClick={(d) => setDrillModal({ title: 'Payment Mode: ' + d.label, rows: [] })} />
              ) : <p>No data</p>}
            </div>
          </div>
        </div>
      )}

      {/* Staff Stats Tab */}
      {activeTab === 'staff' && staffStats && (
        <div className="tab-content fade-in">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <MetricCard title="Total Staff" value={staffStats.totalStaff || 0} sub="Across all shops" icon="fas fa-user-friends" color="var(--primary)" onClick={() => handleOpenEmployeesModal('all')} />
            <MetricCard title="Cashiers" value={staffStats.byRole?.cashier || 0} sub="Active cashiers" icon="fas fa-cash-register" color="#10b981" onClick={() => handleOpenEmployeesModal('cashier')} />
            <MetricCard title="Accountants" value={staffStats.byRole?.accountant || 0} sub="Active accountants" icon="fas fa-calculator" color="#f59e0b" onClick={() => handleOpenEmployeesModal('accountant')} />
            <MetricCard title="Delivery Boys" value={staffStats.byRole?.delivery_boy || 0} sub="Active drivers" icon="fas fa-motorcycle" color="#8b5cf6" onClick={() => handleOpenEmployeesModal('delivery_boy')} />
          </div>

          <div className="grid" style={{ marginTop: '24px', gridTemplateColumns: '1fr 1fr' }}>
             <div className="card">
               <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Most Active Staff</h3>
               <table className="tbl" style={{ fontSize: '12px', cursor: 'pointer' }}>
                 <thead><tr><th>Staff</th><th>Active Days (30d)</th></tr></thead>
                 <tbody>
                   {(staffStats.mostActive || []).map((s, i) => (
                     <tr key={i} onClick={() => setDrillModal({ title: 'Staff Activity', rows: [] })}>
                       <td>{s.username}</td><td>{s.activeDays} days</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <div className="card">
               <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Login Frequency</h3>
               <table className="tbl" style={{ fontSize: '12px', cursor: 'pointer' }}>
                 <thead><tr><th>Staff</th><th>Total Logins</th></tr></thead>
                 <tbody>
                   {(staffStats.loginFreq || []).map((s, i) => (
                     <tr key={i} onClick={() => setDrillModal({ title: 'Staff Logins', rows: [] })}>
                       <td>{s.username}</td><td>{s.logins}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* App Usage Stats Tab */}
      {activeTab === 'appUsage' && appUsage && (
        <div className="tab-content fade-in">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <MetricCard title="Daily Active Users" value={appUsage.dau || 0} sub="Unique today" icon="fas fa-sun" color="#10b981" onClick={() => setDrillModal({ title: 'DAU', rows: [] })} />
            <MetricCard title="Monthly Active Users" value={appUsage.mau || 0} sub="Unique 30 days" icon="fas fa-calendar-alt" color="var(--primary)" onClick={() => setDrillModal({ title: 'MAU', rows: [] })} />
            <MetricCard title="Inactive Shops" value={appUsage.inactiveRiskCount || 0} sub="0 activity in 30d" icon="fas fa-skull-crossbones" color="#ef4444" onClick={() => setDrillModal({ title: 'Inactive Shops (Churn Risk)', rows: (appUsage.inactiveShops||[]).map(x=>({name:x})) })} />
            <MetricCard title="Avg Session Duration" value={(appUsage.avgSessionMinutes || 0) + ' min'} sub="Based on activity span" icon="fas fa-clock" color="#8b5cf6" onClick={() => setDrillModal({ title: 'Session Duration', rows: [] })} />
          </div>

          <div className="grid" style={{ marginTop: '24px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Peak Usage Analytics (Hour-wise)</h3>
              <BarChart data={Object.entries(appUsage.hourUsage || {}).map(([hr, count]) => ({ label: hr + ':00', value: count })).sort((a,b) => parseInt(a.label) - parseInt(b.label))} onBarClick={(d) => setDrillModal({ title: 'Peak Hour: ' + d.label, rows: [] })} />
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Feature Usage Stats</h3>
              <table className="tbl" style={{ fontSize: '12px', cursor: 'pointer' }}>
                <thead><tr><th>Feature / Module</th><th>Usage Count</th></tr></thead>
                <tbody>
                  {Object.entries(appUsage.featureUsage || {}).sort((a,b) => b[1]-a[1]).slice(0, 8).map(([f, count], i) => (
                    <tr key={i} onClick={() => setDrillModal({ title: 'Feature: ' + f, rows: [] })}>
                      <td>{f}</td><td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Most Used Modules Per Shop */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Most Used Modules Per Shop</h3>
            {(appUsage.modulesPerShop || []).length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead><tr><th>#</th><th>Shop</th><th>Top Module</th><th>Usage Count</th></tr></thead>
                  <tbody>
                    {(appUsage.modulesPerShop || []).map((s, i) => (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setDrillModal({ title: 'Shop: ' + s.shop + ' — ' + s.topModule, rows: [] })}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.shop}</td>
                        <td><span style={{ background: '#3b82f622', color: '#3b82f6', padding: '2px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>{s.topModule}</span></td>
                        <td>{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px' }}>No module usage data</div>}
          </div>

          {/* Most Used Invoice Types + Most Used Payment Modes */}
          <div className="grid" style={{ marginTop: '24px', gridTemplateColumns: '1fr 1fr' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Most Used Invoice Types</h3>
              {appUsage.invoiceTypes && Object.keys(appUsage.invoiceTypes).length > 0 ? (
                <PieChart data={Object.entries(appUsage.invoiceTypes).sort((a,b) => b[1]-a[1]).map(([label, value]) => ({ label, value }))} onSliceClick={(d) => setDrillModal({ title: 'Invoice Type: ' + d.label, rows: [] })} />
              ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px' }}>No invoice type data</div>}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Most Used Payment Modes (Platform-wide)</h3>
              {appUsage.paymentModes && Object.keys(appUsage.paymentModes).length > 0 ? (
                <PieChart data={Object.entries(appUsage.paymentModes).sort((a,b) => b[1]-a[1]).map(([label, value]) => ({ label, value }))} onSliceClick={(d) => setDrillModal({ title: 'Payment Mode: ' + d.label, rows: [] })} />
              ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px' }}>No payment mode data</div>}
            </div>
          </div>

          {/* Churn Risk: Shops Not Using Certain Modules */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '15px', color: '#ef4444' }}><i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>Churn Risk: Shops Not Using Key Modules</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>Shops with zero activity in the last 30 days — high risk of churn.</p>
            {(appUsage.inactiveShops || []).length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead><tr><th>#</th><th>Shop Username</th><th>Risk Level</th></tr></thead>
                  <tbody>
                    {(appUsage.inactiveShops || []).map((shop, i) => (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setDrillModal({ title: 'Inactive Shop: ' + shop, rows: [] })}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{shop}</td>
                        <td><span style={{ background: '#ef444422', color: '#ef4444', padding: '2px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>High Risk</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '30px', background: 'var(--bg-input)', borderRadius: '10px' }}><i className="fas fa-check-circle" style={{ fontSize: '24px', color: '#10b981', display: 'block', marginBottom: '8px' }}></i>All shops have recent activity — no churn risk detected.</div>}
          </div>
        </div>
      )}

      {drillModal && (
        <div style={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}>
          <div style={modalBox}>
            <div style={modalHead}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={`fas ${drillModal.icon}`} style={{ color: drillModal.color }}></i>
                  {drillModal.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>{drillModal.rows.length} result(s)</div>
              </div>
              <button className="btn--icon" onClick={() => setDrillModal(null)}><i className="fas fa-times"></i></button>
            </div>

            {drillModal.rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)', background: 'var(--bg-input)', borderRadius: '10px' }}>
                <i className="fas fa-inbox" style={{ fontSize: '28px', marginBottom: '10px', display: 'block' }}></i>
                No records found for this filter.
              </div>
            ) : drillModal.type === 'generic' ? (
              <div style={{ maxHeight: '55vh', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {drillModal.cols.map((col, idx) => (
                        <th key={idx}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drillModal.rows.map((row, idx) => (
                      <tr key={idx}>
                        {row.map((val, cellIdx) => (
                          <td key={cellIdx} style={{ fontSize: '11px', color: 'var(--text-2)', padding: '10px' }}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : drillModal.type === 'shops' ? (
              <div style={{ maxHeight: '55vh', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>SHOP</th>
                      <th>STATUS</th>
                      <th>PLAN</th>
                      <th>EXPIRY</th>
                      <th>CITY</th>
                      <th>JOINED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillModal.rows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>@{r.username}</div>
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'active' ? 'badge--green' : r.status === 'blocked' ? 'badge--red' : 'badge--yellow'}`} style={{ fontSize: '10px' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px' }}>{r.plan}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{r.expiry}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{r.city}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-3)' }}>{r.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ maxHeight: '55vh', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <table className="tbl" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>USER</th>
                      <th>PLAN</th>
                      <th>AMOUNT</th>
                      <th>DATE</th>
                      <th>METHOD</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drillModal.rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>@{r.username}</td>
                        <td style={{ fontSize: '11px' }}>{r.plan}</td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>{r.amount}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{r.date}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-2)' }}>{r.method}</td>
                        <td>
                          <span className={`badge ${r.status === 'failed' ? 'badge--red' : r.status === 'pending' ? 'badge--yellow' : 'badge--green'}`} style={{ fontSize: '10px' }}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeliveryLogs && <DeliveryLogs onClose={() => setShowDeliveryLogs(false)} />}
      {showNotificationsAnalytics && <NotificationsAnalytics onClose={() => setShowNotificationsAnalytics(false)} />}

      {/* INVOICES LIST MODAL */}
      {showInvoicesListModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '800px', width: '90%' }}>
            <div className="modal__top">
              <h3>Detailed Invoices / Sales</h3>
              <button className="btn--icon" onClick={() => setShowInvoicesListModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {invoicesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: '#f64e60' }}></i>
                </div>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Invoice ID</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Mode</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Tenant Shop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalInvoices.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No invoices found</td></tr>
                    ) : (
                      modalInvoices.map(inv => (
                        <tr key={inv._id || inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{inv.id}</td>
                          <td style={{ padding: '12px' }}>{inv.customer || '-'}</td>
                          <td style={{ padding: '12px' }}>{inv.date || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700' }}>₹{inv.amount?.toLocaleString()}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{inv.mode || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${inv.status === 'Paid' ? 'badge--green' : 'badge--yellow'}`}>{inv.status || 'Pending'}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-3)' }}>{inv.username}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowInvoicesListModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEES LIST MODAL */}
      {showEmployeesListModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 3100 }}>
          <div className="modal" style={{ display: 'block', position: 'relative', zIndex: 3101, maxWidth: '700px', width: '90%' }}>
            <div className="modal__top">
              <h3>Active Employees</h3>
              <button className="btn--icon" onClick={() => setShowEmployeesListModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {employeesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '28px', color: '#f64e60' }}></i>
                </div>
              ) : (
                <table className="tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalEmployees.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-3)' }}>No employees found</td></tr>
                    ) : (
                      modalEmployees.map(emp => (
                        <tr key={emp._id || emp.username} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-1)' }}>{emp.username}</td>
                          <td style={{ padding: '12px' }}>{emp.phone || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className="badge badge--gray" style={{ textTransform: 'capitalize' }}>{emp.role || 'Staff'}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`badge ${emp.status === 'active' ? 'badge--green' : 'badge--red'}`}>{emp.status || 'Active'}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn--primary" onClick={() => setShowEmployeesListModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
