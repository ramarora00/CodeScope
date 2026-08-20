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
  const executiveSummary = answer || `Investigation initialized for ${repo?.name?.split('/')?.pop() || 'this repository'}. Analyzing architectural patterns, component hierarchies, and cross-file dependencies to resolve the query.`;

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
      style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease' }}
    >
      {/* ── KNOWLEDGE Header ── */}
      <div
        className="flex-shrink-0"
        style={{
          paddingTop: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          fontWeight: 700,
          fontStyle: 'italic',
          fontFamily: 'var(--font-ui)',
          letterSpacing: '0.10em',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
        }}>
          KNOWLEDGE
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

      {/* ── Pinned Top Section: REPO / NOW EXAMINING ── */}
      <div className="flex-shrink-0 flex flex-col gap-5" style={{ padding: '16px 20px 20px' }}>
        {/* REPOSITORY OVERVIEW */}
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, fontStyle: 'italic', fontFamily: 'var(--font-ui)', marginBottom: '6px', letterSpacing: '0.10em' }}>REPOSITORY</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-ui)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span>{fileCount} files</span>
            {repo?.framework && (<><span>·</span><span>{repo.framework}</span></>)}
          </div>
        </div>

        {/* NOW EXAMINING */}
        {activeFinding && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, fontStyle: 'italic', fontFamily: 'var(--font-ui)', marginBottom: '6px', letterSpacing: '0.10em' }}>NOW EXAMINING</div>
            <div style={{
              borderLeft: '2px solid rgba(255,255,255,0.9)',
              background: 'linear-gradient(90deg, rgba(140,190,255,0.06) 0%, transparent 60%)',
              padding: '6px 0 6px 12px',
              marginLeft: '-14px',
              borderTopRightRadius: '4px',
              borderBottomRightRadius: '4px',
            }}>
              {activeFinding.filePath && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-ui)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeFinding.filePath.split(/[/\\]/).pop()}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.35)' }}>
                    Lines {activeFinding.startLine}–{activeFinding.endLine}
                  </span>
                </div>
              )}
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6', marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {activeFinding.reason}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable: Executive Summary + Key Findings ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Executive Summary — only when investigation has findings */}
          {findings?.length > 0 && (
            <div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, fontStyle: 'italic', fontFamily: 'var(--font-ui)', letterSpacing: '0.10em', marginBottom: '8px' }}>
                EXECUTIVE SUMMARY
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.65', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {executiveSummary}
              </div>
            </div>
          )}

          {/* Key Findings header */}
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: 700, fontStyle: 'italic', fontFamily: 'var(--font-ui)', letterSpacing: '0.10em' }}>
              KEY FINDINGS
            </div>
            {findings?.length > 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: 'var(--font-ui)', marginTop: '2px' }}>
                Accumulated evidence
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence initial={false}>
              {!findings || findings.length === 0 ? (
                <motion.div key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontFamily: 'var(--font-ui)', lineHeight: '1.6' }}>
                    The repository has been mapped.<br />
                    Ask a question to trace its reasoning.
                  </div>
                  {/* Glass action chips — Option A: real triggers */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'Explore dependencies', query: 'Show me the dependency relationships of this repository' },
                      { label: 'Explain a flow', query: 'Explain the main execution flow of this codebase' },
                      { label: 'Generate tests', query: 'What test cases should be written for this repository' },
                    ].map(action => (
                      <button
                        key={action.label}
                        onClick={() => onNewInvestigation?.(action.query)}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '9px 12px',
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: '12px',
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 160ms ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                        }}
                      >
                        <span style={{ color: 'var(--cs-accent)', opacity: 0.7, fontSize: '10px', flexShrink: 0 }}>→</span>
                        {action.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : findings.map((item, i) => {
                const isCardFocused = activeFinding?.sourceEventId === item.sourceEventId;
                if (isCardFocused) return null;

                return (
                  <motion.div
                    key={item.sourceEventId || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.04, 0.2) }}
                    className="group"
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      background: 'transparent',
                      transition: 'background 180ms ease, border-color 180ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    {item.filePath && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-ui)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.filePath.split(/[/\\]/).pop()}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cs-accent)', flexShrink: 0, background: 'rgba(99,170,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            L{item.startLine}–L{item.endLine}
                          </span>
                        </div>
                      </div>
                    )}
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontFamily: 'var(--font-ui)', lineHeight: '1.55', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.reason}
                    </div>
                    {item.filePath && (
                      <div style={{ color: 'var(--cs-accent)', fontSize: '10px', fontWeight: 500, fontFamily: 'var(--font-ui)', opacity: 0.5, transition: 'opacity 150ms ease', marginTop: '2px' }}
                        className="group-hover:opacity-100"
                      >
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
