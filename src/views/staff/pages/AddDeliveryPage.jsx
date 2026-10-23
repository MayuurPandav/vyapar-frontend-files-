import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

const AddDeliveryPage = () => {
  const navigate = useNavigate();
  const { addDelivery } = useData();
  const { user } = useAuth();
  const [deliveryData, setDeliveryData] = useState({ customerName: '', address: '', status: 'Pending', notes: '' });

  const handleChange = (e) => {
    setDeliveryData({ ...deliveryData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const created = addDelivery(deliveryData, user?._id || 'staff-1');
    navigate(`/deliveries/${created._id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Add Delivery</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Create a new delivery assignment for an order.</p>
        </div>
        <button onClick={() => navigate('/deliveries')} className="btn">
          Back to Deliveries
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-row">
          <div className="fg">
            <label>Customer Name</label>
            <input name="customerName" value={deliveryData.customerName} onChange={handleChange} className="fi" required />
          </div>
          <div className="fg">
            <label>Address</label>
            <input name="address" value={deliveryData.address} onChange={handleChange} className="fi" required />
          </div>
        </div>
        <div className="fg">
          <label>Status</label>
          <select name="status" value={deliveryData.status} onChange={handleChange} className="fi">
            <option>Pending</option>
            <option>Processing</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="fg">
          <label>Notes</label>
          <textarea name="notes" value={deliveryData.notes} onChange={handleChange} rows="4" className="fi" />
        </div>
        <div>
          <button type="submit" className="btn btn--primary">Create Delivery</button>
        </div>
      </form>
    </div>
  );
};

export default AddDeliveryPage;
