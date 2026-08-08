import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE } from '../../../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

// Panels
import InvestigationPanel from './InvestigationPanel';
import KnowledgePanel from './KnowledgePanel';
import AIOverlayEditor from './AIOverlayEditor';
import RepositoryReadyState from './RepositoryReadyState';
import InvestigationReportSheet from './InvestigationReportSheet';
import ArchitecturePerspective from './ArchitecturePerspective'; // Returns the graph canvas
import FileExplorer from '../../../../components/FileExplorer';
import UniversalCodeViewer from './shared/UniversalCodeViewer';

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
  fileCount
}) {
  const [reportDismissed, setReportDismissed] = useState(false);

  // Bug Fix: Reset reportDismissed when a new investigation starts
  useEffect(() => {
    if (activeInvestigation?.id) {
      setReportDismissed(false);
    }
  }, [activeInvestigation?.id]);
  // Ensure the report only appears after the orchestration queue is fully emptied (which includes the 1500ms silence phase)
  const isReadingComplete = (presentation.runtimeStatus === 'resolved' || Boolean(presentation.error)) && !orchestration.activeCognitiveEvent;
  const showReport = isReadingComplete && !reportDismissed;

  // File explorer derives active file exactly like it did in ExplorerPerspective
  const aiTouchedPaths = new Set(memoryFiles.map(m => m.file || m.name).filter(Boolean));
  const activeFilePath = presentation.userSelectedFile
    ? (typeof presentation.userSelectedFile === 'string' ? presentation.userSelectedFile : presentation.userSelectedFile.path)
    : null;

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
    <div className="flex-1 min-h-0 relative flex gap-[2px] bg-[var(--cs-bg)] overflow-hidden">

      {/* ── Left Panels (Investigation & Files — Perceived Continuity via Sliver) ── */}
      {perspective !== 'branch' && (
        <div className="flex h-full gap-[2px]">
          {/* Investigation (Timeline) Panel */}
          <div
            className="flex-shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: perspective === 'investigation' ? '18%' : '48px',
              minWidth: perspective === 'investigation' ? '260px' : '48px',
              maxWidth: perspective === 'investigation' ? '320px' : '48px',
              opacity: perspective === 'investigation' ? 1 : 0.4,
              borderRadius: '12px',
              background: 'var(--cs-panel)',
              border: '1px solid var(--cs-border)',
              boxShadow: 'var(--cs-shadow-panel)',
              overflow: 'hidden',
              cursor: perspective !== 'investigation' ? 'pointer' : 'default',
            }}
          >
            {/* Inner fixed width to prevent reflow squishing only if not context, else 48px */}
            <div style={{ width: '100%', height: '100%' }}>
              <InvestigationPanel
                timelineEvents={presentation.timelineEvents}
                planSteps={presentation.planSteps}
                startedAt={startedAt}
                memoryFiles={memoryFiles}
                repo={presentation.selectedRepo}
                activeInvestigation={activeInvestigation}
                onNewInvestigation={onNewInvestigation}
                isContext={perspective !== 'investigation'}
              />
            </div>
          </div>

          {/* Files (Memory Map) Panel */}
          <div
            className="flex-shrink-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: perspective === 'files' ? '18%' : '48px',
              minWidth: perspective === 'files' ? '260px' : '48px',
              maxWidth: perspective === 'files' ? '320px' : '48px',
              opacity: perspective === 'files' ? 1 : 0.4,
              borderRadius: '12px',
              background: 'var(--cs-panel)',
              border: '1px solid var(--cs-border)',
              boxShadow: 'var(--cs-shadow-panel)',
              overflow: 'hidden',
              cursor: perspective !== 'files' ? 'pointer' : 'default',
            }}
          >
            {/* Inner fixed width to prevent reflow squishing only if not context, else 48px */}
            <div style={{ width: '100%', height: '100%' }} className="flex flex-col">
              {perspective === 'files' && (
                <div className="px-8 flex items-center justify-between flex-shrink-0" style={{ height: '40px', borderBottom: '1px solid var(--cs-border)' }}>
                  <span style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    Memory Map
                  </span>
                  {memoryFiles.length > 0 && (
                    <div className="flex items-center gap-2" style={{ color: 'var(--cs-accent)', fontSize: '9px', fontFamily: 'var(--cs-mono)', opacity: 0.6 }}>
                      <span>{Object.values(presentation.aiMemoryMap || {}).filter(m => m.state === 'scanned').length} mapped</span>
                      <span>·</span>
                      <span>{Object.values(presentation.aiMemoryMap || {}).filter(m => m.state === 'investigated').length} read</span>
                      <span>·</span>
                      <span>{Object.values(presentation.aiMemoryMap || {}).filter(m => m.state === 'core').length} evidence</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <FileExplorer
                  repo={presentation.selectedRepo}
                  onFileSelect={presentation.onSelectFile}
                  aiMemoryMap={presentation.aiMemoryMap}
                  selectedPath={activeFilePath}
                  isContext={perspective !== 'files'}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Center Panel (Code Viewer or Architecture Graph) ── */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{
          borderRadius: '12px',
          background: 'var(--cs-panel)',
          boxShadow: 'var(--cs-shadow-panel)',
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
            />
          ) : (
            <div className="flex-1 flex flex-col min-w-0 h-full">
              {perspective === 'files' && activeFilePath && (
                <div
                  className="flex items-center gap-1 px-5 flex-shrink-0"
                  style={{ height: '36px', borderBottom: '1px solid var(--cs-border)' }}
                >
                  <AnimatePresence mode="wait">
                    {activeFilePath.split('/').filter(Boolean).map((segment, i, arr) => (
                      <React.Fragment key={`${activeFilePath}-${i}`}>
                        {i > 0 && (
                          <span style={{ color: 'var(--cs-hint)', fontSize: '10px', margin: '0 2px' }}>/</span>
                        )}
                        <motion.span
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.04, ease: [0.0, 0.0, 0.2, 1] }}
                          style={{
                            color: i === arr.length - 1 ? 'var(--cs-text)' : 'var(--cs-muted)',
                            fontSize: '11px',
                            fontFamily: 'var(--cs-mono)',
                            fontWeight: i === arr.length - 1 ? 600 : 400,
                          }}
                        >
                          {segment}
                        </motion.span>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>

                  {/* AI-touched badge */}
                  {aiTouchedPaths.has(activeFilePath) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                      className="ml-auto flex items-center gap-1.5"
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(62,168,255,0.08)',
                        border: '1px solid rgba(62,168,255,0.15)',
                      }}
                    >
                      <span style={{ color: 'var(--cs-accent)', fontSize: '9px' }}>✦</span>
                      <span style={{ color: 'var(--cs-accent)', fontSize: '9px', fontWeight: 500 }}>AI Read</span>
                    </motion.div>
                  )}
                </div>
              )}
              <UniversalCodeViewer
                activeTabId={activeFilePath || (perspective === 'investigation' ? (presentation.activeCognitiveEvent?.file || presentation.attention?.file) : undefined)}
                isAsset={presentation.isAsset}
                attention={presentation.attention}
                insight={presentation.insight}
                runtimeStatus={presentation.runtimeStatus}
                aiPhase="investigating"
                memoryFiles={enhancedMemoryFiles}
                orchestration={orchestration}
                answer={presentation.answer}
                activeInvestigation={activeInvestigation}
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
          borderRadius: '12px',
          background: 'var(--cs-panel)',
          boxShadow: 'var(--cs-shadow-panel)',
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
          selectedFile={presentation.userSelectedFile}
          selectedTimelineEventId={presentation.selectedTimelineEventId}
          onReturnToPresent={presentation.onReturnToPresent}
          isContext={false}
        />
      </div>

      {/* ── Report Sheet ── */}
      {showReport && perspective !== 'branch' && (
        <InvestigationReportSheet
          answer={presentation.answer}
          error={presentation.error}
          intelligenceStream={presentation.intelligenceStream}
          onClose={() => setReportDismissed(true)}
          onRetryInvestigation={activeInvestigation ? () => onNewInvestigation(activeInvestigation.query || activeInvestigation.title, activeInvestigation.mode) : undefined}
        />
      )}
    </div>
  );
}
