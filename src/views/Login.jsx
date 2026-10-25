import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
  const { handleLogin } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchTarget, setLaunchTarget] = useState('dashboard');

  const quickDemoAccounts = [
    { label: 'Admin', email: 'admin@vyapar.com', pass: 'admin123', icon: 'fa-shield-halved', badge: '#10b981' },
    { label: 'Cashier (POS)', email: 'cashier@vyapar.com', pass: 'cashier123', icon: 'fa-cash-register', badge: '#0ea5e9' },
    { label: 'Super Admin', email: 'superadmin@vyapar.com', pass: 'superadmin123', icon: 'fa-crown', badge: '#a855f7' },
    { label: 'Driver', email: 'DP-1001', pass: 'pass123', icon: 'fa-truck-fast', badge: '#f59e0b' },
    { label: 'Accountant', email: 'accountant@vyapar.com', pass: 'accountant123', icon: 'fa-calculator', badge: '#ec4899' },
  ];

  const handleQuickFill = (acc) => {
    setIsLogin(true);
    setUsername(acc.email);
    setPassword(acc.pass);
    setErrorMsg('');
  };

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

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { message: text || 'Invalid server response' };
      }

      if (res.ok) {
        setLoading(false);
        setLaunching(true);

        const r = (data.user && data.user.role || '').toString().toLowerCase().replace(/[-_]/g, '');
        const roleGreeting = 
          r === 'superadmin' ? 'Master Control Panel' :
          r === 'accountant' ? 'Accountant Portal' :
          r === 'staff' || r === 'cashier' ? 'Staff Billing Counter' :
          r === 'deliveryboy' ? 'Delivery Partner Panel' :
          'Merchant Dashboard';
        setLaunchTarget(roleGreeting);

        setTimeout(() => {
          setLaunching(false);
          if (window.location.pathname === '/login' || window.location.search.includes('login')) {
            window.history.pushState({}, '', '/');
          }
          handleLogin(data);
        }, 1100);
      } else {
        throw new Error(data.message || 'Error processing request');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="login-wrapper" style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18), transparent 35%), radial-gradient(circle at 85% 85%, rgba(14, 165, 233, 0.16), transparent 35%), linear-gradient(135deg, #070e1b 0%, #0f172a 40%, #09252c 100%)',
      color: '#f8fafc',
      fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Animated Blobs */}
      <div className="blob" style={{ position: 'absolute', top: '-8%', left: '-6%', width: '550px', height: '550px', borderRadius: '50%', filter: 'blur(100px)', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, rgba(6,182,212,0.1) 70%)', zIndex: 0 }}></div>
      <div className="blob" style={{ position: 'absolute', bottom: '-10%', right: '-8%', width: '650px', height: '650px', borderRadius: '50%', filter: 'blur(110px)', background: 'radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(16,185,129,0.1) 70%)', zIndex: 0 }}></div>

      {/* Top Header Bar */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669, #0ea5e9)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(16,185,129,0.4)' }}>
            <i className="fas fa-cubes" style={{ fontSize: '18px', color: '#fff' }}></i>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Vyapar <span style={{ fontSize: '12px', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', color: '#fff', WebkitTextFillColor: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 700, marginLeft: '6px' }}>2.0</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Dual-Theme Toggle */}
          <ThemeToggle />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
            All Systems Operational
          </div>

          <button
            onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = '/'; }}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </header>

      {/* Launch Loading Overlay */}
      {launching && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 14, 27, 0.94)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: 'min(90%, 420px)', padding: '40px 32px', borderRadius: '28px', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', display: 'grid', placeItems: 'center', borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #059669, #0ea5e9)', boxShadow: '0 16px 40px rgba(16, 185, 129, 0.4)' }}>
              <i className="fas fa-rocket" style={{ color: '#fff', fontSize: '1.6rem' }}></i>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.03em' }}>
              Launching Vyapar
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, margin: '14px 0 24px' }}>
              Preparing your secure <strong>{launchTarget}</strong>...
            </p>
            <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #0ea5e9, #6366f1)' }}></span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Content Area */}
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '100px auto 40px',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '48px',
        alignItems: 'center',
        zIndex: 10
      }}>
        
        {/* Left Side: Modern Glassmorphic Login Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          padding: '44px 36px',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)',
          position: 'relative'
        }}>
          {/* Back Button */}
          <button
            type="button"
            onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = '/'; }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '20px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>

          {/* Form Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setErrorMsg(''); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9px',
                  border: 'none',
                  background: isLogin ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: isLogin ? '#fff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setErrorMsg(''); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9px',
                  border: 'none',
                  background: !isLogin ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: !isLogin ? '#fff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Merchant Sign Up
              </button>
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.03em' }}>
              {isLogin ? 'Welcome Back' : 'Create Merchant Account'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              {isLogin 
                ? 'Sign in to access your business, accounting, or staff portal.'
                : 'Get started with Vyapar 2.0 to manage billing, inventory, and taxes.'}
            </p>
          </div>

          {/* Quick Demo Login 1-Click Fillers */}
          {isLogin && (
            <div style={{
              marginBottom: '22px',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-bolt"></i> 1-Click Demo Login
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Click to auto-fill</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quickDemoAccounts.map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      background: username === acc.email ? `${acc.badge}25` : 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${username === acc.email ? acc.badge : 'rgba(255, 255, 255, 0.12)'}`,
                      color: username === acc.email ? '#ffffff' : '#cbd5e1',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Fill ${acc.email} / ${acc.pass}`}
                  >
                    <i className={`fas ${acc.icon}`} style={{ color: acc.badge, fontSize: '11px' }}></i>
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isLogin ? (
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Email / Username / Employee ID
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i className="fas fa-user" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '14px' }}></i>
                  <input
                    type="text"
                    placeholder="e.g. admin@vyapar.com or cashier@vyapar.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '13px 16px 13px 44px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    Business Email / Username
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-envelope" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '14px' }}></i>
                    <input
                      type="text"
                      placeholder="e.g. admin@vyapar.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '13px 16px 13px 44px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    Mobile Phone Number
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-phone" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '14px' }}></i>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '13px 16px 13px 44px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  Password
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: '16px', color: '#64748b', fontSize: '14px' }}></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 44px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                color: '#f87171',
                fontSize: '13px',
                margin: '14px 0',
                background: 'rgba(248, 113, 113, 0.12)',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(248, 113, 113, 0.28)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-triangle-exclamation"></i>
                  <span style={{ fontWeight: 600 }}>{errorMsg}</span>
                </div>
                {errorMsg.toLowerCase().includes('credential') && (
                  <div style={{ fontSize: '11.5px', color: '#cbd5e1', borderTop: '1px solid rgba(248, 113, 113, 0.2)', paddingTop: '6px', lineHeight: 1.5 }}>
                    💡 <strong>Quick Fix:</strong> The merchant email is <code style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 5px', borderRadius: '4px' }}>admin@vyapar.com</code> (not <code>@example.com</code>). Simply click the <strong>Admin</strong> or <strong>Cashier</strong> button above to auto-fill!
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669, #0ea5e9)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '12px',
                boxShadow: '0 12px 25px -5px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Dashboard' : 'Create Merchant Account'}</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
            <span>{isLogin ? "Don't have an account yet?" : 'Already registered?'}</span>{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 700, cursor: 'pointer', padding: 0, marginLeft: '4px' }}
            >
              {isLogin ? 'Register New Merchant' : 'Sign In Now'}
            </button>
          </div>
        </div>

        {/* Right Side: Hero Visual Product Banner Showcase */}
        <div className="login-hero-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          {/* Main Visual Frame */}
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.35), rgba(15, 23, 42, 0.85))',
            borderRadius: '28px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 30px 70px -10px rgba(16, 185, 129, 0.25)',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient Background Glow Inside Card */}
            <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%)', filter: 'blur(50px)' }}></div>
            <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)', filter: 'blur(50px)' }}></div>

            {/* Top Product Pill & Branding */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1, #ec4899)', display: 'grid', placeItems: 'center', boxShadow: '0 8px 18px rgba(99,102,241,0.4)' }}>
                  <i className="fas fa-chart-pie" style={{ color: '#fff', fontSize: '20px' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>Vyapar 2.0</h3>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Enterprise ERP & Billing Platform</span>
                </div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '11px', fontWeight: 700 }}>
                ● Active Business Sync
              </span>
            </div>

            {/* 3D Visual Product Showcase Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '28px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 2,
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {/* Product Badge */}
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #6366f1, #ec4899)', margin: '0 auto 16px', display: 'grid', placeItems: 'center', boxShadow: '0 10px 25px rgba(99,102,241,0.4)' }}>
                <i className="fas fa-cubes" style={{ color: '#fff', fontSize: '24px' }}></i>
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                Unified Business Management
              </h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                All-in-one POS billing, inventory tracking, GST tax filing, and multi-portal operations for growing enterprises.
              </p>
            </div>

            {/* Bottom 3 Pills */}
            <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 2 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                <i className="fas fa-barcode" style={{ color: '#818cf8', fontSize: '16px', marginBottom: '4px' }}></i>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>POS Scanner</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                <i className="fas fa-file-invoice" style={{ color: '#34d399', fontSize: '16px', marginBottom: '4px' }}></i>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>GST Compliant</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                <i className="fas fa-truck-fast" style={{ color: '#f472b6', fontSize: '16px', marginBottom: '4px' }}></i>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>Fleet Tracking</div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
