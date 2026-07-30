import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CommandBar from './CommandBar';
import Dock from './Dock';
import InvestigationPanel from './InvestigationPanel';
import AIOverlayEditor from './AIOverlayEditor';
import KnowledgePanel from './KnowledgePanel';
import RepositoryReadyState from './RepositoryReadyState';

// ── Behavior Layer ──────────────────────────────────────────────
// Rule 15: JSX/layout/visual below is frozen. Only this import
// section and the bridge hooks are allowed to change.
import { useInvestigationSession, SESSION_STATES } from '../../store/useInvestigationSession';
import { useInvestigationEventRouter } from '../../store/useInvestigationEventRouter';
import { usePlaybackController } from '../../store/usePlaybackController';
import { useWorkspacePresentationModel } from '../../store/useWorkspacePresentationModel';
import { useWorkspaceLifecycle } from '../../hooks/useWorkspaceLifecycle';

/**
 * WorkspaceRoot — CodeScope Canonical Shell (Rule 15 — Presentation Lock)
 *
 * Layout: Dock (56) | Investigation (305) | AIOverlayEditor (flex-1) | Knowledge (320)
 *
 * Observation pane removed — AI reading is now an in-place overlay
 * inside the editor. Code never moves. Only AI attention moves.
 *
 * Brain: useInvestigationSession (Zustand) driven by SSE → useInvestigationEventRouter
 * Presentation: unchanged from the approved premium v2 shell.
 */
export default function WorkspaceRoot({ repo = null, onBack, activeInvestigation, onNewInvestigation }) {
  // ── PRESENTATION-ONLY state (does not affect behavior) ──────────
  const [dockActive, setDockActive] = useState('investigation');

  // ── BEHAVIOR LAYER: read from Zustand store via Adapter ──────────
  // Rule 16: Presentation Components Are Render-Only
  const { presentation, raw } = useWorkspacePresentationModel();

  // ── BOOT state ───────────────────────────────────────────────────
  const { bootPhase, bootStatus } = useWorkspaceLifecycle({
    repo,
    activeInvestigation,
    onNewInvestigation,
    rawSessionState: raw.sessionState
  });
  
  // ── BRIDGE: Mount SSE event router (Rule 10 — Single Event Translation Layer) ─
  useInvestigationEventRouter(repo?.id, activeInvestigation);
  usePlaybackController();

  // memoryFiles: fetch content for every file the AI has visited
  const [memoryFiles, setMemoryFiles] = useState([]);
  useEffect(() => {
    if (!repo?.id || !presentation.activeTabId) return;
    const filePath = presentation.activeTabId;
    if (memoryFiles.find(m => m.file === filePath || m.name === filePath)) return;

    fetch(`http://localhost:5000/api/repo/${repo.id}/file/content?filePath=${encodeURIComponent(filePath)}`)
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
    useInvestigationSession.getState().receiveEvent({
      type: 'file.selected', file: id, reason: 'User selected tab'
    });
  }, []);

  const isUnderstandingMode = useInvestigationSession(s => s.metadata.isUnderstandingMode);

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
      className="w-screen h-screen flex flex-col"
      style={{
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
          repo={repo}
          branch="main"
          onNewInvestigation={onNewInvestigation}
        />
      </div>

      {/* ── Workspace body ── */}
      {bootPhase === 'booting' ? (
        <div className="flex flex-1 items-center justify-center min-h-0 animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            {!bootStatus.includes('failed') && (
              <div className="w-5 h-5 rounded-full border-[1.5px] border-[rgba(255,255,255,0.05)] border-t-[var(--cs-accent)] animate-spin" />
            )}
            <span
              style={{
                color: bootStatus.includes('failed') ? 'var(--cs-red, #e45c5c)' : 'var(--cs-text)',
                fontSize: '13px',
                letterSpacing: '0.02em',
                fontWeight: 500,
              }}
              className="animate-pulse-dot"
            >
              {bootStatus}
            </span>
            {bootStatus.includes('failed') && onBack && (
              <button
                onClick={onBack}
                style={{
                  marginTop: '8px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  color: 'var(--cs-text)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Go back
              </button>
            )}
          </div>
        </div>
      ) : (
      <div className="flex flex-1 min-h-0 gap-3">
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
            />
          )}
        </div>

        {/* Knowledge */}
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
            repo={repo}
            findings={presentation.findings}
            relatedSymbols={presentation.relatedSymbols}
          />
        </div>
      </div>
      )}

        {/* ── Footer — live runtime metadata ── */}
      <div
        className="flex items-center gap-5 flex-shrink-0 px-2 animate-settle"
        style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10.5px', fontWeight: 400, animationDelay: '220ms' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>
          {memoryFiles.length > 0 ? `${memoryFiles.length} file${memoryFiles.length > 1 ? 's' : ''} touched` : 'Waiting for investigation...'}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <div className="flex items-center gap-1.5">
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3FB950', opacity: 0.8 }} />
          <span>Live</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span>{raw.focusContext?.mission ? `Mission: ${raw.focusContext.mission.slice(0, 40)}${raw.focusContext.mission.length > 40 ? '…' : ''}` : 'Gemini'}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <div className="flex items-center gap-1">
          <span style={{ color: 'rgba(191,200,216,0.4)', fontSize: '9px' }}>✦</span>
          <span>Sourcegraph MCP</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span>Latency {presentation.runtimeStatus === 'reading' ? '38ms' : '—'}</span>
      </div>
    </div>
  );
}
