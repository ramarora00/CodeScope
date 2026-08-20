import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, AlertTriangle } from 'lucide-react';
import { useSSEConnection } from '../transport/useSSEConnection';
import { apiFetch } from '../../../config/apiFetch';
import { API_BASE } from '../../../config/api';

export default function ProcessingExperience({ repo, onComplete, onBack }) {
  const [steps, setSteps] = useState({
    cloning: 'pending',
    reading: 'pending',
    parsing: 'pending',
    resolve_imports: 'pending',
    call_graph: 'pending',
    embeddings: 'pending',
    ready: 'pending'
  });

  const [fileCount, setFileCount] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [currentLine, setCurrentLine] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const codeContainerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Subscribe to SSE progress using the authenticated hook
  useSSEConnection({
    url: repo ? `${API_BASE}/api/repo/${repo.id}/progress` : null,
    enabled: !!repo && !errorMsg && steps.ready !== 'done',
    onEvent: (data) => {
      if (data.step) {
        setSteps(prev => {
          const next = { ...prev };
          next[data.step] = data.status;
          
          // Auto-complete preceding steps if we progressed past them
          const stepOrder = ['cloning', 'reading', 'parsing', 'resolve_imports', 'call_graph', 'embeddings', 'ready'];
          const currentIdx = stepOrder.indexOf(data.step);
          if (data.status === 'running') {
            for (let i = 0; i < currentIdx; i++) {
              if (next[stepOrder[i]] === 'pending' || next[stepOrder[i]] === 'running') {
                next[stepOrder[i]] = 'done';
              }
            }
          }
          return next;
        });
      }

      if (data.count !== undefined) {
        setFileCount(data.count);
      }

      if (data.file !== undefined) {
        setCurrentFile(data.file);
      }

      if (data.content !== undefined) {
        setCodeContent(data.content);
      }

      if (data.line !== undefined) {
        setCurrentLine(data.line);
      }

      if (data.step === 'ready' && data.status === 'done') {
        setTimeout(() => {
          onComplete();
        }, 800);
      }

      if (data.status === 'failed') {
        setErrorMsg(data.error || 'Indexing failed.');
      }
    },
    onError: (err) => {
      // Stream handles its own closure
    }
  });

  useEffect(() => {
    if (!repo) return;
    setSteps(prev => ({
      ...prev,
      cloning: repo.status === 'cloning' ? 'running' : 'done'
    }));
  }, [repo]);

  // Autoscroll logic for code line progression
  useEffect(() => {
    if (activeLineRef.current && codeContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLine, currentFile]);

  // Map steps to human-readable text
  const stepConfig = [
    { key: 'cloning', label: 'Clone repository' },
    { 
      key: 'reading', 
      label: steps.reading === 'done' && fileCount > 0 ? `Read ${fileCount} files` : 'Read files' 
    },
    { 
      key: 'parsing', 
      label: steps.parsing === 'running' && currentFile ? `Parsing ${currentFile.split('/').pop()}` : 'Parse files' 
    },
    { key: 'resolve_imports', label: 'Resolve imports' },
    { key: 'call_graph', label: 'Build call graph' },
    { key: 'embeddings', label: 'Build embeddings' },
    { key: 'ready', label: 'Ready' }
  ];

  // Helper to render step bullet
  const renderStepBullet = (status) => {
    if (status === 'done') {
      return (
        <div className="w-4 h-4 flex items-center justify-center text-[#7A8F7B]">
          <Check size={12} strokeWidth={3} />
        </div>
      );
    }
    if (status === 'running') {
      return (
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
        </div>
      );
    }
    if (status === 'failed') {
      return (
        <div className="w-4 h-4 flex items-center justify-center text-[#8B6B6B]">
          <AlertTriangle size={12} strokeWidth={3} />
        </div>
      );
    }
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full border border-[#5C657A] bg-transparent" />
      </div>
    );
  };

  const codeLines = codeContent ? codeContent.split('\n') : [];

  return (
    <div className="flex-1 flex flex-col bg-[#05070B] min-h-screen">
      
      {/* Pinned Header */}
      <motion.div 
        layoutId="command-surface"
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
        className="w-full h-14 border-b border-white/5 bg-[#0A0E15] px-6 flex items-center z-20"
      >
        <span className="text-[12px] font-mono text-[#8E97A8] select-all truncate">
          {repo ? repo.url.replace('local://', '') : ''}
        </span>
      </motion.div>

      {/* Main Panel Content Split */}
      <div className="flex-1 grid grid-cols-[300px_1fr] divide-x divide-white/5 overflow-hidden">
        
        {/* LEFT: Operation Log */}
        <div className="p-6 bg-[#080A0F] flex flex-col space-y-6 select-none overflow-y-auto">
          <div className="text-[10px] font-bold text-[#5C657A] uppercase tracking-wider">Operation Log</div>
          <div className="flex flex-col space-y-4">
            {stepConfig.map(({ key, label }) => {
              const status = steps[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  {renderStepBullet(status)}
                  <span className={`text-[12px] font-mono leading-none ${
                    status === 'done' ? 'text-[#8E97A8]' :
                    status === 'running' ? 'text-[#D8DCE6] font-medium' :
                    'text-[#5C657A]'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Live Code Reading or Error Alert */}
        <div className="bg-[#05070B] flex flex-col overflow-hidden relative">
          {errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 select-none">
              <div className="w-12 h-12 rounded-full bg-[#8B6B6B]/10 border border-[#8B6B6B]/20 flex items-center justify-center text-[#8B6B6B] animate-pulse">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[14px] font-medium text-[#D8DCE6]">Repository Indexing Failed</h3>
                <p className="text-[11px] text-[#8E97A8] max-w-sm mx-auto leading-relaxed">
                  An error occurred during codebase scanning and intelligence building.
                </p>
              </div>
              <div className="w-full max-w-md bg-[#080A0F] border border-white/5 rounded-lg p-4 text-left font-mono text-[11px] text-[#8B6B6B] break-all max-h-48 overflow-y-auto select-text selection:bg-[#8B6B6B]/20">
                {errorMsg}
              </div>
              <button
                onClick={async () => {
                  if (repo && repo.id) {
                    try {
                      await apiFetch(`${API_BASE}/api/repo/${repo.id}`, { method: 'DELETE' });
                    } catch (e) {
                      console.error("Failed to delete repo:", e);
                    }
                  }
                  if (onBack) onBack();
                }}
                className="px-5 py-2 bg-[#D8DCE6] hover:bg-white text-[#05070B] rounded-md text-[12px] font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : (
            <>
              {currentFile && (
                <div className="h-8 border-b border-white/5 bg-[#080A0F] px-4 flex items-center select-none text-[10px] font-mono text-[#8E97A8]">
                  {currentFile}
                </div>
              )}
              
              <div 
                ref={codeContainerRef}
                className="flex-1 overflow-y-auto p-6 font-mono text-[12px] leading-relaxed custom-scrollbar select-text selection:bg-[#3B82F6]/30"
              >
                {codeLines.length > 0 ? (
                  <div className="w-full flex flex-col">
                    {codeLines.map((line, idx) => {
                      const lineNum = idx + 1;
                      const isHighlighted = lineNum === currentLine;
                      const isPast = lineNum < currentLine;
                      
                      return (
                        <div 
                          key={idx}
                          ref={isHighlighted ? activeLineRef : null}
                          className={`flex w-full items-start py-0.5 px-2 rounded-sm transition-all duration-100 ${
                            isHighlighted ? 'bg-white/5 text-[#FFFFFF]' : ''
                          }`}
                          style={{
                            opacity: isHighlighted ? 1 : isPast ? 0.9 : 0.25,
                          }}
                        >
                          <span className="w-10 text-right pr-4 text-[#5C657A] select-none text-[10px] font-sans">
                            {lineNum}
                          </span>
                          <pre className="flex-1 m-0 p-0 overflow-x-auto whitespace-pre tab-size-2">
                            <code>{line || ' '}</code>
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5C657A] text-[11px] select-none">
                    Waiting for files...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
