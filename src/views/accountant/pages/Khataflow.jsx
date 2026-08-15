import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Inline self-contained SVG Icons to ensure maximum portability and no missing dependency errors
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    </svg>
  ),
  Customers: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Projects: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  Orders: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  Inventory: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Accounts: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    </svg>
  ),
  Tasks: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  VisitSite: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Hamburger: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  CardCustomers: () => (
    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  CardProjects: () => (
    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  CardOrders: () => (
    <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  CardIncome: () => (
    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  UserContact: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ChatContact: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  PhoneContact: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Reload: () => (
    <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
    </svg>
  )
};

const Khataflow = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drillModal, setDrillModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, invoicesRes, customersRes, expensesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/invoices'),
          api.get('/customers'),
          api.get('/expenses').catch(() => ({ data: { data: [] } }))
        ]);
        setStats(statsRes.data.data);
        setInvoices(invoicesRes.data.data || []);
        setCustomers(customersRes.data.data || []);
        setExpenses(expensesRes?.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatINR = (val) => {
    const num = Number(val || 0);
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}k`;
    }
    return `₹${num}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl w-full mx-auto relative" style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1280px', width: '100%', marginLeft: 'auto', marginRight: 'auto', position: 'relative' }}>
      {/* Stats Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {/* Customers Card */}
        <div 
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-md duration-300" 
          style={{ backgroundColor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.3s', cursor: 'pointer' }}
          onClick={() => {
            setDrillModal({
              title: 'Customers List',
              cols: ['Customer Name', 'Email', 'Phone', 'Outstanding Dues'],
              rows: customers.map(c => [c.name, c.email || '-', c.phone || '-', `₹${(c.openingBalance || 0).toLocaleString('en-IN')}`])
            });
          }}
        >
          <div className="space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 className="text-3xl font-black text-slate-900 leading-tight" style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
              {stats?.totalCustomers || customers.length || 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customers</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl" style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px' }}>
            <Icons.CardCustomers />
          </div>
        </div>

        {/* Pending Expenses Card */}
        <div 
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-md duration-300" 
          style={{ backgroundColor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.3s', cursor: 'pointer' }}
          onClick={() => {
            const pendingExps = expenses.filter(e => !e.approved);
            setDrillModal({
              title: 'Pending Expenses Approvals',
              cols: ['Category', 'Amount', 'Date', 'Description'],
              rows: pendingExps.map(e => [e.category, `₹${(e.amount || 0).toLocaleString('en-IN')}`, e.date ? new Date(e.date).toLocaleDateString() : '-', e.description || '-'])
            });
          }}
        >
          <div className="space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 className="text-3xl font-black text-slate-900 leading-tight" style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
              {stats?.pendingExpenseApprovals || 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Expenses</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl" style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px' }}>
            <Icons.CardProjects />
          </div>
        </div>

        {/* Invoices Card */}
        <div 
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-md duration-300" 
          style={{ backgroundColor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.3s', cursor: 'pointer' }}
          onClick={() => {
            setDrillModal({
              title: 'Invoices List',
              cols: ['Invoice Code', 'Customer Name', 'Amount', 'Due Date', 'Status'],
              rows: invoices.map(inv => [inv.invoiceNumber, inv.customerName, `₹${(inv.amount || 0).toLocaleString('en-IN')}`, inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-', inv.status])
            });
          }}
        >
          <div className="space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 className="text-3xl font-black text-slate-900 leading-tight" style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
              {stats?.totalInvoices || invoices.length || 0}
            </h3>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider" style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoices</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-2xl" style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '16px' }}>
            <Icons.CardOrders />
          </div>
        </div>

        {/* Income Card (Solid theme blue) */}
        <div 
          className="bg-[#1d4ed8] border border-[#1e40af] rounded-3xl p-6 shadow-lg shadow-blue-500/10 flex items-center justify-between text-white transition hover:-translate-y-0.5 hover:shadow-xl duration-300" 
          style={{ backgroundColor: '#1d4ed8', border: '1px solid #1e40af', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)', transition: 'all 0.3s', cursor: 'pointer' }}
          onClick={() => {
            const paidInvs = invoices.filter(inv => inv.status === 'paid');
            setDrillModal({
              title: 'Settled Income Transactions',
              cols: ['Invoice Code', 'Customer Name', 'Amount', 'Due Date'],
              rows: paidInvs.map(inv => [inv.invoiceNumber, inv.customerName, `₹${(inv.amount || 0).toLocaleString('en-IN')}`, inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'])
            });
          }}
        >
          <div className="space-y-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 className="text-3xl font-black leading-tight" style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1.2 }}>
              {formatINR(stats?.totalIncome || 0)}
            </h3>
            <p className="text-xs text-blue-100/80 font-semibold uppercase tracking-wider" style={{ fontSize: '12px', color: 'rgba(219, 234, 254, 0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income</p>
          </div>
          <div className="p-4 bg-white/15 rounded-2xl" style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '16px' }}>
            <Icons.CardIncome />
          </div>
        </div>
      </section>

      {/* Lower Grid Content */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Recent Invoices (Left, spans 2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6" style={{ gridColumn: 'span 2', backgroundColor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="text-lg font-black text-slate-900" style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Recent Invoices</h3>
            <button 
              onClick={() => navigate('/invoices')}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition active:scale-95 shadow-sm" 
              style={{ backgroundColor: '#1d4ed8', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '8px 16px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <span>See all</span>
              <Icons.ArrowRight />
            </button>
          </div>

          <div className="overflow-x-auto w-full" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="w-full text-left border-collapse" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider" style={{ borderBottom: '1px solid #f1f5f9', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th className="pb-3 pl-2" style={{ paddingBottom: '12px', paddingLeft: '8px' }}>Invoice Code</th>
                  <th className="pb-3" style={{ paddingBottom: '12px' }}>Customer Name</th>
                  <th className="pb-3" style={{ paddingBottom: '12px' }}>Amount</th>
                  <th className="pb-3 text-right pr-2" style={{ paddingBottom: '12px', textAlign: 'right', paddingRight: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50" style={{ display: 'table-row-group' }}>
                {invoices.slice(0, 6).map((inv, i) => (
                  <tr key={inv._id || i} className="hover:bg-slate-50/50 transition duration-150" style={{ transition: 'all 0.15s' }}>
                    <td className="py-4 pl-2 font-bold text-sm text-slate-800" style={{ padding: '16px 8px', fontWeight: 'bold', fontSize: '14px', color: '#334155' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 text-xs font-semibold text-slate-500" style={{ padding: '16px 0', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                      {inv.customerName}
                    </td>
                    <td className="py-4 text-xs font-bold text-slate-700" style={{ padding: '16px 0', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                      ₹{Number(inv.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-right pr-2" style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <span className={`inline-block text-[10px] font-black uppercase px-3.5 py-1 rounded-full ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                        'bg-orange-100 text-orange-700'
                      }`} style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '4px 14px', borderRadius: '9999px' }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 font-semibold text-xs">
                      No invoices found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Customer List (Right, spans 1 column) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6" style={{ backgroundColor: '#fff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
          <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
            <h3 className="text-lg font-black text-slate-900" style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>New Customer</h3>
            <button 
              onClick={() => navigate('/customers')}
              className="text-[#1d4ed8] hover:text-blue-700 font-bold text-xs flex items-center gap-1 transition" 
              style={{ border: 'none', background: 'transparent', color: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <span>View all</span>
              <Icons.ArrowRight />
            </button>
          </div>

          <div className="flex flex-col divide-y divide-slate-100" style={{ display: 'flex', flexDirection: 'column' }}>
            {customers.slice(0, 6).map((c, i) => {
              const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
              return (
                <div key={c._id || i} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div className="flex items-center gap-3 min-w-0" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1d4ed8] font-bold text-xs flex items-center justify-center shrink-0" style={{ width: '40px', height: '40px', borderRadius: '16px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div className="min-w-0 leading-tight" style={{ minWidth: 0, lineHeight: 1.25 }}>
                      <h4 className="text-sm font-black text-slate-800 truncate" style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</h4>
                      <span className="text-[11px] text-slate-400 font-bold" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>
                        Dues: ₹{Number(c.openingBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-4" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '16px' }}>
                    <button 
                      onClick={() => setSelectedCustomer(c)}
                      className="p-2 text-[#1d4ed8] hover:bg-blue-50 hover:text-blue-700 rounded-full transition" 
                      style={{ border: 'none', background: 'transparent', padding: '8px', color: '#1d4ed8', borderRadius: '9999px', cursor: 'pointer' }} 
                      title="View Profile"
                    >
                      <Icons.UserContact />
                    </button>
                    <button 
                      onClick={() => alert(`Message to ${c.name}: Outstanding dues are ₹${c.openingBalance}.`)}
                      className="p-2 text-[#1d4ed8] hover:bg-blue-50 hover:text-blue-700 rounded-full transition" 
                      style={{ border: 'none', background: 'transparent', padding: '8px', color: '#1d4ed8', borderRadius: '9999px', cursor: 'pointer' }} 
                      title="Send Message"
                    >
                      <Icons.ChatContact />
                    </button>
                    <button 
                      onClick={() => alert(`Calling customer ${c.name} at ${c.phone || '[No Phone Registered]'}`)}
                      className="p-2 text-[#1d4ed8] hover:bg-blue-50 hover:text-blue-700 rounded-full transition" 
                      style={{ border: 'none', background: 'transparent', padding: '8px', color: '#1d4ed8', borderRadius: '9999px', cursor: 'pointer' }} 
                      title="Call Customer"
                    >
                      <Icons.PhoneContact />
                    </button>
                  </div>
                </div>
              );
            })}
            {customers.length === 0 && (
              <div className="py-8 text-center text-slate-400 font-semibold text-xs">
                No customers registered.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Floating bottom right reload button */}
      <div className="fixed bottom-8 right-8 z-40" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40 }}>
        <button 
          onClick={() => window.location.reload()}
          className="bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg p-3.5 rounded-full flex items-center justify-center transition hover:shadow-xl active:scale-95 duration-200"
          style={{ backgroundColor: '#fff', border: '2px solid #e2e8f0', cursor: 'pointer', padding: '14px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', transition: 'all 0.2s' }}
          title="Reload Dashboard"
        >
          <Icons.Reload />
        </button>
      </div>

      {/* Global Customer Snapshot Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all duration-300 text-slate-800" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '448px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transition: 'all 0.3s' }}>
            <div className="flex justify-between items-start border-b pb-3 mb-4 border-slate-100" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase" style={{ fontSize: '10px', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Party Profile Snapshot</span>
                <h3 className="text-2xl font-black tracking-tight mt-0.5" style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0 0' }}>{selectedCustomer.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3 text-left" style={{ padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Customer ID</span>
                  <span className="text-xs font-mono font-bold select-all text-slate-700" style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#334155' }}>{selectedCustomer._id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Phone Number</span>
                    <span className="text-xs font-bold text-slate-800" style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>{selectedCustomer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Live Status</span>
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${selectedCustomer.openingBalance > 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                      }`} style={{ display: 'inline-block', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '9999px', marginTop: '4px' }}>
                      {selectedCustomer.openingBalance > 0 ? 'Outstanding Dues' : 'Fully Settled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border text-left flex items-center justify-between ${selectedCustomer.openingBalance > 0
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`} style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid' }}>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest block opacity-85" style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', opacity: 0.85 }}>Outstanding Balance</span>
                  <span className="text-2xl font-black tracking-tight mt-0.5 block" style={{ fontSize: '24px', fontWeight: 900, display: 'block', marginTop: '2px' }}>
                    ₹{Number(selectedCustomer.openingBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${selectedCustomer.openingBalance > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} shadow-sm flex items-center justify-center`} style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: '24px', height: '24px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-6" style={{ marginTop: '24px' }}>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs py-3 rounded-full transition"
                style={{ width: '100%', border: 'none', backgroundColor: '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '12px', borderRadius: '9999px', cursor: 'pointer' }}
              >
                Close Snapshot
              </button>
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

export default Khataflow;
