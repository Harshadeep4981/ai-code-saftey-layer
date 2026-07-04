import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Code, Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import '../assets/premium-theme.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const glassCardStyle = {
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
    transition: 'transform 0.3s ease, background 0.3s ease',
    cursor: 'default'
  };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '40px 20px 80px 20px',
      overflowY: 'auto'
    }}>
      
      {/* ⭐ PREMIUM GRADIENT BRAND TITLE ⭐ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '60px',
        justifyContent: 'center',
        animation: 'coreEntry 0.8s ease-out'
      }}>
        {/* The premium badge container */}
        <div style={{ 
          width: '48px', 
          height: '48px', 
          background: 'linear-gradient(135deg, #d4af37 0%, #a68425 100%)', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(212,175,55,0.3)'
        }}>
          <Shield size={24} color="#0f172a" strokeWidth={2.5} />
        </div>
        
        {/* The premium typography */}
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '800', 
          background: 'linear-gradient(to right, #d4af37, #fde047)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '10px', 
          textTransform: 'uppercase',
          margin: 0,
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
          AI SAFETY LAYER
        </h1>
      </div>

      {/* ========================================= */}
      {/* ⭐ HERO WELCOME SECTION ⭐                */}
      {/* ========================================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        animation: 'coreEntry 1s ease-out',
        zIndex: 10,
        marginBottom: '80px'
      }}>
        
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: '300', 
          color: '#f8fafc', 
          margin: '0 0 5px 0', 
          letterSpacing: '-0.5px' 
        }}>
          Welcome back,
        </h2>
        
        <h2 style={{ 
          fontSize: '64px', 
          fontWeight: '600', 
          color: '#d4af37', 
          margin: '0 0 20px 0', 
          letterSpacing: '1px',
          textShadow: '0 0 30px rgba(212,175,55,0.3)' 
        }}>
          Harshadeep
        </h2>
        
        <p style={{ 
          color: '#94a3b8', 
          fontSize: '15px', 
          textTransform: 'uppercase',
          letterSpacing: '2px', 
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255,255,255,0.03)',
          padding: '10px 20px',
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 10px #4ade80' }}></span>
          System Status: Optimal & Secured
        </p>

        {/* GLOWING ACTION BUTTON */}
        <button 
          onClick={() => navigate('/analyze')}
          className="glow-on-hover"
          style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#d4af37',
            padding: '18px 50px',
            borderRadius: '40px',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '1.5px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Sparkles size={20} /> Initialize Security Analysis
        </button>
      </div>

      {/* ========================================= */}
      {/* ⭐ SYSTEM PIPELINE / CAPABILITIES ⭐      */}
      {/* ========================================= */}
      <div style={{ 
        width: '100%', 
        maxWidth: '1200px',
        animation: 'coreEntry 1.2s ease-out'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingLeft: '10px' }}>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(212,175,55,0.2) 100%)' }}></div>
          <span style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px' }}>DevSecOps Pipeline Overview</span>
          <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0) 100%)' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          
          {/* Step 1 */}
          <div 
            style={glassCardStyle}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                <Code size={24} />
              </div>
              <span style={{ color: '#475569', fontSize: '24px', fontWeight: '800', fontFamily: 'monospace' }}>01</span>
            </div>
            <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '10px 0 0 0', fontWeight: '500' }}>Deep AST Parsing</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Scans raw codebase converting execution logic into Abstract Syntax Trees to detect zero-day injection flaws, hardcoded secrets, and structural vulnerabilities.
            </p>
          </div>

          {/* Step 2 */}
          <div 
            style={glassCardStyle}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '12px', color: '#f43f5e' }}>
                <Activity size={24} />
              </div>
              <span style={{ color: '#475569', fontSize: '24px', fontWeight: '800', fontFamily: 'monospace' }}>02</span>
            </div>
            <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '10px 0 0 0', fontWeight: '500' }}>AI Threat Architecture</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Utilizes high-speed LLM inference to map detected vulnerabilities to real-world attack scenarios, generating contextual reports on threat mechanisms.
            </p>
          </div>

          {/* Step 3 */}
          <div 
            style={glassCardStyle}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
                <ShieldCheck size={24} />
              </div>
              <span style={{ color: '#475569', fontSize: '24px', fontWeight: '800', fontFamily: 'monospace' }}>03</span>
            </div>
            <h3 style={{ color: '#f8fafc', fontSize: '18px', margin: '10px 0 0 0', fontWeight: '500' }}>Automated Remediation</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Generates production-ready secure patches deployed directly into an interactive Diff Workspace, governed by a conversational Security Copilot.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;