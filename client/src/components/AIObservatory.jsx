import React from 'react';
import { Target, Hash, FileCode, Sparkles, BookOpen, CheckCircle } from 'lucide-react';

export default function AIObservatory({ activeInvestigation, derivedEvidence, selectedFile, focusContext, onOpenFile }) {
  const files = derivedEvidence?.files || [];
  const symbols = derivedEvidence?.symbols || [];
  const routes = derivedEvidence?.routes || [];
  
  const { mission, status, answer, confidence, findings = [] } = focusContext || {};
  const isPlanning = status === 'planning';
  const isInvestigating = status === 'investigating' || status === 'review';

  // Simple loading animation logic
  const [loadingDots, setLoadingDots] = React.useState('');
  React.useEffect(() => {
    if (isPlanning) {
      const interval = setInterval(() => {
        setLoadingDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlanning]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080A0F] select-none text-[#D8DCE6] overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-4 border-b border-white/5 bg-[#080A0F] flex items-center gap-2 flex-shrink-0 select-none">
        <Sparkles size={14} className="text-[#3B82F6]" />
        <span className="text-[10px] font-bold tracking-wider text-[#D8DCE6] uppercase">AI Assistant</span>
      </div>

      {/* Structured Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

        {/* PR 4 / SPRINT 3: Unified Focus Context State Block */}
        {(mission || activeInvestigation) && (
          <div className="space-y-4 border-b border-white/5 pb-4">
            
            {/* Mission */}
            <div className="space-y-2">
              <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Mission</div>
              <div className="p-3 border border-white/5 rounded-lg bg-[#0A0E15]">
                <p className="text-[11px] font-medium text-[#D8DCE6] leading-relaxed">
                  {mission || activeInvestigation?.title || 'No active investigation'}
                </p>
              </div>
            </div>

            {/* Answer (only if investigating, review, or planning) */}
            {(isPlanning || isInvestigating) && (
              <div className="space-y-2">
                <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Investigation Synthesis</div>
                <div className="p-3 border border-[#3B82F6]/20 rounded-lg bg-[#3B82F6]/5">
                  {isPlanning ? (
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <Sparkles size={16} className="text-[#3B82F6] animate-pulse" />
                      <span className="text-[11px] font-medium text-[#3B82F6]">Planning{loadingDots}</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Hypothesis Context */}
                      <p className="text-[11px] text-[#D8DCE6] leading-relaxed font-serif italic border-b border-white/5 pb-3">
                        "{answer}"
                      </p>
                      
                      {/* SPRINT 3: Streaming Findings */}
                      {findings.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Findings</div>
                          <div className="space-y-1.5">
                            {findings.map((fact, idx) => (
                              <div key={`fact-${idx}`} className="flex items-start gap-2 p-2 border border-white/5 rounded bg-[#0A0E15] text-[10px] text-[#8E97A8]">
                                <div className="mt-0.5 text-[#3B82F6]">{idx + 1}.</div>
                                <div>{fact.fact}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {confidence !== null && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                          <Target size={10} className="text-[#5C657A]" />
                          <span className="text-[9px] text-[#5C657A]">
                            Confidence: {(confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Active Focus */}
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Active Focus</div>
          <div className="p-3 border border-white/5 rounded-lg bg-[#0A0E15] flex items-center gap-2">
            <Target size={14} className="text-[#3B82F6] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-[#D8DCE6] truncate">
                {isPlanning ? 'Planning in progress...' : (selectedFile ? selectedFile.name : 'Global Scope')}
              </div>
              {selectedFile && !isPlanning && (
                <div className="text-[9px] text-[#5C657A] truncate font-mono">{selectedFile.path}</div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Evidence (Symbols & Routes) */}
        {(symbols.length > 0 || routes.length > 0) && (
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Pinned Evidence</div>
            <div className="space-y-1.5">
              {symbols.map((sym, idx) => (
                <div key={`sym-${idx}`} className="p-2 border border-white/5 rounded bg-[#0A0E15] flex items-center gap-2">
                  <Hash size={11} className="text-[#8E97A8] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-[#D8DCE6] truncate">{sym.name}</span>
                </div>
              ))}
              {routes.map((rt, idx) => (
                <div key={`rt-${idx}`} className="p-2 border border-white/5 rounded bg-[#0A0E15] flex items-center gap-2">
                  <FileCode size={11} className="text-[#8E97A8] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-[#D8DCE6] truncate">{rt.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referenced Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Referenced Files</div>
            <div className="space-y-1">
              {files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenFile?.(file)}
                  className="w-full text-left p-2 border border-transparent rounded hover:border-white/5 hover:bg-white/5 transition-all flex items-center gap-2 font-mono text-[10px] text-[#8E97A8] hover:text-[#D8DCE6]"
                >
                  <BookOpen size={11} className="text-[#5C657A] flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Reasoning prose */}
        {activeInvestigation?.conclusion && (
          <div className="space-y-2">
            <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Conclusion</div>
            <div className="p-3 border border-white/5 rounded-lg bg-[#0A0D12] text-[11px] text-[#8E97A8] leading-relaxed select-text selection:bg-[#3B82F6]/30 whitespace-pre-wrap font-sans">
              {activeInvestigation.conclusion}
            </div>
          </div>
        )}

        {/* SPRINT 3B: Final Investigation Report Elements */}
        {status === 'review' && (
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">Investigation Complete</span>
            </div>
            
            <div className="space-y-2">
              <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Suggested Follow-ups</div>
              <div className="space-y-1.5">
                <button className="w-full text-left p-2 border border-white/5 rounded-lg bg-[#0A0E15] text-[11px] text-[#D8DCE6] hover:bg-white/5 hover:border-[#3B82F6]/30 transition-all">
                  How is this module tested?
                </button>
                <button className="w-full text-left p-2 border border-white/5 rounded-lg bg-[#0A0E15] text-[11px] text-[#D8DCE6] hover:bg-white/5 hover:border-[#3B82F6]/30 transition-all">
                  Show me the data models used here
                </button>
                <button className="w-full text-left p-2 border border-white/5 rounded-lg bg-[#0A0E15] text-[11px] text-[#D8DCE6] hover:bg-white/5 hover:border-[#3B82F6]/30 transition-all">
                  Explain the error handling flow
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
