import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Download, Printer, Share2, PlusCircle, Search, Eye } from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const isSameDay = (first, second) => {
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const SalesTodayPage = () => {
  const navigate = useNavigate();
  const { invoices } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [drillModal, setDrillModal] = useState(null);

  const showTotalBillsDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Amount", "Payment Mode", "Time"];
    const rows = todayInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.customerName,
      formatCurrency(invoice.totalAmount),
      invoice.paymentMode,
      new Date(invoice.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ]);
    setDrillModal({
      title: "Today's Invoices Detail List",
      cols,
      rows
    });
  };

  const showUniqueCustomersDrilldown = () => {
    const cols = ["Customer Name", "Number of Invoices", "Total Purchased"];
    const aggregated = {};
    todayInvoices.forEach(inv => {
      const name = inv.customerName || 'Walk-in';
      if (!aggregated[name]) {
        aggregated[name] = { count: 0, total: 0 };
      }
      aggregated[name].count += 1;
      aggregated[name].total += inv.totalAmount;
    });
    const rows = Object.entries(aggregated).map(([name, data]) => [
      name,
      String(data.count),
      formatCurrency(data.total)
    ]);
    setDrillModal({
      title: "Unique Customers Purchasing Today",
      cols,
      rows
    });
  };

  const showLastSaleTimeDrilldown = () => {
    if (!todayInvoices.length) return;
    const sorted = [...todayInvoices].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
    const latest = sorted[0];
    const cols = ["Field", "Details"];
    const rows = [
      ["Invoice Number", latest.invoiceNumber],
      ["Customer Name", latest.customerName],
      ["Total Amount", formatCurrency(latest.totalAmount)],
      ["Paid Amount", formatCurrency(latest.paidAmount)],
      ["Payment Mode", latest.paymentMode],
      ["Status", latest.status],
      ["Bill Date & Time", new Date(latest.billDate).toLocaleString()]
    ];
    setDrillModal({
      title: "Latest Transaction Details",
      cols,
      rows
    });
  };

  const showVsYesterdayDrilldown = () => {
    const cols = ["Metric", "Today", "Yesterday", "Difference", "Change %"];
    const rows = [
      [
        "Sales Revenue",
        formatCurrency(todayRevenue),
        formatCurrency(yesterdayRevenue),
        formatCurrency(revenueDelta.diff),
        `${revenueDelta.isPositive ? '+' : ''}${revenueDelta.percent}%`
      ],
      [
        "Invoice Count",
        String(todayInvoices.length),
        String(yesterdayInvoices.length),
        String(todayInvoices.length - yesterdayInvoices.length),
        yesterdayInvoices.length === 0 ? 'N/A' : `${Math.round(((todayInvoices.length - yesterdayInvoices.length) / yesterdayInvoices.length) * 100)}%`
      ]
    ];
    setDrillModal({
      title: "Sales Comparison vs Yesterday",
      cols,
      rows
    });
  };

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, new Date())),
    [invoices]
  );

  const yesterdayInvoices = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, yesterday));
  }, [invoices]);

  const totalBills = todayInvoices.length;
  const uniqueCustomers = useMemo(
    () => new Set(todayInvoices.map((invoice) => invoice.customerId || invoice.customerName)).size,
    [todayInvoices]
  );
  const lastSaleTime = useMemo(() => {
    if (!todayInvoices.length) return 'No sales yet';
    const latest = new Date(Math.max(...todayInvoices.map((invoice) => new Date(invoice.billDate).getTime())));
    return `Last sale at ${latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [todayInvoices]);

  const todayRevenue = useMemo(
    () => todayInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [todayInvoices]
  );

  const yesterdayRevenue = useMemo(
    () => yesterdayInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [yesterdayInvoices]
  );

  const revenueDelta = useMemo(() => {
    const diff = todayRevenue - yesterdayRevenue;
    const percent = yesterdayRevenue === 0 ? (todayRevenue === 0 ? 0 : 100) : (diff / yesterdayRevenue) * 100;
    return { diff, percent: Math.round(percent), isPositive: diff >= 0 };
  }, [todayRevenue, yesterdayRevenue]);

  const filteredInvoices = useMemo(() => {
    return todayInvoices
      .filter((invoice) => {
        const target = `${invoice.customerName} ${invoice.invoiceNumber}`.toLowerCase();
        return target.includes(search.toLowerCase());
      })
      .filter((invoice) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'Paid') return invoice.status === 'Completed';
        if (statusFilter === 'Pending') return invoice.status === 'Pending';
        return invoice.status === 'Credit Note';
      })
      .filter((invoice) => (paymentModeFilter === 'all' ? true : invoice.paymentMode === paymentModeFilter));
  }, [todayInvoices, search, statusFilter, paymentModeFilter]);

  const exportCsv = () => {
    const header = ['Invoice No', 'Customer Name', 'Items', 'Amount', 'Payment Mode', 'Time', 'Status'];
    const rows = todayInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.products?.reduce((sum, item) => sum + item.quantity, 0),
      invoice.totalAmount,
      invoice.paymentMode,
      new Date(invoice.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invoice.status,
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `today-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const itemsHtml = invoice.products
      .map(
        (item) => `<tr><td style="padding:8px;border:1px solid #ddd">${item.name}</td><td style="padding:8px;border:1px solid #ddd">${item.quantity}</td><td style="padding:8px;border:1px solid #ddd">₹${item.price}</td><td style="padding:8px;border:1px solid #ddd">₹${item.price * item.quantity}</td></tr>`
      )
      .join('');
    printWindow.document.write(`
      <html><head><title>Invoice ${invoice.invoiceNumber}</title></head><body>
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p><strong>Customer:</strong> ${invoice.customerName}</p>
        <p><strong>Time:</strong> ${new Date(invoice.billDate).toLocaleString()}</p>
        <table style="border-collapse:collapse;width:100%"><thead><tr><th style="padding:8px;border:1px solid #ddd">Item</th><th style="padding:8px;border:1px solid #ddd">Qty</th><th style="padding:8px;border:1px solid #ddd">Price</th><th style="padding:8px;border:1px solid #ddd">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        <p><strong>Discount:</strong> ₹${invoice.discount || 0}</p>
        <p><strong>Total:</strong> ₹${invoice.totalAmount}</p>
        <p><strong>Payment mode:</strong> ${invoice.paymentMode}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const shareInvoice = (invoice) => {
    const text = `Invoice ${invoice.invoiceNumber}%0ACustomer: ${invoice.customerName}%0AAmount: ₹${invoice.totalAmount}%0APayment: ${invoice.paymentMode}%0AStatus: ${invoice.status}%0AItems: ${invoice.products
      .map((item) => `${item.name} x${item.quantity}`)
      .join(', ')}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const statusTabs = ['all', 'Paid', 'Pending', 'Credit'];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Today's Sales</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Live bill tracking and invoice actions for today's sales.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/billing/new')} className="btn btn--primary">
              <PlusCircle className="h-4 w-4" /> New Sale Bill
            </button>
            <button onClick={exportCsv} className="btn">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showTotalBillsDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Total Bills Today</p>
          <p className="stat__val">{totalBills}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showUniqueCustomersDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Unique Customers</p>
          <p className="stat__val">{uniqueCustomers}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showLastSaleTimeDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Last Sale Time</p>
          <p className="stat__val" style={{ fontSize: '18px', marginTop: '10px' }}>{lastSaleTime}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showVsYesterdayDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">vs Yesterday</p>
          <p className="stat__val" style={{ fontSize: '16px', marginTop: '10px', color: revenueDelta.isPositive ? 'var(--accent)' : 'var(--red)' }}>
            {revenueDelta.isPositive ? '▲' : '▼'} {Math.abs(revenueDelta.percent)}% from yesterday
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="topbar__search" style={{ width: 'auto', minWidth: '280px' }}>
            <i className="fas fa-search" style={{ left: '16px' }}></i>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer or invoice no..."
              style={{ paddingLeft: '44px' }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg" style={{ background: 'var(--bg-input)' }}>
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className="btn btn--sm"
                  style={{
                    border: 'none',
                    background: statusFilter === tab ? 'var(--accent)' : 'transparent',
                    color: statusFilter === tab ? '#fff' : 'var(--text-2)',
                    borderRadius: '6px'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="fi"
              style={{ width: 'auto' }}
            >
              <option value="all">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Name</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const badgeClass = invoice.status === 'Completed' ? 'badge--green' : invoice.status === 'Pending' ? 'badge--yellow' : 'badge--blue';
                return (
                  <tr key={invoice._id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-1)' }}>{invoice.invoiceNumber}</td>
                    <td>{invoice.customerName}</td>
                    <td>{invoice.products?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td>
                    <td>{formatCurrency(invoice.totalAmount)}</td>
                    <td>{invoice.paymentMode}</td>
                    <td>{new Date(invoice.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {invoice.status === 'Completed' ? 'Paid' : invoice.status === 'Pending' ? 'Pending' : 'Credit'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="btn btn--sm"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => printInvoice(invoice)}
                          className="btn btn--sm"
                        >
                          <Printer className="h-3.5 w-3.5" /> Print
                        </button>
                        <button
                          type="button"
                          onClick={() => shareInvoice(invoice)}
                          className="btn btn--sm"
                        >
                          <Share2 className="h-3.5 w-3.5" /> Share
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && <p className="mt-5 text-sm" style={{ color: 'var(--text-3)' }}>No invoices matched your search.</p>}
        </div>
      </div>

      {selectedInvoice && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', width: '700px', maxWidth: '92vw', zIndex: 1101 }}>
            <div className="modal__top">
              <div>
                <h3 className="text-xl font-semibold">Invoice {selectedInvoice.invoiceNumber}</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{selectedInvoice.customerName} · {new Date(selectedInvoice.billDate).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setSelectedInvoice(null)} className="btn btn--sm">
                ✕
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Customer</p>
                <p className="mt-2 font-semibold" style={{ color: 'var(--text-1)' }}>{selectedInvoice.customerName}</p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-2)' }}>Payment mode: {selectedInvoice.paymentMode}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>Status: {selectedInvoice.status === 'Completed' ? 'Paid' : selectedInvoice.status === 'Pending' ? 'Pending' : 'Credit'}</p>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Amount</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(selectedInvoice.totalAmount)}</p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-2)' }}>Discount: {formatCurrency(selectedInvoice.discount || 0)}</p>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto" style={{ maxHeight: '250px' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.products.map((product) => (
                    <tr key={product.productId || product.name}>
                      <td style={{ color: 'var(--text-1)' }}>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{formatCurrency(product.price)}</td>
                      <td style={{ fontWeight: '500' }}>{formatCurrency(product.price * product.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
              style={{ border: 'none', color: '#fff', backgroundColor: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTodayPage;
