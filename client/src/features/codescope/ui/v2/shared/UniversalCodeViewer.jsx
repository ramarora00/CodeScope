import React, { useMemo, useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
function getLineStyle(lineNum, aiLine, isAiActive, startLine, endLine) {
  if (!isAiActive) return { opacity: 1.0, isUnderstood: false, isFootprint: false };

  // If we have a contextual focus block
  if (startLine && endLine) {
    if (lineNum >= startLine && lineNum <= endLine) {
      return { opacity: 1.0, isUnderstood: true, isFootprint: true }; // Context focus (1.0)
    }
    const dist = lineNum < startLine ? startLine - lineNum : lineNum - endLine;
    if (dist <= 5) return { opacity: 0.65, isUnderstood: false, isFootprint: false }; // Adjacent context (0.65)
    return { opacity: 0.35, isUnderstood: false, isFootprint: false }; // Far code (0.35)
  }

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
// SEQUENTIAL READING DOTS (Deprecated/Removed)
// ─────────────────────────────────────────────────────────────────

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
  onReturnToAI,
  userSelectedFile
}) {
  const listRef = useRef(null);
  const previousTokensRef = useRef([]);
  const [isCrossfading, setIsCrossfading] = useState(false);

  const activeFile = activeTabId || attention.file;

  // ── PACING & READING ANIMATION CHOREOGRAPHY ──
  const [animatedAiLine, setAnimatedAiLine] = useState(attention.line || 1);

  const aiLine = animatedAiLine || attention.line || null;
  const isUnderstandingMode = activeInvestigation?.mode === 'understanding';
  const isAiControlling = !userSelectedFile || userSelectedFile === attention.file;
  const isAiActive = !isUnderstandingMode && runtimeStatus === 'reading' && !!aiLine && attention.file === activeFile && isAiControlling;
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
      const startL = attention.startLine;
      const endL = attention.endLine;
      const scrollLine = (startL && endL) ? Math.floor((startL + endL) / 2) : targetLine;
      const scrollIndex = Math.max(0, Math.min(scrollLine - 1, maxLines - 1));
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
        const startL = attention.startLine;
        const endL = attention.endLine;
        const scrollLine = (startL && endL) ? Math.floor((startL + endL) / 2) : targetLine;
        const scrollIndex = Math.max(0, Math.min(scrollLine - 1, maxLines - 1));
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
  const content = activeMemoryFile?.content || '';
  const isLoading = activeFile && !activeMemoryFile;
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

  // P3: Crossfade between files — keep previous tokens visible while new ones tokenize
  useEffect(() => {
    if (tokenizedLines.length > 0) {
      previousTokensRef.current = tokenizedLines;
      setIsCrossfading(false);
    } else if (previousTokensRef.current.length > 0) {
      setIsCrossfading(true);
    }
  }, [tokenizedLines]);

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
  const displayTokens = tokenizedLines.length > 0 ? tokenizedLines : previousTokensRef.current;
  const displayOpacity = isCrossfading ? 0.35 : 1.0;

  const Row = ({ index, style }) => {
    const tokens = displayTokens[index];
    if (!tokens) return null;

    const lineNum = index + 1;
    const startLine = attention.startLine;
    const endLine = attention.endLine;
    const { opacity, isUnderstood, isFootprint } = getLineStyle(lineNum, aiLine || -1, isAiActive, startLine, endLine);

    // The specific line currently being read (top of the window)
    const isAiFocus = isAiActive && (startLine && endLine ? (lineNum >= startLine && lineNum <= endLine) : (lineNum === aiLine));
    const isHovered = hoverLine === lineNum;

    return (
      <div
        style={{
          ...style,
          opacity: isHovered ? 1.0 : opacity,
          display: 'flex',
          alignItems: 'center',
          background: isHovered
            ? 'linear-gradient(90deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.0) 25%, rgba(255,255,255,0.0) 75%, rgba(255,255,255,0.035) 100%)'
            : isAiFocus
              ? 'linear-gradient(90deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.0) 15%, rgba(255,255,255,0.0) 85%, rgba(255,255,255,0.025) 100%)'
              : isFootprint
                ? 'linear-gradient(90deg, rgba(255,255,255,0.01) 0%, transparent 10%, transparent 90%, rgba(255,255,255,0.01) 100%)'
                : 'transparent',
          transition: `opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1), background 300ms ease`,
        }}
      >
        <span
          className="flex-shrink-0 select-none text-right pr-[18px] pl-4"
          style={{
            width: '60px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '24px',
            color: isAiFocus ? 'rgba(255,255,255,0.85)' : isHovered ? 'rgba(255,255,255,0.85)' : isUnderstood ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
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
            fontFamily: 'var(--font-mono)',
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

  const isUserViewing = !!userSelectedFile && (typeof userSelectedFile === 'string' ? userSelectedFile !== attention.file : userSelectedFile.path !== attention.file);

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full relative"
      style={{ background: 'var(--cs-editor)', gap: 0 }}
    >
      {/* ── Editor Header / Tab Bar ── */}
      <div className="flex flex-col flex-shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <div
          className="flex items-center flex-shrink-0"
          style={{
            height: '36px',
            padding: '0 24px',
            overflow: 'hidden'
          }}
        >
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar h-full w-full">
            {tabs.map(tab => {
              const isTabActive = tab.id === activeFile;
              const isAiFocusTab = tab.id === attention.file;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectTab && onSelectTab(tab.id)}
                  className="flex items-center gap-2 h-full px-4 border-b-2 cursor-pointer transition-all flex-shrink-0 group"
                  style={{
                    borderColor: isTabActive ? 'var(--cs-accent)' : 'transparent',
                    color: isTabActive ? 'var(--cs-text)' : 'rgba(255,255,255,0.3)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: isTabActive ? 500 : 400,
                    background: isTabActive ? 'rgba(255,255,255,0.02)' : 'transparent',
                    maxWidth: '160px',
                    minWidth: '60px',
                  }}
                >
                  {isAiFocusTab && (
                    <span style={{ color: 'var(--cs-accent)', fontSize: '11px', display: 'inline-block', marginRight: '2px', flexShrink: 0 }}>✦</span>
                  )}
                  <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {tab.name.split(/[\\/]/).pop()}
                  </span>
                  {onCloseTab && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseTab(tab.id);
                      }}
                      className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-0.5 flex-shrink-0 transition-opacity"
                      style={{ fontSize: '10px', marginLeft: '6px' }}
                    >
                      ✕
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Full file — Virtualized ── */}
      <div className="flex-1 overflow-hidden min-h-0 relative h-full w-full" ref={containerRef}>
        <AnimatePresence mode="wait">
        {!activeFile ? (
          <motion.div key="empty" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.4}} className="absolute inset-0 flex flex-col items-center justify-center gap-2">
             {activeInvestigation ? (
                <>
                  <span className="text-[12px] text-[var(--cs-text)] font-semibold font-mono opacity-80">Tracing repository context...</span>
                  <span className="text-[11px] text-[var(--cs-muted)] font-sans opacity-50">Preparing evidence route</span>
                </>
             ) : (
                <span className="text-[11px] text-[var(--cs-muted)] font-sans opacity-30">Select a file to view code</span>
             )}
          </motion.div>
        ) : isAsset || /\.(png|jpe?g|gif|webp|svg|ico|bmp|mp4|webm|pdf|zip|tar|gz|woff2?|eot|ttf|otf|lock)$/i.test(activeFile) ? (
          <motion.div key="asset" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.4}} className="absolute inset-0 flex flex-col items-center justify-center">
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--cs-border)' }}>
              <p style={{ color: 'var(--cs-text)', fontSize: '14px', fontFamily: 'var(--font-ui)', fontWeight: 600, marginBottom: '8px' }}>Image asset</p>
              <p style={{ color: 'var(--cs-hint)', fontSize: '13px', fontFamily: 'var(--font-ui)', marginBottom: '8px' }}>Not inspected as source code.</p>
              <p style={{ color: 'var(--cs-faint)', fontSize: '11px', fontFamily: 'var(--font-ui)' }}>Referenced by investigation.</p>
            </div>
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.4}} className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="text-[12px] text-[var(--cs-text)] font-semibold font-mono">{activeFile.split(/[\\/]/).pop()}</span>
            <span className="text-[11px] text-[var(--cs-muted)] font-sans opacity-50">locating evidence...</span>
          </motion.div>
        ) : displayTokens.length === 0 ? (
          <motion.div key="tokenizing" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.4}} className="absolute inset-0 flex items-center justify-center">
            {/* Tokenizing — show nothing, crossfade will handle the transition */}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{opacity: 0}} animate={{opacity: displayOpacity}} exit={{opacity: 0}} transition={{duration: 0.4}} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
            <List
              listRef={listRef}
              height={listHeight}
              rowCount={displayTokens.length}
              rowHeight={24}
              rowComponent={Row}
              rowProps={{}}
              width="100%"
            />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ── */}
      {(activeFile && isUserViewing) || (activeFile && isAiActive) ? (
        <div
          className="flex-shrink-0 flex items-center"
          style={{
            height: '32px',
            padding: '0 24px',
            background: 'rgba(0,0,0,0.05)',
            zIndex: 10
          }}
        >
          <div
            className="flex items-center min-w-0 flex-1 justify-between"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              color: 'var(--cs-muted)',
            }}
          >
            {activeFile && isUserViewing ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  <span style={{ fontWeight: 500 }}>Examining <span style={{ color: 'var(--cs-text)', fontFamily: 'var(--font-mono)' }}>{activeFile.split(/[\\/]/).pop()}</span></span>
                  <span style={{ color: 'var(--cs-faint)' }}>|</span>
                  <span style={{ color: 'var(--cs-muted)' }}>User Selection</span>
                </div>
                {onReturnToAI && (
                  <button
                    onClick={onReturnToAI}
                    className="flex items-center gap-1.5 px-3 py-1 rounded transition-colors text-[11px] font-medium"
                    style={{
                      color: 'var(--cs-accent)',
                      background: 'rgba(62,168,255,0.08)',
                      border: '1px solid rgba(62,168,255,0.15)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(62,168,255,0.14)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(62,168,255,0.08)'}
                  >
                    ✦ Follow AI
                  </button>
                )}
              </div>
            ) : activeFile && isAiActive ? (
              <div className="flex items-center gap-3 w-full min-w-0">
                <span className="w-1.5 h-1.5 bg-[var(--cs-accent)] rounded-full animate-pulse-dot shrink-0" />
                <span className="shrink-0" style={{ fontWeight: 600, color: 'var(--cs-accent)', fontFamily: 'var(--font-ui)' }}>✦ Reading logic</span>
                <span className="truncate flex-1" style={{ color: 'var(--cs-muted)', fontFamily: 'var(--font-ui)' }}>
                  {attention.reason || "Analyzing..."}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

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
