import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ScanSearch, Loader2, Code2 } from 'lucide-react';
import '../assets/premium-theme.css';

const Analyze = () => {
  const [code, setCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!code.trim()) return alert("Please enter some code to analyze.");
    
    setIsScanning(true);
    try {
      const data = await apiService.analyzeCode(code);
      navigate('/results', { state: { data, originalCode: code } });
    } catch (error) {
      alert(error.message);
      setIsScanning(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 10 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Code2 color="#d4af37" size={28} />
        <h1 style={{ fontSize: '28px', fontWeight: '300', margin: 0, color: '#fff' }}>Secure Your Code</h1>
      </div>

      {/* FIXED: Removed class="glass-panel" to escape the Lamp UI animations */}
      <div style={{ 
        background: 'rgba(15, 23, 42, 0.4)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <textarea 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="# Paste your Python code here..."
          spellCheck="false"
          style={{
            width: '100%',
            height: '400px',
            background: 'rgba(2, 6, 23, 0.6)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '20px',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: '14px',
            resize: 'none',
            outline: 'none'
          }}
        />

        <button 
          onClick={handleScan}
          disabled={isScanning}
          style={{
            background: isScanning ? 'transparent' : 'rgba(212, 175, 55, 0.1)',
            border: `1px solid ${isScanning ? '#475569' : '#d4af37'}`,
            color: isScanning ? '#94a3b8' : '#d4af37',
            padding: '16px',
            borderRadius: '10px',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.3s ease'
          }}
        >
          {isScanning ? (
            <><Loader2 className="animate-spin" size={20} /> ANALYZING CORE...</>
          ) : (
            <><ScanSearch size={20} /> RUN AI SECURITY SCAN</>
          )}
        </button>
      </div>
    </div>
  );
};

export default Analyze;