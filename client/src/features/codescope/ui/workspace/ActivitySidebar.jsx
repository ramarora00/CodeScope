import React from 'react';
import FileExplorer from '../../../../components/FileExplorer';
import { Brain, FolderClosed, FileText, ChevronRight, CornerDownRight } from 'lucide-react';

export default function ActivitySidebar({ activeTab, repo, onFileSelect }) {
  // Mock Workspace Memory for demonstration
  const memorySessions = [
    {
      title: 'Login Flow Analysis',
      files: [
        { name: 'auth.ts', path: 'middleware/auth.ts' },
        { name: 'jwt.ts', path: 'jwt.ts' },
        { name: 'middleware.ts', path: 'middleware.ts' },
        { name: 'user.ts', path: 'models/user.ts' },
      ],
      notes: 'Investigating JWT authentication pipeline'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'explorer':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <FileExplorer 
              repo={repo} 
              onFileSelect={onFileSelect} 
            />
          </div>
        );
      case 'memory':
        return (
          <div className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar select-none">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#5f5f63] uppercase tracking-wider mb-3">
              <Brain size={11} className="text-[#8b8dee]" />
              <span>Workspace Memory</span>
            </div>
            {memorySessions.map((session, sIdx) => (
              <div key={sIdx} className="mb-4">
                <div className="flex items-center gap-1 py-1 text-[12px] font-medium text-[#e9e9ea] hover:text-white cursor-pointer transition-colors">
                  <ChevronRight size={12} className="text-[#7a7a7f] rotate-90" />
                  <span>{session.title}</span>
                </div>
                <div className="pl-3 border-l border-white/5 mt-1.5 flex flex-col gap-1">
                  {session.files.map((file, fIdx) => (
                    <button
                      key={fIdx}
                      onClick={() => onFileSelect({ name: file.name, path: file.path })}
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white/[0.03] text-left text-[11px] font-mono text-[#8e97a8] hover:text-[#e9e9ea] transition-all"
                    >
                      <CornerDownRight size={10} className="text-[#5f5f63]" />
                      <span>{file.name}</span>
                    </button>
                  ))}
                  <div className="mt-2 text-[10.5px] text-[#5f5f63] font-sans pl-5 leading-normal italic">
                    "{session.notes}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'workspace':
        return (
          <div className="flex-1 flex flex-col p-4 text-[#7a7a7f] text-[11.5px] leading-relaxed">
            <div className="text-[10px] font-bold text-[#5f5f63] uppercase tracking-wider mb-2">Active Altitudes</div>
            <p className="mb-3">CodeScope coordinates analysis across six structural boundaries.</p>
            <div className="flex flex-col gap-1.5 font-mono text-[11px] text-[#8e97a8] mt-2">
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#8b8dee]" /><span>1. Repository Map</span></div>
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#8b8dee]" /><span>2. Directory Explorer</span></div>
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#8b8dee]" /><span>3. Symbol Graph</span></div>
              <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#8b8dee]" /><span>4. Flow Tracer</span></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-4 text-center text-[#5f5f63] text-[11px] font-mono select-none">
            {activeTab.toUpperCase()} Panel Placeholder
          </div>
        );
    }
  };

  return (
    <aside className="w-[240px] bg-[#080A0F] border-r border-white/5 flex flex-col select-none h-full relative z-20 flex-shrink-0">
      {/* Header Label */}
      <div className="h-9 px-3.5 border-b border-white/5 bg-[#0a0a0b] flex items-center justify-between text-[11px] font-semibold text-[#c7c7ce] uppercase tracking-widest">
        <span>{activeTab}</span>
      </div>
      
      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {renderContent()}
      </div>
    </aside>
  );
}
