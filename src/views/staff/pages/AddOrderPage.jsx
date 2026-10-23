import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useData } from '../context/DataContext';

const AddOrderPage = () => {
  const navigate = useNavigate();
  const { customers, addOrder, ready } = useData();
  const [orderData, setOrderData] = useState({ customerId: '', customerName: '', orderId: '', amount: '', items: '', status: 'Pending', notes: '' });

  const handleChange = (e) => {
    const value = e.target.value;
    setOrderData({ ...orderData, [e.target.name]: value });
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selected = customers.find((customer) => customer._id === customerId);
    setOrderData({ ...orderData, customerId, customerName: selected?.name || '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrder({
      ...orderData,
      amount: Number(orderData.amount) || 0,
    });
    navigate('/orders');
  };

  if (!ready) return <Loader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Create Order</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Record a new customer order for dispatch.</p>
        </div>
        <button onClick={() => navigate('/orders')} className="btn">
          Back to Orders
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-row">
          <div className="fg">
            <label>Customer</label>
            <select value={orderData.customerId} name="customerId" onChange={handleCustomerChange} className="fi" required>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fg">
            <label>Order ID</label>
            <input name="orderId" value={orderData.orderId} onChange={handleChange} className="fi" placeholder="ORD-12345" required />
          </div>
        </div>
        <div className="form-row">
          <div className="fg">
            <label>Amount</label>
            <input type="number" name="amount" value={orderData.amount} onChange={handleChange} min="0" className="fi" required />
          </div>
          <div className="fg">
            <label>Items</label>
            <input name="items" value={orderData.items} onChange={handleChange} className="fi" placeholder="Product x2, Bottle x1" />
          </div>
        </div>
        <div className="fg">
          <label>Status</label>
          <select name="status" value={orderData.status} onChange={handleChange} className="fi">
            <option>Pending</option>
            <option>Processing</option>
            <option>Completed</option>
          </select>
        </div>
        <div className="fg">
          <label>Notes</label>
          <textarea name="notes" value={orderData.notes} onChange={handleChange} rows="4" className="fi" />
        </div>
        <div>
          <button type="submit" className="btn btn--primary">Save Order</button>
        </div>
      </form>
    </div>
  );
};

export default AddOrderPage;
