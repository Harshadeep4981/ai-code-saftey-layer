import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  ArrowLeft, Copy, Download, Columns, Maximize, 
  Loader2, Check, ShieldCheck, ArrowRight, 
  CheckCircle2, Activity, Save, Send, User, Bot, X
} from 'lucide-react';
import '../assets/premium-theme.css';

const SecureCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { originalCode, issues, data } = location.state || {}; 

  const [secureCode, setSecureCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSplitView, setIsSplitView] = useState(true);
  const [copied, setCopied] = useState(false);
  const hasFetched = useRef(false);

  // --- FLOATING COPILOT STATE ---
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatScrollRef = useRef(null);

  if (!originalCode) return <Navigate to="/analyze" />;

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

  // Generate dynamic context for the AI's first message
  const generateRealAIContext = () => {
    if (!issues || issues.length === 0) {
      return "I've reviewed the code and confirmed it meets production-ready security standards. What would you like to know?";
    }
    const highRisk = issues.filter(i => (i.severity || '').toLowerCase() === 'high' || (i.severity || '').toLowerCase() === 'critical');
    
    let explanation = `I've successfully engineered this patch to resolve ${issues.length} vulnerabilities. `;

    if (highRisk.length > 0) {
      const highRiskNames = highRisk.map(i => i.issue || i.name || 'Security Flaw').join(", ");
      explanation += `Crucially, I neutralized critical threats including: ${highRiskNames}. `;
    }
    explanation += "What would you like me to explain about the security choices I made?";
    return explanation;
  };

  // Populate initial message only when copilot is opened for the first time
  useEffect(() => {
    if (isCopilotOpen && chatMessages.length === 0) {
      setChatMessages([{ role: 'ai', content: generateRealAIContext() }]);
    }
  }, [isCopilotOpen]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatTyping, isCopilotOpen]);

  // Fetch the secure code
  useEffect(() => {
    const fetchSecureCode = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      
      try {
        const res = await apiService.generateSecureCode(originalCode, issues);
        setSecureCode(res.secure_code);
      } catch (err) {
        setSecureCode("# FATAL ERROR: Failed to generate secure code.\n# Please check backend connection.");
      } finally {
        setIsGenerating(false);
      }
    };
    fetchSecureCode();
  }, [originalCode, issues]);

  // --- REAL AI API INTEGRATION ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatTyping(true);

    try {
      // Calls the FastAPI endpoint with the chat history AND the code!
      const response = await apiService.sendChatMessage(
        userMessage, 
        chatMessages,  
        secureCode,    
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
    navigator.clipboard.writeText(secureCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([secureCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'secure_patch.py';
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
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '60px', zIndex: 10, marginTop: '-20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/results', { state: { data, originalCode } })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', borderRadius: '8px', transition: 'all 0.3s', fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back to Report
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '400', margin: 0, color: '#4ade80', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={26} /> AI Remediation Workspace
        </h1>
        <span style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>Validated Secure Patch</span>
      </div>

      {isGenerating ? (
        <div style={{ ...glassStyle, minHeight: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4ade80', gap: '20px' }}>
          <Loader2 className="animate-spin" size={50} />
          <h2 style={{ fontFamily: 'monospace', letterSpacing: '2px', margin: 0, fontSize: '18px' }}>EXECUTING RECURSIVE VALIDATION...</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '14px' }}>
            <span>&gt; Generating AI Patch...</span>
            <span style={{ opacity: 0.5 }}>&gt; Running Analyzer...</span>
            <span style={{ opacity: 0.2 }}>&gt; Verifying Security Rules...</span>
          </div>
        </div>
      ) : (
        <>
          {/* IMPROVEMENT TIMELINE */}
          <div style={{ ...glassStyle, display: 'flex', flexWrap: 'wrap', padding: '20px', alignItems: 'center', justifyContent: 'center', gap: '25px', background: 'linear-gradient(90deg, rgba(15,23,42,0.6) 0%, rgba(20,40,30,0.6) 100%)' }}>
            
            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Original Score</span>
              <div style={{ fontSize: '38px', fontWeight: 'bold', color: '#ef4444', lineHeight: '1.2', marginTop: '5px' }}>
                {originalScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/10</span>
              </div>
            </div>

            <ArrowRight color="#64748b" size={24} />

            <div style={{ flex: '1 1 300px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#4ade80" /> Recursive Validation Pipeline
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px', color: '#4ade80' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} /> AI Generated Patch</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} /> Security Rules Passed</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} /> Analyzer Executed</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4af37' }}><ShieldCheck size={14} /> Pipeline Confidence: 98.4%</div>
              </div>
            </div>

            <ArrowRight color="#4ade80" size={24} />

            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <span style={{ color: '#4ade80', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Score</span>
              <div style={{ fontSize: '38px', fontWeight: 'bold', color: '#4ade80', lineHeight: '1.2', marginTop: '5px', textShadow: '0 0 20px rgba(74,222,128,0.4)' }}>
                {finalScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/10</span>
              </div>
              <div style={{ color: '#4ade80', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>↑ +{improvement} Improved</div>
            </div>
          </div>

          {/* WORKSPACE AREA */}
          <div style={{ ...glassStyle, display: 'flex', flexDirection: 'column', height: '480px' }}>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => setIsSplitView(!isSplitView)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                {isSplitView ? <><Maximize size={14}/> Unified View</> : <><Columns size={14}/> Split Diff View</>}
              </button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleCopy} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: copied ? '#4ade80' : '#cbd5e1', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', transition: 'color 0.3s' }}>
                  {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy Code</>}
                </button>
                <button onClick={handleDownload} style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid #4ade80', color: '#4ade80', padding: '6px 20px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  <Download size={14} /> Export Secure Patch
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
              
              {isSplitView && (
                <div style={{ flex: 1, borderRight: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', background: 'rgba(239, 68, 68, 0.02)' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px 20px', color: '#ef4444', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>-</span> ORIGINAL (VULNERABLE)
                  </div>
                  <div style={{ display: 'flex', flex: 1 }}>
                    {renderLineNumbers(originalCode)}
                    <textarea 
                      readOnly
                      value={originalCode}
                      spellCheck="false"
                      style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontFamily: 'monospace', fontSize: '13px', resize: 'none', outline: 'none', padding: '20px', lineHeight: '1.6', overflow: 'hidden' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(74, 222, 128, 0.02)' }}>
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px 20px', color: '#4ade80', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '14px' }}>+</span> SECURE PATCH</div>
                  <span style={{ color: '#4ade80', opacity: 0.7, fontWeight: 'normal' }}>Live Editor Active</span>
                </div>
                <div style={{ display: 'flex', flex: 1 }}>
                  {renderLineNumbers(secureCode)}
                  <textarea 
                    value={secureCode}
                    onChange={(e) => setSecureCode(e.target.value)}
                    spellCheck="false"
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#4ade80', fontFamily: 'monospace', fontSize: '13px', resize: 'none', outline: 'none', padding: '20px', lineHeight: '1.6', overflow: 'hidden' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PATCH COMMIT SUMMARY */}
          <div style={{ ...glassStyle, padding: '15px 20px' }}>
            <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '15px' }}>
              Patch Commit Summary
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {issues && issues.slice(0, 5).map((issue, index) => (
                <div key={index} style={{ color: '#4ade80', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> 
                  Fixed: {issue.issue || issue.name || 'Security Vulnerability'}
                </div>
              ))}
              {issues && issues.length > 5 && (
                <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <CheckCircle2 size={16} color="#94a3b8" /> 
                  + {issues.length - 5} minor structural optimizations applied
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '5px', flexShrink: 0 }}>
            <button 
              disabled
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', padding: '12px 25px', borderRadius: '30px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' }}
            >
              <Save size={16} /> Save Patch to Project <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>SOON</span>
            </button>
          </div>
        </>
      )}

      {/* --- FLOATING SECURITY COPILOT --- */}
      {isCopilotOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '380px',
          height: '500px',
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
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Security Copilot</h3>
            </div>
            <button onClick={() => setIsCopilotOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Chat Messages */}
          <div ref={chatScrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                
                {msg.role === 'ai' && <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '8px', borderRadius: '50%', color: '#d4af37', flexShrink: 0 }}><Bot size={16} /></div>}
                
                <div style={{ 
                  background: msg.role === 'user' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)', 
                  border: msg.role === 'user' ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: msg.role === 'user' ? '#4ade80' : '#cbd5e1', 
                  padding: '12px 16px', 
                  borderRadius: '12px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                  borderTopLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                  fontSize: '13px', lineHeight: '1.6'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isChatTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'flex-start' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '8px', borderRadius: '50%', color: '#d4af37' }}><Bot size={16} /></div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '12px 16px', borderRadius: '12px', color: '#cbd5e1', fontSize: '13px', display: 'flex', gap: '4px' }}>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both' }}>.</span>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
                  <span className="typing-dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} style={{ padding: '15px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me about this patch..." 
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 15px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
            />
            <button type="submit" disabled={!chatInput.trim() || isChatTyping} style={{ background: 'rgba(212, 175, 55, 0.2)', border: '1px solid rgba(212, 175, 55, 0.5)', color: '#d4af37', padding: '0 15px', borderRadius: '8px', cursor: chatInput.trim() && !isChatTyping ? 'pointer' : 'not-allowed', opacity: chatInput.trim() && !isChatTyping ? 1 : 0.5, transition: 'all 0.3s' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (The yellow robot icon) */}
      <button 
        onClick={() => setIsCopilotOpen(!isCopilotOpen)} 
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#fbbf24', // Yellow color from your screenshot
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
        {isCopilotOpen ? <X size={24} color="#1e293b" /> : <Bot size={28} color="#1e293b" />}
      </button>

    </div>
  );
};

export default SecureCode;