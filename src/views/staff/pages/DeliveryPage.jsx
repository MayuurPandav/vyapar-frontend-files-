import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { Search, Truck, PlusCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const { deliveries, ready } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  if (!ready) return <Loader />;

  const isManager = user?.role === 'admin' || user?.permissions?.canManageDelivery;

  const allowedDeliveries = deliveries.filter((delivery) => {
    if (isManager) return true;
    const assignedId = delivery.assignedTo?._id || delivery.assignedTo;
    return assignedId && assignedId.toString() === user?._id?.toString();
  });

  const filtered = allowedDeliveries.filter((delivery) => (delivery.customerName || '').toLowerCase().includes(search.toLowerCase()) || (delivery.status || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Delivery Tracking</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Monitor orders in transit and delivery status.</p>
        </div>
        <button onClick={() => navigate('/deliveries/new')} className="btn btn--primary">
          <PlusCircle style={{ width: 16, height: 16 }} /> New Delivery
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Deliveries</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
            <Search style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
            <input
              type="search"
              placeholder="Search deliveries"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--text-1)', width: '100%' }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((delivery) => (
                <tr key={delivery._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/deliveries/${delivery._id}`)}>
                  <td>#{delivery._id.slice(-6)}</td>
                  <td>{delivery.customerName}</td>
                  <td>{delivery.address}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Truck style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
                      {delivery.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>No deliveries match that search.</p>}
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
