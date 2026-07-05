import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LogOut, ShieldAlert } from 'lucide-react';
import '../assets/premium-theme.css';

const MainLayout = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- CHECK FOR ADMIN PRIVILEGES ---
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Dynamically reveal the admin route only for the master account
        if (payload.email === "harshadeepm63@gmail.com") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Could not parse session token for admin check");
      }
    }
  }, []);

  const stars = useMemo(() => Array.from({ length: 60 }).map(() => ({
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    duration: Math.random() * 4 + 3 + 's',
    size: Math.random() * 2 + 1 + 'px'
  })), []);

  return (
    <div className="core-entry-anim" style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      
      {/* Background Layers */}
      <div className="premium-bg" />
      <div className="star-container">
        {stars.map((s, i) => (
          <div key={i} className="star" style={{ 
            left: s.left, top: s.top, 
            '--duration': s.duration, 
            width: s.size, height: s.size 
          }} />
        ))}
      </div>

      {/* Top Left Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px', // Adjusted slightly for mobile safe zones
        left: '20px',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            background: isSidebarOpen ? 'transparent' : 'rgba(255, 255, 255, 0.03)',
            backdropFilter: isSidebarOpen ? 'none' : 'blur(10px)',
            border: isSidebarOpen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            color: '#d4af37',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            boxShadow: isSidebarOpen ? 'none' : '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {/* NEW: MOBILE CLICK-AWAY OVERLAY */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      {/* The Sliding Glass Sidebar */}
      <aside 
        className="sidebar-glass" 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px', // Slightly wider for better touch targets
          padding: '100px 25px 30px 25px', 
          display: 'flex', 
          flexDirection: 'column',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 999,
          boxShadow: isSidebarOpen ? '10px 0 40px rgba(0,0,0,0.8)' : 'none',
          background: 'rgba(15, 23, 42, 0.85)' // Slightly darker for readability
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, marginTop: '20px' }}>
          
          {/* Enhanced Nav Links for Mobile Tapping */}
          <NavLink 
            to="/dashboard" 
            onClick={() => setIsSidebarOpen(false)} 
            style={({isActive}) => ({ 
              color: isActive ? '#fff' : '#94a3b8', 
              background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              textDecoration: 'none', 
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              fontWeight: isActive ? '600' : '400'
            })}
          >
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/analyze" 
            onClick={() => setIsSidebarOpen(false)} 
            style={({isActive}) => ({ 
              color: isActive ? '#fff' : '#94a3b8', 
              background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              textDecoration: 'none', 
              fontSize: '16px',
              padding: '12px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              fontWeight: isActive ? '600' : '400'
            })}
          >
            Analyze Code
          </NavLink>

          {/* Conditional Admin Link */}
          {isAdmin && (
            <NavLink 
              to="/admin" 
              onClick={() => setIsSidebarOpen(false)} 
              style={({isActive}) => ({ 
                color: isActive ? '#000' : '#e5a93d', 
                background: isActive ? '#e5a93d' : 'rgba(229, 169, 61, 0.1)',
                textDecoration: 'none', 
                fontSize: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px'
              })}
            >
              <ShieldAlert size={18} /> Core Registry
            </NavLink>
          )}

        </nav>

        {/* UPGRADED LOGOUT BUTTON */}
        <button 
          onClick={onLogout} 
          className="glow-on-hover"
          style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            color: '#f43f5e', 
            fontSize: '16px', 
            fontWeight: '600',
            cursor: 'pointer', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(244, 63, 94, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <LogOut size={18} /> Disconnect
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'flex-start',
        alignItems: 'center', 
        position: 'relative', 
        width: '100%', 
        overflowY: 'auto',
        paddingTop: '60px' // Added buffer for the menu icon so it doesn't overlap content
      }}>
        {children}
      </main>

    </div>
  );
};

export default MainLayout;