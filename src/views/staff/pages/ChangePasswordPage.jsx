import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordPage = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    await changePassword({ currentPassword, newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Change Password</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Secure your account with a strong new password.</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="fg">
          <label>Current Password</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <Lock style={{ width: 16, height: 16, color: 'var(--text-3)' }} />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-1)' }}
              required
            />
          </div>
        </div>

        <div className="fg">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="fi"
            required
          />
        </div>

        <div className="fg">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="fi"
            required
          />
        </div>

        <div>
          <button type="submit" className="btn btn--primary">
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
