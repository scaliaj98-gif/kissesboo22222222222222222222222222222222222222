import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleOAuthLogin = () => {
    setLoading(true);
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF9F0 0%, #F0F4FF 50%, #FFF0F9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .social-btn:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,0,0,0.12) !important; }
        .social-btn { transition:all 0.2s !important; }
        .divider-line { flex:1; height:1px; background:#E5E7EB; }
      `}</style>

      {/* Floating blobs */}
      <div style={{ position:'fixed', top:'15%', right:'10%', width:300, height:300, background:'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none', animation:'float 8s ease-in-out infinite' }} />
      <div style={{ position:'fixed', bottom:'10%', left:'5%', width:400, height:400, background:'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none', animation:'float 10s ease-in-out infinite 2s' }} />

      <div style={{ width:'100%', maxWidth:480, animation:'fadeInUp 0.6s ease forwards', position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <Link to="/" style={{ textDecoration:'none', display:'inline-flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{
              width:64, height:64,
              background:'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:32, boxShadow:'0 8px 30px rgba(255,107,107,0.4)'
            }}>🎬</div>
            <span style={{ fontSize:28, fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>SnapRecord</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{
          background:'white', borderRadius:28,
          padding:40, boxShadow:'0 20px 60px rgba(0,0,0,0.1)',
          border:'1px solid rgba(0,0,0,0.04)'
        }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#0F172A', textAlign:'center', marginBottom:8 }}>Welcome back! 👋</h1>
          <p style={{ fontSize:16, color:'#64748B', textAlign:'center', marginBottom:32 }}>Sign in to continue to SnapRecord</p>

          {/* OAuth Buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:28 }}>
            <button onClick={handleOAuthLogin} className="social-btn" style={{
              display:'flex', alignItems:'center', gap:12, padding:'16px 20px',
              background:'white', border:'2px solid #E5E7EB', borderRadius:14,
              cursor:'pointer', fontFamily:'inherit', width:'100%',
              fontSize:16, fontWeight:600, color:'#374151'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
            <div className="divider-line" />
            <span style={{ color:'#94A3B8', fontSize:14, fontWeight:500, whiteSpace:'nowrap' }}>or sign in with email</span>
            <div className="divider-line" />
          </div>

          {/* Email Form */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
            <div>
              <label style={{ fontSize:14, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email address</label>
              <input type="email" placeholder="you@example.com" style={{
                width:'100%', padding:'14px 16px', borderRadius:12,
                border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                outline:'none', boxSizing:'border-box',
                transition:'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor='#FF6B6B'}
              onBlur={e => e.target.style.borderColor='#E5E7EB'}
              />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ fontSize:14, fontWeight:600, color:'#374151' }}>Password</label>
                <a href="#" style={{ fontSize:13, color:'#FF6B6B', textDecoration:'none', fontWeight:500 }}>Forgot password?</a>
              </div>
              <input type="password" placeholder="••••••••" style={{
                width:'100%', padding:'14px 16px', borderRadius:12,
                border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                outline:'none', boxSizing:'border-box'
              }}
              onFocus={e => e.target.style.borderColor='#FF6B6B'}
              onBlur={e => e.target.style.borderColor='#E5E7EB'}
              />
            </div>
          </div>

          <button onClick={handleOAuthLogin} style={{
            width:'100%', padding:'16px',
            background:'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color:'white', border:'none', borderRadius:14,
            fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 8px 24px rgba(255,107,107,0.4)',
            transition:'all 0.2s'
          }}
          onMouseEnter={e => { e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 12px 32px rgba(255,107,107,0.5)'; }}
          onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 8px 24px rgba(255,107,107,0.4)'; }}
          >
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>

          <p style={{ textAlign:'center', marginTop:24, fontSize:15, color:'#64748B' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'#FF6B6B', fontWeight:700, textDecoration:'none' }}>Sign up free →</Link>
          </p>
        </div>

        <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'#94A3B8', lineHeight:1.6 }}>
          By signing in you agree to our{' '}
          <a href="#" style={{ color:'#FF6B6B', textDecoration:'none' }}>Terms of Service</a>{' '}and{' '}
          <a href="#" style={{ color:'#FF6B6B', textDecoration:'none' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
