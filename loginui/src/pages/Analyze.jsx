import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Folder, FileCode, X, Sparkles, Loader2 } from 'lucide-react';
import '../assets/premium-theme.css';

const Analyze = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Folders and file types we want to ignore
  const IGNORED_FOLDERS = ['.git', 'node_modules', 'dist', 'build', '.next', 'venv'];
  const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'];

  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = async (files) => {
    const validFiles = files.filter(file => {
      // Filter out hidden files, ignored folders, and ensure it's a valid code file
      const pathParts = file.webkitRelativePath.split('/');
      const hasIgnoredFolder = pathParts.some(part => IGNORED_FOLDERS.includes(part));
      const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => file.name.endsWith(ext));
      
      return !hasIgnoredFolder && hasValidExtension && !file.name.startsWith('.');
    });

    // Read the contents of all valid files
    const parsedFiles = await Promise.all(
      validFiles.map(async (file) => {
        const text = await file.text();
        return {
          name: file.webkitRelativePath || file.name,
          content: text,
          size: file.size
        };
      })
    );

    setSelectedFiles(parsedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    if (selectedFiles.length === 0) return;
    setIsAnalyzing(true);

    try {
      // NOTE: Change this to your actual backend URL if you aren't using a central API config
      const response = await fetch('https://ai-code-saftey-layer.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // We are sending an array of files instead of a single string
        body: JSON.stringify({ files: selectedFiles }) 
      });

      if (!response.ok) throw new Error("Analysis failed");
      
      const results = await response.json();
      
      // Navigate to results page and pass the data!
      navigate('/results', { state: { data: results, analyzedFiles: selectedFiles.length } });
      
    } catch (error) {
      console.error("Error during analysis:", error);
      alert("Failed to analyze codebase. Ensure backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(20px, 5vw, 40px)', overflowY: 'auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px', animation: 'coreEntry 0.5s ease-out' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', color: '#f8fafc', margin: '0 0 10px 0', fontWeight: '600' }}>
          Repository <span style={{ color: '#d4af37' }}>Scanner</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px, 2vw, 16px)', maxWidth: '600px' }}>
          Upload your project folder. The AI safety layer will parse the entire AST structure, cross-reference dependencies, and detect vulnerabilities.
        </p>
      </div>

      {/* RESPONSIVE DRAG & DROP ZONE */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          width: '100%',
          maxWidth: '800px',
          background: dragActive ? 'rgba(212, 175, 55, 0.1)' : 'rgba(15, 23, 42, 0.4)',
          border: dragActive ? '2px dashed #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: 'clamp(30px, 5vw, 60px) 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          animation: 'coreEntry 0.7s ease-out'
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
          <Folder size={48} color="#d4af37" />
        </div>
        
        <h3 style={{ color: '#f8fafc', fontSize: 'clamp(18px, 3vw, 22px)', margin: '0 0 10px 0' }}>
          {dragActive ? "Drop your folder here" : "Click to select a project folder"}
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center' }}>
          Supports .js, .py, .ts, .java, .cpp (Ignores node_modules & hidden files)
        </p>

        {/* The Magic HTML Attribute: webkitdirectory */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          webkitdirectory="true" 
          directory="true" 
          multiple 
          onChange={handleFolderSelect}
        />
      </div>

      {/* RESPONSIVE SELECTED FILES LIST */}
      {selectedFiles.length > 0 && (
        <div style={{ width: '100%', maxWidth: '800px', marginTop: '30px', animation: 'coreEntry 0.5s ease-out' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="#d4af37" /> 
              {selectedFiles.length} Code Files Extracted
            </h4>
            <button onClick={(e) => { e.stopPropagation(); clearFiles(); }} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <X size={16} /> Clear
            </button>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '12px', 
            padding: '15px',
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'grid',
            gap: '8px'
          }}>
            {selectedFiles.slice(0, 20).map((file, idx) => (
              <div key={idx} style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                {file.name}
              </div>
            ))}
            {selectedFiles.length > 20 && (
              <div style={{ color: '#d4af37', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
                + {selectedFiles.length - 20} more files ready for analysis...
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button 
            onClick={triggerAnalysis}
            disabled={isAnalyzing}
            className="glow-on-hover"
            style={{
              width: '100%',
              marginTop: '25px',
              background: isAnalyzing ? 'rgba(212, 175, 55, 0.2)' : 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(166, 132, 37, 0.2) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#d4af37',
              padding: 'clamp(14px, 3vw, 18px)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              letterSpacing: '1px',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease'
            }}
          >
            {isAnalyzing ? (
              <><Loader2 size={20} className="spinner" /> Analyzing AST Tree...</>
            ) : (
              <><Sparkles size={20} /> Initialize Security Scan</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Analyze;