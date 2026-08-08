import React, { useState, useEffect, useCallback } from 'react';
import CommandBar from './CommandBar';
import MacOSTitleBar from './MacOSTitleBar';
import Dock from './Dock';
import PerspectiveRouter from './PerspectiveRouter';
import { API_BASE } from '../../../../config/api';
import TransitionWrapper from './shared/TransitionWrapper';

// ── Behavior Layer ──────────────────────────────────────────────
import { useInvestigationSession, SESSION_STATES } from '../../store/useInvestigationSession';
import { useInvestigationEventRouter } from '../../store/useInvestigationEventRouter';
import { usePlaybackController } from '../../store/usePlaybackController';
import { useWorkspacePresentationModel } from '../../store/useWorkspacePresentationModel';
import { useWorkspaceLifecycle } from '../../hooks/useWorkspaceLifecycle';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import RepositoryReadingExperience from './RepositoryReadingExperience';

export default function WorkspaceRoot({ onBack, activeInvestigation, onNewInvestigation }) {
  const { selectedRepo: repo } = useWorkspaceStore();
  
  // ── PRESENTATION-ONLY state (does not affect behavior) ──────────
  const [dockActive, setDockActive] = useState('investigation');

  // ── BEHAVIOR LAYER: read from Zustand store via Adapter ──────────
  const { presentation, raw, orchestration } = useWorkspacePresentationModel();

  // ── BOOT state ───────────────────────────────────────────────────
  const { bootPhase, bootStatus, currentFile, currentLine, currentContent } = useWorkspaceLifecycle({
    repo,
    activeInvestigation,
    onNewInvestigation,
    rawSessionState: raw.sessionState
  });
  
  useInvestigationEventRouter(repo?.id, activeInvestigation);
  usePlaybackController();
  
  // ── Global Graph Data (Loaded once per repo) ──
  const setFileTree = useWorkspaceStore(s => s.setFileTree);
  const fileTree = useWorkspaceStore(s => s.fileTree);
  
  useEffect(() => {
    if (!repo?.id) return;
    if (fileTree.length > 0) return; // Already loaded
    if (bootPhase === 'booting') return; // Wait until repo is ready
    
    const fetchFiles = () => {
      fetch(`${API_BASE}/api/repo/${repo.id}/files`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFileTree(data);
          else throw new Error('Invalid file tree data');
        })
        .catch(err => {
          console.error('[WorkspaceRoot] Failed to load files, retrying...', err);
          setTimeout(fetchFiles, 2000);
        });
    };
    fetchFiles();
  }, [repo?.id, fileTree.length, setFileTree, bootPhase]);

  // memoryFiles: fetch content for every file the AI has visited
  const [memoryFiles, setMemoryFiles] = useState([]);
  useEffect(() => {
    if (!repo?.id || !presentation.activeTabId) return;
    const filePath = presentation.activeTabId;
    
    if (memoryFiles.find(m => m.file === filePath || m.name === filePath)) return;

    fetch(`${API_BASE}/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => {
        setMemoryFiles(prev => {
          if (prev.find(f => f.file === filePath)) return prev;
          return [...prev, {
            name: filePath,
            file: filePath,
            content: data.content || '',
            language: filePath.endsWith('.ts') ? 'typescript' : 'javascript',
          }];
        });
      })
      .catch(err => console.error('[WorkspaceRoot] File fetch error:', err));
  }, [presentation.activeTabId, repo?.id]);

  // startedAt for the elapsed timer in InvestigationPanel
  const [startedAt, setStartedAt] = useState(null);
  useEffect(() => {
    if (raw.sessionState === SESSION_STATES.PLAYING && !startedAt) {
      setStartedAt(Date.now());
    }
  }, [raw.sessionState]);

  // Reset memory files and startedAt when repo changes
  useEffect(() => {
    setMemoryFiles([]);
    setStartedAt(null);
  }, [repo?.id]);

  const handleSelectTab = useCallback(id => {
    // User explicitly clicked a tab → write to userSelectedFile, not AI session
    useWorkspaceStore.getState().setUserSelectedFile({ name: id.split(/[\\/]/).pop(), path: id, type: 'file' });
  }, []);

  const isUnderstandingMode = presentation.isUnderstandingMode;

  const handleCloseTab = useCallback(id => {
    // Tab close is presentation-only; we don't purge events from the store
    setMemoryFiles(prev => prev.filter(m => m.file !== id && m.name !== id));
  }, []);

  // ── JSX: FROZEN — Rule 15 Presentation Lock ──────────────────────
  // Do NOT modify layout, spacing, borderRadius, animationDelay,
  // panel widths, or component hierarchy below this line without
  // explicit user approval.
  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        background: '#09090B',
        padding: '16px 20px',
        gap: '12px',
      }}
    >
      {/* ── Command Bar ── */}
      <div
        className="animate-settle flex-shrink-0"
        style={{
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          animationDelay: '0ms',
        }}
      >
        <CommandBar
          branch="main"
          onNewInvestigation={onNewInvestigation}
        />
      </div>

      {/* ── Workspace body ── */}
      <TransitionWrapper transitionKey={bootPhase === 'booting' ? 'booting' : 'workspace'}>
        {bootPhase === 'booting' ? (
          <RepositoryReadingExperience
            bootStatus={bootStatus}
            currentFile={currentFile}
            currentLine={currentLine}
            currentContent={currentContent}
          />
        ) : (
          <div className="flex flex-1 min-h-0 gap-3 w-full h-full">
        {/* Dock */}
        <div
          className="animate-settle flex-shrink-0"
          style={{
            borderRadius: '12px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
            boxShadow: 'var(--cs-shadow-panel)',
            overflow: 'hidden',
            animationDelay: '60ms',
          }}
        >
          <Dock activeItem={dockActive} onSelect={setDockActive} />
        </div>
        {/* Perspective Router handles the main body */}
        <PerspectiveRouter
          perspective={dockActive}
          bootPhase={bootPhase}
          activeInvestigation={activeInvestigation}
          isUnderstandingMode={isUnderstandingMode}
          presentation={presentation}
          orchestration={orchestration}
          handleSelectTab={handleSelectTab}
          handleCloseTab={handleCloseTab}
          memoryFiles={memoryFiles}
          startedAt={startedAt}
          onNewInvestigation={onNewInvestigation}
          fileCount={fileTree.length}
        />
        </div>
        )}
      </TransitionWrapper>

        {/* ── Footer — live runtime metadata ── */}
      <div
        className="flex items-center gap-2 flex-shrink-0 px-2 animate-settle"
        style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10.5px', fontWeight: 400, animationDelay: '300ms' }}
      >
        {raw.isAiActive ? (
          <div className="w-1.5 h-1.5 bg-[var(--cs-accent)] rounded-full animate-pulse-dot" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        )}
        <span>
          {raw.isAiActive ? 'Reading' : raw.runtimeStatus === 'resolved' ? 'Analysis Complete' : 'Idle'}
          {raw.isAiActive && presentation.activeTabId && ` · ${presentation.activeTabId.split(/[\\/]/).pop()}`}
          {(raw.isAiActive || raw.runtimeStatus === 'resolved') && ` · evidence ${presentation.intelligenceStream?.length || 0}`}
        </span>
      </div>
    </div>
  );
}
