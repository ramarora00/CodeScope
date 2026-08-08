import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileExplorer from '../../../../components/FileExplorer';
import UniversalCodeViewer from './shared/UniversalCodeViewer';
import KnowledgePanel from './KnowledgePanel';
import { API_BASE } from '../../../../config/api';

/**
 * ExplorerPerspective — Sprint 3: AI Explorer
 * 
 * Experience Goal: User browses the file tree and feels that the AI 
 * has already been here. Files touched by the investigation are subtly 
 * marked, and selecting a file immediately scopes the Knowledge Panel
 * to that file's evidence.
 * 
 * Pure layout component. No Zustand access. All state via presentation prop.
 */
export default function ExplorerPerspective({ onNewInvestigation, presentation }) {
  const repo = presentation.selectedRepo;
  const selectedFile = presentation.userSelectedFile;
  const setSelectedFile = presentation.onSelectFile;
  const memoryFiles = presentation.memoryFiles || [];
  const [fetchedContent, setFetchedContent] = useState({ path: null, content: null });

  // Build the set of AI-touched file paths from memoryFiles
  const aiTouchedPaths = new Set(memoryFiles.map(m => m.file || m.name).filter(Boolean));

  // Derive the file path for the active file
  const activeFilePath = selectedFile
    ? (typeof selectedFile === 'string' ? selectedFile : selectedFile.path)
    : null;

  // Alias for passing to FileExplorer
  const selectedFilePath = activeFilePath;

  // Find file content from memoryFiles if available
  const activeMemoryFile = memoryFiles.find(
    m => m.file === activeFilePath || m.name === activeFilePath
  );

  // Fetch file content from backend if not in memoryFiles
  useEffect(() => {
    if (!activeFilePath || activeMemoryFile || !repo?.id) return;
    if (fetchedContent.path === activeFilePath) return; // Already fetched

    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(activeFilePath)}`);
        const data = await res.json();
        setFetchedContent({ path: activeFilePath, content: data.content || '// Empty file' });
      } catch (err) {
        console.error('[ExplorerPerspective] Failed to fetch file content:', err);
        setFetchedContent({ path: activeFilePath, content: '// Failed to load content' });
      }
    };
    fetchContent();
  }, [activeFilePath, activeMemoryFile, repo?.id]);

  // Resolve the file to pass to UniversalCodeViewer
  const resolvedMemoryFile = activeMemoryFile || (
    activeFilePath && fetchedContent.path === activeFilePath
      ? { name: activeFilePath.split('/').pop(), file: activeFilePath, content: fetchedContent.content || '// Loading...' }
      : null
  );

  // Build tabs from selected file
  const tabs = activeFilePath
    ? [{ id: activeFilePath, name: activeFilePath.split('/').pop(), path: activeFilePath }]
    : [];

  // Build breadcrumb segments from the active file path
  const breadcrumbSegments = activeFilePath
    ? activeFilePath.split('/').filter(Boolean)
    : [];

  return (
    <div className="flex-1 flex min-h-0 bg-[var(--cs-bg)] gap-[2px]">
      {/* File Tree Panel */}
      <div 
        className="w-[280px] flex-shrink-0 bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle"
        style={{ animationDelay: '100ms' }}
      >
        <div className="px-5 flex items-center justify-between" style={{ height: '40px', borderBottom: '1px solid var(--cs-border)' }}>
          <span style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Explorer
          </span>
          {memoryFiles.length > 0 && (
            <span style={{ 
              color: 'var(--cs-accent)', 
              fontSize: '9px', 
              fontFamily: 'var(--cs-mono)',
              opacity: 0.6
            }}>
              {memoryFiles.length} AI-touched
            </span>
          )}
        </div>
        <div className="overflow-y-auto no-scrollbar" style={{ height: 'calc(100% - 40px)' }}>
          <div className="p-2">
            <FileExplorer
              repo={repo}
              onFileSelect={setSelectedFile}
              aiTouchedPaths={aiTouchedPaths}
              selectedPath={selectedFilePath}
            />
          </div>
        </div>
      </div>
      
      {/* Code Viewer Panel — uses UniversalCodeViewer instead of FileViewer */}
      <div 
        className="flex-1 flex flex-col bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle min-w-0"
        style={{ animationDelay: '140ms' }}
      >
        {activeFilePath ? (
          <>
            {/* Animated Breadcrumb */}
            <div 
              className="flex items-center gap-1 px-5 flex-shrink-0"
              style={{ height: '36px', borderBottom: '1px solid var(--cs-border)' }}
            >
              <AnimatePresence mode="wait">
                {breadcrumbSegments.map((segment, i) => (
                  <React.Fragment key={`${activeFilePath}-${i}`}>
                    {i > 0 && (
                      <span style={{ color: 'var(--cs-hint)', fontSize: '10px', margin: '0 2px' }}>/</span>
                    )}
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.15,
                        delay: i * 0.04,
                        ease: [0.0, 0.0, 0.2, 1]
                      }}
                      style={{
                        color: i === breadcrumbSegments.length - 1 ? 'var(--cs-text)' : 'var(--cs-muted)',
                        fontSize: '11px',
                        fontFamily: 'var(--cs-mono)',
                        fontWeight: i === breadcrumbSegments.length - 1 ? 600 : 400,
                      }}
                    >
                      {segment}
                    </motion.span>
                  </React.Fragment>
                ))}
              </AnimatePresence>

              {/* AI-touched badge */}
              {activeMemoryFile && (
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

            {/* Code content via UniversalCodeViewer */}
            <div className="flex-1 min-h-0">
              <UniversalCodeViewer
                tabs={tabs}
                activeTabId={activeFilePath}
                onSelectTab={() => {}}
                onCloseTab={() => {}}
                attention={{}}
                runtimeStatus="idle"
                memoryFiles={
                  resolvedMemoryFile
                    ? [resolvedMemoryFile]
                    : [{ name: activeFilePath.split('/').pop(), file: activeFilePath, content: '// Loading file content...' }]
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div 
              className="w-12 h-12 rounded-xl border border-dashed flex items-center justify-center"
              style={{ borderColor: 'var(--cs-border)' }}
            >
              <span style={{ color: 'var(--cs-hint)', fontSize: '20px' }}>+</span>
            </div>
            <div className="text-center">
              <div style={{ color: 'var(--cs-muted)', fontSize: '12px', fontWeight: 500 }}>Select a file to view</div>
              <div style={{ color: 'var(--cs-hint)', fontSize: '10px', marginTop: '4px' }}>
                Files touched by AI are marked with ✦
              </div>
            </div>
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
