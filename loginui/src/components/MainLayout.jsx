import React, { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import '../assets/premium-theme.css';

const MainLayout = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

      {/* Top Left Toggle (Branding Removed to save space) */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
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
            transition: 'all 0.3s ease'
          }}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* The Sliding Glass Sidebar */}
      <aside 
        className="sidebar-glass" 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100vh',
          width: '260px', 
          padding: '100px 30px 30px 30px', 
          display: 'flex', 
          flexDirection: 'column',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 999,
          boxShadow: isSidebarOpen ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1, marginTop: '20px' }}>
          <NavLink to="/" onClick={() => setIsSidebarOpen(false)} style={({isActive}) => ({ color: isActive ? '#fff' : '#64748b', textDecoration: 'none', fontSize: '14px' })}>Dashboard</NavLink>
          <NavLink to="/analyze" onClick={() => setIsSidebarOpen(false)} style={({isActive}) => ({ color: isActive ? '#fff' : '#64748b', textDecoration: 'none', fontSize: '14px' })}>Analyze Code</NavLink>
        </nav>
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}>Logout</button>
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
        paddingTop: '30px' /* Reduced from 120px since we removed the top branding */
      }}>
        {children}
      </main>

    </div>
  );
};

export default MainLayout;