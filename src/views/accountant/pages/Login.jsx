import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ─── Shared input style helper ────────────────────────────────────────────
const inputStyle = (focused) => ({
  width: '100%',
  padding: '13px 16px 13px 44px',
  background: focused ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
  border: `1.5px solid ${focused ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.09)'}`,
  borderRadius: 12,
  color: '#f0f1ff',
  fontSize: 14.5,
  fontWeight: 500,
  outline: 'none',
  transition: 'all 0.25s ease',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  letterSpacing: '0.3px',
});

const iconLeft = (isFocused, children) => (
  <div style={{
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    color: isFocused ? '#818cf8' : 'rgba(150,155,180,0.6)',
    transition: 'color 0.25s', pointerEvents: 'none',
  }}>{children}</div>
);



// ─── Main Login Component ─────────────────────────────────────────────────
const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();



  // Inject global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
      @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.1)} 66%{transform:translate(-30px,50px) scale(0.95)} }
      @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,60px) scale(1.05)} 66%{transform:translate(40px,-30px) scale(0.9)} }
      @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,40px) scale(1.08)} }
      @keyframes slideUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
      @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .login-card { animation: slideUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }
      .orb1 { animation: orb1 9s ease-in-out infinite; }
      .orb2 { animation: orb2 12s ease-in-out infinite; }
      .orb3 { animation: orb3 7s ease-in-out infinite; }
      .btn-shimmer { background:linear-gradient(110deg,#4f46e5 30%,#6366f1 50%,#7c3aed 70%,#4f46e5); background-size:200% auto; }
      .btn-shimmer:hover { animation: shimmer 1.4s linear infinite; }
      .btn-shimmer:active { transform:scale(0.98); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);



  // ── Login submit ──────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Employee ID is required'); return; }
    if (!password)           { setError('Password is required');    return; }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      {/* ── BACKDROP ── */}
      <div style={{
        minHeight:'100vh',
        background:'linear-gradient(135deg,#0a0a1a 0%,#0f0f2e 40%,#0a0f1e 70%,#090914 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
        position:'relative', overflow:'hidden',
      }}>
        {/* Orbs */}
        <div className="orb1" style={{position:'absolute',top:'10%',left:'8%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(99,102,241,0.22) 0%,rgba(99,102,241,0.05) 60%,transparent 80%)',filter:'blur(40px)',pointerEvents:'none'}} />
        <div className="orb2" style={{position:'absolute',bottom:'8%',right:'6%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,92,246,0.18) 0%,rgba(139,92,246,0.04) 60%,transparent 80%)',filter:'blur(50px)',pointerEvents:'none'}} />
        <div className="orb3" style={{position:'absolute',top:'55%',left:'55%',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.14) 0%,transparent 70%)',filter:'blur(35px)',pointerEvents:'none'}} />
        {/* Grid */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'60px 60px'}} />

        {/* ── LOGIN CARD ── */}
        <div className="login-card" style={{
          position:'relative',zIndex:10,
          width:'100%',maxWidth:460,margin:'0 16px',
          background:'rgba(255,255,255,0.035)',
          backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
          border:'1px solid rgba(255,255,255,0.09)',
          borderRadius:24,padding:'48px 44px',
          boxShadow:'0 32px 80px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.04) inset',
        }}>
          {/* Brand */}
          <div style={{textAlign:'center',marginBottom:36}}>
            <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:64,height:64,borderRadius:18,background:'linear-gradient(135deg,#4f46e5,#7c3aed)',boxShadow:'0 8px 32px rgba(99,102,241,0.45)',marginBottom:18}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M8 9h8M8 12h8M8 15h5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="6.5" cy="9" r="0.5" fill="white" stroke="white" strokeWidth="0.5"/>
                <circle cx="6.5" cy="12" r="0.5" fill="white" stroke="white" strokeWidth="0.5"/>
                <circle cx="6.5" cy="15" r="0.5" fill="white" stroke="white" strokeWidth="0.5"/>
              </svg>
            </div>
            <h1 style={{fontSize:26,fontWeight:800,color:'#fff',margin:'0 0 6px',letterSpacing:'-0.5px'}}>KhataFlow</h1>
            <p style={{fontSize:13.5,color:'rgba(180,185,210,0.75)',margin:0,fontWeight:400}}>Sign in to your workspace</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{display:'flex',alignItems:'center',gap:10,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:12,padding:'12px 16px',marginBottom:22,color:'#fca5a5',fontSize:13.5,fontWeight:500}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Employee ID */}
            <div style={{marginBottom:20}}>
              <label style={{display:'flex',alignItems:'center',gap:4,fontSize:13,fontWeight:600,color:'rgba(200,205,230,0.9)',marginBottom:8,letterSpacing:'0.2px'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{opacity:0.7}}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M14 10h4M14 14h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Employee ID
                <span style={{color:'#f87171',fontSize:15,lineHeight:1}}>*</span>
              </label>
              <div style={{position:'relative'}}>
                <input
                  id="login-employee-id"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onFocus={() => setFocused('id')}
                  onBlur={() => setFocused('')}
                  placeholder="e.g. EMP-2026-1234"
                  autoComplete="username"
                  style={inputStyle(focused === 'id')}
                />
                {iconLeft(focused === 'id', <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.8"/><path d="M13 10h5M13 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>)}
              </div>
              <p style={{fontSize:11.5,color:'rgba(140,145,175,0.7)',margin:'6px 0 0',fontWeight:400}}>You can also use your registered email address</p>
            </div>

            {/* Password */}
            <div style={{marginBottom:28}}>
              <label style={{display:'flex',alignItems:'center',gap:4,fontSize:13,fontWeight:600,color:'rgba(200,205,230,0.9)',letterSpacing:'0.2px',marginBottom:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{opacity:0.7}}><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Password
                <span style={{color:'#f87171',fontSize:15,lineHeight:1}}>*</span>
              </label>
              <div style={{position:'relative'}}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')}
                  onBlur={() => setFocused('')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{...inputStyle(focused === 'pw'), padding:'13px 48px 13px 44px', letterSpacing: showPassword ? '0.3px' : '0.1em'}}
                />
                {iconLeft(focused === 'pw', <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/></svg>)}
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'rgba(150,155,180,0.6)',cursor:'pointer',padding:2,display:'flex',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color='#818cf8'} onMouseLeave={e=>e.currentTarget.style.color='rgba(150,155,180,0.6)'}>
                  {showPassword ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-shimmer"
              style={{width:'100%',padding:'14px',border:'none',borderRadius:12,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',opacity:loading?0.75:1,transition:'opacity 0.2s,transform 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'inherit',letterSpacing:'0.2px',boxShadow:'0 4px 24px rgba(99,102,241,0.4)'}}
            >
              {loading ? (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{animation:'spin 0.8s linear infinite'}}><circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/><path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>Signing in…</>) : (<>Sign In<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></>)}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{position:'absolute',bottom:20,left:0,right:0,textAlign:'center',fontSize:12,color:'rgba(120,125,155,0.5)',fontFamily:'inherit'}}>
          © 2026 KhataFlow · Enterprise Financial Suite
        </div>
      </div>


    </>
  );
};

export default Login;
