import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PlusCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import billService from '../services/billService';

const BillingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { invoices: localInvoices } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [apiInvoices, setApiInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [drillModal, setDrillModal] = useState(null);

  const showInvoicesDrilldown = () => {
    const cols = ["Invoice #", "Customer", "Amount", "Status", "Date"];
    const rows = filteredInvoices.map(inv => [
      `#${inv.invoiceNumber || inv._id.slice(-6)}`,
      inv.customerName || 'Walk-in',
      `₹${Number(inv.totalAmount || 0).toLocaleString()}`,
      inv.status,
      new Date(inv.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Invoice Overview Details",
      cols,
      rows
    });
  };

  const showTotalValueDrilldown = () => {
    const cols = ["Invoice #", "Customer", "Type", "Amount", "Date"];
    const rows = filteredInvoices.map(inv => [
      `#${inv.invoiceNumber || inv._id.slice(-6)}`,
      inv.customerName || 'Walk-in',
      inv.type === 'credit' ? 'Credit Note' : 'Sale',
      `₹${Number(inv.totalAmount || 0).toLocaleString()}`,
      new Date(inv.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Total Invoice Value Breakdown",
      cols,
      rows
    });
  };

  const showPendingDrilldown = () => {
    const cols = ["Invoice #", "Customer", "Total Amount", "Paid", "Remaining Due", "Status"];
    const pendingItems = filteredInvoices.filter(inv => inv.status !== 'Completed');
    const rows = pendingItems.map(inv => [
      `#${inv.invoiceNumber || inv._id.slice(-6)}`,
      inv.customerName || 'Walk-in',
      `₹${Number(inv.totalAmount || 0).toLocaleString()}`,
      `₹${Number(inv.paidAmount || 0).toLocaleString()}`,
      `₹${Math.max(0, Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)).toLocaleString()}`,
      inv.status
    ]);
    setDrillModal({
      title: "Pending & Uncompleted Invoices",
      cols,
      rows
    });
  };

  const showCreditNotesDrilldown = () => {
    const cols = ["Invoice #", "Customer", "Amount", "Status", "Date"];
    const creditItems = filteredInvoices.filter(inv => inv.status === 'Credit Note' || inv.type === 'credit');
    const rows = creditItems.map(inv => [
      `#${inv.invoiceNumber || inv._id.slice(-6)}`,
      inv.customerName || 'Walk-in',
      `₹${Math.abs(inv.totalAmount || 0).toLocaleString()}`,
      inv.status,
      new Date(inv.billDate).toLocaleDateString()
    ]);
    setDrillModal({
      title: "Credit Notes Registry Details",
      cols,
      rows
    });
  };

  // Fetch invoices from backend API
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setIsLoading(true);
        const response = await billService.getAllBills(page, 20, search, statusFilter === 'all' ? '' : statusFilter);
        setApiInvoices(response.bills || response);
      } catch (error) {
        console.error('Error fetching bills:', error);
        // Fallback to local invoices if API fails
        setApiInvoices(localInvoices);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBills();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, search, statusFilter]);

  const filterQuery = searchParams.get('filter') || '';
  const isTodayFilter = filterQuery === 'today';

  // Use API invoices if available, fallback to local invoices
  const validApiInvoices = Array.isArray(apiInvoices) ? apiInvoices : [];
  const invoices = validApiInvoices.length > 0 ? validApiInvoices : (Array.isArray(localInvoices) ? localInvoices : []);

  const allowedInvoices = useMemo(() => {
    const own = invoices.filter((invoice) => {
      const createdById = invoice.createdBy?._id || invoice.createdBy;
      return createdById === user?._id || (invoice.createdBy?.email && invoice.createdBy?.email === user?.username);
    });
    return (user?.role === 'admin' || user?.permissions?.canViewAllInvoices) ? invoices : own;
  }, [invoices, user]);

  const todayInvoices = useMemo(
    () => allowedInvoices.filter((bill) => new Date(bill.billDate).toDateString() === new Date().toDateString()),
    [allowedInvoices]
  );

  const filteredInvoices = useMemo(() => {
    const source = isTodayFilter ? todayInvoices : allowedInvoices;
    return source.filter((invoice) => (statusFilter === 'all' ? true : invoice.status === statusFilter));
  }, [allowedInvoices, todayInvoices, isTodayFilter, statusFilter]);

  const totals = useMemo(
    () =>
      filteredInvoices.reduce(
        (acc, invoice) => {
          acc.count += 1;
          acc.amount += Number(invoice.totalAmount || 0);
          if (invoice.status === 'Completed') acc.paid += Number(invoice.paidAmount || 0);
          if (invoice.status === 'Credit Note') acc.credit += Number(invoice.totalAmount || 0);
          if (invoice.status !== 'Completed') acc.pending += Number(invoice.totalAmount || 0);
          return acc;
        },
        { count: 0, amount: 0, paid: 0, pending: 0, credit: 0 }
      ),
    [filteredInvoices]
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{isTodayFilter ? `Today's Invoices` : 'Billing'}</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>{isTodayFilter ? 'All invoices created today.' : 'Live invoice tracking and permission-aware billing.'}</p>
          </div>
          <button onClick={() => navigate('/billing/new')} className="btn btn--primary">
            <PlusCircle className="h-4 w-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showInvoicesDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Invoices</p>
          <p className="stat__val">{totals.count}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showTotalValueDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Total value</p>
          <p className="stat__val">₹{totals.amount.toLocaleString()}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showPendingDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Pending</p>
          <p className="stat__val">₹{totals.pending.toLocaleString()}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showCreditNotesDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Credit notes</p>
          <p className="stat__val">₹{Math.abs(totals.credit).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Invoice Ledger</h3>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Search invoices by customer, invoice number, or date.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="topbar__search" style={{ width: 'auto', minWidth: '240px' }}>
              <i className="fas fa-search" style={{ left: '16px' }}></i>
              <input
                type="search"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="fi"
              style={{ width: 'auto' }}
            >
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Credit Note">Credit Note</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}></div>
                <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Loading invoices...</p>
              </div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const date = new Date(invoice.billDate);
                  const badgeClass = invoice.status === 'Completed' ? 'badge--green' : invoice.status === 'Credit Note' ? 'badge--blue' : 'badge--yellow';
                  return (
                    <tr
                      key={invoice._id}
                      onClick={() => navigate(`/billing/invoice/${invoice._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: '600', color: 'var(--text-1)' }}>#{invoice.invoiceNumber || invoice._id.slice(-6)}</td>
                      <td>{invoice.customerName || 'Walk-in'}</td>
                      <td>₹{Number(invoice.totalAmount || 0).toLocaleString()}</td>
                      <td>₹{Number(invoice.paidAmount || 0).toLocaleString()}</td>
                      <td>₹{Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0)).toLocaleString()}</td>
                      <td>{invoice.type === 'credit' ? 'Credit Note' : 'Sale'}</td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{invoice.status}</span>
                      </td>
                      <td style={{ color: 'var(--text-2)' }}>{date.toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!isLoading && filteredInvoices.length === 0 && (
            <p className="mt-5 text-sm" style={{ color: 'var(--text-3)' }}>No invoices matched your search and filters.</p>
          )}
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

export default BillingPage;
