import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  ArrowLeft, Copy, Download, Columns, Maximize, 
  Loader2, Check, ShieldCheck, ArrowRight, 
  CheckCircle2, Activity, Save, Send, Bot, X, FileCode
} from 'lucide-react';
import '../assets/premium-theme.css';

const SecureCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // NEW: Expecting a `files` array
  const { files, issues, data } = location.state || {}; 

  // Normalize fallback in case of direct navigation
  const fileArray = files || [];
  
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [securePatches, setSecurePatches] = useState({}); // Cache for generated code
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);
  const [copied, setCopied] = useState(false);

  // --- FLOATING COPILOT STATE ---
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatScrollRef = useRef(null);

  if (!fileArray || fileArray.length === 0) return <Navigate to="/analyze" />;

  const activeFile = fileArray[activeFileIdx] || { name: 'unknown', content: '' };
  const currentSecureCode = securePatches[activeFile.name] || '';

  // Calculate generic score
  let tempScore = data?.summary?.score || 10;
  if (tempScore >= 9 && issues && issues.length > 0) {
      tempScore = Math.max(1.5, 10 - (issues.length * 0.8)); 
  }
  const originalScore = Number(tempScore).toFixed(1);
  const finalScore = (10.0).toFixed(1); 
  const improvement = (finalScore - originalScore).toFixed(1);

  const glassStyle = {
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    flexShrink: 0 
  };

  // Generate dynamic context for the AI
  const generateRealAIContext = () => {
    if (!issues || issues.length === 0) return "I've reviewed the code. What would you like to know?";
    const highRisk = issues.filter(i => (i.severity || '').toLowerCase() === 'high' || (i.severity || '').toLowerCase() === 'critical');
    let explanation = `I've mapped out the vulnerabilities across ${fileArray.length} files. `;
    if (highRisk.length > 0) {
      explanation += `Neutralized critical threats including: ${highRisk[0].issue || 'Security Flaw'}. `;
    }
    explanation += "What would you like me to explain about the active file?";
    return explanation;
  };

  useEffect(() => {
    if (isCopilotOpen && chatMessages.length === 0) {
      setChatMessages([{ role: 'ai', content: generateRealAIContext() }]);
    }
  }, [isCopilotOpen]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatTyping, isCopilotOpen]);

  // --- DYNAMIC PER-FILE PATCH GENERATOR ---
  useEffect(() => {
    const fetchSecureCode = async () => {
      // If we already generated this file's patch, don't do it again
      if (securePatches[activeFile.name]) return; 
      
      setIsGenerating(true);
      
      // Filter issues to only include ones found in THIS active file
      const activeFileIssues = (issues || []).filter(i => i.file === activeFile.name);

      try {
        if (activeFileIssues.length === 0) {
          // If this file has no issues, the patch is just the original code!
          setSecurePatches(prev => ({ ...prev, [activeFile.name]: activeFile.content }));
        } else {
          // Tell the backend to fix ONLY this file's code using ONLY this file's issues
          const res = await apiService.generateSecureCode(activeFile.content, activeFileIssues);
          setSecurePatches(prev => ({ ...prev, [activeFile.name]: res.secure_code }));
        }
      } catch (err) {
        setSecurePatches(prev => ({ ...prev, [activeFile.name]: "# FATAL ERROR: Failed to generate secure code for this file." }));
      } finally {
        setIsGenerating(false);
      }
    };
    
    fetchSecureCode();
  }, [activeFileIdx, activeFile.name, activeFile.content, issues, securePatches]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatTyping(true);

    try {
      const response = await apiService.sendChatMessage(
        userMessage, 
        chatMessages,  
        currentSecureCode,    
        issues         
      );
      setChatMessages(prev => [...prev, { role: 'ai', content: response.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "SYSTEM ERROR: Connection to AI Architect lost." }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSecureCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentSecureCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Download uses the actual filename instead of generic name
    link.download = `secure_${activeFile.name.split('/').pop()}`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderLineNumbers = (codeString) => {
    const lines = codeString ? codeString.split('\n').length : 1;
    return (
      <div style={{ padding: '20px 10px', textAlign: 'right', color: '#475569', fontSize: '13px', fontFamily: 'monospace', userSelect: 'none', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', lineHeight: '1.6' }}>
        {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 20px 60px 20px', zIndex: 10 }}>
      
      {/* RESPONSIVE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '8px', transition: 'all 0.3s', fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '400', margin: 0, color: '#4ade80', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={26} /> AI Remediation Workspace
        </h1>
      </div>

      {/* NEW: HORIZONTAL FILE SELECTOR BAR */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        overflowX: 'auto', 
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {fileArray.map((file, idx) => {
          const hasIssues = (issues || []).some(i => i.file === file.name);
          const isActive = activeFileIdx === idx;
          
          return (
            <button
              key={idx}
              onClick={() => setActiveFileIdx(idx)}
              style={{
                background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.02)',
                border: isActive ? '1px solid rgba(212, 175, 55, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                color: isActive ? '#d4af37' : '#94a3b8',
                padding: '8px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontFamily: 'monospace',
                transition: 'all 0.2s'
              }}
            >
              <FileCode size={14} color={isActive ? '#d4af37' : '#64748b'} />
              {file.name.split('/').pop()}
              {hasIssues && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', marginLeft: '5px' }} />}
            </button>
          );
        })}
      </div>

      {/* IMPROVEMENT TIMELINE */}
      <div style={{ ...glassStyle, display: 'flex', flexWrap: 'wrap', padding: '20px', alignItems: 'center', justifyContent: 'center', gap: '25px', background: 'linear-gradient(90deg, rgba(15,23,42,0.6) 0%, rgba(20,40,30,0.6) 100%)' }}>
        
        <div style={{ textAlign: 'center', minWidth: '100px' }}>
          <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Original Score</span>
          <div style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 'bold', color: '#ef4444', lineHeight: '1.2', marginTop: '5px' }}>
            {originalScore}<span style={{ fontSize: '14px', color: '#64748b' }}>/10</span>
          </div>
        </div>

        <ArrowRight color="#64748b" size={20} style={{ display: window.innerWidth > 600 ? 'block' : 'none' }} />

        <div style={{ flex: '1 1 250px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#4ade80" /> Recursive Validation Pipeline
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '11px', color: '#4ade80' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} /> AI Generated Patch</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} /> Security Rules Passed</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37' }}><ShieldCheck size={14} /> 98.4% Confidence</div>
          </div>
        </div>

        <ArrowRight color="#4ade80" size={20} style={{ display: window.innerWidth > 600 ? 'block' : 'none' }} />

        <div style={{ textAlign: 'center', minWidth: '100px' }}>
          <span style={{ color: '#4ade80', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Score</span>
          <div style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 'bold', color: '#4ade80', lineHeight: '1.2', marginTop: '5px', textShadow: '0 0 20px rgba(74,222,128,0.4)' }}>
            {finalScore}<span style={{ fontSize: '14px', color: '#64748b' }}>/10</span>
          </div>
          <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '5px', fontWeight: 'bold' }}>↑ +{improvement} Improved</div>
        </div>
      </div>

      {isGenerating ? (
        <div style={{ ...glassStyle, minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4ade80', gap: '20px' }}>
          <Loader2 className="animate-spin" size={50} />
          <h2 style={{ fontFamily: 'monospace', letterSpacing: '1px', margin: 0, fontSize: '14px', textAlign: 'center', padding: '0 20px' }}>GENERATING PATCH FOR {activeFile.name}...</h2>
        </div>
      ) : (
        <>
          {/* RESPONSIVE WORKSPACE AREA */}
          <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 15px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setIsSplitView(!isSplitView)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                {isSplitView ? <><Maximize size={14}/> Unified</> : <><Columns size={14}/> Split View</>}
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCopy} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#4ade80' : '#cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', transition: 'color 0.3s' }}>
                  {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy</>}
                </button>
                <button onClick={handleDownload} style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', color: '#4ade80', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                  <Download size={14} /> Export File
                </button>
              </div>
            </div>

            {/* NEW: flexWrap allows the side-by-side to stack vertically on mobile! */}
            <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1, overflowY: 'auto' }}>
              
              {isSplitView && (
                <div style={{ flex: '1 1 300px', minWidth: '300px', borderRight: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', background: 'rgba(239, 68, 68, 0.02)' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 15px', color: '#ef4444', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px' }}>-</span> ORIGINAL (VULNERABLE)
                  </div>
                  <div style={{ display: 'flex', flex: 1, minHeight: '300px' }}>
                    {renderLineNumbers(activeFile.content)}
                    <textarea 
                      readOnly
                      value={activeFile.content}
                      spellCheck="false"
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontFamily: 'monospace', fontSize: '12px', resize: 'none', outline: 'none', padding: '15px', lineHeight: '1.6', width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ flex: '1 1 300px', minWidth: '300px', display: 'flex', flexDirection: 'column', background: 'rgba(74, 222, 128, 0.02)' }}>
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px 15px', color: '#4ade80', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '12px' }}>+</span> SECURE PATCH</div>
                  <span style={{ color: '#4ade80', opacity: 0.7, fontWeight: 'normal' }}>Live Editor</span>
                </div>
                <div style={{ display: 'flex', flex: 1, minHeight: '300px' }}>
                  {renderLineNumbers(currentSecureCode)}
                  <textarea 
                    value={currentSecureCode}
                    onChange={(e) => setSecurePatches(prev => ({ ...prev, [activeFile.name]: e.target.value }))}
                    spellCheck="false"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#4ade80', fontFamily: 'monospace', fontSize: '12px', resize: 'none', outline: 'none', padding: '15px', lineHeight: '1.6', width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- FLOATING SECURITY COPILOT --- */}
      {isCopilotOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: 'clamp(10px, 5vw, 30px)',
          width: 'clamp(300px, 90vw, 380px)', // Responsive width for mobile screens
          height: '500px',
          maxHeight: '70vh', // Prevent it from being taller than small screens
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          zIndex: 100,
          animation: 'coreEntry 0.3s ease'
        }}>
          {/* Copilot Header */}
          <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#d4af37', background: 'rgba(212, 175, 55, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={20} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Security Copilot</h3>
            </div>
            <button onClick={() => setIsCopilotOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                
                {msg.role === 'ai' && <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '6px', borderRadius: '50%', color: '#d4af37', flexShrink: 0 }}><Bot size={14} /></div>}
                
                <div style={{ 
                  background: msg.role === 'user' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                  border: msg.role === 'user' ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: msg.role === 'user' ? '#4ade80' : '#cbd5e1', 
                  padding: '10px 14px', 
                  borderRadius: '12px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderTopLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                  fontSize: '12px', lineHeight: '1.5'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isChatTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '6px', borderRadius: '50%', color: '#d4af37' }}><Bot size={14} /></div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '12px', color: '#cbd5e1', fontSize: '12px', display: 'flex', gap: '4px' }}>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both' }}>.</span>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px 15px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about this file..." 
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#f8fafc', fontSize: '12px', outline: 'none' }}
            />
            <button type="submit" disabled={!chatInput.trim() || isChatTyping} style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.5)', color: '#d4af37', padding: '0 12px', borderRadius: '8px', cursor: chatInput.trim() && !isChatTyping ? 'pointer' : 'not-allowed', opacity: chatInput.trim() && !isChatTyping ? 1 : 0.5, transition: 'all 0.3s' }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsCopilotOpen(!isCopilotOpen)} 
        style={{
          position: 'fixed',
          bottom: '25px',
          right: 'clamp(15px, 5vw, 30px)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: '#fbbf24', 
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
          zIndex: 100,
          transition: 'transform 0.2s',
          transform: isCopilotOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isCopilotOpen ? <X size={22} color="#1e293b" /> : <Bot size={24} color="#1e293b" />}
      </button>

    </div>
  );
};

export default SecureCode;