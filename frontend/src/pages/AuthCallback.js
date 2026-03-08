import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);
  
  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    
    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        navigate('/', { replace: true });
        return;
      }
      
      const sessionId = sessionIdMatch[1];
      
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        login(data.user);
        
        // Try to notify extension if installed
        try {
          if (window.chrome && window.chrome.runtime) {
            // Store token for extension
            localStorage.setItem('screen_master_token', data.session_token);
            localStorage.setItem('screen_master_user', JSON.stringify(data.user));
          }
        } catch (e) {
          // Extension not installed or not accessible
        }
        
        // Navigate to dashboard with user data
        navigate('/dashboard', { replace: true, state: { user: data.user } });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/', { replace: true });
      }
    };
    
    processAuth();
  }, [navigate, login]);
  
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Signing you in...</p>
    </div>
  );
}
