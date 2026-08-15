import React, { useState, useEffect } from 'react';

const TrendChart = ({ data, color, type }) => {
  if (!data || data.length === 0) {
    return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>No data available for chart.</div>;
  }

  const maxVal = Math.max(...data.map(d => d.count || d.amount || 0), 1);

  return (
    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      {data.slice(-30).map((d, i) => {
        const val = d.count || d.amount || 0;
        const height = `${(val / maxVal) * 100}%`;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', group: 'true', position: 'relative' }} title={`${d._id}: ${val}`}>
            <div style={{ 
              width: '100%', 
              height: height, 
              background: `linear-gradient(to top, ${color}22, ${color})`, 
              borderRadius: '4px 4px 0 0',
              minHeight: val > 0 ? '4px' : '0'
            }}></div>
          </div>
        );
      })}
    </div>
  );
};

export default function BusinessOversight() {
  const [tab, setTab] = useState('billing'); // 'billing', 'purchase', 'inventory'
  const [data, setData] = useState({ billing: null, purchase: null, inventory: null, accounting: null, gst: null, expense: null, payment: null, delivery: null, offers: null, staff: null });
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  const fetchData = async (currentTab) => {
    if (data[currentTab]) return; // already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/super/oversight/${currentTab}`);
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, [currentTab]: json }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurr = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  const formatNum = (val) => new Intl.NumberFormat('en-IN').format(val || 0);

  const renderKPI = (title, value, subtext, icon, color, onClick) => (
    <div 
      className="card card--lift" 
      style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '16px', 
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
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
        <i className={icon}></i>
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-1)' }}>{value}</div>
        {subtext && <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px' }}>{subtext}</div>}
      </div>
      {onClick && <i className="fas fa-chevron-right" style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-3)', opacity: 0.5, alignSelf: 'center' }}></i>}
    </div>
  );

  return (
    <div className="main sa-main" style={{ padding: '24px 30px' }}>
      <header className="topbar sa-topbar" style={{ marginBottom: '24px' }}>
        <div className="topbar__left">
          <h1>Business Module Oversight</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '13px', marginTop: '4px' }}>
            Macro-level view of all business activities happening across all tenant shops.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <button onClick={() => setTab('billing')} className={`btn ${tab === 'billing' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-file-invoice-dollar"></i> Billing & Invoices
        </button>
        <button onClick={() => setTab('purchase')} className={`btn ${tab === 'purchase' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-shopping-cart"></i> Purchases
        </button>
        <button onClick={() => setTab('inventory')} className={`btn ${tab === 'inventory' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-boxes"></i> Inventory
        </button>
        <button onClick={() => setTab('accounting')} className={`btn ${tab === 'accounting' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-file-invoice"></i> Accounting / Khata
        </button>
        <button onClick={() => setTab('gst')} className={`btn ${tab === 'gst' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-percentage"></i> GST
        </button>
        <button onClick={() => setTab('expense')} className={`btn ${tab === 'expense' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-wallet"></i> Expenses
        </button>
        <button onClick={() => setTab('payment')} className={`btn ${tab === 'payment' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-credit-card"></i> Payments
        </button>
        <button onClick={() => setTab('delivery')} className={`btn ${tab === 'delivery' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-shipping-fast"></i> Deliveries
        </button>
        <button onClick={() => setTab('offers')} className={`btn ${tab === 'offers' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-tags"></i> Offers
        </button>
        <button onClick={() => setTab('staff')} className={`btn ${tab === 'staff' ? 'btn--primary' : 'btn--secondary'}`} style={{ padding: '8px 20px', borderRadius: '30px', whiteSpace: 'nowrap' }}>
          <i className="fas fa-users-cog"></i> Staff
        </button>
      </div>

      {loading && !data[tab] ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        <div>
          {tab === 'billing' && data.billing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Today's Invoices", formatNum(data.billing.today?.count), `${formatCurr(data.billing.today?.totalValue)} generated today`, "fas fa-bolt", "#10b981", () => handleOpenInvoicesModal('today'))}
                {renderKPI("Monthly Invoices", formatNum(data.billing.month?.count), `${formatCurr(data.billing.month?.totalValue)} generated this month`, "fas fa-calendar-alt", "#3b82f6", () => handleOpenInvoicesModal('month'))}
                {renderKPI("Overdue Invoices", formatNum(data.billing.allTime?.overdueCount), `${formatCurr(data.billing.allTime?.overdueValue)} outstanding`, "fas fa-exclamation-triangle", "#ef4444")}
                {renderKPI("Credit Notes", formatNum(data.billing.allTime?.creditNoteCount), "Platform-wide refunds/returns", "fas fa-undo-alt", "#8b5cf6")}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Invoice Volume Trends (Last 30 Days)</h3>
                  <TrendChart data={data.billing.trends} color="#3b82f6" type="count" />
                </div>
                
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Most Used Invoice Types</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.billing.invoiceTypes?.map(t => (
                      <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{t._id || 'Standard'}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-2)', background: 'var(--border)', padding: '4px 10px', borderRadius: '12px' }}>{formatNum(t.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Top Shops by Invoice Count</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Shop Username</th>
                        <th>Total Invoices</th>
                        <th>Total Value Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.billing.topShops?.map((shop, idx) => (
                        <tr key={shop._id}>
                          <td>#{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{shop._id}</td>
                          <td>{formatNum(shop.count)}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurr(shop.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'purchase' && data.purchase && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Purchase Bills", formatNum(data.purchase.allTime?.count), "Across all shops", "fas fa-receipt", "#3b82f6")}
                {renderKPI("Total Purchase Value", formatCurr(data.purchase.allTime?.totalValue), "Platform-wide spend", "fas fa-coins", "#10b981")}
                {renderKPI("Pending Payments", formatNum(data.purchase.allTime?.pendingCount), `${formatCurr(data.purchase.allTime?.pendingValue)} to be paid`, "fas fa-clock", "#f59e0b")}
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Purchase Volume Trends (Last 30 Days)</h3>
                <TrendChart data={data.purchase.trends} color="#10b981" type="amount" />
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Top Suppliers Across Platform</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Supplier Name</th>
                        <th>Bill Count</th>
                        <th>Total Purchase Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.purchase.topSuppliers?.map((sup, idx) => (
                        <tr key={sup._id}>
                          <td>#{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{sup._id || 'Unknown Supplier'}</td>
                          <td>{formatNum(sup.count)}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurr(sup.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'inventory' && data.inventory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Products Listed", formatNum(data.inventory.allTime?.count), "Unique items across shops", "fas fa-box-open", "#3b82f6")}
                {renderKPI("Total Stock Value", formatCurr(data.inventory.allTime?.totalValue), "Estimated platform inventory value", "fas fa-hand-holding-usd", "#10b981")}
                {renderKPI("Low Stock Alerts", formatNum(data.inventory.allTime?.lowStock), "Items running low", "fas fa-battery-quarter", "#f59e0b")}
                {renderKPI("Out of Stock", formatNum(data.inventory.allTime?.outOfStock), "Items completely depleted", "fas fa-times-circle", "#ef4444")}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Most Stocked Categories</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.inventory.categories?.map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{c._id || 'Uncategorized'}</div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                          <div><span style={{ color: 'var(--text-3)' }}>Products:</span> {formatNum(c.count)}</div>
                          <div><span style={{ color: 'var(--text-3)' }}>Units:</span> {formatNum(c.stock)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '10px' }}>Critical Alerts</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#ef444415', borderRadius: '8px', border: '1px solid #ef444430' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-skull-crossbones" style={{ color: '#ef4444', fontSize: '24px' }}></i>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ef4444' }}>Dead Stock Items</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Items with no sales in 90 days</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>{formatNum(data.inventory.deadStockCount)}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f59e0b15', borderRadius: '8px', border: '1px solid #f59e0b30' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <i className="fas fa-hourglass-end" style={{ color: '#f59e0b', fontSize: '24px' }}></i>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f59e0b' }}>Expiry Alerts</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>Items expiring within 30 days</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>{formatNum(data.inventory.expiryCount)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'accounting' && data.accounting && data.accounting.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Receivables", formatCurr(data.accounting.data.totalReceivables), "Customer dues platform-wide", "fas fa-arrow-down", "#10b981")}
                {renderKPI("Total Payables", formatCurr(data.accounting.data.totalPayables), "Supplier dues platform-wide", "fas fa-arrow-up", "#ef4444")}
                {renderKPI("Overdue Payments", formatCurr(data.accounting.data.overduePayments), "Across all shops", "fas fa-exclamation-circle", "#f59e0b")}
                {renderKPI("Net Cash Flow", formatCurr(data.accounting.data.totalCashFlow), "Platform-wide recorded", "fas fa-money-bill-wave", "#3b82f6")}
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#ef4444' }}>
                  <i className="fas fa-flag" style={{ marginRight: '8px' }}></i> Shops with Negative Balance
                </h3>
                {data.accounting.data.negativeBalanceShops?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Current Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.accounting.data.negativeBalanceShops.map(shop => (
                          <tr key={shop._id}>
                            <td style={{ fontWeight: 600 }}>{shop.name}</td>
                            <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurr(shop.accountBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-3)', padding: '20px 0', textAlign: 'center' }}>No shops with negative balance found.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'gst' && data.gst && data.gst.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Pending Filings", formatNum(data.gst.data.shopsPendingFiling), "Shops with pending GST", "fas fa-file-invoice", "#f59e0b")}
                {renderKPI("Completion Rate", `${data.gst.data.filingCompletionRate}%`, "Overall platform compliance", "fas fa-check-circle", "#10b981")}
                {renderKPI("Total GST Collected", formatCurr(data.gst.data.totalGSTCollected), "Platform-wide", "fas fa-coins", "#3b82f6")}
                {renderKPI("E-Way Bills Generated", formatNum(data.gst.data.ewayBillCount), "Total count", "fas fa-truck", "#8b5cf6")}
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#ef4444' }}>
                  <i className="fas fa-flag" style={{ marginRight: '8px' }}></i> Non-compliant Shops
                </h3>
                {data.gst.data.nonCompliantShops?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Shop Name</th>
                          <th>Flag Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.gst.data.nonCompliantShops.map((shop, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{shop.name}</td>
                            <td style={{ color: '#ef4444' }}>{shop.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-3)', padding: '20px 0', textAlign: 'center' }}>All shops appear compliant.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'expense' && data.expense && data.expense.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Expenses", formatCurr(data.expense.data.totalExpenses), "Recorded platform-wide", "fas fa-receipt", "#ef4444")}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Monthly Expense Trends</h3>
                  <TrendChart data={data.expense.data.monthlyTrends} color="#ef4444" type="amount" />
                </div>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Expense Category Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.expense.data.categoryBreakdown?.map(c => (
                      <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600 }}>{c._id || 'Uncategorized'}</div>
                        <div style={{ fontWeight: 600, color: '#ef4444' }}>{formatCurr(c.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#ef4444' }}>
                  <i className="fas fa-flag" style={{ marginRight: '8px' }}></i> Shops with Unusually High Expenses
                </h3>
                {data.expense.data.highExpenseShops?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Shop ID</th>
                          <th>Total Expenses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.expense.data.highExpenseShops.map((shop, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{shop.shopId}</td>
                            <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurr(shop.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-3)', padding: '20px 0', textAlign: 'center' }}>No unusual expenses detected.</div>
                )}
              </div>
            </div>
          )}

          {tab === 'payment' && data.payment && data.payment.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Payments Collected", formatCurr(data.payment.data.totalCollected), "Platform-wide", "fas fa-money-check-alt", "#3b82f6")}
                {renderKPI("Failed Payments", formatNum(data.payment.data.failedAttempts), "Failed transaction attempts", "fas fa-times-circle", "#ef4444")}
                {renderKPI("Pending / Overdue", formatCurr(data.payment.data.pendingOverduePayments), "Outstanding across all shops", "fas fa-clock", "#f59e0b")}
                {renderKPI("Advance Payments", formatCurr(data.payment.data.advancePaymentsValue), `${formatNum(data.payment.data.advancePaymentsCount)} advance payments`, "fas fa-fast-forward", "#10b981")}
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Payment Mode Distribution</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Payment Mode</th>
                        <th>Transaction Count</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payment.data.modeDistribution?.map((mode, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{mode._id || 'Unknown'}</td>
                          <td>{formatNum(mode.count)}</td>
                          <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurr(mode.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'delivery' && data.delivery && data.delivery.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Total Deliveries", formatNum(data.delivery.data.totalDeliveries), "Platform-wide", "fas fa-shipping-fast", "#3b82f6")}
                {renderKPI("Completed Deliveries", formatNum(data.delivery.data.completedDeliveries), "Successfully delivered", "fas fa-check-circle", "#10b981")}
                {renderKPI("Pending Deliveries", formatNum(data.delivery.data.pendingDeliveries), "In-transit or assigned", "fas fa-truck-loading", "#f59e0b")}
                {renderKPI("Failed Deliveries", formatNum(data.delivery.data.failedDeliveries), "Could not be delivered", "fas fa-times-circle", "#ef4444")}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Performance Metrics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 600 }}>Delivery Success Rate</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{data.delivery.data.successRate}%</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 600 }}>Average Delivery Time</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>{data.delivery.data.averageDeliveryTime}</div>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Top Performing Delivery Boys</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Delivery Boy ID</th>
                          <th>Completed Deliveries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.delivery.data.topPerformingBoys?.map((boy, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{boy.id || 'Unknown'}</td>
                            <td style={{ color: '#10b981', fontWeight: 600 }}>{formatNum(boy.count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'offers' && data.offers && data.offers.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Active Offers", formatNum(data.offers.data.totalActiveOffers), "Across all shops", "fas fa-tags", "#3b82f6")}
                {renderKPI("Total Discount Given", formatCurr(data.offers.data.totalDiscountGiven), "Platform-wide value", "fas fa-hand-holding-usd", "#10b981")}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Most Used Coupon Codes</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Coupon Code</th>
                          <th>Times Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.offers.data.mostUsedCoupons?.map((coupon, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, color: '#3b82f6' }}>{coupon.code}</td>
                            <td>{formatNum(coupon.usage)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Offer Type Performance Summary</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Offer Type</th>
                          <th>Conversions / Uses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.offers.data.offerPerformance?.map((perf, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{perf.type}</td>
                            <td style={{ color: '#10b981', fontWeight: 600 }}>{formatNum(perf.conversions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'staff' && data.staff && data.staff.data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {renderKPI("Login Frequency", data.staff.data.loginFrequency, "Platform-wide avg", "fas fa-sign-in-alt", "#3b82f6")}
                {renderKPI(
                  "Total Staff Members", 
                  formatNum(data.staff.data.totalStaffByRole?.reduce((sum, r) => sum + (r.count || 0), 0) || 0), 
                  "Click to view active employees across all shops", 
                  "fas fa-user-friends", 
                  "var(--accent)", 
                  () => handleOpenEmployeesModal('all')
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Staff by Role</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Total Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.staff.data.totalStaffByRole?.map((role, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{role._id || 'Unknown'}</td>
                            <td>{formatNum(role.count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Most Active Staff (Bills Created)</h3>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Staff Name</th>
                          <th>Bills Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.staff.data.mostActiveStaff?.map((staff, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{staff.name}</td>
                            <td style={{ color: '#10b981', fontWeight: 600 }}>{formatNum(staff.billsCreated)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#ef4444' }}>
                  <i className="fas fa-shield-alt" style={{ marginRight: '8px' }}></i> Suspicious Staff Activity Alerts
                </h3>
                {data.staff.data.suspiciousAlerts?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Staff Member</th>
                          <th>Issue Detected</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.staff.data.suspiciousAlerts.map((alert, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{alert.user}</td>
                            <td style={{ color: '#ef4444' }}>{alert.issue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-3)', padding: '20px 0', textAlign: 'center' }}>No suspicious activity detected.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
