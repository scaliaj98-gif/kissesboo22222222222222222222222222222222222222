import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Monitor, Camera, Video, Cloud, Share2, Sparkles, Download, 
  Shield, Zap, Play, ChevronRight, Star, Check, ArrowRight,
  Mic, Edit3, Users, Globe, Lock, Clock, Layers, Cpu,
  MessageCircle, Image, Film, Scissors, Bot
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const features = [
    { icon: '🎬', title: 'Screen & Cam', desc: 'Record screen, webcam, or both at once with picture-in-picture', color: '#FF6B6B', emoji: '✨' },
    { icon: '✂️', title: 'Smart Editor', desc: 'Trim, remove silences, add text & transitions in browser', color: '#4ECDC4', emoji: '💫' },
    { icon: '🔗', title: 'Instant Share', desc: 'One click to generate secure share links', color: '#45B7D1', emoji: '🚀' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Get intelligent help for editing and annotations', color: '#96CEB4', emoji: '🎨' },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'Product Manager', avatar: '👩‍💼', text: 'SnapRecord has completely transformed how our team communicates. No more long meetings!', stars: 5, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Marcus Johnson', role: 'Developer', avatar: '👨‍💻', text: 'The annotation tools are incredible. I use it daily for bug reports and code reviews.', stars: 5, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Priya Patel', role: 'Content Creator', avatar: '👩‍🎨', text: 'Love the AI assistant feature! It helped me edit my tutorials 3x faster.', stars: 5, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  ];

  const plans = [
    { name: 'Free', price: '0', period: 'forever', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', features: ['5 min recordings', '25 screenshots/mo', 'Basic annotations', 'Share links'], popular: false, icon: '🌟' },
    { name: 'Pro', price: '12', period: 'month', color: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', features: ['Unlimited recordings', 'Unlimited screenshots', 'AI Assistant', 'Custom watermarks', 'GIF export', 'Priority support'], popular: true, icon: '🚀' },
    { name: 'Team', price: '29', period: 'month', color: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', features: ['Everything in Pro', 'Team workspace', 'Admin controls', 'Advanced analytics', 'SSO', 'Dedicated support'], popular: false, icon: '👥' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", background: '#FFFDF9', overflowX: 'hidden' }}>
      
      {/* Animated Background */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, #FFF9F0 0%, #F0F4FF 30%, #FFF0F9 60%, #F0FFFA 100%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      
      {/* Floating blobs */}
      <div style={{
        position: 'fixed', top: '10%', right: '5%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(255,107,107,0.15) 0%, transparent 70%)',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        animation: 'float1 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '-5%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(78,205,196,0.12) 0%, transparent 70%)',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        animation: 'float2 10s ease-in-out infinite'
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '10%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(69,183,209,0.12) 0%, transparent 70%)',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        animation: 'float3 12s ease-in-out infinite'
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.1)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.05)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,40px) scale(1.08)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(2);opacity:0} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        .nav-link { color: #374151; font-weight:500; font-size:15px; text-decoration:none; padding:8px 16px; border-radius:100px; transition:all 0.2s; }
        .nav-link:hover { background:rgba(0,0,0,0.05); color:#111; }
        .feature-card:hover { transform:translateY(-8px) scale(1.02); }
        .feature-card { transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .pricing-card:hover { transform:translateY(-12px); }
        .pricing-card { transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 20px 40px -8px rgba(255,107,107,0.5); }
        .btn-primary { transition:all 0.2s; }
        .btn-secondary:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,0,0,0.1); }
        .btn-secondary { transition:all 0.2s; }
        .stat-item:hover { transform:scale(1.05); }
        .stat-item { transition:all 0.2s; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: isScrolled ? '12px 0' : '20px 0',
        background: isScrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255,107,107,0.4)'
            }}>
              <span style={{ fontSize: 20 }}>🎬</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#111', letterSpacing: '-0.5px' }}>SnapRecord</span>
            <span style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px',
              borderRadius: 100, letterSpacing: '0.5px', marginLeft: 4
            }}>PRO</span>
          </div>
          
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#download" className="nav-link">Download</a>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleLogin} style={{
              background: 'transparent', border: '2px solid #E5E7EB',
              color: '#374151', padding: '10px 20px', borderRadius: 100,
              fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}>
              Log In
            </button>
            <button onClick={handleLogin} className="btn-primary" style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: 'white', border: 'none', padding: '10px 24px',
              borderRadius: 100, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 15px rgba(255,107,107,0.35)'
            }}>
              Start Free ✨
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 80, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            
            {/* Left Content */}
            <div style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, rgba(255,107,107,0.1), rgba(255,142,83,0.1))',
                border: '1px solid rgba(255,107,107,0.2)',
                padding: '8px 16px', borderRadius: 100, marginBottom: 32
              }}>
                <span style={{ fontSize: 16 }}>🚀</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FF6B6B' }}>The Future of Screen Recording is Here</span>
              </div>
              
              {/* Headline */}
              <h1 style={{
                fontSize: 72, fontWeight: 900, lineHeight: 1.05,
                letterSpacing: '-2px', color: '#0F172A', marginBottom: 24
              }}>
                Record, Edit &{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFC300 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%', animation: 'gradient-shift 4s ease infinite'
                }}>
                  Share
                </span>{' '}
                <br />Your Screen ✨
              </h1>
              
              <p style={{
                fontSize: 20, color: '#64748B', lineHeight: 1.7,
                marginBottom: 40, maxWidth: 520
              }}>
                The ultimate screen recording tool. Record screen + webcam, annotate screenshots, edit videos, and share instantly. Like Loom but{' '}
                <strong style={{ color: '#FF6B6B' }}>supercharged</strong>.
              </p>
              
              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                <button onClick={handleLogin} className="btn-primary" style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                  color: 'white', border: 'none', padding: '18px 36px',
                  borderRadius: 100, fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 8px 30px rgba(255,107,107,0.4)'
                }}>
                  <Download size={20} /> Download Extension Free
                </button>
                <button onClick={handleLogin} className="btn-secondary" style={{
                  background: 'white', color: '#374151',
                  border: '2px solid #E5E7EB', padding: '18px 36px',
                  borderRadius: 100, fontWeight: 600, fontSize: 16,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                  <Play size={20} fill="currentColor" /> Watch Demo
                </button>
              </div>
              
              {/* Social Proof */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ display: 'flex' }}>
                  {['👩‍💻', '👨‍🎨', '👩‍🔬', '👨‍💼', '👩‍🎤'].map((emoji, i) => (
                    <div key={i} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `hsl(${i * 60}, 70%, 85%)`,
                      border: '3px solid white', marginLeft: i > 0 ? -10 : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, zIndex: 5 - i, position: 'relative'
                    }}>{emoji}</div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#FBBF24', fontSize: 16 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
                    <strong style={{ color: '#0F172A' }}>50,000+</strong> happy users
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right - Hero Visual */}
            <div style={{ position: 'relative', animation: 'fadeInUp 1s ease 0.2s both' }}>
              {/* Main Mockup */}
              <div style={{
                background: 'white', borderRadius: 24,
                boxShadow: '0 40px 100px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                overflow: 'hidden', position: 'relative'
              }}>
                {/* Browser chrome */}
                <div style={{ background: '#F8FAFC', padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
                  </div>
                  <div style={{ flex: 1, background: '#E2E8F0', borderRadius: 6, height: 28, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>snaprecord.app/dashboard</span>
                  </div>
                </div>
                
                {/* Extension Popup Preview */}
                <div style={{ padding: 24, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.1)', padding: 20,
                    maxWidth: 320, margin: '0 auto'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>SnapRecord</span>
                      </div>
                      <span style={{ background: 'rgba(255,107,107,0.2)', color: '#FF6B6B', fontSize: 11, padding: '3px 8px', borderRadius: 100, fontWeight: 600 }}>PRO</span>
                    </div>
                    
                    {/* Tab Buttons */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
                      {[{ icon: '🎥', label: 'Record' }, { icon: '📸', label: 'Screenshot' }, { icon: '🤖', label: 'AI Help' }].map((tab, i) => (
                        <button key={i} style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8,
                          background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                          border: 'none', color: 'white', cursor: 'pointer',
                          fontSize: 11, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                        }}>
                          <span style={{ fontSize: 18 }}>{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* Record Options */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      {[
                        { icon: '🖥️', label: 'Screen', active: true },
                        { icon: '📹', label: 'Camera', active: false },
                        { icon: '🎙️', label: 'Mic On', active: true },
                        { icon: '⏱️', label: '10s Timer', active: false }
                      ].map((opt, i) => (
                        <div key={i} style={{
                          background: opt.active ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${opt.active ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 10, padding: '10px 12px',
                          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                        }}>
                          <span style={{ fontSize: 18 }}>{opt.icon}</span>
                          <span style={{ fontSize: 12, color: opt.active ? '#FF6B6B' : 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Record Button */}
                    <button style={{
                      width: '100%', padding: '14px',
                      background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                      border: 'none', borderRadius: 12, color: 'white',
                      fontWeight: 700, fontSize: 15, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 8px 20px rgba(255,107,107,0.4)'
                    }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', animation: 'shimmer 1.5s ease-in-out infinite', display: 'inline-block' }} />
                      Start Recording
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div style={{
                position: 'absolute', top: -20, right: -30,
                background: 'white', borderRadius: 16, padding: '14px 18px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 12, animation: 'bounce-slow 4s ease-in-out infinite'
              }}>
                <span style={{ fontSize: 28 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Recording saved!</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Link copied to clipboard</div>
                </div>
              </div>
              
              <div style={{
                position: 'absolute', bottom: -20, left: -30,
                background: 'white', borderRadius: 16, padding: '14px 18px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                display: 'flex', alignItems: 'center', gap: 12, animation: 'bounce-slow 5s ease-in-out infinite 1s'
              }}>
                <span style={{ fontSize: 28 }}>✨</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>AI Auto-edited</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>3 silences removed</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div style={{
            marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 24, padding: '32px 0',
            borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)'
          }}>
            {[
              { value: '50K+', label: 'Active Users', icon: '👥', color: '#FF6B6B' },
              { value: '2M+', label: 'Videos Recorded', icon: '🎬', color: '#4ECDC4' },
              { value: '4.9 ★', label: 'Chrome Store Rating', icon: '⭐', color: '#FFC300' },
              { value: '99.9%', label: 'Uptime SLA', icon: '🛡️', color: '#45B7D1' }
            ].map((stat, i) => (
              <div key={i} className="stat-item" style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: '#64748B', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)',
              padding: '8px 16px', borderRadius: 100, marginBottom: 20
            }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0E7490' }}>Everything you need</span>
            </div>
            <h2 style={{ fontSize: 56, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', marginBottom: 20, lineHeight: 1.1 }}>
              Packed with{' '}
              <span style={{ background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>superpowers</span> 💪
            </h2>
            <p style={{ fontSize: 20, color: '#64748B', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              Everything you need to capture, edit, and share your screen content in one beautiful tool.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: '🎬', title: 'Screen + Webcam Recording', desc: 'Record screen, webcam, or both with picture-in-picture. Full HD quality with audio narration.', color: '#FF6B6B', bg: 'rgba(255,107,107,0.08)' },
              { icon: '📸', title: 'Smart Screenshots', desc: 'Capture full screen, active window, or select any region. Annotate with shapes, text, and highlights.', color: '#4ECDC4', bg: 'rgba(78,205,196,0.08)' },
              { icon: '✂️', title: 'In-Browser Video Editor', desc: 'Trim clips, remove silences, add text overlays, transitions and call-to-action buttons.', color: '#45B7D1', bg: 'rgba(69,183,209,0.08)' },
              { icon: '🔗', title: 'Instant Sharing', desc: 'One click generates a secure shareable link. Set privacy, expiration dates, and password protection.', color: '#96CEB4', bg: 'rgba(150,206,180,0.08)' },
              { icon: '📁', title: 'Organized Workspace', desc: 'Organize content in folders. Set privacy settings, expiration dates, and team access controls.', color: '#FFEAA7', bg: 'rgba(255,234,167,0.15)' },
              { icon: '🤖', title: 'AI Assistant', desc: 'Get smart suggestions for editing, auto-generate titles and tags, remove filler words automatically.', color: '#DDA0DD', bg: 'rgba(221,160,221,0.1)' },
              { icon: '⏱️', title: 'Countdown Timer', desc: 'Set 10s, 20s, or custom countdown before recording. Prepare yourself before the camera starts.', color: '#FFB347', bg: 'rgba(255,179,71,0.1)' },
              { icon: '💬', title: 'Video Messaging', desc: 'Inject recording bubbles into Gmail, Slack, and other tools. Reply with video directly in chat.', color: '#87CEEB', bg: 'rgba(135,206,235,0.1)' },
              { icon: '☁️', title: 'Cloud Storage', desc: 'All your recordings and screenshots safely stored in the cloud. Access from any device anytime.', color: '#98FB98', bg: 'rgba(152,251,152,0.1)' },
            ].map((feature, i) => (
              <div key={i} className="feature-card" style={{
                background: 'white',
                borderRadius: 20, padding: 28,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: feature.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 16
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{
        position: 'relative', zIndex: 1,
        padding: '100px 0',
        background: 'linear-gradient(135deg, #0F172A, #1E293B)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: 20 }}>
              How it works 🚀
            </h2>
            <p style={{ fontSize: 20, color: '#94A3B8', maxWidth: 500, margin: '0 auto' }}>
              From install to first recording in under 2 minutes.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { step: '01', icon: '⬇️', title: 'Install Extension', desc: 'Add SnapRecord to Chrome in one click from the Web Store', color: '#FF6B6B' },
              { step: '02', icon: '🔐', title: 'Sign Up Free', desc: 'Create your account with Google or email. No credit card needed.', color: '#4ECDC4' },
              { step: '03', icon: '🎬', title: 'Start Recording', desc: 'Click the extension icon, choose what to capture, and hit record!', color: '#FFD93D' },
              { step: '04', icon: '🔗', title: 'Share Instantly', desc: 'Copy your link and share anywhere. Recipients watch instantly.', color: '#96CEB4' }
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: 'rgba(255,255,255,0.05)', position: 'absolute', top: 10, right: 20, lineHeight: 1 }}>{item.step}</div>
                <div style={{ fontSize: 40, marginBottom: 20 }}>{item.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* COLORFUL FEATURE SHOWCASE */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          
          {/* Showcase 1 - Capture */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 100 }}>
            <div style={{ background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)', borderRadius: 32, padding: 48, overflow: 'hidden', position: 'relative' }}>
              <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[{ icon: '🖥️', label: 'Screen' }, { icon: '📹', label: 'Camera' }, { icon: '📸', label: 'Screenshot' }].map((opt, i) => (
                    <div key={i} style={{
                      background: i === 0 ? 'linear-gradient(135deg, #FF6B6B, #FF8E53)' : '#F1F5F9',
                      borderRadius: 12, padding: '14px 8px', textAlign: 'center', cursor: 'pointer'
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? 'white' : '#64748B' }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', borderRadius: 12, padding: '14px', color: 'white', fontWeight: 700, textAlign: 'center', fontSize: 15 }}>
                  🎬 Start Recording
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '6px 14px', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>🎬</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>Capture your screen and much more</span>
              </div>
              <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>
                Record screen,<br />camera, or{' '}
                <span style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>both</span>.
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
                Record your screen and webcam simultaneously with picture-in-picture. Set a countdown timer to prepare yourself. Capture any application on your system.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Picture-in-picture webcam overlay', 'Configurable countdown timer (10s, 20s, custom)', 'System audio + microphone recording', 'HD quality recording up to 4K'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} color="#16A34A" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 16, color: '#374151' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Showcase 2 - Edit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 100 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', padding: '6px 14px', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>✂️</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#6366F1' }}>Edit effortlessly</span>
              </div>
              <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>
                Edit your video<br />right in your{' '}
                <span style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>browser</span>.
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
                Trim clips, remove silences and filler words, add text overlays, buttons, and smooth transitions — all without leaving your browser.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ icon: '✂️', label: 'Trim & Cut' }, { icon: '🔇', label: 'Remove Silences' }, { icon: '📝', label: 'Add Text' }, { icon: '🎭', label: 'Transitions' }].map((item, i) => (
                  <div key={i} style={{
                    background: '#F8FAFC', border: '1px solid #E2E8F0',
                    borderRadius: 12, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', borderRadius: 32, padding: 48 }}>
              <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                <div style={{ height: 8, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 100, marginBottom: 20, width: '60%' }} />
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {['✂️ Trim', '🔇 Silence', '📝 Text', '🎨 Effects'].map((btn, i) => (
                    <button key={i} style={{
                      background: i === 0 ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#F1F5F9',
                      color: i === 0 ? 'white' : '#64748B', border: 'none',
                      borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}>{btn}</button>
                  ))}
                </div>
                <div style={{ background: '#1E293B', borderRadius: 12, height: 80, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'repeating-linear-gradient(90deg, rgba(99,102,241,0.3) 0px, rgba(139,92,246,0.3) 20px, transparent 20px, transparent 40px)', borderRadius: 12 }} />
                  <div style={{ position: 'absolute', top: '50%', left: '25%', transform: 'translateY(-50%)', width: 4, height: 70, background: '#FF6B6B', borderRadius: 2 }} />
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#64748B', textAlign: 'center' }}>2:34 / 5:12 — 3 silences detected</div>
              </div>
            </div>
          </div>
          
          {/* Showcase 3 - Share */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', borderRadius: 32, padding: 48 }}>
              <div style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: '#F8FAFC', borderRadius: 12 }}>
                  <span style={{ fontSize: 20 }}>🔗</span>
                  <code style={{ fontSize: 12, color: '#6366F1', flex: 1 }}>snaprecord.app/v/abc123xy</code>
                  <button style={{ background: '#6366F1', color: 'white', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Copy</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {[{ icon: '🔒', label: 'Privacy', val: 'Public' }, { icon: '📅', label: 'Expires', val: '30 days' }, { icon: '👁️', label: 'Views', val: '1,234' }, { icon: '💬', label: 'Comments', val: '12' }].map((stat, i) => (
                    <div key={i} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 14 }}>{stat.icon}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{stat.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{stat.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['📧 Email', '💼 Slack', '🐙 GitHub', '📋 Jira'].map((platform, i) => (
                    <button key={i} style={{
                      flex: 1, background: '#F1F5F9', border: 'none',
                      borderRadius: 8, padding: '8px 4px', fontSize: 11, fontWeight: 600,
                      color: '#64748B', cursor: 'pointer'
                    }}>{platform}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '6px 14px', borderRadius: 100, marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>🔗</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#D97706' }}>Share in seconds</span>
              </div>
              <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20 }}>
                Share anywhere,<br />
                <span style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>instantly</span>.
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', lineHeight: 1.7, marginBottom: 32 }}>
                Generate a secure link in one click. Set privacy controls, password protection, and expiration dates. Share to Slack, Gmail, Jira, and more.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Password-protected links', 'Custom expiration dates', 'View analytics & comments', 'Direct share to 10+ platforms'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 24, height: 24, background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} color="#D97706" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 16, color: '#374151' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* TESTIMONIALS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 0', background: 'linear-gradient(135deg, #F0F4FF, #FFF0F9)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 52, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', marginBottom: 16 }}>
              Loved by teams worldwide 💖
            </h2>
            <p style={{ fontSize: 18, color: '#64748B' }}>Join thousands of creators, developers, and teams</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: 24, padding: 32,
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FBBF24', fontSize: 18 }}>★</span>)}
                </div>
                <p style={{ fontSize: 16, color: '#374151', lineHeight: 1.7, marginBottom: 24 }}>„{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `hsl(${i * 100}, 70%, 85%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{t.name}</div>
                    <div style={{ color: '#64748B', fontSize: 14 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '100px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 52, fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', marginBottom: 16 }}>
              Simple, honest pricing 💰
            </h2>
            <p style={{ fontSize: 18, color: '#64748B' }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 960, margin: '0 auto' }}>
            {plans.map((plan, i) => (
              <div key={i} className="pricing-card" style={{
                background: plan.popular ? `linear-gradient(135deg, ${plan.color}22, ${plan.color}11)` : 'white',
                borderRadius: 24, padding: 32,
                border: plan.popular ? `2px solid ${plan.color}` : '1px solid #E2E8F0',
                boxShadow: plan.popular ? `0 20px 60px ${plan.color}30` : '0 4px 24px rgba(0,0,0,0.06)',
                position: 'relative'
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
                    color: 'white', fontSize: 13, fontWeight: 700,
                    padding: '5px 20px', borderRadius: 100,
                    whiteSpace: 'nowrap'
                  }}>✨ Most Popular</div>
                )}
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>$</span>
                  <span style={{ fontSize: 52, fontWeight: 900, color: '#0F172A', letterSpacing: '-2px' }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: '#64748B' }}>/{plan.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} color={plan.color} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 15, color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleLogin} style={{
                  width: '100%', padding: '14px',
                  background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)` : 'transparent',
                  color: plan.popular ? 'white' : '#374151',
                  border: plan.popular ? 'none' : '2px solid #E2E8F0',
                  borderRadius: 12, fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: plan.popular ? `0 8px 24px ${plan.color}40` : 'none'
                }}>
                  {plan.price === '0' ? 'Start for Free' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* DOWNLOAD CTA */}
      <section id="download" style={{
        position: 'relative', zIndex: 1,
        padding: '100px 0',
        background: 'linear-gradient(135deg, #0F172A, #1E293B)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 72, marginBottom: 24 }}>🚀</div>
          <h2 style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: '-1.5px', marginBottom: 24, lineHeight: 1.1 }}>
            Ready to record your
            <span style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> first video?</span>
          </h2>
          <p style={{ fontSize: 20, color: '#94A3B8', marginBottom: 48, lineHeight: 1.6 }}>
            Join 50,000+ professionals who use SnapRecord to communicate faster and more clearly.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleLogin} style={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              color: 'white', border: 'none', padding: '20px 48px',
              borderRadius: 100, fontWeight: 700, fontSize: 18,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 8px 30px rgba(255,107,107,0.5)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <Download size={22} /> Get Extension Free
            </button>
            <button onClick={handleLogin} style={{
              background: 'rgba(255,255,255,0.1)', color: 'white',
              border: '2px solid rgba(255,255,255,0.2)',
              padding: '20px 48px', borderRadius: 100, fontWeight: 600, fontSize: 18,
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Sign Up with Email
            </button>
          </div>
          <p style={{ marginTop: 24, color: '#64748B', fontSize: 14 }}>No credit card required. Free forever plan available.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0B1120', padding: '60px 0 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎬</div>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>SnapRecord</span>
              </div>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.7, maxWidth: 280 }}>The ultimate screen recording and screenshot tool for professionals. Record, edit, share.</p>
            </div>
            {[{
              title: 'Product', links: ['Features', 'Pricing', 'Download', 'Changelog']
            }, {
              title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact']
            }, {
              title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookie Policy']
            }].map((col, i) => (
              <div key={i}>
                <h4 style={{ color: 'white', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{col.title}</h4>
                {col.links.map((link, j) => (
                  <div key={j} style={{ marginBottom: 10 }}>
                    <a href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>{link}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: '#475569', fontSize: 14 }}>© 2026 SnapRecord. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 16 }}>
              {['🐦 Twitter', '💼 LinkedIn', '📺 YouTube', '💬 Discord'].map((social, i) => (
                <a key={i} href="#" style={{ color: '#64748B', fontSize: 14, textDecoration: 'none' }}>{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
