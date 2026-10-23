import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { User, Mail, Phone, MapPin } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile, loginHistory, fetchLoginHistory } = useAuth();
  const { loginHistoryForUser } = useData();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
      fetchLoginHistory();
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">My Profile</h2>
            <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)' }}>Update your profile information and address details.</p>
          </div>
          <button onClick={() => navigate('/profile/change-password')} className="btn btn--primary">
            Change Password
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="fg">
            <label>Name</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
              <User className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="fi"
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
          </div>
          <div className="fg">
            <label>Email</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
              <Mail className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="fi"
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
          </div>
          <div className="fg">
            <label>Phone</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
              <Phone className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="fi"
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
          </div>
          <div className="fg md:col-span-2">
            <label>Address</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px' }}>
              <MapPin className="h-4 w-4" style={{ color: 'var(--text-3)' }} />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="fi"
                style={{ border: 'none', background: 'transparent' }}
              />
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn btn--primary">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <div className="card">
        <h3 className="text-lg font-semibold">Recent Logins</h3>
        <p className="text-sm text-slate-500" style={{ color: 'var(--text-3)', marginBottom: '16px' }}>Your recent login attempts and devices.</p>
        <div className="space-y-3">
          {user ? (
            (loginHistory && loginHistory.length > 0 ? loginHistory : loginHistoryForUser(user._id)).map((ev) => {
              const dateVal = ev.createdAt || ev.timestamp;
              const deviceVal = ev.userAgent || ev.device || 'Browser';
              const ipVal = ev.ipAddress || ev.ip || '127.0.0.1';
              return (
                <div key={ev._id} className="card" style={{ padding: '16px', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-1)', fontSize: '13.5px' }}>{new Date(dateVal).toLocaleString()}</div>
                    <div style={{ color: 'var(--text-3)', fontSize: '12px', marginTop: '4px' }}>{deviceVal} • {ipVal}</div>
                  </div>
                  <div>
                    {ev.successful === false ? (
                      <span className="badge badge--red">Failed</span>
                    ) : (
                      <span className="badge badge--green">Success</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>No login history available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
