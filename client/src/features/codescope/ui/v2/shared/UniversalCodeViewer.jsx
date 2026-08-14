import React, { useMemo, useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { createHighlighter, bundledLanguages, bundledThemes } from 'shiki';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────
const ROW_HEIGHT = 24;

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
// INVESTIGATION ACTIVITY SEQUENCE
// Replaces static "Tracing repository context..." with a
// live sequence that communicates the AI is actively thinking.
// Reads directly from backend investigationState for true synchronization.
// ─────────────────────────────────────────────────────────────────
function InvestigationActivitySequence({ event, investigationState }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (event?.type === 'file.read.progress') {
      setStep(4);
    } else if (event?.type === 'jump.started' || event?.type === 'file.selected') {
      setStep(3);
    } else {
      switch (investigationState) {
        case 'IDLE':
        case 'PLANNING':
          setStep(0);
          break;
        case 'INDEXING':
          setStep(1);
          break;
        case 'SEARCHING':
        case 'TRACING':
          setStep(2);
          break;
        case 'READING':
        case 'EVALUATING':
          setStep(3);
          break;
        case 'COMPLETED':
          setStep(4);
          break;
        default:
          setStep(0);
      }
    }
  }, [event, investigationState]);

  const phases = [
    'QUESTION RECEIVED',
    'MAPPING REPOSITORY',
    'TRACING EXECUTION',
    'OPENING SOURCE',
    'READING CODE'
  ];

  const checklist = [
    { label: 'structure', activeStep: 1 },
    { label: 'dependencies', activeStep: 2 },
    { label: 'source', activeStep: 3 },
    { label: 'reasoning', activeStep: 4 }
  ];

  const currentPhase = phases[Math.min(step, phases.length - 1)];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 4, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.99 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
      >
        <span style={{
          color: 'var(--cs-accent)',
          fontSize: '12px',
          opacity: 0.8,
          letterSpacing: '0.02em',
        }}>✦</span>
        
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase'
        }}>{currentPhase}</span>

        <div style={{
          width: '180px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          margin: '4px 0'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
          {checklist.map((item, i) => {
            const isCompleted = step > item.activeStep;
            const isCurrent = step === item.activeStep;
            
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  color: isCurrent ? 'var(--cs-accent)' : isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                  fontSize: '10px',
                  transition: 'color 0.4s ease'
                }}>
                  {isCurrent ? '●' : '○'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: isCurrent ? 'rgba(255,255,255,0.8)' : isCompleted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  transition: 'color 0.4s ease'
                }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
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
  // isAiActive: AI is presenting content to the user in the editor.
  // Directly tied to `attention.file === activeFile` to guarantee UI stability. 
  // Do NOT rely on ephemeral backend `runtimeStatus` or it will blink.
  const isAiActive = !isUnderstandingMode && !!activeInvestigation && attention.file === activeFile && isAiControlling;
  // isAiFocusing: narrower gate — only true when a concrete line range is known
  // This is what gates the focus box overlay and Reading Logic.
  const isAiFocusing = isAiActive && !!(attention.startLine && attention.endLine);
  const { activeCognitiveEvent, commitActiveCognitiveEvent, investigationState } = orchestration || {};

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

      setAnimatedAiLine(targetLine);
      const startL = attention.startLine;
      const endL = attention.endLine;
      const scrollLine = (startL && endL) ? Math.floor((startL + endL) / 2) : targetLine;
      const scrollIndex = Math.max(0, Math.min(scrollLine - 1, maxLines - 1));
      scrollAndSettle(scrollIndex, startL, endL);

      // Hold to let user see the focused region
      const holdDuration = 700 + Math.random() * 300;
      const activeTimeout = setTimeout(() => commitActiveCognitiveEvent(), holdDuration);
      return () => clearTimeout(activeTimeout);
    }
    else if (type === 'jump.started' || type === 'file.selected') {
      const maxLines = Math.max(1, tokenizedLinesRef.current?.length || 1);
      const targetLine = Math.min(activeCognitiveEvent.line || attention.line || 1, maxLines);
      // 400ms thinking beat, then scroll+settle, then commit
      setTimeout(() => {
        setAnimatedAiLine(targetLine);
        const startL = attention.startLine;
        const endL = attention.endLine;
        const scrollLine = (startL && endL) ? Math.floor((startL + endL) / 2) : targetLine;
        const scrollIndex = Math.max(0, Math.min(scrollLine - 1, maxLines - 1));
        scrollAndSettle(scrollIndex, startL, endL);
        setTimeout(() => commitActiveCognitiveEvent(), 750);
      }, 400);
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
  
  const [scrollOffset, setScrollOffset] = useState(0);
  const visibleRangeRef = useRef({ start: 0, end: 0 });

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
  const [hoverBlock, setHoverBlock] = useState(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  // scrollSettled: true once viewport has had time to settle post-scroll
  // prevents focus box from appearing at wrong visual position
  const [scrollSettled, setScrollSettled] = useState(true);
  const scrollSettleTimerRef = useRef(null);

  const scrollAndSettle = (index, startLineRange, endLineRange) => {
    // Viewport-aware scroll: only scroll if the target is outside the safe visible zone
    const targetStart = startLineRange ? startLineRange - 1 : index;
    const targetEnd = endLineRange ? endLineRange - 1 : index;

    // Is the entire focus region fully visible?
    const isVisible = targetStart >= visibleRangeRef.current.start && targetEnd <= visibleRangeRef.current.end;
    if (isVisible) {
      if (!scrollSettled) setScrollSettled(true);
      return; // Already visible, no need to jump
    }

    setScrollSettled(false);
    if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    try {
      if (listRef.current) {
        if (targetEnd - targetStart > 15) {
          // If range is large, align to the start of the block with a small buffer
          const alignIndex = Math.max(0, targetStart - 2);
          if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(alignIndex, 'start');
          else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: alignIndex, align: 'start' });
        } else {
          // Normal center alignment
          const centerIndex = Math.floor((targetStart + targetEnd) / 2);
          if (typeof listRef.current.scrollToItem === 'function') listRef.current.scrollToItem(centerIndex, 'center');
          else if (typeof listRef.current.scrollToRow === 'function') listRef.current.scrollToRow({ index: centerIndex, align: 'center' });
        }
      }
    } catch (_) { }
    scrollSettleTimerRef.current = setTimeout(() => setScrollSettled(true), 380);
  };

  useEffect(() => {
    const handleEditorHighlight = (e) => {
      const detail = e.detail;
      if (detail && activeFile) {
        const detailName = detail.file.split(/[\\/]/).pop();
        const activeName = activeFile.split(/[\\/]/).pop();
        if (detail.file === activeFile || detailName === activeName || activeFile.endsWith(detail.file) || activeFile.replace(/\\/g, '/').endsWith(detail.file.replace(/\\/g, '/'))) {
          setHoverLine(detail.line);
          setHoverBlock(detail.startLine && detail.endLine ? { start: detail.startLine, end: detail.endLine } : null);
          if (detail.line) scrollAndSettle(Math.max(0, detail.line - 1), detail.startLine, detail.endLine);
          return;
        }
      }
      setHoverLine(null);
      setHoverBlock(null);
    };
    window.addEventListener('editor-highlight', handleEditorHighlight);
    return () => window.removeEventListener('editor-highlight', handleEditorHighlight);
  }, [activeFile]);

  // react-window Row renderer
  const displayTokens = tokenizedLines.length > 0 ? tokenizedLines : previousTokensRef.current;
  const displayOpacity = isCrossfading ? 0.35 : 1.0;

  const Row = ({
    index,
    style,
    visibleRange = { start: 0, end: 0 },
    scrollSettled = true,
    isAiActive = false,
    isAiFocusing = false,
    aiLine = null,
    attention = {},
    hoverLine = null,
    hoverBlock = null
  }) => {
    const tokens = displayTokens[index];
    if (!tokens) return null;

    const lineNum = index + 1;
    const startLine = attention.startLine;
    const endLine = attention.endLine;
    const { opacity, isUnderstood, isFootprint } = getLineStyle(lineNum, aiLine || -1, isAiActive, startLine, endLine);

    let focusStart = startLine;
    let focusEnd = endLine;
    const isAiFocus = isAiFocusing && (focusStart && focusEnd ? (lineNum >= focusStart && lineNum <= focusEnd) : (lineNum === aiLine));
    const isHoveredLine = hoverLine === lineNum;
    let activeHoverStart = hoverBlock?.start;
    let activeHoverEnd = hoverBlock?.end;
    
    if (hoverBlock && (hoverBlock.end - hoverBlock.start > 6)) {
      const visibleMid = Math.floor((visibleRange.start + visibleRange.end) / 2) + 1;
      const anchor = Math.max(hoverBlock.start, Math.min(hoverBlock.end, visibleMid));
      activeHoverStart = Math.max(hoverBlock.start, anchor - 2);
      activeHoverEnd = Math.min(hoverBlock.end, anchor + 3);
    }
    
    const isHoverFocus = hoverBlock && lineNum >= activeHoverStart && lineNum <= activeHoverEnd;
    // Row-based rendering cannot misalign during scroll, so we no longer need to wait for scrollSettled
    const isFocus = isAiFocus || isHoverFocus;
    const isFirstFocusLine = (isAiFocus && (focusStart ? lineNum === focusStart : lineNum === aiLine)) || (isHoverFocus && lineNum === activeHoverStart);
    const isLastFocusLine = (isAiFocus && (focusEnd ? lineNum === focusEnd : lineNum === aiLine)) || (isHoverFocus && lineNum === activeHoverEnd);

    return (
      <div
        style={{
          ...style,
          opacity: isFocus || isHoveredLine ? 1.0 : opacity,
          display: 'flex',
          alignItems: 'center',
          background: isHoveredLine
              ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.0) 80%, rgba(255,255,255,0.04) 100%)'
              : isFocus
                ? 'linear-gradient(90deg, rgba(140,190,255,0.08) 0%, rgba(140,190,255,0.03) 30%, rgba(140,190,255,0.0) 100%)'
                : isFootprint
                  ? 'linear-gradient(90deg, rgba(255,255,255,0.015) 0%, transparent 12%, transparent 88%, rgba(255,255,255,0.015) 100%)'
                  : 'transparent',
          borderTopRightRadius: isFirstFocusLine ? '6px' : '0',
          borderBottomRightRadius: isLastFocusLine ? '6px' : '0',
          boxShadow: isFirstFocusLine && isLastFocusLine
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05), inset 0 2px 0 rgba(255,255,255,0.02)'
              : isFirstFocusLine
              ? 'inset 0 1px 0 rgba(255,255,255,0.1), inset -1px 0 0 rgba(255,255,255,0.05), inset 0 2px 0 rgba(255,255,255,0.02)'
              : isLastFocusLine
              ? 'inset 0 -1px 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.1)'
              : isFocus
              ? 'inset -1px 0 0 rgba(255,255,255,0.05)'
              : 'none',
          transition: `opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1), background 300ms ease`,
        }}
      >
        {isFocus && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', pointerEvents: 'none',
            background: isFirstFocusLine ? 'linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2))' : isLastFocusLine ? 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))' : 'rgba(255,255,255,0.2)',
            borderTopLeftRadius: isFirstFocusLine ? '2px' : '0',
            borderBottomLeftRadius: isLastFocusLine ? '2px' : '0',
          }} />
        )}
        <span
          className="flex-shrink-0 select-none text-right pr-[18px] pl-4 flex items-center justify-end"
          style={{
            width: '60px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: '24px',
            color: isFocus ? 'rgba(255,255,255,0.85)' : isHoveredLine ? 'rgba(255,255,255,0.85)' : isUnderstood ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
            userSelect: 'none',
            transition: 'color 220ms ease',
            position: 'relative'
          }}
        >
          {(isHoveredLine || (isAiActive && isFirstFocusLine)) && (
            <span style={{ position: 'absolute', left: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>←</span>
          )}
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

  const getFileIcon = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.js') || lower.endsWith('.jsx')) return <span style={{color: '#E3B341', fontSize: '10px', fontWeight: 800, background: 'rgba(227,179,65,0.1)', padding: '2px 4px', borderRadius: '3px'}}>JS</span>;
    if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return <span style={{color: '#3178C6', fontSize: '10px', fontWeight: 800, background: 'rgba(49,120,198,0.1)', padding: '2px 4px', borderRadius: '3px'}}>TS</span>;
    if (lower.endsWith('.json')) return <span style={{color: '#F85149', fontSize: '11px', fontWeight: 800, background: 'rgba(248,81,73,0.1)', padding: '2px 4px', borderRadius: '3px'}}>{'{ }'}</span>;
    if (lower.endsWith('.md')) return <span style={{color: '#9CA3AF', fontSize: '11px', fontWeight: 800, background: 'rgba(156,163,175,0.1)', padding: '2px 4px', borderRadius: '3px'}}>MD</span>;
    if (lower.endsWith('.pdf')) return <span style={{color: '#EF4444', fontSize: '10px', fontWeight: 800, background: 'rgba(239,68,68,0.1)', padding: '2px 4px', borderRadius: '3px'}}>PDF</span>;
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.svg')) return <span style={{color: '#8B5CF6', fontSize: '10px', fontWeight: 800, background: 'rgba(139,92,246,0.1)', padding: '2px 4px', borderRadius: '3px'}}>IMG</span>;
    return <span style={{color: '#9CA3AF', fontSize: '10px', fontWeight: 800, background: 'rgba(156,163,175,0.1)', padding: '2px 4px', borderRadius: '3px'}}>{filename.split('.').pop().toUpperCase().substring(0, 2)}</span>;
  };

  const isUserViewing = !!userSelectedFile && (typeof userSelectedFile === 'string' ? userSelectedFile !== attention.file : userSelectedFile.path !== attention.file);

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full relative"
      style={{ background: 'var(--cs-editor)', gap: 0 }}
    >
      {/* ── Editor Header / Tab Bar ── */}
      <div className="flex flex-col flex-shrink-0" style={{ background: 'transparent' }}>
        <div
          className="flex items-center flex-shrink-0"
          style={{
            height: '52px',
            padding: '10px 16px 0',
            overflow: 'hidden'
          }}
        >
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-full w-full pb-2">
            {tabs.map(tab => {
              const isTabActive = tab.id === activeFile;
              const isAiFocusTab = tab.id === attention.file;
              return (
                <div
                  key={tab.id}
                  onClick={() => onSelectTab && onSelectTab(tab.id)}
                  className="flex items-center justify-center gap-2.5 px-4 cursor-pointer flex-shrink-0 group relative"
                    style={{
                      height: '34px',
                      color: isTabActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: isTabActive ? 500 : 400,
                      background: isTabActive
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.02)',
                      borderRadius: '8px 8px 0 0',
                      border: '1px solid',
                      borderColor: isTabActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                      borderBottom: 'none',
                      boxShadow: isTabActive
                        ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 12px rgba(0,0,0,0.4)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                      maxWidth: '160px',
                      minWidth: '60px',
                      transform: isTabActive ? 'translateY(-1px)' : 'translateY(0px)',
                      transition: 'all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                    onMouseEnter={e => {
                      if (!isTabActive) {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isTabActive) {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.transform = 'translateY(0px)';
                      }
                    }}
                >
                  {isAiFocusTab && (
                    <span style={{ color: 'var(--cs-accent)', fontSize: '9px', display: 'inline-block', flexShrink: 0, opacity: 0.8 }}>✦</span>
                  )}
                  {getFileIcon(tab.name)}
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
                      style={{ fontSize: '9px', marginLeft: '2px' }}
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

      {/* ── Reading Logic Panel — persistent floating glass surface ── */}
      <AnimatePresence>
        {isAiActive && (
          <motion.div
            key="reading-logic-panel"
            initial={{ opacity: 0, height: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, height: 'auto', scale: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flexShrink: 0,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
              margin: '10px 16px 12px 16px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '10px 20px',
              gap: '20px',
            }}>
              {/* Left: Label + reason */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ color: 'var(--cs-accent)', fontSize: '10px', flexShrink: 0, opacity: 0.9, marginTop: '1px' }}>✦</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>READING LOGIC</span>
                  <motion.div
                    key={attention.reason}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      fontSize: '12.5px',
                      fontFamily: 'var(--font-ui)',
                      color: 'rgba(255,255,255,0.82)',
                      lineHeight: '1.5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '520px',
                    }}
                  >
                    {attention.reason || 'Examining source...'}
                  </motion.div>
                </div>
              </div>
              {/* Right: file + line range */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(255,255,255,0.35)',
                }}>{
                  activeFile
                    ? activeFile.split('/').pop()
                    : ''
                }</span>
                {attention.startLine && attention.endLine && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(255,255,255,0.25)',
                  }}>Lines {attention.startLine}–{attention.endLine}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full file — Virtualized ── */}
      <div className="flex-1 overflow-hidden min-h-0 relative h-full w-full" ref={containerRef}>
        <AnimatePresence mode="wait">
        {!activeFile ? (
          <motion.div key="empty" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0.4}} className="absolute inset-0 flex flex-col items-center justify-center gap-2">
             {activeInvestigation ? (
                <InvestigationActivitySequence event={activeCognitiveEvent} investigationState={investigationState} />
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
            {/* Focus box rendering is now handled internally by the Row component slices to guarantee perfect pixel alignment and z-index ordering */}
            <List
              listRef={listRef}
              height={listHeight}
              rowCount={displayTokens.length}
              rowHeight={ROW_HEIGHT}
              onScroll={({ scrollOffset }) => setScrollOffset(scrollOffset)}
              rowComponent={Row}
              rowProps={{
                visibleRange,
                scrollSettled,
                isAiActive,
                isAiFocusing,
                aiLine,
                attention,
                hoverLine,
                hoverBlock
              }}
              width="100%"
              onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                visibleRangeRef.current = { start: visibleStartIndex, end: visibleStopIndex };
                if (visibleRange.start !== visibleStartIndex || visibleRange.end !== visibleStopIndex) {
                  setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
                }
              }}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* ── Status bar — user-viewing mode only ── */}
      {activeFile && isUserViewing ? (
        <div
          className="flex-shrink-0 flex items-center"
          style={{
            height: '32px',
            padding: '0 20px',
            background: 'rgba(0,0,0,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            zIndex: 10,
          }}
        >
          <div
            className="flex items-center min-w-0 flex-1 justify-between"
            style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--cs-muted)' }}
          >
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
