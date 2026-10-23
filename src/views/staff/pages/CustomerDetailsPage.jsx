import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { useData } from '../context/DataContext';

const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findCustomerById, customerOutstanding, ready } = useData();
  const customer = useMemo(() => findCustomerById(id), [findCustomerById, id]);

  if (!ready) return <Loader />;
  if (!customer) return <div className="card">Customer not found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>{customer.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Customer details and contact information.</p>
        </div>
        <button onClick={() => navigate('/customers')} className="btn">
          Back to Customers
        </button>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Email</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{customer.email || 'N/A'}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Phone</p>
            <p style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{customer.phone}</p>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Outstanding Balance</p>
          <p style={{ fontSize: 22, fontWeight: 700, marginTop: 8, color: 'var(--red)' }}>
            ₹{(customer.outstandingBalance ?? customerOutstanding?.[customer._id] ?? 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Address</p>
          <p style={{ marginTop: 8, padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 8, color: 'var(--text-2)' }}>
            {customer.address || 'No address specified.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
