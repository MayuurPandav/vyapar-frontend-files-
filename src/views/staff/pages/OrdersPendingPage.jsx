import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { ArrowRight, Printer, MessageCircle, Search, Eye } from 'lucide-react';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const isSameDay = (first, second) => {
  const a = new Date(first);
  const b = new Date(second);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const OrdersPendingPage = () => {
  const { orders, customers, users, updateOrder } = useData();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drillModal, setDrillModal] = useState(null);

  const showTotalPendingDrilldown = () => {
    const cols = ["Order ID", "Customer", "Items", "Amount", "Status"];
    const pendingItems = orderRows.filter(order => ['pending', 'processing', 'out for delivery'].includes(order.status?.toLowerCase()));
    const rows = pendingItems.map(order => [
      order.orderId,
      order.customerName,
      order.items || order.notes || '—',
      formatCurrency(order.amount),
      order.status
    ]);
    setDrillModal({
      title: "Total Pending Orders Breakdown",
      cols,
      rows
    });
  };

  const showOverdueDrilldown = () => {
    const cols = ["Order ID", "Customer", "Amount", "Time Placed"];
    const rows = overdueOrders.map(order => [
      order.orderId,
      order.customerName,
      formatCurrency(order.amount),
      order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'
    ]);
    setDrillModal({
      title: "Overdue Orders Breakdown",
      cols,
      rows
    });
  };

  const showOutForDeliveryDrilldown = () => {
    const cols = ["Order ID", "Customer", "Address", "Amount"];
    const rows = outForDeliveryOrders.map(order => [
      order.orderId,
      order.customerName,
      order.customer?.address || order.address || 'Address not available',
      formatCurrency(order.amount)
    ]);
    setDrillModal({
      title: "Orders Out for Delivery Breakdown",
      cols,
      rows
    });
  };

  const staffUsers = useMemo(() => users.filter((user) => user.role === 'staff'), [users]);

  const orderRows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        customer: customers.find((customer) => customer._id === order.customerId) || {},
      })),
    [orders, customers]
  );

  const now = Date.now();
  const overdueOrders = useMemo(
    () =>
      orderRows.filter((order) => {
        const status = order.status?.toLowerCase();
        if (!['pending', 'processing'].includes(status)) return false;
        const createdAt = order.createdAt ? new Date(order.createdAt).getTime() : null;
        return createdAt ? now - createdAt > 1000 * 60 * 60 * 2 : false;
      }),
    [orderRows, now]
  );

  const outForDeliveryOrders = useMemo(
    () => orderRows.filter((order) => order.status?.toLowerCase() === 'out for delivery'),
    [orderRows]
  );

  const totalPending = useMemo(
    () => orderRows.filter((order) => ['pending', 'processing', 'out for delivery'].includes(order.status?.toLowerCase())).length,
    [orderRows]
  );

  const filteredOrders = useMemo(() => {
    return orderRows
      .filter((order) => {
        if (filterTab === 'all') return ['pending', 'processing', 'out for delivery'].includes(order.status?.toLowerCase());
        if (filterTab === 'overdue') return overdueOrders.some((item) => item._id === order._id);
        return order.status?.toLowerCase() === 'out for delivery';
      })
      .filter(
        (order) =>
          order.customerName.toLowerCase().includes(search.toLowerCase()) ||
          order.orderId.toLowerCase().includes(search.toLowerCase()) ||
          (order.customer?.phone || '').includes(search)
      );
  }, [orderRows, filterTab, search, overdueOrders]);

  const printSlip = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Order ${order.orderId}</title></head><body>
        <h1>Delivery Slip: ${order.orderId}</h1>
        <p><strong>Customer:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.customer?.phone || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.customer?.address || order.address || 'N/A'}</p>
        <p><strong>Items:</strong> ${order.items || order.notes || 'N/A'}</p>
        <p><strong>Total:</strong> ${formatCurrency(order.amount)}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const notifyCustomer = (order) => {
    const phone = order.customer?.phone?.replace(/\D/g, '');
    const message = `Your order ${order.orderId} is on the way.`;
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const statusTabs = [
    { id: 'all', label: 'All Pending' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'outForDelivery', label: 'Out for Delivery' },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Pending Orders</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Live order management for pending deliveries.</p>
          </div>
          <div className="topbar__search" style={{ width: 'auto', minWidth: '280px' }}>
            <i className="fas fa-search" style={{ left: '16px' }}></i>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name..."
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showTotalPendingDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Total Pending</p>
          <p className="stat__val">{totalPending}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showOverdueDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Overdue</p>
          <p className="stat__val" style={{ color: 'var(--red)' }}>{overdueOrders.length}</p>
        </div>
        <div 
          className="card card--lift cursor-pointer hover:scale-[1.02] active:scale-95 transition-all" 
          onClick={showOutForDeliveryDrilldown}
          style={{ cursor: 'pointer' }}
        >
          <p className="stat__lbl">Out for Delivery</p>
          <p className="stat__val" style={{ color: 'var(--blue)' }}>{outForDeliveryOrders.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className="btn btn--sm"
              style={{
                background: filterTab === tab.id ? 'var(--accent)' : 'transparent',
                borderColor: filterTab === tab.id ? 'var(--accent)' : 'var(--border)',
                color: filterTab === tab.id ? '#fff' : 'var(--text-2)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredOrders.length === 0 && <p className="text-sm" style={{ color: 'var(--text-3)' }}>No pending orders match the current filter.</p>}
          {filteredOrders.map((order) => {
            const orderTime = order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const elapsed = order.createdAt ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60)) : 0;
            const longAgo = order.createdAt ? `${elapsed} hrs ago` : 'N/A';
            const isOverdue = order.createdAt ? Date.now() - new Date(order.createdAt).getTime() > 1000 * 60 * 60 * 2 : false;
            return (
              <div key={order._id} className="card">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{order.orderId} · {order.customer?.phone || 'No phone'}</p>
                    <h3 className="mt-2 text-xl font-semibold">{order.customerName}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-2)', marginTop: '4px' }}>{order.customer?.address || order.address || 'Address not available'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>Order placed</p>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{orderTime}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{longAgo}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Items</p>
                    <p className="mt-2 text-sm font-medium">{order.items || order.notes || 'Not specified'}</p>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Amount</p>
                    <p className="mt-2 text-xl font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(order.amount)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className={`badge ${
                    order.status === 'Pending'
                      ? 'badge--yellow'
                      : order.status === 'Processing'
                      ? 'badge--blue'
                      : order.status === 'Out for Delivery'
                      ? 'badge--blue'
                      : 'badge--green'
                  }`}>
                    {order.status}
                  </span>
                  {isOverdue && <span className="badge badge--red">Overdue</span>}
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-sidebar)' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>Change Status</label>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                      className="fi"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div className="card" style={{ padding: '16px', background: 'var(--bg-sidebar)' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>Assign Staff</label>
                    <select
                      value={order.assignedTo || ''}
                      onChange={(e) => updateOrder(order._id, { assignedTo: e.target.value })}
                      className="fi"
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map((staff) => (
                        <option key={staff._id} value={staff._id}>{staff.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="card flex flex-col gap-2" style={{ padding: '16px', background: 'var(--bg-sidebar)', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => updateOrder(order._id, { status: 'Delivered' })}
                      className="btn btn--sm btn--primary"
                      style={{ justifyContent: 'center' }}
                    >
                      Mark Complete
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => printSlip(order)}
                        className="btn btn--sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                      <button
                        type="button"
                        onClick={() => notifyCustomer(order)}
                        className="btn btn--sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Notify
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="btn btn--sm"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrder && (
        <div className="overlay" style={{ display: 'block', zIndex: 1100 }}>
          <div className="modal" style={{ display: 'block', width: '700px', maxWidth: '92vw', zIndex: 1101 }}>
            <div className="modal__top">
              <div>
                <h3 className="text-xl font-semibold">Order Details</h3>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{selectedOrder.orderId} · {selectedOrder.customerName}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn--sm">
                ✕
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Customer</p>
                <p className="mt-2 font-semibold" style={{ color: 'var(--text-1)' }}>{selectedOrder.customerName}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{selectedOrder.customer?.phone || 'Phone not available'}</p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-2)' }}>{selectedOrder.customer?.address || selectedOrder.address || 'Address not available'}</p>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Status & Assignment</p>
                <p className="mt-2 text-md font-semibold" style={{ color: 'var(--text-1)' }}>{selectedOrder.status}</p>
                <p className="mt-3 text-xs" style={{ color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Assigned to</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{users.find((user) => user._id === selectedOrder.assignedTo)?.name || 'Unassigned'}</p>
              </div>
            </div>
            <div className="card mt-4" style={{ padding: '16px' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Items</p>
              <p className="mt-2 text-sm">{selectedOrder.items || selectedOrder.notes || 'No item details available'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Amount</p>
                <p className="mt-2 text-xl font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(selectedOrder.amount)}</p>
              </div>
              <div className="card" style={{ padding: '16px', background: 'var(--bg-input)' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 'bold' }}>Placed Date/Time</p>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-1)' }}>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => printSlip(selectedOrder)} className="btn">
                <Printer className="h-4 w-4" /> Print Slip
              </button>
              <button type="button" onClick={() => notifyCustomer(selectedOrder)} className="btn btn--primary">
                <MessageCircle className="h-4 w-4" /> Notify Customer
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

export default OrdersPendingPage;
