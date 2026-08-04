import React, { useState } from 'react';
import InvestigationPanel from './InvestigationPanel';
import AIOverlayEditor from './AIOverlayEditor';
import KnowledgePanel from './KnowledgePanel';
import InvestigationReportSheet from './InvestigationReportSheet';
import RepositoryReadyState from './RepositoryReadyState';

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
  const [reportDismissed, setReportDismissed] = useState(false);
  
  // Show report if there is an answer/error and it hasn't been dismissed by the user
  const showReport = (presentation.answer || presentation.error) && !reportDismissed;

  return (
    <div className="flex-1 flex min-h-0 bg-[var(--cs-bg)] gap-[2px] relative overflow-hidden">
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
          repo={presentation.selectedRepo}
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
          <RepositoryReadyState repo={presentation.selectedRepo} repositoryContext={presentation.repositoryContext} onNewInvestigation={onNewInvestigation} />
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
            onAnimationComplete={presentation.onAnimationComplete}
          />
        )}
      </div>

      {/* Knowledge Panel always stays mounted */}
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
        <KnowledgePanel
          repo={presentation.selectedRepo}
          findings={presentation.findings}
          relatedSymbols={presentation.relatedSymbols}
          onNewInvestigation={onNewInvestigation}
          selectedFile={presentation.userSelectedFile}
          selectedTimelineEventId={presentation.selectedTimelineEventId}
          onReturnToPresent={presentation.onReturnToPresent}
        />
      </div>

      {/* Cinematic Bottom Sheet Overlay */}
      {showReport && (
        <InvestigationReportSheet 
          answer={presentation.answer} 
          error={presentation.error}
          onClose={() => setReportDismissed(true)} 
          onRetryInvestigation={activeInvestigation ? () => onNewInvestigation(activeInvestigation.query || activeInvestigation.title, activeInvestigation.mode) : undefined}
        />
      )}
    </div>
  );
}
