import React, { useState } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  ArrowLeft, ShieldAlert, AlertTriangle, Info, 
  Zap, Sparkles, Loader2, Terminal, ChevronRight, CheckCircle2, Activity,
  Settings, Crosshair, ShieldCheck, FileCode
} from 'lucide-react';
import '../assets/premium-theme.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // NEW: Accept the `files` array we sent from Analyze.jsx
  const { data, files, originalCode } = location.state || {};

  const [loadingExplain, setLoadingExplain] = useState(null); 
  const [explanations, setExplanations] = useState({}); 

  if (!data) return <Navigate to="/analyze" />;

  // Backwards compatibility just in case we hit it with old state
  const fileArray = files || [{ name: 'codebase.py', content: originalCode || '' }];
  const issues = data.issues || [];
  const score = data.summary?.score || 10;
  
  const totalIssues = issues.length;
  const highRisk = issues.filter(i => (i.severity || '').toLowerCase() === 'high').length;
  const medRisk = issues.filter(i => (i.severity || '').toLowerCase() === 'medium').length;
  const lowRisk = issues.filter(i => (i.severity || '').toLowerCase() === 'low').length;

  const getHealthStatus = (s) => {
    if (s >= 9) return { label: 'SECURE', color: '#4ade80', shadow: 'rgba(74, 222, 128, 0.4)' };
    if (s >= 7) return { label: 'WARNING', color: '#fbbf24', shadow: 'rgba(251, 191, 36, 0.4)' };
    return { label: 'CRITICAL', color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.6)' };
  };
  const health = getHealthStatus(score);

  const getSeverityStyles = (severity) => {
    const s = (severity || '').toLowerCase();
    if (s === 'high' || s === 'critical') return { color: '#ef4444', icon: <ShieldAlert size={18} />, label: 'CRITICAL' };
    if (s === 'medium') return { color: '#fbbf24', icon: <AlertTriangle size={18} />, label: 'MEDIUM' };
    return { color: '#3b82f6', icon: <Info size={18} />, label: 'LOW' };
  };

  const glassStyle = {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
  };

  const handleExplain = async (issue, index) => {
    if (explanations[index]) {
      setExplanations(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
      return;
    }

    setLoadingExplain(index);
    try {
      const res = await apiService.explainIssue(issue.issue, issue.details || "Static Analysis Detection");
      setExplanations(prev => ({ ...prev, [index]: res.explanation }));
    } catch (err) {
      setExplanations(prev => ({ ...prev, [index]: "Failed to connect to the AI backend." }));
    } finally {
      setLoadingExplain(null);
    }
  };

  const formatLocation = (lineStr) => {
    if (lineStr === undefined || lineStr === null) return "Unknown";
    const str = String(lineStr);
    if (str.toLowerCase().includes('pre-scan')) return "Unknown";
    if (str.toLowerCase().includes('line')) return str;
    return `Line ${str}`;
  };

  const renderRichExplanation = (text) => {
    if (!text) return null;
    const regex = /(\*?\*?VULNERABILITY MECHANISM:?\*?\*?|\*?\*?ATTACK SCENARIO:?\*?\*?|\*?\*?REMED\w*\s+STRATEGY:?\*?\*?)/gi;
    const parts = text.split(regex);
    const elements = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part || !part.trim()) continue;
      const cleanUpperPart = part.replace(/\*/g, '').toUpperCase().trim();

      if (cleanUpperPart.includes('VULNERABILITY MECHANISM')) {
        elements.push(
          <div key={i} style={{ marginTop: '15px', padding: '15px 20px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '3px solid #3b82f6', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={16} /> VULNERABILITY MECHANISM
            </h4>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14.5px', lineHeight: '1.7' }}>{parts[i+1]?.replace(/\*/g, '').trim()}</p>
          </div>
        );
        i++; 
      } 
      else if (cleanUpperPart.includes('ATTACK SCENARIO')) {
        elements.push(
          <div key={i} style={{ marginTop: '15px', padding: '15px 20px', background: 'rgba(244, 63, 94, 0.08)', borderLeft: '3px solid #f43f5e', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#fb7185', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={16} /> ATTACK SCENARIO
            </h4>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14.5px', lineHeight: '1.7' }}>{parts[i+1]?.replace(/\*/g, '').trim()}</p>
          </div>
        );
        i++;
      } 
      else if (cleanUpperPart.includes('REMED') && cleanUpperPart.includes('STRATEGY')) {
        elements.push(
          <div key={i} style={{ marginTop: '15px', padding: '15px 20px', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', borderRadius: '0 8px 8px 0' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#34d399', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} /> REMEDIATION STRATEGY
            </h4>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14.5px', lineHeight: '1.7' }}>{parts[i+1]?.replace(/\*/g, '').trim()}</p>
          </div>
        );
        i++;
      } 
      else {
        elements.push(
          <p key={i} style={{ color: '#cbd5e1', fontSize: '14.5px', lineHeight: '1.7', margin: '0 0 10px 0' }}>
            {part.replace(/\*/g, '').trim()}
          </p>
        );
      }
    }
    return elements;
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '80px' }}>
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', gap: '30px', padding: 'clamp(20px, 4vw, 40px) 20px' }}>
        
        {/* RESPONSIVE HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/analyze')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '14px', transition: 'all 0.2s' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: '400', margin: 0, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1px' }}>
            AI Safety Layer Report
          </h1>
        </div>

        {/* RESPONSIVE STATS GRID - auto-fit handles wrapping on mobile automatically! */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
          <div style={{ ...glassStyle, padding: '20px', textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Total Issues</span>
            <div style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 'bold', color: '#f8fafc', marginTop: '10px' }}>{totalIssues}</div>
          </div>
          <div style={{ ...glassStyle, padding: '20px', textAlign: 'center', borderBottom: '4px solid #ef4444' }}>
            <span style={{ color: '#ef4444', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>High Risk</span>
            <div style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 'bold', color: '#ef4444', marginTop: '10px' }}>{highRisk}</div>
          </div>
          <div style={{ ...glassStyle, padding: '20px', textAlign: 'center', borderBottom: '4px solid #fbbf24' }}>
            <span style={{ color: '#fbbf24', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Med Risk</span>
            <div style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 'bold', color: '#fbbf24', marginTop: '10px' }}>{medRisk}</div>
          </div>
          <div style={{ ...glassStyle, padding: '20px', textAlign: 'center', borderBottom: '4px solid #3b82f6' }}>
            <span style={{ color: '#3b82f6', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Low Risk</span>
            <div style={{ fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 'bold', color: '#3b82f6', marginTop: '10px' }}>{lowRisk}</div>
          </div>
          
          <div style={{ ...glassStyle, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${health.color}`, boxShadow: `0 0 20px ${health.shadow}`, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px' }}>Health</span>
              <span style={{ color: health.color, fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', background: `${health.color}20`, padding: '4px 8px', borderRadius: '4px' }}>
                {health.label}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(36px, 6vw, 46px)', fontWeight: 'bold', color: health.color, marginTop: '5px', lineHeight: '1' }}>
              {score}<span style={{ fontSize: '18px', color: '#64748b' }}>/10</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '15px' }}>
              <div style={{ width: `${score * 10}%`, height: '100%', background: health.color, borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* REMEDIATION CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0', width: '100%' }}>
          <button 
            // NEW: Pass the `fileArray` instead of just a string
            onClick={() => navigate('/secure-code', { state: { data, issues, files: fileArray } })} 
            className="glow-on-hover"
            style={{ background: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: 'clamp(12px, 3vw, 15px) clamp(20px, 4vw, 40px)', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', width: '100%', maxWidth: '400px', justifyContent: 'center' }}
          >
            <Sparkles size={20} /> Enter Remediation Workspace
          </button>
        </div>

        {/* RESPONSIVE WIDE ISSUE CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {issues.map((issue, index) => {
            const style = getSeverityStyles(issue.severity);
            
            return (
              <div key={index} style={{ ...glassStyle, borderLeft: `5px solid ${style.color}`, overflow: 'hidden' }}>
                
                <div style={{ padding: '15px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#64748b', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold' }}>#{index + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: style.color, fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {style.icon} {style.label}
                  </div>
                  <span style={{ color: '#475569', display: window.innerWidth > 600 ? 'inline' : 'none' }}>|</span>
                  <h3 style={{ margin: 0, fontSize: 'clamp(14px, 3vw, 18px)', color: '#f8fafc', fontWeight: '500', flex: '1 1 100%' }}>
                    {issue.issue || 'Security Vulnerability'}
                  </h3>
                </div>

                {/* Card Body - Now fully flex-wrapped for mobile */}
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', flex: '1 1 auto' }}>
                    <div>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Target File</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        <FileCode size={14} color="#d4af37" /> 
                        {issue.file || 'unknown_file'}
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Location</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', fontFamily: 'monospace' }}>
                        <Terminal size={14} color="#94a3b8" /> 
                        {formatLocation(issue.line)}
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Context</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
                        <Activity size={14} color="#94a3b8" /> Static Analysis Detection
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleExplain(issue, index)}
                    disabled={loadingExplain === index}
                    style={{ 
                      background: explanations[index] ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.05)', 
                      border: explanations[index] ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255,255,255,0.1)', 
                      color: explanations[index] ? '#d4af37' : '#cbd5e1', 
                      padding: '10px 20px', 
                      borderRadius: '8px', 
                      cursor: loadingExplain === index ? 'wait' : 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '8px', 
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      flex: '1 1 100%',
                      maxWidth: '300px'
                    }}
                  >
                    {loadingExplain === index ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} color={explanations[index] ? '#d4af37' : '#cbd5e1'} />}
                    {explanations[index] ? 'Close Explanation' : 'Explain Vulnerability'}
                  </button>
                </div>

                {/* AI EXPLANATION DROPDOWN */}
                {(loadingExplain === index || explanations[index]) && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(212, 175, 55, 0.03)', padding: '20px', animation: 'coreEntry 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37', marginBottom: '15px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <Sparkles size={16} /> AI Security Architect Analysis
                    </div>
                    {explanations[index] ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {renderRichExplanation(explanations[index])}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>
                        Analyzing vulnerability and generating educational context...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM FOOTER */}
        <div style={{ marginTop: '20px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: 'clamp(10px, 2.5vw, 13px)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <CheckCircle2 size={16} /> End of Security Report — {totalIssues} Issues Reviewed
          </div>
          <p style={{ color: '#94a3b8', fontSize: 'clamp(13px, 3vw, 15px)', margin: 0 }}>Ready to generate a validated secure patch?</p>
          <button 
            onClick={() => navigate('/secure-code', { state: { data, issues, files: fileArray } })}
            style={{ background: 'transparent', border: 'none', color: '#d4af37', fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Continue to Remediation Workspace <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Results;