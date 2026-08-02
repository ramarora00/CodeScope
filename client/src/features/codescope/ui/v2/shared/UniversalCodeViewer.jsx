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
// AI OPACITY MODEL
// ─────────────────────────────────────────────────────────────────
function lineOpacity(dist, isAiActive) {
  if (!isAiActive) return 1.0;
  if (dist === 0) return 1.00;
  if (dist <= 2)  return 0.55;
  if (dist <= 4)  return 0.28;
  if (dist <= 6)  return 0.12;
  return 0.05;
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
  onSelectTab,
  onCloseTab,
  attention = {},
  insight,
  runtimeStatus,
  aiPhase = 'searching',
  memoryFiles = [],
  answer,
}) {
  const listRef = useRef(null);

  const activeFile = activeTabId || attention.file;
  const activeMemoryFile = memoryFiles.find(m => m.name === activeFile || m.file === activeFile);
  const content = activeMemoryFile?.content || (activeFile ? '// Loading file content...' : '');
  const language = activeMemoryFile?.language || 'javascript';

  const [tokenizedLines, setTokenizedLines] = useState([]);
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
    
    if (!content || !activeFile) {
      setTokenizedLines([]);
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

  const aiLine = attention.line ?? null;
  const isAiActive = runtimeStatus === 'reading' && !!aiLine && attention.file === activeFile;
  const isResolved = runtimeStatus === 'resolved';
  const confidence = isResolved ? 'High' : attention.type === 'insight' ? 'High' : 'Medium';

  // Softly scroll editor to keep AI focus visible — only on insight/jump, never on read
  useEffect(() => {
    if (!listRef.current || !aiLine) return;
    if (attention.type !== 'insight' && attention.type !== 'appear') return;
    listRef.current.scrollToRow ? listRef.current.scrollToRow(aiLine - 1) : listRef.current.scrollToItem(aiLine - 1, 'center');
  }, [aiLine, attention.type]);

  // react-window Row renderer
  const Row = ({ index, style }) => {
    const tokens = tokenizedLines[index];
    if (!tokens) return null;

    const lineNum = index + 1;
    const dist = aiLine ? Math.abs(lineNum - aiLine) : Infinity;
    const opacity = lineOpacity(dist, isAiActive);
    const isAiFocus = isAiActive && dist === 0;

    return (
      <div
        style={{
          ...style,
          opacity,
          display: 'flex',
          alignItems: 'center',
          transition: `opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
          borderLeft: isAiFocus
            ? '2px solid rgba(191,200,216,0.55)'
            : '2px solid transparent',
          background: isAiFocus
            ? 'linear-gradient(90deg, rgba(191,200,216,0.06) 0%, rgba(191,200,216,0.01) 60%, transparent 100%)'
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
            color: isAiFocus ? 'rgba(191,200,216,0.7)' : 'rgba(255,255,255,0.15)',
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
      {/* ── Hypothesis Pill ── */}
      {answer && runtimeStatus !== 'resolved' && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-fade-in flex items-center gap-2"
          style={{
            background: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--cs-border)',
            borderRadius: '16px',
            padding: '6px 14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            maxWidth: '80%',
          }}
        >
          <Sparkles size={12} className="text-[var(--cs-accent)] flex-shrink-0" />
          <span className="text-[12px] text-[var(--cs-text)] font-medium truncate">
            {answer}
          </span>
        </div>
      )}

      {/* ── Full file — Virtualized ── */}
      <div className="flex-1 overflow-hidden min-h-0 relative animate-crossfade h-full w-full" ref={containerRef}>
        {!activeFile ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
              Waiting for AI to open a file...
            </p>
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
                ref={listRef}
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
          height: '34px',
          padding: '0 24px',
          background: 'transparent',
          borderTop: '1px solid var(--cs-border)',
          zIndex: 10
        }}
      >
        <div
          className="flex items-center min-w-0 flex-1"
          style={{
            fontFamily: 'var(--cs-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.28)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            gap: 0,
          }}
        >
          {activeFile ? (
            <>
              <span style={{ color: isResolved ? 'rgba(255,255,255,0.35)' : isAiActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)' }}>
                {isResolved ? 'Analysis complete' : isAiActive ? 'Reading' : 'Ready'}
              </span>
              <span style={{ color: 'var(--cs-text)', fontWeight: 500, marginLeft: '5px' }}>{activeFile}</span>
              {aiLine && (
                <>
                  <span style={{ margin: '0 6px', opacity: 0.2 }}>·</span>
                  <span>Line {aiLine}/{tokenizedLines.length}</span>
                </>
              )}
              {attention.symbol && (
                <>
                  <span style={{ margin: '0 6px', opacity: 0.2 }}>·</span>
                  <span>Focus <span style={{ color: 'rgba(191,200,216,0.65)', fontWeight: 500 }}>{attention.symbol}</span></span>
                </>
              )}
              {(isAiActive || isResolved) && (
                <>
                  <span style={{ margin: '0 6px', opacity: 0.2 }}>·</span>
                  <span>Confidence <span style={{ color: confidence === 'High' ? 'rgba(63,185,80,0.8)' : 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{confidence}</span></span>
                </>
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
          style={{ height: '32px', borderTop: '1px solid var(--cs-border)', zIndex: 10 }}
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
