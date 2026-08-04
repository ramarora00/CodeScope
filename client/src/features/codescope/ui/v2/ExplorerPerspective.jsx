import React from 'react';
import FileExplorer from '../../../../components/FileExplorer';
import FileViewer from '../../../../components/FileViewer';
import KnowledgePanel from './KnowledgePanel';

// ExplorerPerspective is a PURE layout component.
// It receives all state via presentation prop — no Zustand.
export default function ExplorerPerspective({ onNewInvestigation, presentation }) {
  const repo = presentation.selectedRepo;
  const selectedFile = presentation.userSelectedFile;
  const setSelectedFile = presentation.onSelectFile;

  return (
    <div className="flex-1 flex min-h-0 bg-[var(--cs-bg)] gap-[2px]">
      {/* File Tree Panel */}
      <div 
        className="w-[300px] flex-shrink-0 bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle"
        style={{ animationDelay: '100ms' }}
      >
        <div className="px-5 flex items-center" style={{ height: '40px', borderBottom: '1px solid var(--cs-border)' }}>
          <span style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Explorer
          </span>
        </div>
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
          <div className="p-2">
            <FileExplorer repo={repo} onFileSelect={setSelectedFile} />
          </div>
        </div>
      </div>
      
      {/* Code Editor Panel */}
      <div 
        className="flex-1 flex flex-col bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle"
        style={{ animationDelay: '140ms' }}
      >
        {selectedFile ? (
          <FileViewer repo={repo} file={selectedFile} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--cs-muted)] font-mono text-[11px] gap-3">
            <div className="w-8 h-8 rounded border border-dashed border-[var(--cs-border)] flex items-center justify-center opacity-50">
              <span className="text-[16px] text-[var(--cs-hint)]">+</span>
            </div>
            Select a file to view
          </div>
        )}
      </div>

      {/* Intelligence Panel */}
      <div 
        className="flex-shrink-0 bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle"
        style={{ animationDelay: '180ms' }}
      >
        <KnowledgePanel
          repo={repo}
          findings={presentation.findings}
          relatedSymbols={presentation.relatedSymbols}
          onNewInvestigation={onNewInvestigation}
          selectedFile={selectedFile}
          selectedTimelineEventId={presentation.selectedTimelineEventId}
          onReturnToPresent={presentation.onReturnToPresent}
        />
      </div>
    </div>
  );
}
