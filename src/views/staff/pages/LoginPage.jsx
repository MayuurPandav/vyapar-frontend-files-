import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const success = await login({ email, password });
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '48px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Welcome Back</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Log in to access your Vyapar-style billing dashboard.</p>
        </div>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit}>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail style={{ width: 14, height: 14 }} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fi"
              placeholder="admin@vyapar.com"
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
              placeholder="Enter password"
              required
            />
          </div>
          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Log In</button>
          {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>{error}</p>}
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'var(--accent)' }}>
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
