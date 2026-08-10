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
  onReturnToPresent,
  answer
}) {
  const activeFilePath = typeof selectedFile === 'string' ? selectedFile : selectedFile?.path;
  const activeFinding = activeFilePath ? findings.find(f => f.filePath === activeFilePath) : findings[findings.length - 1];

  const [panelState, setPanelState] = useState('dormant');
  const prevFindingsRef = React.useRef(findings.length);
  const executiveSummary = answer || `Investigation initialized for ${repo?.name?.split('/')?.pop() || 'this repository'}. Analyzing architectural patterns, component hierarchies, and cross-file dependencies to resolve the query. We will track key insights below.`;

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
      className="flex-1 overflow-hidden flex flex-col relative"
      style={{
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
      }}
    >
      {/* ── KNOWLEDGE Header ── */}
      <div
        className="flex-shrink-0"
        style={{
          paddingTop: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
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
      <div className="flex-shrink-0 flex flex-col gap-5" style={{ padding: '16px 20px 20px' }}>
        {/* REPOSITORY OVERVIEW */}
        <div>
          <div style={{ color: 'var(--cs-muted)', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: '5px', letterSpacing: '0.06em', opacity: 0.6 }}>REPOSITORY</div>
          <div className="text-[13px] font-bold text-[var(--cs-text)] truncate" style={{ opacity: 0.9 }}>{repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace'}</div>
          <div className="flex items-center gap-2 mt-1" style={{ color: 'var(--cs-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.45 }}>
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
            <div style={{ color: 'var(--cs-muted)', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-ui)', marginBottom: '5px', letterSpacing: '0.06em', opacity: 0.6 }}>NOW EXAMINING</div>
            {activeFinding.filePath && (
              <div className="flex flex-col gap-0.5 pb-1.5">
                <span className="text-[13px] font-bold text-[var(--cs-text)] truncate">
                  {activeFinding.filePath.split(/[\\/]/).pop()}
                </span>
                <span className="text-[10px] text-[var(--cs-muted)] font-mono" style={{ opacity: 0.5 }}>
                  lines {activeFinding.startLine}–{activeFinding.endLine}
                </span>
              </div>
            )}
            <div style={{ color: 'var(--cs-text)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6', marginTop: '4px', opacity: 0.65 }} className="line-clamp-3">
              {activeFinding.reason}
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Stream: Executive Summary & Key Findings ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-0" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ padding: '16px 16px 24px' }} className="flex flex-col gap-3">
          {findings?.length > 0 && (
            <div className="mb-4">
              <div style={{ color: 'var(--cs-text)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-ui)', opacity: 0.9, paddingLeft: '4px', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', opacity: 0.7 }}>📄</span> Executive summary
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6', paddingLeft: '4px' }} className="line-clamp-4">
                {executiveSummary}
              </div>
            </div>
          )}

          <div style={{ color: 'var(--cs-text)', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-ui)', opacity: 0.9, paddingLeft: '4px', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', opacity: 0.7 }}>☍</span> Key findings
          </div>
          
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {!findings || findings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-2 p-3"
                >
                  <div style={{ color: 'var(--cs-text)', opacity: 0.55, fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-ui)', lineHeight: '1.5' }}>
                    No investigation yet
                  </div>
                  <div style={{ color: 'var(--cs-faint)', fontSize: '12px', lineHeight: '1.5' }}>
                    The repository has been mapped.<br />
                    Ask a question to trace its reasoning.
                  </div>
                </motion.div>
              ) : findings.map((item, i) => {
                const isCardFocused = activeFinding?.sourceEventId === item.sourceEventId;
                if (isCardFocused) return null;

                return (
                  <motion.div
                    key={item.sourceEventId || i}
                    className="flex flex-col gap-2 cursor-pointer group"
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, opacity 180ms ease',
                      opacity: 0.75,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(191,200,216,0.18)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                      e.currentTarget.style.opacity = '1';
                      if (item.filePath) {
                        window.dispatchEvent(new CustomEvent('editor-highlight', { 
                          detail: { file: item.filePath, startLine: item.startLine, endLine: Math.min(item.endLine, item.startLine + 4), line: item.startLine } 
                        }));
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.opacity = '0.75';
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
                          detail: { file: item.filePath, startLine: item.startLine, endLine: Math.min(item.endLine, item.startLine + 4), line: item.startLine } 
                        }));
                      }
                    }}
                  >
                    {item.filePath && (
                      <div className="flex flex-col gap-0">
                        <span className="text-[12px] font-medium text-[var(--cs-text)] transition-colors truncate" style={{ opacity: 0.9 }}>
                          {item.filePath.split(/[\\/]/).pop()}
                        </span>
                        <span className="text-[10px] text-[var(--cs-muted)] font-mono" style={{ opacity: 0.5 }}>
                          lines {item.startLine}–{item.endLine}
                        </span>
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontFamily: 'var(--font-ui)', lineHeight: '1.55', marginTop: '2px' }} className="line-clamp-3">
                      {item.reason}
                    </div>
                    {item.filePath && (
                      <div style={{ color: 'var(--cs-muted)', fontSize: '10px', fontFamily: 'var(--font-ui)', fontStyle: 'italic', marginTop: '4px', opacity: 0.6 }}>
                        → Open in editor
                      </div>
                    )}
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
