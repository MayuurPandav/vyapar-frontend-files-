import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { Search, PlusCircle } from 'lucide-react';
import { useData } from '../context/DataContext';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orders, ready, updateOrder } = useData();
  const [search, setSearch] = useState('');

  const filterParam = (searchParams.get('filter') || searchParams.get('status') || 'all').toLowerCase();

  if (!ready) return <Loader />;

  const filtered = orders
    .filter((order) =>
      order.customerName.toLowerCase().includes(search.toLowerCase()) || order.orderId.toLowerCase().includes(search.toLowerCase())
    )
    .filter((order) => {
      if (filterParam === 'all') return true;
      if (filterParam === 'pending') return ['pending', 'processing'].includes(order.status.toLowerCase());
      return order.status.toLowerCase() === filterParam;
    });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Orders</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Track order status and payments.</p>
          </div>
          <button onClick={() => navigate('/orders/new')} className="btn btn--primary">
            <PlusCircle className="h-4 w-4" /> New Order
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">Order List</h3>
          <div className="topbar__search" style={{ width: 'auto', minWidth: '220px' }}>
            <i className="fas fa-search" style={{ left: '16px' }}></i>
            <input
              type="search"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Time Placed</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const orderTime = order.createdAt
                  ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'N/A';
                const canComplete = ['pending', 'processing'].includes(order.status.toLowerCase());
                const badgeClass = order.status === 'Completed' ? 'badge--green' : 'badge--yellow';
                return (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-1)' }}>{order.orderId}</td>
                    <td>{order.customerName}</td>
                    <td style={{ color: 'var(--text-2)' }}>{order.items || order.notes || '—'}</td>
                    <td>₹{order.amount}</td>
                    <td>{orderTime}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{order.status}</span>
                    </td>
                    <td>
                      {canComplete ? (
                        <button
                          onClick={() => updateOrder(order._id, { status: 'Completed' })}
                          className="btn btn--sm btn--primary"
                        >
                          Mark Complete
                        </button>
                      ) : (
                        <span className="badge badge--green" style={{ opacity: 0.7 }}>Done</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="mt-5 text-sm" style={{ color: 'var(--text-3)' }}>No matching orders found.</p>}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
