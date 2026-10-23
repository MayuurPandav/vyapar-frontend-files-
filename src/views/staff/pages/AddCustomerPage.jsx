import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const AddCustomerPage = () => {
  const navigate = useNavigate();
  const { addCustomer } = useData();
  const [customerData, setCustomerData] = useState({ name: '', email: '', phone: '', address: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const created = await addCustomer(customerData);
    navigate(`/customers/${created._id}`);
  };

  const handleChange = (e) => {
    setCustomerData({ ...customerData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Add Customer</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Add a new customer to your billing and delivery system.</p>
        </div>
        <button onClick={() => navigate('/customers')} className="btn">
          Back to Customers
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-row">
          <div className="fg">
            <label>Name</label>
            <input name="name" onChange={handleChange} value={customerData.name} className="fi" required />
          </div>
          <div className="fg">
            <label>Email</label>
            <input type="email" name="email" onChange={handleChange} value={customerData.email} className="fi" required />
          </div>
        </div>
        <div className="fg">
          <label>Phone</label>
          <input name="phone" onChange={handleChange} value={customerData.phone} className="fi" required />
        </div>
        <div className="fg">
          <label>Address</label>
          <textarea name="address" onChange={handleChange} value={customerData.address} className="fi" rows="4" required />
        </div>
        <div>
          <button type="submit" className="btn btn--primary">Save Customer</button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerPage;
