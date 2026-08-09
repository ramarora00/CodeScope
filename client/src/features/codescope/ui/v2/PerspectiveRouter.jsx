import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../../../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

// Panels

import KnowledgePanel from './KnowledgePanel';
import AIOverlayEditor from './AIOverlayEditor';
import RepositoryReadyState from './RepositoryReadyState';
import InvestigationReportSheet from './InvestigationReportSheet';
import ArchitecturePerspective from './ArchitecturePerspective'; // Returns the graph canvas
import FileExplorer from '../../../../components/FileExplorer';
import UniversalCodeViewer from './shared/UniversalCodeViewer';
import { useInvestigationSession, SESSION_STATES } from '../../store/useInvestigationSession';

export default function PerspectiveRouter({
  perspective,
  bootPhase,
  activeInvestigation,
  isUnderstandingMode,
  presentation,
  orchestration,
  handleSelectTab,
  handleCloseTab,
  memoryFiles,
  startedAt,
  onNewInvestigation,
  fileCount,
  filesLoading
}) {
  const [reportDismissed, setReportDismissed] = useState(false);
  const sessionState = useInvestigationSession(s => s.sessionState);

  // Bug Fix: Reset reportDismissed when a new investigation starts
  useEffect(() => {
    if (activeInvestigation?.id) {
      setReportDismissed(false);
    }
  }, [activeInvestigation?.id]);
  // Ensure the report only appears after the orchestration queue is fully emptied (which includes the 1500ms silence phase)
  const isReadingComplete = (presentation.runtimeStatus === 'resolved' || Boolean(presentation.error)) && !orchestration?.activeCognitiveEvent;
  const showReport = activeInvestigation &&
    sessionState !== SESSION_STATES.IDLE &&
    isReadingComplete &&
    !isUnderstandingMode &&
    !reportDismissed;

  // File explorer derives active file exactly like it did in ExplorerPerspective
  const aiTouchedPaths = new Set(memoryFiles.map(m => m.file || m.name).filter(Boolean));
  const activeFilePath = presentation.userSelectedFile
    ? (typeof presentation.userSelectedFile === 'string' ? presentation.userSelectedFile : presentation.userSelectedFile.path)
    : null;

  // The ONE canonical evidence state driving Editor, Knowledge, and Explorer
  const canonicalFile = activeFilePath || (perspective === 'investigation' ? (presentation.activeCognitiveEvent?.file || presentation.attention?.file) : undefined);

  const [fetchedContent, setFetchedContent] = useState({ path: null, content: null });
  const activeMemoryFile = memoryFiles.find(
    m => m.file === activeFilePath || m.name === activeFilePath
  );

  useEffect(() => {
    if (!activeFilePath || activeMemoryFile || !presentation.selectedRepo?.id) return;
    if (fetchedContent.path === activeFilePath) return;

    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/repo/${presentation.selectedRepo.id}/file/content?filePath=${encodeURIComponent(activeFilePath)}`);
        const data = await res.json();
        setFetchedContent({ path: activeFilePath, content: data.content || '// Empty file' });
      } catch (e) {
        console.error('Failed to fetch file content', e);
      }
    };
    fetchContent();
  }, [activeFilePath, activeMemoryFile, presentation.selectedRepo?.id, fetchedContent.path]);

  const enhancedMemoryFiles = useMemo(() => {
    if (activeFilePath && fetchedContent.path === activeFilePath && !activeMemoryFile) {
      return [...memoryFiles, { file: fetchedContent.path, content: fetchedContent.content, language: activeFilePath.split('.').pop() }];
    }
    return memoryFiles;
  }, [memoryFiles, fetchedContent, activeFilePath, activeMemoryFile]);

  return (
    <div className="flex-1 min-h-0 relative flex gap-0 bg-[var(--cs-bg)] overflow-hidden">

      {/* ── Single Left Panel: Repository Explorer ── */}
      {perspective !== 'branch' && (
        <div
          className="flex-shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: '18%',
            minWidth: '220px',
            maxWidth: '300px',
            borderRadius: '10px',
            background: 'var(--cs-glass-panel)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'var(--cs-inset-top-soft)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{ padding: '24px 24px 16px', gap: '8px' }}
          >
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--cs-text)',
              opacity: 0.8,
              fontFamily: 'var(--font-ui)',
            }}>
              Repository
            </span>
            <div className="flex items-center text-[11px] text-[var(--cs-muted)]" style={{ fontFamily: 'var(--font-mono)' }}>
              <span>{fileCount} files</span>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: '0 12px' }}>
            <FileExplorer
              repo={presentation.selectedRepo}
              onFileSelect={presentation.onSelectFile}
              aiMemoryMap={presentation.aiMemoryMap}
              selectedPath={activeFilePath}
              activeInvestigatingFile={canonicalFile}
            />
          </div>
        </div>
      )}

      {/* ── Center Panel (Code Viewer or Architecture Graph) ── */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{
          borderRadius: '10px',
          background: 'var(--cs-editor)',
          border: '1px solid rgba(255,255,255,0.04)',
          boxShadow: 'none',
          overflow: 'hidden',
        }}
      >
        {perspective === 'branch' ? (
          <ArchitecturePerspective presentation={presentation} />
        ) : (
          bootPhase === 'ready' && (!activeInvestigation || (isUnderstandingMode && presentation.isResolving)) && !(perspective === 'files' && activeFilePath) ? (
            <RepositoryReadyState
              repo={presentation.selectedRepo}
              repositoryContext={presentation.repositoryContext}
              onNewInvestigation={onNewInvestigation}
              fileCount={fileCount}
              filesLoading={filesLoading}
            />
          ) : (
            <div className="flex-1 flex flex-col min-w-0 h-full">
              {/* Removed redundant breadcrumb row */}
              <UniversalCodeViewer
                tabs={presentation.tabs}
                activeTabId={canonicalFile}
                isAsset={presentation.isAsset}
                onSelectTab={handleSelectTab}
                onCloseTab={handleCloseTab}
                attention={presentation.attention}
                insight={presentation.insight}
                runtimeStatus={presentation.runtimeStatus}
                aiPhase="investigating"
                memoryFiles={enhancedMemoryFiles}
                orchestration={orchestration}
                answer={presentation.answer}
                activeInvestigation={activeInvestigation}
                onReturnToAI={presentation.onReturnToAI}
                userSelectedFile={presentation.userSelectedFile}
              />
            </div>
          )
        )}
      </div>

      {/* ── Right Panel (Knowledge) ── */}
      <div
        className="flex-shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: '20%',
          minWidth: '280px',
          maxWidth: '380px',
          borderRadius: '10px',
          background: 'var(--cs-glass-panel)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'var(--cs-inset-top-soft)',
          overflow: 'hidden',
        }}
      >
        <KnowledgePanel
          repo={presentation.selectedRepo}
          fileCount={fileCount}
          findings={presentation.findings}
          relatedSymbols={presentation.relatedSymbols}
          intelligenceStream={presentation.intelligenceStream}
          onNewInvestigation={onNewInvestigation}
          selectedFile={canonicalFile}
          selectedTimelineEventId={presentation.selectedTimelineEventId}
          onReturnToPresent={presentation.onReturnToPresent}
          isContext={false}
        />
      </div>

      {/* ── Report Sheet ── */}
      {showReport && perspective !== 'branch' && (
        <>
          <div 
            className="absolute inset-0 z-40 transition-opacity duration-700 pointer-events-auto"
            onClick={() => setReportDismissed(true)}
            style={{
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <InvestigationReportSheet
            answer={presentation.answer}
            error={presentation.error}
            findings={presentation.findings}
            providerUsed={presentation.providerUsed}
            query={activeInvestigation?.title || activeInvestigation?.query}
            onClose={() => setReportDismissed(true)}
            onRetryInvestigation={activeInvestigation ? () => onNewInvestigation(activeInvestigation.query || activeInvestigation.title, activeInvestigation.mode) : undefined}
          />
        </>
      )}

      {/* ── Collapsed Report Dock ── */}
      {activeInvestigation && sessionState !== SESSION_STATES.IDLE && isReadingComplete && reportDismissed && perspective !== 'branch' && (
        <div
          onClick={() => setReportDismissed(false)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
          style={{
            padding: '8px 16px',
            background: 'var(--cs-glass-float)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), var(--cs-inset-top)',
          }}
        >
          <span style={{ color: 'var(--cs-accent)', fontSize: '11px' }}>✦</span>
          <span style={{ fontSize: '12px', color: 'var(--cs-text)', fontWeight: 500 }}>
            {activeInvestigation.query || activeInvestigation.title || 'Investigation Report'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--cs-muted)' }}>
            · {presentation.findings?.length || 0} insights
          </span>
        </div>
      )}
    </div>
  );
}
