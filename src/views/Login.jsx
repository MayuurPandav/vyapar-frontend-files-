import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { handleLogin } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchTarget, setLaunchTarget] = useState('index.html');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin ? { username, password } : { username, password, phone };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setLoading(false);
        setLaunching(true);
        setLaunchTarget(data.user.role === 'super_admin' ? 'super_admin' : 'dashboard');
        
        setTimeout(() => {
          setLaunching(false);
          handleLogin(data);
        }, 1200);
      } else {
        throw new Error(data.message || 'Error processing request');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-body-wrapper" style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.14), transparent 20%), linear-gradient(135deg, #08101f 0%, #111a33 45%, #171d43 100%)',
      color: '#f8fafc',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Back button */}
      <button
        onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = '/'; }}
        className="btn btn--sm"
        style={{ position: 'absolute', top: 18, left: 18, zIndex: 30 }}
        aria-label="Back"
      >
        <i className="fas fa-arrow-left" style={{ marginRight: 8 }}></i>
        Back
      </button>
      {/* Background blobs */}
      <div className="blob blob-1" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(59, 130, 246, 0.3)', opacity: 0.6, zIndex: 0 }}></div>
      <div className="blob blob-2" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', filter: 'blur(80px)', background: 'rgba(139, 92, 246, 0.24)', opacity: 0.6, zIndex: 0 }}></div>

      <div className="hero-banner" style={{ position: 'absolute', top: '18%', right: '8%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', zIndex: 0, pointerEvents: 'none', opacity: 0.92 }}>
        <div className="hero-title" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'rgba(248, 250, 252, 0.92)', letterSpacing: '-0.04em' }}>Vyapar</div>
        <div className="hero-subtitle" style={{ color: 'rgba(148, 163, 184, 0.85)', fontSize: '1rem', maxWidth: '320px', textAlign: 'right', lineHeight: 1.75 }}>Billing, inventory and payments powered for growth.</div>
        <div className="hero-badge" style={{ padding: '10px 16px', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.14)', color: '#e0e7ff', fontSize: '0.85rem', letterSpacing: '0.08em' }}>Designed for smart businesses</div>
      </div>

      {/* Launch Overlay */}
      {launching && (
        <div className="launch-overlay active" style={{ position: 'absolute', inset: 0, background: 'rgba(3, 10, 25, 0.94)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 20, opacity: 1, visibility: 'visible' }}>
          <div className="launch-card" style={{ width: 'min(92%, 420px)', padding: '36px 30px', borderRadius: '28px', backgroundColor: 'rgba(12, 20, 42, 0.95)', border: '1px solid rgba(99, 102, 241, 0.16)', boxShadow: '0 36px 90px rgba(0,0,0,0.45)', textAlign: 'center' }}>
            <div className="launch-logo" style={{ width: '68px', height: '68px', margin: '0 auto 18px', display: 'grid', placeItems: 'center', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(99, 102, 241, 0.9))', boxShadow: '0 16px 35px rgba(59, 130, 246, 0.25)' }}><i className="fas fa-rocket" style={{ color: '#fff', fontSize: '1.35rem' }}></i></div>
            <h2 style={{ fontSize: '1.65rem', letterSpacing: '-0.04em', color: '#f8fafc', margin: 0 }}>Launching Vyapar</h2>
            <p style={{ color: 'rgba(241, 245, 249, 0.78)', fontSize: '0.95rem', lineHigh: 1.8, margin: '14px 0 24px' }}>Preparing your secure business dashboard. This will only take a moment.</p>
            <div className="launch-progress" style={{ height: '10px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: '100%', height: '100%', background: 'linear-gradient(90deg, #22c55e, #6366f1, #ec4899)', transition: 'width 1.2s ease-in-out' }}></span>
            </div>
          </div>
        </div>
      )}

      {/* Main Glass Card Form */}
      <div className="login-container" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '48px 40px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
          <div className="logo-icon-wrapper" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)' }}>
            <i className="fas fa-chart-pie" style={{ fontSize: '24px', color: '#fff' }}></i>
          </div>
          <span style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Vyapar</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Email Address</label>
            <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="email"
                className="form-control"
                placeholder="admin@vyapar.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '15px', color: '#f8fafc' }}
                required
              />
              <i className="fas fa-envelope" style={{ position: 'absolute', left: '16px', color: '#94a3b8' }}></i>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phone Number</label>
              <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '15px', color: '#f8fafc' }}
                  required={!isLogin}
                />
                <i className="fas fa-phone" style={{ position: 'absolute', left: '16px', color: '#94a3b8' }}></i>
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
            <div className="input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '15px', color: '#f8fafc' }}
                required
              />
              <i className="fas fa-lock" style={{ position: 'absolute', left: '16px', color: '#94a3b8' }}></i>
            </div>
          </div>

          {errorMsg && (
            <div className="error-msg" style={{ display: 'block', color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'center', background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
              <i className="fas fa-circle-exclamation" style={{ marginRight: '6px' }}></i> {errorMsg}
            </div>
          )}

          <button type="submit" className="btn" disabled={loading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '32px', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <i className="fas fa-arrow-right"></i>
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
            <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setErrorMsg(''); }}
              style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
