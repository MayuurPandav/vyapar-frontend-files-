import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Bar, Line } from 'react-chartjs-2';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const ReportsPage = () => {
  const location = useLocation();
  const { invoices } = useData();
  const isTodayView = location.pathname.endsWith('/today');
  const [drillModal, setDrillModal] = useState(null);

  const showStatusInvoicesDrilldown = (statusName) => {
    const cols = ["Invoice #", "Customer", "Amount", "Type", "Date"];
    const filteredInvs = invoices.filter(inv => inv.status?.toLowerCase() === statusName.toLowerCase());
    const rows = filteredInvs.map(inv => [
      `#${inv.invoiceNumber || inv._id.slice(-6)}`,
      inv.customerName || 'Walk-in',
      `₹${Number(inv.totalAmount || 0).toLocaleString()}`,
      inv.type === 'credit' ? 'Credit Note' : 'Sale',
      new Date(inv.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: `${statusName.charAt(0).toUpperCase() + statusName.slice(1)} Invoices Detailed List`,
      cols,
      rows
    });
  };

  const isSameDay = (date1, date2) => {
    const a = new Date(date1);
    const b = new Date(date2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const todayInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.type === 'sale' && isSameDay(invoice.billDate, new Date())),
    [invoices]
  );

  const hourlyRevenue = useMemo(() => {
    const hours = {};
    const currentHour = new Date().getHours();
    const startHour = 8;
    for (let hour = startHour; hour <= Math.max(currentHour, startHour); hour += 1) {
      hours[hour] = 0;
    }
    todayInvoices.forEach((invoice) => {
      const hour = new Date(invoice.billDate).getHours();
      if (typeof hours[hour] !== 'undefined') {
        hours[hour] += invoice.totalAmount;
      }
    });
    return Object.entries(hours).map(([hour, total]) => ({ hour: Number(hour), total }));
  }, [todayInvoices]);

  const productTotals = useMemo(() => {
    const totals = {};
    todayInvoices.forEach((invoice) => {
      invoice.products.forEach((item) => {
        const key = item.productId || item.name;
        if (!totals[key]) totals[key] = { name: item.name, quantity: 0, revenue: 0 };
        totals[key].quantity += item.quantity;
        totals[key].revenue += item.price * item.quantity;
      });
    });
    return Object.values(totals).sort((a, b) => b.quantity - a.quantity).slice(0, 3);
  }, [todayInvoices]);

  const customerTotals = useMemo(() => {
    const totals = {};
    todayInvoices.forEach((invoice) => {
      const name = invoice.customerName || 'Unknown';
      totals[name] = totals[name] || { name, spent: 0 };
      totals[name].spent += invoice.totalAmount;
    });
    return Object.values(totals).sort((a, b) => b.spent - a.spent)[0] || { name: 'N/A', spent: 0 };
  }, [todayInvoices]);

  const revenueData = useMemo(
    () => ({
      labels: hourlyRevenue.map((item) => `${item.hour % 12 === 0 ? 12 : item.hour % 12} ${item.hour < 12 ? 'AM' : 'PM'}`),
      datasets: [
        {
          label: 'Revenue',
          data: hourlyRevenue.map((item) => item.total),
          backgroundColor: '#3b82f6',
        },
      ],
    }),
    [hourlyRevenue]
  );

  const monthlyRevenue = useMemo(() => {
    const totals = {};
    invoices.forEach((invoice) => {
      if (invoice.type !== 'sale') return;
      const date = new Date(invoice.billDate);
      const month = date.getMonth() + 1;
      totals[month] = (totals[month] || 0) + invoice.totalAmount;
    });
    return Object.entries(totals)
      .map(([month, total]) => ({ _id: Number(month), total }))
      .sort((a, b) => a._id - b._id);
  }, [invoices]);

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, processing: 0, completed: 0 };
    invoices.forEach((invoice) => {
      const status = invoice.status?.toLowerCase();
      if (counts[status] !== undefined) counts[status] += 1;
    });
    return counts;
  }, [invoices]);

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
        label: 'Order Count',
        data: [statusCounts.pending, statusCounts.processing, statusCounts.completed],
        backgroundColor: ['#f59e0b', '#0ea5e9', '#10b981'],
      },
    ],
  };

  if (!isTodayView) {
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-2xl font-semibold">Reports</h2>
          <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginTop: '4px' }}>Performance analytics for sales and order flow.</p>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Pending Orders', status: 'pending', value: statusCounts.pending, badgeClass: 'badge--yellow' },
            { label: 'Processing', status: 'processing', value: statusCounts.processing, badgeClass: 'badge--blue' },
            { label: 'Completed', status: 'completed', value: statusCounts.completed, badgeClass: 'badge--green' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
              onClick={() => showStatusInvoicesDrilldown(stat.status)}
              style={{ cursor: 'pointer' }}
            >
              <p className="stat__lbl">{stat.label}</p>
              <p className="stat__val">{stat.value}</p>
              <span className={`badge ${stat.badgeClass}`} style={{ marginTop: '12px', display: 'inline-block' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="card">
            <h3 className="text-lg font-semibold">Monthly Revenue</h3>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginBottom: '16px' }}>Revenue trend across recent months.</p>
            <div className="mt-6 h-72">
              <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold">Order Status Breakdown</h3>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginBottom: '16px' }}>Active order counts by current status.</p>
            <div className="mt-6 h-72">
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-semibold">Today's Revenue Report</h2>
        <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginTop: '4px' }}>Hourly revenue and top performers for today.</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold">Hourly Revenue</h3>
        <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginBottom: '16px' }}>From 8AM through the current hour.</p>
        <div className="mt-6 h-72">
          <Bar data={revenueData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card">
          <p className="stat__lbl">Top 3 Products</p>
          <div className="mt-4 space-y-3">
            {productTotals.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No products sold today.</p>
            ) : (
              productTotals.map((product) => (
                <div key={product.name} className="card" style={{ padding: '12px', background: 'var(--bg-input)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <p style={{ fontWeight: '600', color: 'var(--text-1)' }}>{product.name}</p>
                    <span className="badge badge--blue">{product.quantity} pcs</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: 'var(--accent)' }}>₹{product.revenue.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-2 card">
          <p className="stat__lbl">Top Customer Today</p>
          <div className="card mt-4" style={{ padding: '24px', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>{customerTotals.name}</p>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Highest spender today</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>₹{customerTotals.spent.toLocaleString()}</p>
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

export default ReportsPage;
