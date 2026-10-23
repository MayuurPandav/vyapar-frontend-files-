import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await forgotPassword(email);
    if (success) {
      setSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '48px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Forgot Password</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Enter your email to receive a secure reset link.</p>
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
          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>Send reset link</button>
        </form>
        {submitted && <p style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--accent)' }}>Reset instructions have been sent to your email.</p>}
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
          Remembered your password?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--accent)' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
