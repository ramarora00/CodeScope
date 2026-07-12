import React from 'react';
import { Target, Hash, FileCode, Sparkles, BookOpen } from 'lucide-react';

export default function AIObservatory({ activeInvestigation, selectedFile, onOpenFile }) {
  const files = activeInvestigation?.evidence?.files || [];
  const symbols = activeInvestigation?.evidence?.symbols || [];
  const routes = activeInvestigation?.evidence?.routes || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080A0F] select-none text-[#D8DCE6] overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-4 border-b border-white/5 bg-[#080A0F] flex items-center gap-2 flex-shrink-0 select-none">
        <Sparkles size={14} className="text-[#3B82F6]" />
        <span className="text-[10px] font-bold tracking-wider text-[#D8DCE6] uppercase">AI Assistant</span>
      </div>

      {/* Structured Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Active Focus */}
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Active Focus</div>
          <div className="p-3 border border-white/5 rounded-lg bg-[#0A0E15] flex items-center gap-2">
            <Target size={14} className="text-[#3B82F6] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-[#D8DCE6] truncate">
                {selectedFile ? selectedFile.name : 'Global Scope'}
              </div>
              {selectedFile && (
                <div className="text-[9px] text-[#5C657A] truncate font-mono">{selectedFile.path}</div>
              )}
            </div>
          </div>
        </div>

        {/* Current Investigation */}
        <div className="space-y-2">
          <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Current Investigation</div>
          <div className="p-3 border border-white/5 rounded-lg bg-[#0A0E15]">
            <p className="text-[11px] font-medium text-[#D8DCE6] leading-relaxed">
              {activeInvestigation ? activeInvestigation.title : 'No active investigation'}
            </p>
          </div>
        </div>

        {/* Pinned Evidence (Symbols & Routes) */}
        {activeInvestigation && (symbols.length > 0 || routes.length > 0) && (
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
        {activeInvestigation && files.length > 0 && (
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
            <div className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Reasoning</div>
            <div className="p-3 border border-white/5 rounded-lg bg-[#0A0D12] text-[11px] text-[#8E97A8] leading-relaxed select-text selection:bg-[#3B82F6]/30 whitespace-pre-wrap font-sans">
              {activeInvestigation.conclusion}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
