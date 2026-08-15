import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { Activity, AlertTriangle, BarChart3, Box, CreditCard, Package, Search, Settings, UserPlus, X, Zap } from 'lucide-react';
import UploadFile from '../components/UploadFile';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const badgeClasses = {
  Pending: 'bg-amber-100 text-amber-700',
  Processing: 'bg-sky-100 text-sky-700',
  Completed: 'bg-emerald-100 text-emerald-700',
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, orders, products, todaySalesCount, todayRevenue, pendingOrdersCount, openOrdersCount, recentBills, lowStockAlerts, addCustomer, adjustStock } = useData();
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isEditMode, setIsEditMode] = useState(false);
  const [quickActions, setQuickActions] = useState(['newSale', 'newCustomer', 'addStock', 'viewReports']);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockProduct, setStockProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockReason, setStockReason] = useState('Purchase');
  const [stockDate, setStockDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerModalData, setCustomerModalData] = useState({ name: '', phone: '', email: '', address: '', openingBalance: '' });
  const [drillModal, setDrillModal] = useState(null);

  const QUICK_ACTIONS_KEY = 'vyapar-quick-actions';
  const actionOptions = [
    { id: 'newSale', label: 'New Sale Bill', icon: Zap, variant: 'primary' },
    { id: 'newCustomer', label: 'New Customer', icon: UserPlus, variant: 'outline' },
    { id: 'addStock', label: 'Add Stock', icon: Box, variant: 'outline' },
    { id: 'viewReports', label: 'View Reports', icon: BarChart3, variant: 'outline' },
    { id: 'purchaseOrder', label: 'New Purchase Order', icon: Package, variant: 'outline' },
    { id: 'lowStock', label: 'Low Stock Report', icon: AlertTriangle, variant: 'outline' },
    { id: 'dailySummary', label: 'Daily Summary', icon: Activity, variant: 'outline' },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(QUICK_ACTIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuickActions(parsed);
        }
      } catch {
        // ignore invalid stored value
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(quickActions));
  }, [quickActions]);

  const selectedQuickActions = actionOptions.filter((item) => quickActions.includes(item.id));
  const hiddenQuickActions = actionOptions.filter((item) => !quickActions.includes(item.id));

  const openQuickAction = (id) => {
    switch (id) {
      case 'newSale':
        navigate('/billing/new');
        return;
      case 'newCustomer':
        setShowCustomerModal(true);
        return;
      case 'addStock':
        setShowStockModal(true);
        return;
      case 'viewReports':
        navigate('/reports');
        return;
      case 'purchaseOrder':
        navigate('/orders');
        return;
      case 'lowStock':
        navigate('/reports');
        return;
      case 'dailySummary':
        navigate('/reports/today');
        return;
      default:
        return;
    }
  };

  const handleAddQuickAction = (id) => {
    if (!quickActions.includes(id)) {
      setQuickActions((prev) => [...prev, id]);
      toast.success('Shortcut added');
    }
  };

  const handleRemoveQuickAction = (id) => {
    if (id === 'newSale') {
      toast.error('New Sale Bill cannot be removed');
      return;
    }
    setQuickActions((prev) => prev.filter((item) => item !== id));
    toast.success('Shortcut removed');
  };

  const handleCustomerSave = async (e) => {
    e.preventDefault();
    if (!customerModalData.name.trim() || !customerModalData.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    await addCustomer({
      ...customerModalData,
      openingBalance: Number(customerModalData.openingBalance || 0),
    });
    toast.success('Customer added successfully');
    setCustomerModalData({ name: '', phone: '', email: '', address: '', openingBalance: '' });
    setShowCustomerModal(false);
  };

  const stockOptions = useMemo(() => {
    const query = stockSearch.trim().toLowerCase();
    return products.filter(
      (product) =>
        (product.productName || product.name || '').toLowerCase().includes(query) ||
        (product.sku || '').toLowerCase().includes(query) ||
        (product.barcode || '').toLowerCase().includes(query)
    );
  }, [products, stockSearch]);

  const handleStockSave = () => {
    if (!stockProduct) {
      toast.error('Choose a product to update stock');
      return;
    }
    if (!stockQuantity || Number(stockQuantity) <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    adjustStock(stockProduct._id, Number(stockQuantity), stockReason);
    toast.success('Stock updated');
    setStockProduct(null);
    setStockSearch('');
    setStockQuantity('');
    setStockReason('Purchase');
    setStockDate(new Date().toISOString().slice(0, 10));
    setShowStockModal(false);
  };

  const actionButtonClass = (variant) =>
    variant === 'primary' ? 'btn btn--primary' : 'btn';

  const actionLabelClass = (variant) => '';

  const isCustomizeSelected = isEditMode && hiddenQuickActions.length > 0;

  const isSameDay = (date1, date2) => {
    const a = new Date(date1);
    const b = new Date(date2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, new Date())),
    [invoices]
  );

  const uniqueTodayCustomers = useMemo(
    () => new Set(todayInvoices.map((invoice) => invoice.customerId || invoice.customerName)).size,
    [todayInvoices]
  );

  const lastSaleTime = useMemo(() => {
    if (todayInvoices.length === 0) return 'No sales yet';
    const latest = new Date(Math.max(...todayInvoices.map((invoice) => new Date(invoice.billDate).getTime())));
    return latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [todayInvoices]);

  const todayPaidInvoices = useMemo(
    () => todayInvoices.filter((invoice) => invoice.status?.toLowerCase() === 'completed'),
    [todayInvoices]
  );

  const paidRevenue = useMemo(
    () => todayPaidInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [todayPaidInvoices]
  );

  const paymentTotals = useMemo(() => {
    return todayPaidInvoices.reduce(
      (acc, invoice) => {
        const mode = invoice.paymentMode || 'Cash';
        acc[mode] = (acc[mode] || 0) + (invoice.paidAmount ?? invoice.totalAmount);
        return acc;
      },
      { Cash: 0, UPI: 0, Card: 0 }
    );
  }, [todayPaidInvoices]);

  const pendingRevenue = useMemo(
    () => todayInvoices.reduce((sum, invoice) => (invoice.status?.toLowerCase() !== 'completed' ? sum + invoice.totalAmount : sum), 0),
    [todayInvoices]
  );

  const discountGiven = useMemo(
    () => todayInvoices.reduce((sum, invoice) => sum + (invoice.discount || 0), 0),
    [todayInvoices]
  );

  const overdueOrdersCount = useMemo(() => {
    const twoHoursAgo = Date.now() - 1000 * 60 * 60 * 2;
    return orders.filter((order) => {
      const status = order.status?.toLowerCase();
      if (!['pending', 'processing'].includes(status)) return false;
      const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : null;
      return createdAt ? createdAt < twoHoursAgo : false;
    }).length;
  }, [orders]);

  const outForDeliveryCount = useMemo(
    () => orders.filter((order) => order.status?.toLowerCase() === 'out for delivery').length,
    [orders]
  );

  const monthlyRevenue = useMemo(() => {
    const totals = {};
    invoices.forEach((invoice) => {
      if (invoice.type !== 'sale') return;
      const date = new Date(invoice.billDate);
      const key = `${date.getMonth() + 1}`;
      totals[key] = (totals[key] || 0) + invoice.totalAmount;
    });
    return Object.entries(totals)
      .map(([month, total]) => ({ _id: Number(month), total }))
      .sort((a, b) => a._id - b._id);
  }, [invoices]);

  const filteredBills = useMemo(() => {
    const sorted = [...recentBills].sort((a, b) => {
      return sortOrder === 'asc' ? new Date(a.billDate) - new Date(b.billDate) : new Date(b.billDate) - new Date(a.billDate);
    });
    return sorted.filter((bill) => bill.customerName.toLowerCase().includes(search.toLowerCase()));
  }, [search, sortOrder, recentBills]);

  const processingCount = orders.filter((order) => order.status === 'Processing').length;
  const completedCount = orders.filter((order) => order.status === 'Completed').length;

  const lineData = {
    labels: monthlyRevenue.map((item) => `M${item._id}`),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyRevenue.map((item) => item.total),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: ['Pending', 'Processing', 'Completed'],
    datasets: [
      {
        label: 'Orders',
        data: [pendingOrdersCount, processingCount, completedCount],
        backgroundColor: ['#f59e0b', '#0ea5e9', '#10b981'],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          title="View today's sales"
          onClick={() => {
            setDrillModal({
              title: "Today's Sales Bills",
              cols: ['Bill ID', 'Customer Name', 'Amount', 'Payment Mode', 'Status'],
              rows: todayInvoices.map((inv, idx) => [inv.invoiceNumber || `#${idx + 1001}`, inv.customerName || 'Walk-in Customer', `₹${inv.totalAmount.toLocaleString()}`, inv.paymentMode || 'Cash', inv.status || 'Completed'])
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setDrillModal({
                title: "Today's Sales Bills",
                cols: ['Bill ID', 'Customer Name', 'Amount', 'Payment Mode', 'Status'],
                rows: todayInvoices.map((inv, idx) => [inv.invoiceNumber || `#${idx + 1001}`, inv.customerName || 'Walk-in Customer', `₹${inv.totalAmount.toLocaleString()}`, inv.paymentMode || 'Cash', inv.status || 'Completed'])
              });
            }
          }}
          className="card card--lift cursor-pointer"
        >
          <div className="stat__top">
            <span className="stat__lbl">TODAY'S SALES</span>
            <div className="stat__icon stat__icon--b">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
          </div>
          <div className="stat__val">{todaySalesCount}</div>
          <div className="stat__trend up" style={{ marginTop: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{uniqueTodayCustomers} unique customers • Last sale: {lastSaleTime}</span>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          title="View today's revenue report"
          onClick={() => {
            setDrillModal({
              title: "Today's Revenue Transactions",
              cols: ['Bill ID', 'Customer Name', 'Paid Amount', 'Payment Mode', 'Date'],
              rows: todayPaidInvoices.map((inv, idx) => [inv.invoiceNumber || `#${idx + 1001}`, inv.customerName || 'Walk-in Customer', `₹${(inv.paidAmount ?? inv.totalAmount).toLocaleString()}`, inv.paymentMode || 'Cash', new Date(inv.billDate).toLocaleDateString()])
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setDrillModal({
                title: "Today's Revenue Transactions",
                cols: ['Bill ID', 'Customer Name', 'Paid Amount', 'Payment Mode', 'Date'],
                rows: todayPaidInvoices.map((inv, idx) => [inv.invoiceNumber || `#${idx + 1001}`, inv.customerName || 'Walk-in Customer', `₹${(inv.paidAmount ?? inv.totalAmount).toLocaleString()}`, inv.paymentMode || 'Cash', new Date(inv.billDate).toLocaleDateString()])
              });
            }
          }}
          className="card card--lift cursor-pointer"
        >
          <div className="stat__top">
            <span className="stat__lbl">TODAY'S REVENUE</span>
            <div className="stat__icon stat__icon--g">
              <i className="fas fa-indian-rupee-sign"></i>
            </div>
          </div>
          <div className="stat__val">₹{paidRevenue.toLocaleString()}</div>
          <div className="stat__trend" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-3)' }}>
              <span>Cash: ₹{paymentTotals.Cash.toLocaleString()}</span>
              <span>UPI: ₹{paymentTotals.UPI.toLocaleString()}</span>
              <span>Card: ₹{paymentTotals.Card.toLocaleString()}</span>
            </div>
            <div style={{ color: 'var(--yellow)', fontWeight: 600, fontSize: '11px' }}>₹{pendingRevenue.toLocaleString()} pending</div>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          title="View pending orders"
          onClick={() => {
            const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase()));
            setDrillModal({
              title: 'Active Pending Orders',
              cols: ['Order ID', 'Customer', 'Items', 'Status', 'Date'],
              rows: activeOrders.map(o => [o.orderNumber || o.id || '-', o.customerName || '-', (o.items || []).map(it => `${it.name} x${it.qty}`).join(', '), o.status, new Date(o.createdAt || o.date).toLocaleDateString()])
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status?.toLowerCase()));
              setDrillModal({
                title: 'Active Pending Orders',
                cols: ['Order ID', 'Customer', 'Items', 'Status', 'Date'],
                rows: activeOrders.map(o => [o.orderNumber || o.id || '-', o.customerName || '-', (o.items || []).map(it => `${it.name} x${it.qty}`).join(', '), o.status, new Date(o.createdAt || o.date).toLocaleDateString()])
              });
            }
          }}
          className="card card--lift cursor-pointer"
        >
          <div className="stat__top">
            <span className="stat__lbl">PENDING ORDERS</span>
            <div className="stat__icon stat__icon--y">
              <i className="fas fa-cart-shopping"></i>
            </div>
          </div>
          <div className="stat__val">{openOrdersCount}</div>
          <div className="stat__trend down" style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{overdueOrdersCount} overdue</span>
            <span style={{ color: 'var(--blue)' }}>{outForDeliveryCount} out for delivery</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="badge badge--green" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}>
              <Zap className="h-4 w-4" />
              Quick Actions
            </div>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-3)' }}>Shortcuts to common tasks</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedQuickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => openQuickAction(action.id)}
                  className={actionButtonClass(action.variant)}
                >
                  <Icon className="h-4 w-4" style={{ marginRight: '6px' }} />
                  <span>{action.label}</span>
                  {isEditMode && action.id !== 'newSale' && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700" style={{ pointerEvents: 'auto' }}>
                      <X className="h-3.5 w-3.5" onClick={(event) => { event.stopPropagation(); handleRemoveQuickAction(action.id); }} />
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsEditMode((prev) => !prev)}
              className="btn"
            >
              <Settings className="h-4 w-4" style={{ marginRight: '6px' }} /> Customize
            </button>
          </div>
        </div>
        {isEditMode && (
          <div className="mt-5 card" style={{ background: 'var(--bg-input)' }}>
            <h4 className="text-sm font-semibold">Customize Quick Actions</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {actionOptions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => (quickActions.includes(action.id) ? handleRemoveQuickAction(action.id) : handleAddQuickAction(action.id))}
                  className="btn"
                  style={{
                    justifyContent: 'space-between',
                    width: '100%',
                    background: quickActions.includes(action.id) ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-sidebar)',
                    borderColor: quickActions.includes(action.id) ? 'var(--accent)' : 'var(--border)',
                    color: quickActions.includes(action.id) ? 'var(--accent)' : 'var(--text-2)'
                  }}
                >
                  <span className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </span>
                  <span>{quickActions.includes(action.id) ? 'Visible' : 'Add'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <div>
              <h3 className="text-lg font-semibold">Revenue Analytics</h3>
              <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Monthly growth and sales report.</p>
            </div>
            <div className="badge badge--green">Live</div>
          </div>
          <div className="mt-6 h-72">
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="text-lg font-semibold">Order Status</h3>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginBottom: '16px' }}>Live overview of active orders.</p>
            <div className="mt-6 h-72">
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2 xl:items-stretch">
        <div className="card flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Recent Bills Created</h3>
              <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Search and sort latest invoices.</p>
            </div>
            <div className="topbar__search" style={{ width: 'auto', minWidth: '220px' }}>
              <i className="fas fa-search" style={{ left: '16px' }}></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer..."
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>
          <div className="mt-6 overflow-x-auto flex-1">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, index) => (
                  <tr key={bill._id} onClick={() => navigate(`/billing/invoice/${bill._id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: '600' }}>#{index + 1001}</td>
                    <td>{bill.customerName}</td>
                    <td>₹{bill.totalAmount.toLocaleString()}</td>
                    <td>{bill.paymentMode}</td>
                    <td style={{ color: 'var(--text-2)' }}>{new Date(bill.billDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${bill.status === 'Completed' ? 'badge--green' : bill.status === 'Processing' ? 'badge--blue' : 'badge--yellow'}`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
              <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Products that need restocking.</p>
            </div>
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--yellow)' }} />
          </div>
          <div className="mt-6 flex-1 space-y-4">
            {lowStockAlerts.length === 0 ? (
              <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>All product levels are healthy.</p>
            ) : (
              lowStockAlerts.map((item) => (
                <div key={item._id} className="card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '16px', marginBottom: '12px' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{item.productName || item.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)', marginTop: '4px' }}>Current stock: <strong>{item.stock}</strong></p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>Minimum required: <strong>{item.minimumStock}</strong></p>
                  <span className="badge badge--red mt-2 inline-block">Order immediately</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-2 card">
          <h3 className="text-lg font-semibold">Upload Asset</h3>
          <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Upload images or documents to the server.</p>
          <div className="mt-4">
            <UploadFile />
          </div>
        </div>
      </section>

      {showCustomerModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', zIndex: 1101 }}>
            <div className="modal__top">
              <div>
                <h3 className="text-xl font-semibold">New Customer</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Create a customer and use it immediately in billing.</p>
              </div>
              <button type="button" onClick={() => setShowCustomerModal(false)} className="btn--icon">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCustomerSave} className="mt-6 space-y-4">
              <div className="fg">
                <label>Full Name</label>
                <input
                  value={customerModalData.name}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, name: e.target.value })}
                  placeholder="Enter name"
                  className="fi"
                  required
                />
              </div>
              <div className="fg">
                <label>Phone Number</label>
                <input
                  value={customerModalData.phone}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="fi"
                  required
                />
              </div>
              <div className="fg">
                <label>Email (optional)</label>
                <input
                  value={customerModalData.email}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="fi"
                />
              </div>
              <div className="fg">
                <label>Address (optional)</label>
                <textarea
                  value={customerModalData.address}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, address: e.target.value })}
                  rows="3"
                  placeholder="Enter address"
                  className="fi"
                />
              </div>
              <div className="fg">
                <label>Opening Balance (optional)</label>
                <input
                  value={customerModalData.openingBalance}
                  onChange={(e) => setCustomerModalData({ ...customerModalData, openingBalance: e.target.value })}
                  placeholder="Opening balance in ₹"
                  type="number"
                  min="0"
                  className="fi"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn">
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', zIndex: 1101 }}>
            <div className="modal__top">
              <div>
                <h3 className="text-xl font-semibold">Add Stock</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Search product, enter quantity, and update inventory instantly.</p>
              </div>
              <button type="button" onClick={() => setShowStockModal(false)} className="btn--icon">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div className="fg">
                <label>Search Product</label>
                <div className="topbar__search" style={{ width: '100%' }}>
                  <i className="fas fa-search" style={{ left: '16px' }}></i>
                  <input
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="Search by name, SKU or barcode..."
                    style={{ paddingLeft: '44px' }}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto" style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', background: 'var(--bg-input)' }}>
                {stockOptions.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => setStockProduct(product)}
                    className="btn"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      background: stockProduct?._id === product._id ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-sidebar)',
                      borderColor: stockProduct?._id === product._id ? 'var(--accent)' : 'var(--border)'
                    }}
                  >
                    <span className="flex flex-col text-left">
                      <span style={{ fontWeight: '600', color: 'var(--text-1)' }}>{product.productName || product.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>SKU {product.sku || product.barcode || 'N/A'}</span>
                    </span>
                    <span style={{ fontSize: '12px' }}>Stock: {product.stock}</span>
                  </button>
                ))}
                {stockOptions.length === 0 && <p className="text-xs" style={{ color: 'var(--text-3)' }}>Search a product to select it.</p>}
              </div>
              <div className="form-row">
                <div className="fg">
                  <label>Quantity</label>
                  <input
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    className="fi"
                  />
                </div>
                <div className="fg">
                  <label>Reason</label>
                  <select
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    className="fi"
                  >
                    <option>Purchase</option>
                    <option>Return</option>
                    <option>Adjustment</option>
                  </select>
                </div>
              </div>
              <div className="fg">
                <label>Date</label>
                <input
                  value={stockDate}
                  onChange={(e) => setStockDate(e.target.value)}
                  type="date"
                  className="fi"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn">
                  Cancel
                </button>
                <button type="button" onClick={handleStockSave} className="btn btn--primary">
                  Save Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Drill-down Modal */}
      {drillModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}
          onClick={(e) => e.target === e.currentTarget && setDrillModal(null)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl transition-all duration-300 text-slate-800" 
            style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '85vh' }}
          >
            <div className="flex justify-between items-center border-b pb-3 border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase" style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics Detailed Breakdown</span>
                <h3 className="text-xl font-black mt-0.5" style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>{drillModal.title}</h3>
              </div>
              <button
                onClick={() => setDrillModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <X className="w-5 h-5 text-slate-500" style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '55vh', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {drillModal.cols.map((col, i) => (
                      <th key={i} style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drillModal.rows.map((row, rIdx) => (
                    <tr 
                      key={rIdx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : '#fafafa'
                      }}
                    >
                      {row.map((val, cIdx) => (
                        <td key={cIdx} style={{ padding: '12px 16px', color: '#475569' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                  {drillModal.rows.length === 0 && (
                    <tr>
                      <td colSpan={drillModal.cols.length} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setDrillModal(null)}
              className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-3 rounded-full transition"
              style={{ width: '100%', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
