import React, { useEffect, useRef } from 'react';
import { X, FileCode2, Loader2, CheckCircle2 } from 'lucide-react';

export default function MainWorkspace({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  repo,
  attention = {},
  fileContent = '',
  fileLoading = false,
  runtimeStatus = 'idle',
  resolveText = null
}) {
  const activeTab = tabs.find(t => t.id === activeTabId);
  const containerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Smooth-scroll the focused line to vertical center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [attention.line, attention.file]);

  // ── Lexical tokenizer (low-saturation Antigravity theme) ──
  const highlightSyntax = (text) => {
    if (!text) return '\u00A0'; // non-breaking space keeps line height

    const tokenRegex = /(\/\/.*)|(\/\*[\s\S]*?\*\/)|(["'`](?:\\.|[^"'`\\])*["'`])|(\b\d+\.?\d*\b)|(\b[A-Z][A-Z0-9_]+\b)|(\b\w+\b)/g;

    const keywords = new Set([
      'import', 'from', 'export', 'const', 'let', 'var', 'async',
      'function', 'await', 'return', 'if', 'else', 'try', 'catch',
      'new', 'class', 'extends', 'as', 'default', 'throw', 'typeof',
      'interface', 'type', 'null', 'undefined', 'true', 'false',
      'SELECT', 'FROM', 'WHERE', 'AND', 'INSERT', 'INTO', 'VALUES',
      'UPDATE', 'SET', 'RETURNING'
    ]);

    const builtins = new Set([
      'console', 'process', 'Promise', 'Error', 'setTimeout',
      'fetch', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String'
    ]);

    const parts = [];
    let lastIndex = 0;

    text.replace(tokenRegex, (m, comment, blockComment, str, num, constant, word, offset) => {
      if (offset > lastIndex) {
        parts.push(text.slice(lastIndex, offset));
      }

      if (comment || blockComment) {
        parts.push(
          <span key={offset} className="text-[#4a5260] italic">{m}</span>
        );
      } else if (str) {
        parts.push(
          <span key={offset} className="text-[#7fa58a]">{m}</span>
        );
      } else if (num) {
        parts.push(
          <span key={offset} className="text-[#8b8475]">{m}</span>
        );
      } else if (constant) {
        // ALL_CAPS constants
        parts.push(
          <span key={offset} className="text-[#c4a882]">{m}</span>
        );
      } else if (word) {
        if (keywords.has(m)) {
          parts.push(
            <span key={offset} className="text-[#8b8dee] font-medium">{m}</span>
          );
        } else if (builtins.has(m)) {
          parts.push(
            <span key={offset} className="text-[#8e97a8]">{m}</span>
          );
        } else {
          parts.push(m);
        }
      }

      lastIndex = offset + m.length;
      return m;
    });

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return <>{parts}</>;
  };

  // ── Resolve code lines ──
  const getCodeLines = () => {
    if (fileLoading) return [];
    if (fileContent && fileContent.trim()) {
      return fileContent.split('\n').map((line, idx) => ({
        num: String(idx + 1).padStart(2, ' '),
        text: line
      }));
    }
    return [];
  };

  const lines = getCodeLines();

  // ── Compute per-line opacity based on attention focus ──
  const getLineOpacity = (lineNum) => {
    if (!attention?.file || !attention?.line || attention.file !== activeTab?.name) {
      return 1.0; // No active attention — show all
    }
    const distance = Math.abs(lineNum - attention.line);
    if (distance === 0) return 1.0;
    if (distance <= 1) return 0.65;
    if (distance <= 3) return 0.30;
    if (distance <= 6) return 0.12;
    return 0.04;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#05070B] h-full overflow-hidden select-text relative z-10 font-mono text-[13px] leading-[1.7]">

      {/* ── Tab Bar ── */}
      <div className="h-9 border-b border-white/5 bg-[#0a0a0b] flex items-center px-1.5 select-none overflow-x-auto custom-scrollbar gap-0.5 flex-shrink-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`h-7 px-2.5 rounded-sm flex items-center gap-2 text-[11px] font-mono border-t border-x cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-[#05070B] border-white/[0.07] text-[#e9e9ea]'
                  : 'bg-[#0a0a0b] border-transparent text-[#5f5f63] hover:text-[#a0a0a8] hover:bg-white/[0.02]'
              }`}
            >
              {tab.openedByAI && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#8b8dee] opacity-80"
                  title="Opened by AI"
                />
              )}
              <span className="truncate max-w-[120px]">{tab.name.split('/').pop()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-white/10 text-[#3a3a3e] hover:text-[#8e97a8] transition-colors"
              >
                <X size={9} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Breadcrumb path ── */}
      {activeTab && (
        <div className="h-7 px-4 border-b border-white/[0.03] bg-[#070910] flex items-center gap-1.5 text-[10px] font-mono text-[#3a3a3e] flex-shrink-0 select-none">
          <span className="text-[#2a2a2e]">src</span>
          <span>/</span>
          <span className="text-[#3a3a3e]">middleware</span>
          <span>/</span>
          <span className="text-[#7a7a7f]">{activeTab.name.split('/').pop()}</span>
        </div>
      )}

      {/* ── Editor Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-[#05070B] relative scroll-smooth"
        style={{ paddingTop: '40px', paddingBottom: '80px' }}
      >
        {fileLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#3a3a3e] gap-2 select-none">
            <Loader2 className="animate-spin text-[#8b8dee]" size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Reading source…</span>
          </div>
        ) : lines.length > 0 ? (
          <div className="w-full flex flex-col">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActiveLine = (
                attention?.file === activeTab?.name &&
                attention?.line === lineNum
              );
              const opacity = getLineOpacity(lineNum);
              const isSymbolLine = (
                attention?.symbol &&
                attention?.file === activeTab?.name &&
                attention?.line === lineNum
              );

              return (
                <div
                  key={idx}
                  ref={isActiveLine ? activeLineRef : null}
                  className="flex items-start w-full transition-all duration-500 ease-out"
                  style={{
                    opacity,
                    backgroundColor: isActiveLine
                      ? 'rgba(139, 141, 238, 0.05)'
                      : 'transparent',
                    borderLeft: isActiveLine
                      ? '2px solid rgba(139, 141, 238, 0.6)'
                      : '2px solid transparent'
                  }}
                >
                  {/* Line number gutter */}
                  <span
                    className="flex-shrink-0 w-12 pr-5 text-right select-none text-[10.5px] pt-px"
                    style={{
                      color: isActiveLine ? '#8b8dee' : '#2d2d32',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {lineNum}
                  </span>

                  {/* Code text */}
                  <pre
                    className="flex-1 m-0 p-0 whitespace-pre overflow-x-visible"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      lineHeight: '1.7',
                      color: isActiveLine ? '#e9e9ea' : '#7a7f8a',
                      paddingRight: '24px'
                    }}
                  >
                    <code>{highlightSyntax(line.text)}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        ) : (
          !fileLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center select-none space-y-3">
              <div className="w-8 h-8 rounded bg-white/[0.02] border border-white/5 flex items-center justify-center text-[#3a3a3e]">
                <FileCode2 size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="text-[12px] font-medium text-[#5f5f63]">No active file</h4>
                <p className="text-[10.5px] text-[#3a3a3e] font-sans leading-relaxed max-w-[200px]">
                  Select a file from the Explorer or wait for the AI to begin.
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Attention Status Bar ── */}
      <div className="h-7 border-t border-white/[0.04] bg-[#080a0f] px-4 flex items-center justify-between text-[10px] font-mono flex-shrink-0 select-none">
        {/* Left: file + line */}
        <div className="flex items-center gap-2 text-[#3a3a3e]">
          {attention?.file && (
            <>
              <span className="text-[#8b8dee] font-semibold text-[9.5px] uppercase tracking-wider">
                {runtimeStatus === 'reading' ? 'reading' : runtimeStatus === 'resolved' ? 'resolved' : 'focus'}
              </span>
              <span className="text-[#5f5f63]">{attention.file}</span>
              {attention.line && (
                <>
                  <span className="text-[#2a2a2e]">:</span>
                  <span className="text-[#5f5f63]">L{attention.line}</span>
                </>
              )}
              {attention.symbol && (
                <>
                  <span className="text-[#2a2a2e]">·</span>
                  <span className="text-[#8b8dee]">{attention.symbol}</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Right: reason text */}
        {attention?.reason && (
          <div className="truncate max-w-[380px] text-right text-[#3d4050] italic font-sans">
            {attention.reason}
          </div>
        )}
      </div>

      {/* ── Resolve Panel ── */}
      {runtimeStatus === 'resolved' && resolveText && (
        <div className="border-t border-[#8b8dee]/10 bg-[#080b12] px-5 py-4 flex-shrink-0">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={14} className="text-[#5aa876] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-[9.5px] font-bold uppercase tracking-widest text-[#5aa876]">
                Analysis Complete
              </div>
              <p className="text-[11.5px] text-[#8e97a8] leading-relaxed font-sans max-w-[580px]">
                {resolveText}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
