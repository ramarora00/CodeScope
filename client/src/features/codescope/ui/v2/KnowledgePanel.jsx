import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KnowledgePanel({
  repo,
  fileCount = 0,
  findings = [],
  relatedSymbols = [],
  intelligenceStream = [],
  onNewInvestigation,
  selectedFile,
  selectedTimelineEventId,
  onReturnToPresent
}) {
  const activeFilePath = typeof selectedFile === 'string' ? selectedFile : selectedFile?.path;
  const activeFinding = activeFilePath ? findings.find(f => f.filePath === activeFilePath) : findings[findings.length - 1];

  const [panelState, setPanelState] = useState('dormant');
  const prevFindingsRef = React.useRef(findings.length);

  useEffect(() => {
    if (findings.length > prevFindingsRef.current) {
      setPanelState('receiving');
      const settlingTimer = setTimeout(() => setPanelState('settling'), 1000);
      const passiveTimer = setTimeout(() => setPanelState('passive'), 2500);
      prevFindingsRef.current = findings.length;
      return () => {
        clearTimeout(settlingTimer);
        clearTimeout(passiveTimer);
      };
    } else if (findings.length > 0) {
      if (panelState === 'dormant') setPanelState('passive');
    } else if (findings.length === 0) {
      setPanelState('watching');
    }
    prevFindingsRef.current = findings.length;
  }, [findings.length, panelState]);

  return (
    <div
      className="w-[340px] flex-shrink-0 bg-[var(--cs-panel)] border-r border-[var(--cs-border-subtle)] overflow-hidden flex flex-col relative"
      style={{
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
      }}
    >
      {/* ── KNOWLEDGE Header ── */}
      <div
        className="flex-shrink-0"
        style={{
          paddingTop: '24px',
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingBottom: '24px', // 20-24px to content
        }}
      >
        <span style={{
          color: 'var(--cs-text)',
          opacity: 0.6,
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'var(--font-ui)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}>
          Knowledge
          <span
            className="transition-colors duration-500"
            style={{
              color: panelState === 'receiving' ? 'var(--cs-accent)'
                : panelState === 'settling' ? 'rgba(62, 168, 255, 0.4)'
                  : panelState === 'watching' ? 'rgba(255,255,255,0.1)'
                    : 'transparent',
              fontStyle: 'normal',
              fontSize: '8px'
            }}
          >
            ●
          </span>
        </span>
      </div>

      {/* ── Pinned Top Section: NOW EXAMINING / REPO ── */}
      <div className="flex-shrink-0 flex flex-col gap-6" style={{ padding: '0 24px 24px' }}>
        {/* REPOSITORY OVERVIEW - Extremely Quiet */}
        <div>
          <div style={{ color: 'var(--cs-muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>Repository</div>
          <div className="text-[14px] font-bold text-[var(--cs-text)] truncate">{repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace'}</div>
          {/* Canonical metadata - single line */}
          <div className="flex items-center gap-2 mt-2" style={{ color: 'var(--cs-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span>{fileCount} files</span>
            {repo?.framework && (
              <>
                <span>·</span>
                <span>{repo.framework}</span>
              </>
            )}
          </div>
        </div>

        {/* NOW EXAMINING (If active finding exists) */}
        {activeFinding && (
          <div>
            <div style={{ color: 'var(--cs-muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>Now examining</div>
            {activeFinding.filePath && (
              <div className="flex flex-col gap-1 pb-2">
                <span className="text-[13px] font-bold text-[var(--cs-text)] truncate">
                  {activeFinding.filePath.split(/[\\/]/).pop()}
                </span>
                <span className="text-[10px] text-[var(--cs-muted)] font-mono">
                  lines {activeFinding.startLine}–{activeFinding.endLine}
                </span>
              </div>
            )}
            <div style={{ color: 'var(--cs-text)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6', marginTop: '4px' }} className="line-clamp-3">
              {activeFinding.reason}
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Stream: EVIDENCE HISTORY ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-0" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ padding: '24px' }} className="flex flex-col gap-8">
          <div style={{ color: 'var(--cs-muted)', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Evidence history</div>
          
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {!findings || findings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2"
                >
                  <div style={{ color: 'var(--cs-text)', opacity: 0.6, fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-ui)', lineHeight: '1.5' }}>
                    No investigation yet
                  </div>
                  <div style={{ color: 'var(--cs-faint)', fontSize: '12px', lineHeight: '1.5' }}>
                    The repository has been mapped.<br />
                    Ask a question to trace its reasoning.
                  </div>
                  <div className="mt-4 flex flex-col gap-2" style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
                    <div>→ Explore dependencies</div>
                    <div>→ Explain a flow</div>
                    <div>→ Generate tests</div>
                  </div>
                </motion.div>
              ) : findings.map((item, i) => {
                const isCardFocused = activeFinding?.sourceEventId === item.sourceEventId;
                if (isCardFocused) return null; // Don't show the currently examining item in history to avoid duplication

                return (
                  <motion.div
                    key={item.sourceEventId || i}
                    className="flex flex-col gap-2 cursor-pointer transition-all duration-300 group"
                    style={{
                      opacity: 0.65,
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingTop: '8px',
                      paddingBottom: '8px',
                      marginLeft: '-16px',
                      width: 'calc(100% + 32px)',
                      borderLeft: '2px solid transparent',
                      borderRadius: '4px',
                      transition: 'opacity 200ms ease, background 180ms ease, border-color 180ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.opacity = '1.0';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderLeftColor = 'rgba(191,200,216,0.35)';
                      if (item.filePath) {
                        window.dispatchEvent(new CustomEvent('editor-highlight', { 
                          detail: { file: item.filePath, line: item.startLine } 
                        }));
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.opacity = '0.65';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                      window.dispatchEvent(new CustomEvent('editor-highlight', { detail: null }));
                    }}
                    onClick={() => {
                      if (item.filePath) {
                        const name = item.filePath.split(/[\\/]/).pop();
                        const wsStore = window.__workspace_store__ || require('../../store/useWorkspaceStore').useWorkspaceStore;
                        if (wsStore) {
                          wsStore.getState().setUserSelectedFile({ name, path: item.filePath, type: 'file' });
                        }
                        window.dispatchEvent(new CustomEvent('editor-highlight', { 
                          detail: { file: item.filePath, line: item.startLine } 
                        }));
                      }
                    }}
                  >
                    {item.filePath && (
                      <div className="flex flex-col gap-0">
                        <span className="text-[13px] font-medium text-[var(--cs-text)] transition-colors truncate">
                          {item.filePath.split(/[\\/]/).pop()}
                        </span>
                        <span className="text-[10px] text-[var(--cs-muted)] font-mono group-hover:text-[var(--cs-muted)] transition-colors">
                          lines {item.startLine}–{item.endLine}
                        </span>
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6' }} className="group-hover:text-[rgba(255,255,255,0.9)] transition-colors line-clamp-3">
                      {item.reason}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
