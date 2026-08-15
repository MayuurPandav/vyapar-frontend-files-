import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const isSameDay = (first, second) => {
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const RevenueTodayPage = () => {
  const { invoices } = useData();
  const [drillModal, setDrillModal] = useState(null);

  const showTotalCollectedDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Amount", "Payment Mode", "Date"];
    const rows = paidInvoices.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(invoice.totalAmount),
      invoice.paymentMode,
      new Date(invoice.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Today's Paid Sales Invoices",
      cols,
      rows
    });
  };

  const showCashDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Amount", "Date"];
    const cashInvs = paidInvoices.filter(invoice => invoice.paymentMode === 'Cash');
    const rows = cashInvs.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(invoice.totalAmount),
      new Date(invoice.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Today's Cash Payments Details",
      cols,
      rows
    });
  };

  const showUpiDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Amount", "Date"];
    const upiInvs = paidInvoices.filter(invoice => invoice.paymentMode === 'UPI');
    const rows = upiInvs.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(invoice.totalAmount),
      new Date(invoice.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Today's UPI Payments Details",
      cols,
      rows
    });
  };

  const showCardDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Amount", "Date"];
    const cardInvs = paidInvoices.filter(invoice => invoice.paymentMode === 'Card');
    const rows = cardInvs.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(invoice.totalAmount),
      new Date(invoice.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Today's Card Payments Details",
      cols,
      rows
    });
  };

  const showPendingAmountDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Remaining Due", "Total Amount", "Status"];
    const pendingInvs = todayInvoices.filter(invoice => invoice.status !== 'Completed');
    const rows = pendingInvs.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0))),
      formatCurrency(invoice.totalAmount),
      invoice.status
    ]);
    setDrillModal({
      title: "Today's Pending/Unpaid Invoices",
      cols,
      rows
    });
  };

  const showDiscountGivenDrilldown = () => {
    const cols = ["Invoice No", "Customer Name", "Discount Given", "Total Amount"];
    const discountInvs = todayInvoices.filter(invoice => (invoice.discount || 0) > 0);
    const rows = discountInvs.map((invoice) => [
      invoice.invoiceNumber || invoice._id.slice(-6),
      invoice.customerName || 'Walk-in',
      formatCurrency(invoice.discount),
      formatCurrency(invoice.totalAmount)
    ]);
    setDrillModal({
      title: "Today's Customer Discounts Breakdown",
      cols,
      rows
    });
  };

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, new Date())),
    [invoices]
  );

  const paidInvoices = useMemo(
    () => todayInvoices.filter((invoice) => invoice.status === 'Completed'),
    [todayInvoices]
  );

  const totalCollected = useMemo(
    () => paidInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [paidInvoices]
  );

  const cashTotal = useMemo(
    () => paidInvoices.filter((invoice) => invoice.paymentMode === 'Cash').reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [paidInvoices]
  );

  const upiTotal = useMemo(
    () => paidInvoices.filter((invoice) => invoice.paymentMode === 'UPI').reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [paidInvoices]
  );

  const cardTotal = useMemo(
    () => paidInvoices.filter((invoice) => invoice.paymentMode === 'Card').reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [paidInvoices]
  );

  const pendingAmount = useMemo(
    () => todayInvoices.filter((invoice) => invoice.status !== 'Completed').reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    [todayInvoices]
  );

  const discountGiven = useMemo(
    () => todayInvoices.reduce((sum, invoice) => sum + (invoice.discount || 0), 0),
    [todayInvoices]
  );

  const yesterdayInvoices = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, yesterday));
  }, [invoices]);

  const yesterdayRevenue = useMemo(
    () => yesterdayInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? invoice.totalAmount), 0),
    [yesterdayInvoices]
  );

  const revenueDelta = useMemo(() => {
    const diff = totalCollected - yesterdayRevenue;
    const percent = yesterdayRevenue === 0 ? (totalCollected === 0 ? 0 : 100) : (diff / yesterdayRevenue) * 100;
    return { value: Math.abs(Math.round(percent)), isPositive: diff >= 0, diff };
  }, [totalCollected, yesterdayRevenue]);

  const hourlyRevenue = useMemo(() => {
    const currentHour = new Date().getHours();
    const endHour = Math.max(8, Math.min(currentHour, 18));
    const hours = [];
    for (let hour = 8; hour <= endHour; hour += 1) {
      hours.push({ hour, amount: 0 });
    }
    todayInvoices.forEach((invoice) => {
      const hour = new Date(invoice.billDate).getHours();
      const bucket = hours.find((item) => item.hour === hour);
      if (bucket) {
        bucket.amount += invoice.totalAmount;
      }
    });
    return hours.map((item) => ({ ...item, label: `${item.hour % 12 === 0 ? 12 : item.hour % 12}${item.hour < 12 ? 'AM' : 'PM'}` }));
  }, [todayInvoices]);

  const productTotals = useMemo(() => {
    const totals = {};
    todayInvoices.forEach((invoice) => {
      invoice.products.forEach((product) => {
        const key = product.productId || product.name;
        if (!totals[key]) totals[key] = { name: product.name, quantity: 0, revenue: 0 };
        totals[key].quantity += product.quantity;
        totals[key].revenue += product.price * product.quantity;
      });
    });
    return Object.values(totals).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [todayInvoices]);

  const bestCustomer = useMemo(() => {
    const totals = {};
    todayInvoices.forEach((invoice) => {
      const name = invoice.customerName || 'Walk-in Customer';
      totals[name] = (totals[name] || 0) + invoice.totalAmount;
    });
    const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], amount: top[1] } : { name: 'N/A', amount: 0 };
  }, [todayInvoices]);

  const monthTotal = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((invoice) => {
        const date = new Date(invoice.billDate);
        return invoice.type === 'sale' && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      })
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }, [invoices]);

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Today's Revenue</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Live revenue data and hourly insights.</p>
          </div>
          <button onClick={exportReport} className="btn btn--primary">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showTotalCollectedDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Total Collected</p>
          <p className="stat__val" style={{ color: 'var(--accent)' }}>{formatCurrency(totalCollected)}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showCashDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Cash</p>
          <p className="stat__val">{formatCurrency(cashTotal)}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showUpiDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">UPI</p>
          <p className="stat__val">{formatCurrency(upiTotal)}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showCardDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Card</p>
          <p className="stat__val">{formatCurrency(cardTotal)}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showPendingAmountDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Pending Amount</p>
          <p className="stat__val" style={{ color: 'var(--yellow)' }}>{formatCurrency(pendingAmount)}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showDiscountGivenDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Discount Given</p>
          <p className="stat__val" style={{ color: 'var(--red)' }}>{formatCurrency(discountGiven)}</p>
        </div>
      </div>

      <div className="card">
        <div>
          <h3 className="text-lg font-semibold">Hourly Revenue</h3>
          <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Revenue per hour from 8AM through current hour.</p>
        </div>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-2)', fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `₹${value}`} tick={{ fill: 'var(--text-2)', fontSize: 12 }} />
              <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)', color: 'var(--text-1)' }} />
              <Bar dataKey="amount" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: '16px' }}>Top 5 Products Sold Today</h3>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {productTotals.map((product) => (
                  <tr key={product.name}>
                    <td style={{ fontWeight: '500', color: 'var(--text-1)' }}>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
                {productTotals.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-3)' }}>No product sales today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold" style={{ marginBottom: '20px' }}>Today's Highlights</h3>
          <div className="space-y-4">
            <div className="card card--lift" style={{ padding: '16px', background: 'var(--bg-input)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Best Customer</p>
              <p className="mt-2 font-semibold" style={{ color: 'var(--text-1)' }}>{bestCustomer.name}</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>Spent {formatCurrency(bestCustomer.amount)}</p>
            </div>
            <div className="card card--lift" style={{ padding: '16px', background: 'var(--bg-input)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>vs Yesterday Revenue</p>
              <div className="mt-2 flex items-center gap-2 font-semibold" style={{ color: revenueDelta.isPositive ? 'var(--accent)' : 'var(--red)' }}>
                {revenueDelta.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{revenueDelta.value}%</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>{revenueDelta.isPositive ? 'Growth' : 'Decline'}</p>
            </div>
            <div className="card card--lift" style={{ padding: '16px', background: 'var(--bg-input)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>This Month's Running Total</p>
              <p className="mt-2 text-xl font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(monthTotal)}</p>
            </div>
          </div>
        </div>
      </div>
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

export default RevenueTodayPage;
