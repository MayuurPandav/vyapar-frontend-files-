import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');

  const validateEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter a valid name.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const success = await register({ name, email, password, role });
    if (success) {
      navigate('/');
    } else {
      setError('Registration failed. Please check your details and try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '48px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Register as admin or staff to manage invoices and inventory.</p>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus style={{ width: 14, height: 14 }} /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="fi"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail style={{ width: 14, height: 14 }} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fi"
              placeholder="example@vyapar.com"
              required
            />
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock style={{ width: 14, height: 14 }} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fi"
              placeholder="Create password"
              required
            />
          </div>
          <div className="fg">
            <label>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="fi"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Register</button>
          {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--accent)' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
