import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleOAuthSignup = () => {
    setLoading(true);
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    { icon: '🎬', text: 'Unlimited screen recordings' },
    { icon: '📸', text: 'Smart screenshot & annotations' },
    { icon: '✂️', text: 'In-browser video editor' },
    { icon: '🔗', text: 'Instant shareable links' },
    { icon: '🤖', text: 'AI assistant (coming soon)' },
    { icon: '☁️', text: 'Cloud storage included' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF9F0 0%, #F0F4FF 50%, #FFF0F9 100%)',
      display: 'flex', alignItems: 'stretch',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .check-item { transition:all 0.2s; }
        .check-item:hover { transform:translateX(4px); }
      `}</style>

      {/* Left Panel */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #0F172A, #1E293B)',
        padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        minWidth: 400, position: 'relative', overflow: 'hidden'
      }}>
        {/* Blobs */}
        <div style={{ position:'absolute', top:'20%', right:'-10%', width:300, height:300, background:'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)', borderRadius:'50%', animation:'float 8s ease-in-out infinite' }} />
        <div style={{ position:'absolute', bottom:'15%', left:'-5%', width:250, height:250, background:'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)', borderRadius:'50%', animation:'float 10s ease-in-out infinite 2s' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
            <div style={{ width:44, height:44, background:'linear-gradient(135deg, #FF6B6B, #FF8E53)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🎬</div>
            <span style={{ fontSize:22, fontWeight:800, color:'white' }}>SnapRecord</span>
          </Link>

          <h2 style={{ fontSize:40, fontWeight:900, color:'white', lineHeight:1.15, marginBottom:16, letterSpacing:'-1px' }}>
            Everything you need<br />
            <span style={{ background:'linear-gradient(135deg, #FF6B6B, #FFD93D)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>to record & share</span>
          </h2>
          <p style={{ fontSize:17, color:'#94A3B8', marginBottom:40, lineHeight:1.6 }}>
            Join 50,000+ professionals who use SnapRecord to communicate more effectively.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {features.map((f, i) => (
              <div key={i} className="check-item" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:36, height:36, background:'rgba(255,255,255,0.08)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{f.icon}</div>
                <span style={{ fontSize:16, color:'#CBD5E1', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop:48, padding:20, background:'rgba(255,255,255,0.05)', borderRadius:16, border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', gap:4, marginBottom:8 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ color:'#FBBF24', fontSize:18 }}>★</span>)}
            </div>
            <p style={{ color:'#CBD5E1', fontSize:15, lineHeight:1.6, margin:0 }}>
              "SnapRecord changed how our team communicates. We cut meeting time by 40%."
            </p>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg, #4ECDC4, #45B7D1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👩‍💼</div>
              <div>
                <div style={{ color:'white', fontWeight:600, fontSize:14 }}>Sarah Chen</div>
                <div style={{ color:'#64748B', fontSize:13 }}>Product Manager, TechCorp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px', animation: 'fadeInUp 0.6s ease forwards'
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:'#0F172A', marginBottom:8, letterSpacing:'-0.5px' }}>Create your account 🎉</h1>
          <p style={{ fontSize:16, color:'#64748B', marginBottom:32 }}>It's free to start. No credit card required.</p>

          {/* Card */}
          <div style={{
            background:'white', borderRadius:24, padding:36,
            boxShadow:'0 20px 60px rgba(0,0,0,0.1)',
            border:'1px solid rgba(0,0,0,0.04)'
          }}>
            {/* OAuth */}
            <button onClick={handleOAuthSignup} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:12,
              padding:'16px 20px', background:'white',
              border:'2px solid #E5E7EB', borderRadius:14,
              cursor:'pointer', fontFamily:'inherit', width:'100%',
              fontSize:16, fontWeight:600, color:'#374151',
              transition:'all 0.2s', marginBottom:20
            }}
            onMouseEnter={e => { e.target.style.borderColor='#D1D5DB'; e.target.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.boxShadow='none'; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
              <span style={{ color:'#94A3B8', fontSize:14, fontWeight:500 }}>or with email</span>
              <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>First name</label>
                  <input placeholder="Alex" style={{
                    width:'100%', padding:'12px 14px', borderRadius:10,
                    border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                    outline:'none', boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor='#FF6B6B'}
                  onBlur={e => e.target.style.borderColor='#E5E7EB'}
                  />
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Last name</label>
                  <input placeholder="Johnson" style={{
                    width:'100%', padding:'12px 14px', borderRadius:10,
                    border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                    outline:'none', boxSizing:'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor='#FF6B6B'}
                  onBlur={e => e.target.style.borderColor='#E5E7EB'}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Email address</label>
                <input type="email" placeholder="you@example.com" style={{
                  width:'100%', padding:'12px 14px', borderRadius:10,
                  border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                  outline:'none', boxSizing:'border-box'
                }}
                onFocus={e => e.target.style.borderColor='#FF6B6B'}
                onBlur={e => e.target.style.borderColor='#E5E7EB'}
                />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Password</label>
                <input type="password" placeholder="Create a strong password" style={{
                  width:'100%', padding:'12px 14px', borderRadius:10,
                  border:'2px solid #E5E7EB', fontSize:15, fontFamily:'inherit',
                  outline:'none', boxSizing:'border-box'
                }}
                onFocus={e => e.target.style.borderColor='#FF6B6B'}
                onBlur={e => e.target.style.borderColor='#E5E7EB'}
                />
              </div>
            </div>

            <button onClick={handleOAuthSignup} style={{
              width:'100%', padding:'16px',
              background:'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color:'white', border:'none', borderRadius:14,
              fontWeight:700, fontSize:16, cursor:'pointer', fontFamily:'inherit',
              boxShadow:'0 8px 24px rgba(255,107,107,0.4)',
              transition:'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.transform='translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform='translateY(0)'}
            >
              {loading ? '⏳ Creating account...' : '🎉 Create Free Account'}
            </button>

            <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#94A3B8', lineHeight:1.5 }}>
              By creating an account, you agree to our{' '}
              <a href="#" style={{ color:'#FF6B6B', textDecoration:'none' }}>Terms</a>{' '}and{' '}
              <a href="#" style={{ color:'#FF6B6B', textDecoration:'none' }}>Privacy Policy</a>.
            </p>
          </div>

          <p style={{ textAlign:'center', marginTop:20, fontSize:15, color:'#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#FF6B6B', fontWeight:700, textDecoration:'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
