import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, GitBranch, Workflow, TestTube, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTIONS = [
  { id: 'dep-map', icon: GitBranch, label: 'View dependency map' },
  { id: 'explain', icon: Workflow, label: 'Explain this flow' },
  { id: 'tests', icon: TestTube, label: 'Generate test cases' },
];

function SectionHeader({ label }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <span style={{
        color: 'rgba(255,255,255,0.07)',
        fontSize: '8.5px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

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
  isContext
}) {
  // Removed askQuery state since input surface is now centralized in Top Bar
  const [activeTab, setActiveTab] = useState('repository'); // 'repository' or 'investigation'

  const activeFilePath = typeof selectedFile === 'string' ? selectedFile : selectedFile?.path;
  const displayFindings = activeFilePath
    ? findings.filter(f => f.filePath === activeFilePath)
    : findings;

  const handleAction = (id) => {
    console.log(`KnowledgePanel action clicked: ${id}`);
  };

  // Removed handleAsk

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
    } else if (findings.length === 0 && !isContext) {
      setPanelState('watching');
    }
    prevFindingsRef.current = findings.length;
  }, [findings.length, isContext]);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] relative"
      style={{
        width: isContext ? '220px' : '310px',
        opacity: isContext ? 0.4 : 1,
        background: 'var(--cs-panel)',
      }}
    >
      {/* ── Header with Tabs ── */}
      <div
        className="flex flex-col flex-shrink-0"
      >
        <div className="flex items-center justify-between px-5" style={{ height: '40px' }}>
          <span style={{
            color: 'var(--cs-faint)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Knowledge
            {!isContext && (
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
            )}
          </span>
        </div>
      </div>

      {/* ── Context State (Minimalist) ── */}
      {isContext ? (
        <div className="flex-1 flex flex-col p-4 gap-6 animate-fade-in opacity-80 overflow-y-auto no-scrollbar">
          {/* Minimal Repository Summary */}
          <div className="flex flex-col gap-2 border-b pb-4" style={{ borderColor: 'var(--cs-border)' }}>
            <span style={{ color: 'var(--cs-hint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Repo Context
            </span>
            <span className="text-[11px] font-mono font-bold text-[var(--cs-text)] truncate">{repo?.name?.replace(/-\d{10,}$/, '') || 'Workspace'}</span>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--cs-muted)] font-mono">
              {repo?.framework && (
                <>
                  <span className="truncate">{repo.framework}</span>
                  <span>·</span>
                </>
              )}
              <span>{fileCount} files</span>
            </div>
          </div>

          {/* Minimal Findings */}
          <div className="flex flex-col gap-3 border-b pb-4" style={{ borderColor: 'var(--cs-border)' }}>
            <span style={{ color: 'var(--cs-hint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Findings
            </span>
            <div className="flex items-center gap-2 text-[11px] text-[var(--cs-muted)] font-mono">
              <span className="w-2 h-2 rounded-full bg-[var(--cs-accent)] opacity-50"></span>
              {displayFindings.length} active findings
            </div>
          </div>

          {/* Minimal Related Symbols */}
          <div className="flex flex-col gap-3">
            <span style={{ color: 'var(--cs-hint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Related Symbols
            </span>
            <div className="flex items-center gap-2 text-[11px] text-[var(--cs-muted)] font-mono">
              <span className="w-2 h-2 rounded-full border border-[var(--cs-hint)]"></span>
              {relatedSymbols.length} referenced
            </div>
          </div>
        </div>
      ) : (
        /* ── Hero State: Single Stream ── */
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          <div style={{ padding: '32px 32px' }} className="flex flex-col gap-8 animate-fade-in">

            {/* ── REPOSITORY OVERVIEW ── */}
            <div>
              <div style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Repository</div>
              <div className="text-[13px] font-bold text-[var(--cs-text)] font-mono truncate">{repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace'}</div>
              {repo?.repositorySummary && (
                <div style={{ lineHeight: '1.6', marginTop: '8px' }} className="text-[12px] text-[var(--cs-muted)] italic">
                  {repo.repositorySummary}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4">
                <span style={{ color: 'var(--cs-hint)', fontSize: '12px', fontFamily: 'var(--cs-mono)' }}>{fileCount} files</span>
                {repo?.framework && <span style={{ color: 'var(--cs-hint)', fontSize: '12px', fontFamily: 'var(--cs-sans)' }}>{repo.framework}</span>}
              </div>
            </div>

            {/* Divider (spacing not border) */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.03)' }} />

            {/* ── UNDERSTANDING ── */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {!intelligenceStream || intelligenceStream.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center p-6 rounded-lg mt-2"
                    style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ color: 'var(--cs-faint)', fontSize: '12px', textAlign: 'center' }}>No intelligence collected yet.</div>
                  </motion.div>
                ) : intelligenceStream.map((item, i) => (
                  <motion.div
                    key={item.id || i}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      x: { ease: [0.2, 0.0, 0.0, 1.0], duration: 0.2, delay: i * 0.08 + 0.5 },
                      opacity: { duration: 0.2, delay: i * 0.08 + 0.5 },
                    }}
                    className="flex flex-col gap-3 rounded-lg cursor-pointer transition-all duration-300"
                    style={{
                      padding: '12px 16px',
                      background: 'transparent',
                      borderTop: '1px solid rgba(255,255,255,0.015)',
                      opacity: item.active ? 1.0 : 0.45,
                      borderRadius: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                      if (item.source) window.dispatchEvent(new CustomEvent('editor-highlight', { detail: { file: item.source, line: 1 } }));
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.02)';
                      window.dispatchEvent(new CustomEvent('editor-highlight', { detail: null }));
                    }}
                  >
                    {item.source && (
                      <div className="flex flex-col gap-1 pb-2 mb-1" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-[13px] font-bold text-[var(--cs-accent)] font-mono truncate">
                          {typeof item.source === 'string' ? item.source.split(/[\\/]/).pop() : item.source.file.split(/[\\/]/).pop()}
                        </span>
                        {typeof item.source !== 'string' && item.source.line && (
                          <span className="text-[10px] text-[var(--cs-muted)] font-mono">
                            line {item.source.line}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <span style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {item.type || 'Evidence'}
                      </span>
                      <span style={{ color: item.active ? 'var(--cs-text)' : 'rgba(255,255,255,0.7)', fontSize: '12px', fontFamily: 'var(--cs-sans)', lineHeight: '1.6' }}>
                        {item.text}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <div className="space-y-2">
              {ACTIONS.map(action => (
                <div
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="flex items-center gap-3 cursor-pointer transition-colors duration-[220ms] group"
                  style={{ height: '40px', padding: '0 12px', borderRadius: '8px', background: 'transparent', opacity: 0.6 }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.opacity = 1.0;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.opacity = 0.6;
                  }}
                >
                  <action.icon size={12} style={{ color: 'var(--cs-hint)' }} className="group-hover:text-[var(--cs-faint)] transition-colors" />
                  <span style={{ color: 'var(--cs-muted)', fontSize: '13px', transition: 'color 150ms ease' }} className="group-hover:text-[var(--cs-text)]">
                    {action.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
