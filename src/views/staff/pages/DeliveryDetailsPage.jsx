import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const DeliveryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findDeliveryById, updateDeliveryStatus, ready } = useData();
  const { user } = useAuth();
  const delivery = useMemo(() => findDeliveryById(id), [findDeliveryById, id]);
  const [localStatus, setLocalStatus] = useState(delivery?.status || 'Pending');

  if (!ready) return <Loader />;
  if (!delivery) return <div className="card">Delivery not found.</div>;

  const isManager = user?.role === 'admin' || user?.permissions?.canManageDelivery;
  const assignedId = delivery.assignedTo?._id || delivery.assignedTo;
  const isAssignee = assignedId && assignedId.toString() === user?._id?.toString();
  const canUpdate = isManager || isAssignee;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Delivery #{delivery._id.slice(-6)}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Delivery status and order details.</p>
        </div>
        <button onClick={() => navigate('/deliveries')} className="btn">
          Back to Deliveries
        </button>
      </div>

      <div className="card">
        <div className="form-row">
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Customer</p>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>{delivery.customerName}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8 }}>{delivery.address}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Delivery Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              {canUpdate ? (
                <>
                  <select value={localStatus} onChange={(e) => setLocalStatus(e.target.value)} className="fi">
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                  <button onClick={() => updateDeliveryStatus(delivery._id, localStatus)} className="btn btn--primary">Update</button>
                </>
              ) : (
                <div style={{ padding: '8px 16px', background: 'var(--bg-input)', borderRadius: 8, color: 'var(--text-2)' }}>{delivery.status}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Order Notes</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 12 }}>{delivery.notes || 'No additional delivery notes available.'}</p>
      </div>
    </div>
  );
};

export default DeliveryDetailsPage;
