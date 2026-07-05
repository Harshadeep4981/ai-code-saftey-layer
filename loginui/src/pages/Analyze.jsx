import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Folder, FileCode, X, Sparkles, Loader2, Code2, ArrowLeft } from 'lucide-react';
import '../assets/premium-theme.css';

const Analyze = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [mode, setMode] = useState('select'); // 'select' | 'upload' | 'paste'
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pastedCode, setPastedCode] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // LOGIC FIX: Now it strictly only accepts Python files!
  const IGNORED_FOLDERS = ['.git', 'node_modules', 'dist', 'build', '.next', 'venv', '__pycache__', 'env'];
  const ALLOWED_EXTENSIONS = ['.py'];

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = async (files) => {
    const validFiles = files.filter(file => {
      const pathParts = file.webkitRelativePath.split('/');
      const hasIgnoredFolder = pathParts.some(part => IGNORED_FOLDERS.includes(part));
      const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => file.name.endsWith(ext));
      return !hasIgnoredFolder && hasValidExtension && !file.name.startsWith('.');
    });

    const parsedFiles = await Promise.all(
      validFiles.map(async (file) => {
        const text = await file.text();
        return { name: file.webkitRelativePath || file.name, content: text, size: file.size };
      })
    );
    setSelectedFiles(parsedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const clearFiles = () => setSelectedFiles([]);

  const triggerAnalysis = async () => {
    if (mode === 'upload' && selectedFiles.length === 0) return;
    if (mode === 'paste' && !pastedCode.trim()) return;

    setIsAnalyzing(true);

    try {
      const payloadFiles = mode === 'upload' 
        ? selectedFiles 
        : [{ name: 'manual_snippet.py', content: pastedCode, size: pastedCode.length }];

      const response = await fetch('https://ai-code-saftey-layer.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles }) 
      });

      if (!response.ok) throw new Error("Analysis failed");
      
      const results = await response.json();
      navigate('/results', { state: { data: results, files: payloadFiles } }); // Passes the files array!
      
    } catch (error) {
      console.error("Error during analysis:", error);
      alert("Failed to analyze codebase. Ensure backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(20px, 5vw, 40px)', overflowY: 'auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px', animation: 'coreEntry 0.5s ease-out' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', color: '#f8fafc', margin: '0 0 10px 0', fontWeight: '600' }}>
          Security <span style={{ color: '#d4af37' }}>Scanner</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px, 2vw, 16px)', maxWidth: '600px' }}>
          {mode === 'select' && "Choose how you want to provide your code for vulnerability analysis."}
          {mode === 'upload' && "Upload a Python project folder to parse AST structures and cross-reference dependencies."}
          {mode === 'paste' && "Paste a Python code snippet directly into the secure environment for rapid analysis."}
        </p>
      </div>

      {/* --- MODE 1: SELECTOR --- */}
      {mode === 'select' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', animation: 'coreEntry 0.3s ease' }}>
          <div onClick={() => setMode('upload')} className="glow-on-hover" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px', transition: 'all 0.3s' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}><UploadCloud size={40} color="#d4af37" /></div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Upload Folder</h3>
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px', margin: 0 }}>Analyze a Python repository and detect cross-file vulnerabilities.</p>
          </div>
          <div onClick={() => setMode('paste')} className="glow-on-hover" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px', transition: 'all 0.3s' }}>
            <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}><Code2 size={40} color="#4ade80" /></div>
            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>Paste Snippet</h3>
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px', margin: 0 }}>Quickly scan a single block of Python code without uploading files.</p>
          </div>
        </div>
      )}

      {/* --- MODE 2: UPLOAD UI --- */}
      {mode === 'upload' && (
        // ALIGNMENT FIX: Added maxWidth: 800px here to bound the Back button!
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'coreEntry 0.3s ease' }}>
          <button onClick={() => setMode('select')} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#f8fafc'} onMouseOut={(e) => e.target.style.color = '#94a3b8'}>
            <ArrowLeft size={16} /> Back to Options
          </button>
          
          <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current.click()} style={{ width: '100%', background: dragActive ? 'rgba(212, 175, 55, 0.1)' : 'rgba(15, 23, 42, 0.4)', border: dragActive ? '2px dashed #d4af37' : '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: 'clamp(30px, 5vw, 60px) 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}><Folder size={48} color="#d4af37" /></div>
            <h3 style={{ color: '#f8fafc', fontSize: 'clamp(18px, 3vw, 22px)', margin: '0 0 10px 0' }}>{dragActive ? "Drop your folder here" : "Click to select a Python project folder"}</h3>
            {/* TEXT FIX: Updated description */}
            <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>Strictly parses .py files (Ignores venv, __pycache__, & hidden folders)</p>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} webkitdirectory="true" directory="true" multiple onChange={handleFolderSelect} />
          </div>

          {selectedFiles.length > 0 && (
            <div style={{ width: '100%', marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><FileCode size={18} color="#d4af37" /> {selectedFiles.length} Python Files Extracted</h4>
                <button onClick={(e) => { e.stopPropagation(); clearFiles(); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><X size={16} /> Clear</button>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '15px', maxHeight: '200px', overflowY: 'auto', display: 'grid', gap: '8px' }}>
                {selectedFiles.slice(0, 20).map((file, idx) => (<div key={idx} style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>{file.name}</div>))}
                {selectedFiles.length > 20 && <div style={{ color: '#d4af37', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>+ {selectedFiles.length - 20} more files...</div>}
              </div>
              <button onClick={triggerAnalysis} disabled={isAnalyzing} className="glow-on-hover" style={{ width: '100%', marginTop: '25px', background: isAnalyzing ? 'rgba(212, 175, 55, 0.2)' : 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(166, 132, 37, 0.2) 100%)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#d4af37', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textTransform: 'uppercase', cursor: isAnalyzing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {isAnalyzing ? <><Loader2 size={20} className="animate-spin" /> Analyzing AST Tree...</> : <><Sparkles size={20} /> Initialize Security Scan</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 3: PASTE UI --- */}
      {mode === 'paste' && (
        // ALIGNMENT FIX: Bound the width here to 800px so the Back button aligns perfectly
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', animation: 'coreEntry 0.3s ease' }}>
          <button onClick={() => setMode('select')} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#f8fafc'} onMouseOut={(e) => e.target.style.color = '#94a3b8'}>
            <ArrowLeft size={16} /> Back to Options
          </button>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px', color: '#4ade80', fontSize: '13px', fontWeight: 'bold' }}>
              <Code2 size={16} /> QUICK EDITOR
            </div>
            <textarea 
              value={pastedCode}
              onChange={(e) => setPastedCode(e.target.value)}
              placeholder="# Paste your vulnerable Python code snippet here..."
              spellCheck="false"
              style={{ width: '100%', height: '400px', background: 'transparent', border: 'none', color: '#f8fafc', fontFamily: 'monospace', fontSize: '14px', padding: '20px', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <button onClick={triggerAnalysis} disabled={isAnalyzing || !pastedCode.trim()} className="glow-on-hover" style={{ width: '100%', marginTop: '25px', background: isAnalyzing ? 'rgba(74, 222, 128, 0.1)' : 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 197, 94, 0.2) 100%)', border: '1px solid rgba(74, 222, 128, 0.4)', color: '#4ade80', padding: '18px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', textTransform: 'uppercase', cursor: isAnalyzing || !pastedCode.trim() ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', gap: '10px', opacity: !pastedCode.trim() ? 0.5 : 1 }}>
            {isAnalyzing ? <><Loader2 size={20} className="animate-spin" /> Analyzing Syntax...</> : <><Sparkles size={20} /> Scan Snippet</>}
          </button>
        </div>
      )}

    </div>
  );
};

export default Analyze;