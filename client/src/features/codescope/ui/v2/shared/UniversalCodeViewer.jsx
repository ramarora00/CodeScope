import React, { useMemo, useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki';
import { Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// SHIKI HIGHLIGHTER INSTANCE
// ─────────────────────────────────────────────────────────────────
let highlighterPromise = null;

function getShikiHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-dimmed'],
      langs: ['javascript', 'typescript', 'python', 'json', 'html', 'css']
    });
  }
  return highlighterPromise;
}

// ─────────────────────────────────────────────────────────────────
// AI ATTENTION WINDOW
// ─────────────────────────────────────────────────────────────────
function getLineStyle(lineNum, aiLine, isAiActive) {
  if (!isAiActive) return { opacity: 1.0, isUnderstood: false, isFootprint: false };

  const dist = lineNum - aiLine;

  // Active reading area (current line + up to 3 lines ahead)
  if (dist >= 0 && dist <= 3) return { opacity: 1.0, isUnderstood: false, isFootprint: false };

  // Nearby ahead
  if (dist > 3 && dist <= 10) return { opacity: 0.75, isUnderstood: false, isFootprint: false };

  // Far ahead
  if (dist > 10) return { opacity: 0.35, isUnderstood: false, isFootprint: false };

  // Nearby behind (Memory trace)
  if (dist < 0 && dist >= -8) return { opacity: 0.85, isUnderstood: true, isFootprint: dist >= -2 };

  // Far behind
  return { opacity: 0.5, isUnderstood: true, isFootprint: false };
}

// ─────────────────────────────────────────────────────────────────
// SEQUENTIAL READING DOTS
// ─────────────────────────────────────────────────────────────────
function ReadingDots({ active }) {
  const [filled, setFilled] = React.useState(0);

  React.useEffect(() => {
    if (!active) { setFilled(0); return; }
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % 6;
      setFilled(i === 5 ? 0 : i + 1);
    }, 320);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex items-center gap-[5px] px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: active && i < filled ? 'var(--cs-accent)' : 'rgba(191,200,216,0.18)',
            transition: 'background 150ms ease',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL CODE VIEWER
// Replaces AIOverlayEditor and regex parsing with Shiki and react-window
// ─────────────────────────────────────────────────────────────────
export default function UniversalCodeViewer({
  tabs = [],
  activeTabId,
  isAsset,
  onSelectTab,
  onCloseTab,
  attention = {},
  insight,
  runtimeStatus,
  aiPhase = 'searching',
  memoryFiles = [],
  answer,
  orchestration,
  activeInvestigation,
}) {
  const listRef = useRef(null);

  const activeFile = activeTabId || attention.file;

  // ── PACING & READING ANIMATION CHOREOGRAPHY ──
  const [animatedAiLine, setAnimatedAiLine] = useState(attention.line || 1);

  const aiLine = animatedAiLine || attention.line || null;
  const isUnderstandingMode = activeInvestigation?.mode === 'understanding';
  const isAiActive = !isUnderstandingMode && runtimeStatus === 'reading' && !!aiLine && attention.file === activeFile;
  const { activeCognitiveEvent, commitActiveCognitiveEvent } = orchestration || {};

  const isResolved = runtimeStatus === 'resolved' && !activeCognitiveEvent;
  const confidence = isResolved ? 'High' : attention.type === 'insight' ? 'High' : 'Medium';

  // ── PHASE B/C: BELIEVABLE COGNITION (Evidence Commit Pipeline) ──
  // When file changes, reset AI cursor to top to avoid jumping from bottom
  useEffect(() => {
    setAnimatedAiLine(1);
    if (listRef.current) {
      if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(0, 'center');
      else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: 0, align: 'center' });
    }
  }, [activeFile]);

  useEffect(() => {
    if (!activeCognitiveEvent) return;

    // If the user has navigated away to a different file, we still need to consume the events 
    // so the investigation doesn't stall. We just consume them instantly without visual delay.
    if (!isAiActive) {
      commitActiveCognitiveEvent();
      return;
    }

    const type = activeCognitiveEvent.type;
    const isEditorEvent = ['file.read.progress', 'file.read.completed', 'file.selected', 'jump.started', 'evidence.added', 'knowledge.added', 'investigation.completed', 'planner.completed'].includes(type);

    if (!isEditorEvent) {
      commitActiveCognitiveEvent();
      return;
    }

    if (type === 'file.read.progress') {
      const maxLines = Math.max(1, activeCognitiveEvent.totalLines || tokenizedLinesRef.current?.length || 1);
      const targetLine = Math.min(activeCognitiveEvent.line, maxLines);

      // Believable Cognition: Jump directly to the relevant block, no theatrical scanning.
      setAnimatedAiLine(targetLine);
      const scrollIndex = Math.max(0, Math.min(targetLine - 1, maxLines - 1));
      try {
        if (listRef.current) {
          if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(scrollIndex, 'center');
          else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: scrollIndex, align: 'center' });
        }
      } catch (_) { /* Suppress transient RangeError during file transitions */ }

      // Short hold to visually digest the block
      const holdDuration = 600 + Math.random() * 400; // 600-1000ms pause
      const activeTimeout = setTimeout(() => commitActiveCognitiveEvent(), holdDuration);

      return () => clearTimeout(activeTimeout);
    }
    else if (type === 'jump.started' || type === 'file.selected') {
      // ANTICIPATION: Wait 300ms thinking beat before jump
      const maxLines = Math.max(1, tokenizedLinesRef.current?.length || 1);
      const targetLine = Math.min(activeCognitiveEvent.line || attention.line || 1, maxLines);
      setTimeout(() => {
        setAnimatedAiLine(targetLine);
        const scrollIndex = Math.min(targetLine - 1, maxLines - 1);
        try {
          if (listRef.current) {
            if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(scrollIndex, 'center');
            else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: scrollIndex, align: 'center' });
          }
        } catch (_) { }
        // Arrive and orient
        setTimeout(() => commitActiveCognitiveEvent(), 700);
      }, 400); // 400ms thinking beat before jumping
    }
    else if (type === 'file.read.completed') {
      // CONCLUDE FILE: Pause to synthesize before moving on
      setTimeout(() => commitActiveCognitiveEvent(), 900);
    }
    else if (type === 'evidence.added' || type === 'knowledge.added') {
      // DISCOVER / VERIFY: Pronounced pause as AI internalizes the evidence
      setTimeout(() => commitActiveCognitiveEvent(), 1000);
    }
    else if (type === 'planner.completed') {
      // PLAN: Brief pause to finalize strategy
      setTimeout(() => commitActiveCognitiveEvent(), 800);
    }
    else if (type === 'investigation.completed') {
      // THE SILENT TRANSITION: 
      // 1. Cursor stops.
      // 2. Footer changes to "Concluding".
      // 3. Absolute silence for 1500ms before the report rises.
      setTimeout(() => commitActiveCognitiveEvent(), 1500);
    }
  }, [activeCognitiveEvent, commitActiveCognitiveEvent, animatedAiLine, attention.line, isAiActive]);

  // --- RUNTIME TRUTHFULNESS: Provable Narration (Lagged) ---
  // The footer always lags visible cognition slightly, never leading it.
  const [provableNarration, setProvableNarration] = useState('');

  useEffect(() => {
    if (!isAiActive) {
      setProvableNarration('Ready');
      return;
    }
    if (activeCognitiveEvent?.type === 'investigation.completed') {
      setProvableNarration('Concluding');
      return;
    }
    if (activeCognitiveEvent?.type === 'jump.started' || activeCognitiveEvent?.type === 'file.selected') {
      const target = activeCognitiveEvent.file || activeCognitiveEvent.to || '';
      setProvableNarration(`Following ${target.split('/').pop()}`);
      return;
    }

    const currentTokens = tokenizedLinesRef.current || [];
    const lineTokens = currentTokens[Math.max(0, (animatedAiLine || 1) - 1)];

    if (lineTokens) {
      const text = lineTokens.map(t => t.content).join('').trim();
      const lower = text.toLowerCase();

      let targetCaption = 'Reading logic';
      if (lower.includes('import ') || lower.includes('export ') || lower.includes('require(')) {
        targetCaption = 'Reading imports';
      } else if (lower.includes('auth') || lower.includes('jwt') || lower.includes('passport') || lower.includes('login') || lower.includes('session') || lower.includes('token') || lower.includes('cookie')) {
        targetCaption = 'Checking authentication flow';
      } else if (lower.includes('request') || lower.includes('req') || lower.includes('res') || lower.includes('route') || lower.includes('get(') || lower.includes('post(') || lower.includes('put(') || lower.includes('delete(')) {
        targetCaption = 'Following request lifecycle';
      } else if (lower.includes('middleware') || lower.includes('use(') || lower.includes('next(') || lower.includes('cors') || lower.includes('helmet')) {
        targetCaption = 'Verifying middleware chain';
      } else if (lower.includes('catch') || lower.includes('throw ') || lower.includes('error') || lower.includes('retry') || lower.includes('backoff') || lower.includes('reject(')) {
        targetCaption = 'Tracing retry chain & errors';
      } else if (lower.includes('config') || lower.includes('setup') || lower.includes('env') || lower.includes('process.env')) {
        targetCaption = 'Reading configuration';
      } else if (text.startsWith('//') || text.startsWith('/*')) {
        targetCaption = 'Reading comments';
      } else if (text.includes('class ') || text.includes('function ') || text.includes('=>')) {
        targetCaption = 'Inspecting signature';
      }

      // Introduce a 150ms lag so visual cursor movement is seen first
      const timeoutId = setTimeout(() => {
        setProvableNarration(targetCaption);
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [animatedAiLine, activeCognitiveEvent, isAiActive]);

  const activeNarration = activeCognitiveEvent && activeCognitiveEvent.text
    ? activeCognitiveEvent.text
    : provableNarration;

  const activeMemoryFile = memoryFiles.find(m => m.name === activeFile || m.file === activeFile);
  const content = activeMemoryFile?.content || (activeFile ? '// Loading file content...' : '');
  const getLanguage = (path) => {
    if (!path) return 'javascript';
    const ext = path.split('.').pop().toLowerCase();
    if (['json', 'md', 'html', 'css'].includes(ext)) return ext;
    if (['ts', 'tsx'].includes(ext)) return 'typescript';
    return 'javascript';
  };
  const language = activeMemoryFile?.language || getLanguage(activeFile);

  const [tokenizedLines, setTokenizedLines] = useState([]);
  const tokenizedLinesRef = useRef([]);

  useEffect(() => {
    tokenizedLinesRef.current = tokenizedLines;
  }, [tokenizedLines]);

  const [listHeight, setListHeight] = useState(600);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setListHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Tokenize using Shiki asynchronously
  useEffect(() => {
    let isMounted = true;

    // Clear tokens immediately on file change to prevent stale content survival race condition
    setTokenizedLines([]);

    if (!content || !activeFile) {
      return;
    }

    const tokenizeContent = async () => {
      try {
        const hl = await getShikiHighlighter();

        let langToUse = language;
        if (!hl.getLoadedLanguages().includes(langToUse)) {
          langToUse = 'javascript';
        }

        const tokens = hl.codeToTokens(content, {
          lang: langToUse,
          theme: 'github-dark-dimmed'
        });

        if (isMounted) {
          setTokenizedLines(tokens.tokens);
        }
      } catch (e) {
        console.error('Failed to tokenize with Shiki', e);
        if (isMounted) {
          const lines = content.split('\n').map(line => [{ content: line, color: 'var(--syn-default)' }]);
          setTokenizedLines(lines);
        }
      }
    };

    tokenizeContent();
    return () => { isMounted = false; };
  }, [content, language, activeFile]);

  const [hoverLine, setHoverLine] = useState(null);

  useEffect(() => {
    const handleEditorHighlight = (e) => {
      const detail = e.detail;
      if (detail && (detail.file === activeFile || detail.file === activeFile.split('/').pop())) {
        setHoverLine(detail.line);
        if (listRef.current && detail.line) {
          const safeIdx = Math.max(0, detail.line - 1);
          if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(safeIdx, 'center');
          else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: safeIdx, align: 'center' });
        }
      } else {
        setHoverLine(null);
      }
    };
    window.addEventListener('editor-highlight', handleEditorHighlight);
    return () => window.removeEventListener('editor-highlight', handleEditorHighlight);
  }, [activeFile]);

  // react-window Row renderer
  const Row = ({ index, style }) => {
    const tokens = tokenizedLines[index];
    if (!tokens) return null;

    const lineNum = index + 1;
    const { opacity, isUnderstood, isFootprint } = getLineStyle(lineNum, aiLine || -1, isAiActive);

    // The specific line currently being read (top of the window)
    const isAiFocus = isAiActive && lineNum === aiLine;
    const isHovered = hoverLine === lineNum;

    return (
      <div
        style={{
          ...style,
          opacity: isHovered ? 1.0 : opacity,
          display: 'flex',
          alignItems: 'center',
          borderLeft: isAiFocus
            ? '2px solid var(--cs-accent)'
            : isHovered
              ? '2px solid var(--cs-accent)'
              : '2px solid transparent',
          background: isHovered
            ? 'linear-gradient(90deg, rgba(62,168,255,0.12) 0%, rgba(62,168,255,0.02) 60%, transparent 100%)'
            : isAiFocus
              ? 'linear-gradient(90deg, rgba(191,200,216,0.14) 0%, rgba(191,200,216,0.02) 60%, transparent 100%)'
              : isFootprint
                ? 'linear-gradient(90deg, rgba(191,200,216,0.04) 0%, rgba(191,200,216,0.01) 60%, transparent 100%)'
                : 'transparent',
          transition: `opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1), background 300ms ease, border-color 300ms ease`,
        }}
      >
        <span
          className="flex-shrink-0 select-none text-right pr-[18px] pl-4"
          style={{
            width: '60px',
            fontFamily: 'var(--cs-mono)',
            fontSize: '12px',
            lineHeight: '24px',
            color: isAiFocus ? 'var(--cs-accent)' : isHovered ? 'var(--cs-accent)' : isUnderstood ? 'rgba(62,168,255,0.3)' : 'rgba(255,255,255,0.15)',
            userSelect: 'none',
            transition: 'color 220ms ease',
          }}
        >
          {lineNum}
        </span>

        <pre
          style={{
            flex: 1,
            margin: 0,
            padding: '0 24px 0 28px',
            fontFamily: 'var(--cs-mono)',
            fontSize: '13px',
            lineHeight: '24px',
            whiteSpace: 'pre',
            overflow: 'hidden'
          }}
        >
          {tokens.map((tok, i) => (
            <span
              key={i}
              style={{
                color: tok.color || 'var(--syn-default)',
                fontStyle: tok.fontStyle === 1 ? 'italic' : 'normal',
              }}
            >
              {tok.content}
            </span>
          ))}
        </pre>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full relative"
      style={{ background: 'var(--cs-editor)' }}
    >

      {/* ── Full file — Virtualized ── */}
      <div className="flex-1 overflow-hidden min-h-0 relative animate-crossfade h-full w-full" ref={containerRef}>
        {!activeFile ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
              Waiting for AI to open a file...
            </p>
          </div>
        ) : isAsset || /\.(png|jpe?g|gif|webp|svg|ico|bmp|mp4|webm|pdf|zip|tar|gz|woff2?|eot|ttf|otf|lock)$/i.test(activeFile) ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--cs-border)' }}>
              <p style={{ color: 'var(--cs-text)', fontSize: '14px', fontFamily: 'var(--cs-mono)', marginBottom: '8px' }}>IMAGE ASSET</p>
              <p style={{ color: 'var(--cs-hint)', fontSize: '13px', marginBottom: '8px' }}>Not inspected as source code.</p>
              <p style={{ color: 'var(--cs-faint)', fontSize: '11px', fontFamily: 'var(--cs-mono)' }}>Referenced by investigation.</p>
            </div>
          </div>
        ) : tokenizedLines.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
              Loading tokens...
            </p>
          </div>
        ) : (
          <div style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
            <List
              listRef={listRef}
              height={listHeight}
              rowCount={tokenizedLines.length}
              rowHeight={24}
              rowComponent={Row}
              rowProps={{}}
              width="100%"
            />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex-shrink-0 flex items-center"
        style={{
          height: '42px',
          padding: '0 24px 8px 24px',
          background: 'transparent',
          zIndex: 10
        }}
      >
        <div
          className="flex items-center min-w-0 flex-1"
          style={{
            fontFamily: 'var(--cs-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            gap: 0,
          }}
        >
          {activeFile ? (
            <>
              {isResolved ? (
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Analysis complete</span>
              ) : isAiActive ? (
                <>
                  {activeNarration || 'Following request'}
                  <span style={{ color: 'var(--cs-accent)', marginLeft: '12px', fontWeight: 600 }}>
                    {activeFile.split(/[\\/]/).pop()}
                    <span style={{ opacity: 0.6, marginLeft: '6px', fontWeight: 400 }}>
                      {Math.min(aiLine || 1, tokenizedLines.length)}/{tokenizedLines.length}
                    </span>
                  </span>
                </>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>{activeNarration || 'Thinking...'}</span>
              )}
            </>
          ) : (
            <span style={{ color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Waiting for AI...</span>
          )}
        </div>

        {activeFile && <ReadingDots active={isAiActive} />}
      </div>

      {/* ── Insight bar ── */}
      {insight && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 animate-slide"
          style={{ height: '32px', zIndex: 10 }}
        >
          <span style={{ color: 'var(--cs-accent)', fontSize: '11px', flexShrink: 0 }}>✦</span>
          <span style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '11px',
            fontFamily: 'var(--cs-mono)',
            fontStyle: 'italic',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {insight}
          </span>
          <button
            style={{
              flexShrink: 0,
              color: 'var(--cs-faint)',
              fontSize: '10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--cs-sans)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cs-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--cs-faint)'}
          >
            View map →
          </button>
        </div>
      )}

    </div>
  );
}
