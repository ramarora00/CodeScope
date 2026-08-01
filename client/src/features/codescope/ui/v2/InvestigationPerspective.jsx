import React from 'react';
import InvestigationPanel from './InvestigationPanel';
import AIOverlayEditor from './AIOverlayEditor';
import KnowledgePanel from './KnowledgePanel';
import ReviewPanel from './ReviewPanel';
import RepositoryReadyState from './RepositoryReadyState';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export default function InvestigationPerspective({
  bootPhase,
  activeInvestigation,
  isUnderstandingMode,
  presentation,
  handleSelectTab,
  handleCloseTab,
  memoryFiles,
  startedAt,
  onNewInvestigation,
}) {
  const repo = useWorkspaceStore(s => s.selectedRepo);
  const selectedFile = useWorkspaceStore(s => s.selectedFile);
  return (
    <>
      {/* Investigation */}
      <div
        className="animate-settle flex-shrink-0"
        style={{
          marginTop: '2px',
          borderRadius: '12px',
          background: 'var(--cs-panel)',
          border: '1px solid var(--cs-border)',
          boxShadow: 'var(--cs-shadow-panel)',
          overflow: 'hidden',
          animationDelay: '100ms',
        }}
      >
        <InvestigationPanel
          timelineEvents={presentation.timelineEvents}
          planSteps={presentation.planSteps}
          startedAt={startedAt}
          memoryFiles={memoryFiles}
          repo={repo}
          activeInvestigation={activeInvestigation}
          onNewInvestigation={onNewInvestigation}
        />
      </div>

      {/* AI Overlay Editor */}
      <div
        className="animate-settle flex-1 flex flex-col min-w-0"
        style={{
          borderRadius: '12px',
          background: 'var(--cs-panel)',
          border: '1px solid var(--cs-border)',
          boxShadow: 'var(--cs-shadow-panel)',
          overflow: 'hidden',
          animationDelay: '140ms',
        }}
      >
        {bootPhase === 'ready' && (!activeInvestigation || isUnderstandingMode) ? (
          <RepositoryReadyState repo={repo} />
        ) : (
          <AIOverlayEditor
            tabs={presentation.tabs}
            activeTabId={presentation.activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            attention={presentation.attention}
            insight={presentation.insight}
            runtimeStatus={presentation.runtimeStatus}
            aiPhase={presentation.aiPhase}
            memoryFiles={memoryFiles}
            answer={presentation.answer}
          />
        )}
      </div>

      {/* Knowledge or Review */}
      <div
        className="animate-settle flex-shrink-0"
        style={{
          borderRadius: '12px',
          background: 'var(--cs-panel)',
          border: '1px solid var(--cs-border)',
          boxShadow: 'var(--cs-shadow-panel)',
          overflow: 'hidden',
          animationDelay: '180ms',
        }}
      >
        {(presentation.answer || presentation.error) ? (
          <ReviewPanel answer={presentation.answer} error={presentation.error} />
        ) : (
          <KnowledgePanel
            repo={repo}
            findings={presentation.findings}
            relatedSymbols={presentation.relatedSymbols}
            onNewInvestigation={onNewInvestigation}
            selectedFile={selectedFile}
          />
        )}
      </div>
    </>
  );
}
