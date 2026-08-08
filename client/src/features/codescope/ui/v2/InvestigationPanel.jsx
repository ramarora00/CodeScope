import React, { useState, useEffect, useRef } from 'react';
import { Check, Send } from 'lucide-react';
import { API_BASE } from '../../../../config/api';
import { motion, AnimatePresence } from 'framer-motion';

function ElapsedTimer({ startedAt }) {
  const [elapsed, setElapsed] = useState('00:00');
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(`${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span style={{ color: 'var(--cs-hint)', fontFamily: 'var(--cs-mono)', fontSize: '9px' }}>
      {elapsed}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// TIMELINE ENTRY — Parent/child hierarchy, no borders, no overlap
// ─────────────────────────────────────────────────────────────────
function TimelineEntry({ entry, isActive, memoryFiles }) {
  return (
    <div style={{ marginBottom: isActive ? '24px' : '14px', paddingLeft: '8px' }}>
      <div
        className="flex items-start gap-2"
        style={{ minHeight: '26px' }}
      >
        <span style={{
          color: 'rgba(255,255,255,0.2)',
          fontSize: '11px',
          fontFamily: 'var(--cs-mono)',
          flexShrink: 0,
          width: '36px',
          lineHeight: 1.6,
        }}>
          {entry.timestamp}
        </span>
        <div className="flex-shrink-0" style={{ paddingTop: '5px', width: '11px', display: 'flex', justifyContent: 'center' }}>
          {isActive && (
            <div className="w-[11px] h-[11px] flex items-center justify-center">
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--cs-accent)' }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0" style={{ paddingTop: '1px' }}>
          <span style={{
            color: isActive ? 'var(--cs-text)' : 'rgba(255, 255, 255, 0.4)',
            fontSize: '13px',
            fontWeight: isActive ? 500 : 400,
            display: 'block',
            lineHeight: 1.5,
          }}>
            {entry.label}
          </span>
          {entry.sublabel && !isActive && (
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', display: 'block', marginTop: '6px', lineHeight: 1.4 }}>
              {entry.sublabel}
            </span>
          )}
        </div>
      </div>

      {/* Active: compact hierarchical block — one logical unit, no floating labels */}
      {isActive && (
        <div className="animate-fade-in" style={{ marginTop: '12px', paddingLeft: '47px' }}>
          {/* Single block — all fields in visual flow, tightly packed */}
          <div style={{
            borderLeft: '1px solid rgba(255,255,255,0.04)',
            paddingLeft: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {entry.insight && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                  Finding
                </div>
                <div style={{ color: 'var(--cs-text)', fontSize: '13px', lineHeight: 1.6 }}>
                  {entry.insight}
                </div>
              </div>
            )}
            {entry.next && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                  Next
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.6 }}>
                  {entry.next}
                </div>
              </div>
            )}
            {entry.then && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
                  Then
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.6 }}>
                  {entry.then}
                </div>
              </div>
            )}
            {memoryFiles.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                  Memory
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {memoryFiles.map((f, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-1.5 cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 py-0.5" 
                      style={{ paddingLeft: '4px' }}
                      onMouseEnter={() => {
                        if (f.file) {
                           window.dispatchEvent(new CustomEvent('editor-highlight', { detail: { file: f.file, line: f.line || 1 } }));
                        }
                      }}
                      onMouseLeave={() => {
                        window.dispatchEvent(new CustomEvent('editor-highlight', { detail: null }));
                      }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '8px' }}>↳</span>
                      <span style={{ color: 'rgba(191,200,216,0.45)', fontSize: '12px', fontFamily: 'var(--cs-mono)' }}>
                        {f.file}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// INVESTIGATION PANEL — 305px, ~15% compressed vs previous
// ─────────────────────────────────────────────────────────────────
export default function InvestigationPanel({ timelineEvents = [], planSteps = [], startedAt, memoryFiles = [], repo, activeInvestigation, onNewInvestigation, isContext }) {
  const bottomRef = useRef(null);

  const repoName = repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace';
  const title = activeInvestigation?.title || (activeInvestigation?.mode === 'understanding' ? `Exploring ${repoName}` : 'Investigation');

  const completedSteps = planSteps.filter(s => s.done).length;

  useEffect(() => {
    if (!isContext) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [timelineEvents.length, isContext]);

  // Removed handleAsk

  // Law of Representation: Context Level
  if (isContext) {
    return (
      <div className="flex flex-col items-center h-full pt-8 pb-4 border-r border-transparent hover:bg-white/[0.02] transition-colors w-[48px]">
        {/* minimalist vertical progress line */}
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: 'var(--cs-faint)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '32px', opacity: 0.8 }}>
          Timeline
        </div>
        
        <div className="flex-1 flex flex-col items-center w-full relative">
          <div className="absolute top-0 bottom-0 w-[1px] bg-[var(--cs-border)]" style={{ opacity: 0.5 }} />
          {planSteps.map((step, i) => {
             const topOffset = planSteps.length > 1 ? (i / (planSteps.length - 1)) * 100 : 50;
             return (
               <div key={step.id} className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: `calc(${topOffset}% - 3px)` }}>
                  <div style={{ 
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: step.done ? 'var(--cs-green)' : step.active ? 'var(--cs-text)' : 'var(--cs-border)'
                  }} />
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  // Law of Representation: Hero/Supporting Level
  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '330px',
        background: 'var(--cs-panel)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-8"
        style={{ height: '60px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
      >
        <span style={{
          color: 'var(--cs-faint)',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}>
          Investigation
        </span>
        <div className="flex items-center gap-3">
          {activeInvestigation && activeInvestigation.status !== 'completed' && activeInvestigation.status !== 'failed' && activeInvestigation.status !== 'cancelled' && (
            <button
              onClick={() => {
                if (!repo?.id) return;
                fetch(`${API_BASE}/api/repo/${repo.id}/investigate`, {
                  method: 'DELETE'
                }).catch(console.error);
              }}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Stop Investigation"
            >
              <div style={{ width: '6px', height: '6px', background: '#EF4444', borderRadius: '1px' }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Query ── */}
      <div style={{ padding: '24px 32px 16px' }} className="flex-shrink-0">
        <p style={{
          color: 'var(--cs-text)',
          fontSize: '15px',
          fontWeight: 500,
          lineHeight: 1.5,
        }}>
          {title}
        </p>
      </div>

      {/* ── Current Focus ── */}
      {timelineEvents.find(e => e.status === 'active') && (
        <div className="flex-shrink-0" style={{ padding: '16px 32px' }}>
          <span style={{ color: 'var(--cs-faint)', fontSize: '10px', marginBottom: '8px', display: 'block' }}>
            Current focus
          </span>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--cs-accent)', fontSize: '12px' }}>✦</span>
            <span style={{ color: 'var(--cs-text)', fontSize: '13px', fontFamily: 'var(--cs-mono)' }}>
              {timelineEvents.find(e => e.status === 'active')?.label?.split(' ')?.pop() || 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* ── Trail ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 flex flex-col gap-3" style={{ padding: '24px 32px' }}>
        <span style={{ color: 'var(--cs-faint)', fontSize: '10px', marginBottom: '4px', display: 'block' }}>
          Trail
        </span>
        <AnimatePresence initial={false}>
          {timelineEvents.map((entry, index) => {
            const isActive = entry.status === 'active';
            const fileName = entry.label?.split(' ')?.pop() || 'Processing...';
            return (
              <motion.div 
                key={entry.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ 
                  fontSize: '12px', 
                  fontFamily: 'var(--cs-mono)',
                  color: isActive ? 'var(--cs-text)' : 'var(--cs-hint)',
                  paddingLeft: '14px',
                  borderLeft: `2px solid ${isActive ? 'var(--cs-accent)' : 'var(--cs-border)'}`,
                  paddingTop: '2px',
                  paddingBottom: '2px'
                }}
              >
                {fileName}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} style={{ height: '24px' }} />
      </div>

    </div>
  );
}
