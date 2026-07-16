import React, { useState, useEffect, useRef } from 'react';
import { Check, Send } from 'lucide-react';

const PLAN_STEPS = [
  { id: 1, label: 'Find auth middleware entry point', done: true },
  { id: 2, label: 'Trace token verification failure', active: true },
  { id: 3, label: 'Follow session guard logic' },
  { id: 4, label: 'Review refresh token endpoint' },
  { id: 5, label: 'Check user repository session invalidation' },
  { id: 6, label: 'Summarize failure path' },
];

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
    <span style={{ color: 'var(--cs-hint)', fontFamily: 'var(--cs-mono)', fontSize: '10px' }}>
      {elapsed}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// TIMELINE ENTRY — Parent/child hierarchy, no borders, no overlap
// ─────────────────────────────────────────────────────────────────
function TimelineEntry({ entry, isActive, memoryFiles }) {
  return (
    <div style={{ marginBottom: isActive ? '12px' : '4px' }}>
      <div
        className="flex items-start gap-2"
        style={{ minHeight: '26px' }}
      >
        <span style={{
          color: 'var(--cs-hint)',
          fontSize: '9.5px',
          fontFamily: 'var(--cs-mono)',
          flexShrink: 0,
          width: '28px',
          lineHeight: 1.6,
        }}>
          {entry.timestamp}
        </span>
        <div className="flex-shrink-0" style={{ paddingTop: '2px', width: '11px', display: 'flex', justifyContent: 'center' }}>
          {isActive && (
            <div className="w-[11px] h-[11px] flex items-center justify-center">
              <div className="w-[6px] h-[6px] rounded-full" style={{ background: 'var(--cs-accent)' }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0" style={{ paddingTop: '1px' }}>
          <span style={{
            color: isActive ? 'var(--cs-text)' : 'var(--cs-muted)',
            fontSize: '11.5px',
            fontWeight: isActive ? 500 : 400,
            display: 'block',
            lineHeight: 1.5,
          }}>
            {entry.label}
          </span>
          {entry.sublabel && !isActive && (
            <span style={{ color: 'var(--cs-faint)', fontSize: '10px', display: 'block', marginTop: '4px', lineHeight: 1.4 }}>
              {entry.sublabel}
            </span>
          )}
        </div>
      </div>

      {/* Active: nested with vertical line connecting them */}
      {isActive && (
        <div className="animate-fade-in relative" style={{ paddingLeft: '48px', marginTop: '10px' }}>
          {/* Vertical line connecting children */}
          <div className="absolute top-0 bottom-0 left-[33px]" style={{ width: '1px', background: 'var(--cs-border)' }} />
          
          <div className="space-y-4">
            {entry.insight && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  Finding
                </div>
                <div style={{ color: 'var(--cs-muted)', fontSize: '11px', lineHeight: 1.6 }}>
                  {entry.insight}
                </div>
              </div>
            )}
            {entry.next && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  Next
                </div>
                <div style={{ color: 'var(--cs-muted)', fontSize: '11px', lineHeight: 1.6 }}>
                  {entry.next}
                </div>
              </div>
            )}
            {entry.then && (
              <div>
                <div style={{ color: 'var(--cs-faint)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                  Then
                </div>
                <div style={{ color: 'var(--cs-muted)', fontSize: '11px', lineHeight: 1.6 }}>
                  {entry.then}
                </div>
              </div>
            )}
            {memoryFiles.length > 0 && (
              <div className="space-y-1.5 mt-3">
                {memoryFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span style={{ color: 'var(--cs-hint)', fontSize: '9px' }}>↳</span>
                    <span style={{ color: 'var(--cs-hint)', fontSize: '10px', fontFamily: 'var(--cs-mono)' }}>
                      {f.file}
                    </span>
                  </div>
                ))}
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
export default function InvestigationPanel({ events = [], attention = {}, startedAt, memoryFiles = [] }) {
  const [askQuery, setAskQuery] = useState('');
  const bottomRef = useRef(null);

  const timelineEntries = events.filter(e => e.type === 'timeline');
  const completedSteps = PLAN_STEPS.filter(s => s.done).length;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events.length]);

  const handleAsk = (e) => {
    e.preventDefault();
    if (askQuery.trim()) setAskQuery('');
  };

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '315px',
        background: 'var(--cs-panel)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-5"
        style={{ height: '40px', borderBottom: '1px solid var(--cs-border)' }}
      >
        <span style={{
          color: 'var(--cs-faint)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          Investigation
        </span>
        {startedAt && <ElapsedTimer startedAt={startedAt} />}
      </div>

      {/* ── Query ── */}
      <div style={{ padding: '24px 24px 16px' }} className="flex-shrink-0">
        <div className="flex items-start gap-2">
          <p style={{
            color: 'var(--cs-text)',
            fontSize: '13px',
            fontWeight: 600,
            lineHeight: 1.4,
            flex: 1,
          }}>
            Find where JWT authentication breaks for expired sessions.
          </p>
          <span style={{ color: 'var(--cs-accent)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✦</span>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar min-h-0"
        style={{ padding: '0 24px' }}
      >
        {timelineEntries.map((entry, index) => {
          const isActive = entry.status === 'active';
          return (
            <React.Fragment key={entry.id}>
              <TimelineEntry
                entry={entry}
                isActive={isActive}
                memoryFiles={isActive ? memoryFiles : []}
              />
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} style={{ height: '24px' }} />
      </div>

      {/* ── Plan ── */}
      <div
        className="flex-shrink-0"
        style={{ padding: '18px 24px 24px', borderTop: '1px solid var(--cs-border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span style={{
            color: 'var(--cs-faint)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}>
            Plan
          </span>
          <span style={{ color: 'var(--cs-hint)', fontSize: '10px', fontFamily: 'var(--cs-mono)' }}>
            {completedSteps} / {PLAN_STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '1px', background: 'var(--cs-border)', borderRadius: '1px', overflow: 'hidden', marginBottom: '14px' }}>
          <div
            style={{
              height: '100%',
              width: `${(completedSteps / PLAN_STEPS.length) * 100}%`,
              background: 'var(--cs-green)',
              transition: 'width 300ms ease-out',
            }}
          />
        </div>

        {/* Step list */}
        <div className="space-y-[8px]">
          {PLAN_STEPS.map(step => (
            <div
              key={step.id}
              className="flex items-center gap-2"
              style={{
                height: '26px',
                padding: '0 6px',
                borderRadius: '4px',
                background: step.active ? 'rgba(191,200,216,0.04)' : 'transparent',
                borderLeft: step.active ? '2px solid rgba(191,200,216,0.45)' : '2px solid transparent',
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '14px', height: '14px',
                  color: step.done ? 'var(--cs-green)' : step.active ? 'var(--cs-accent)' : 'var(--cs-hint)',
                }}
              >
                <span style={{ fontSize: '10px', fontFamily: 'var(--cs-mono)', fontWeight: 500, lineHeight: 1 }}>
                  {step.id}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                color: step.done ? 'var(--cs-hint)' : step.active ? 'var(--cs-text)' : 'var(--cs-faint)',
                fontWeight: step.active ? 500 : 400,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
              {step.done ? (
                <Check size={12} style={{ color: 'var(--cs-green)' }} className="flex-shrink-0" />
              ) : step.active ? (
                <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--cs-text)' }} />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ── Ask AI ── */}
      <form onSubmit={handleAsk} style={{ padding: '16px 24px 24px' }}>
        <div
          className="flex items-center gap-2"
          style={{
            background: 'var(--cs-editor)',
            border: '1px solid var(--cs-border)',
            borderRadius: '10px',
            padding: '9px 12px',
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(191,200,216,0.14)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--cs-border)'}
        >
          <input
            type="text"
            value={askQuery}
            onChange={e => setAskQuery(e.target.value)}
            placeholder="Ask AI about this investigation..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--cs-sans)',
              fontSize: '11px',
              color: 'var(--cs-text)',
            }}
            className="placeholder:text-[var(--cs-hint)]"
          />
          <button
            type="submit"
            disabled={!askQuery.trim()}
            style={{
              flexShrink: 0,
              color: askQuery.trim() ? 'var(--cs-accent)' : 'var(--cs-hint)',
              background: 'transparent',
              border: 'none',
              cursor: askQuery.trim() ? 'pointer' : 'default',
              transition: 'color 220ms ease',
            }}
          >
            <span style={{ fontSize: '14px', fontFamily: 'var(--cs-sans)', lineHeight: 1 }}>↵</span>
          </button>
        </div>
      </form>
    </div>
  );
}
