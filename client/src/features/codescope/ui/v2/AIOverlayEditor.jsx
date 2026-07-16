import React, { useMemo, useRef, useEffect } from 'react';
import { MOCK_FILES } from '../../model/ClaudeRuntime';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// SYNTAX TOKENIZER
// ─────────────────────────────────────────────────────────────────
const KEYWORDS = new Set([
  'import','export','from','as','default','const','let','var',
  'async','await','function','return','throw','new','if','else',
  'try','catch','for','while','in','of','class','extends',
  'implements','interface','type','private','public','protected',
  'readonly','static','null','undefined','true','false','void','typeof',
]);
const TYPE_WORDS = new Set([
  'Injectable','NestMiddleware','Request','Response','NextFunction',
  'CanActivate','ExecutionContext','Reflector','ConfigService',
  'Promise','string','number','boolean','any','never','unknown',
  'JwtPayload','JwtService','SessionService','UserRepository',
  'TokenExpiredError','NestJwtService','TokenRefreshService',
]);

function tokenize(text) {
  if (text == null) return [{ kind: 'text', value: '' }];
  const t = text.trim();
  if (t.startsWith('//') || t.startsWith('* ') || t === '*' || t.startsWith('/*') || t.startsWith('*/')) {
    return [{ kind: 'comment', value: text }];
  }
  if (t.startsWith('@')) {
    const at = text.indexOf('@');
    return [{ kind: 'text', value: text.slice(0, at) }, { kind: 'decorator', value: text.slice(at) }];
  }
  const tokens = [];
  const re = /(\/\/.*|\/\*[\s\S]*?\*\/)|(["'`](?:\\.|[^"'`\\])*["'`])|(\b\d+\.?\d*\b)|(\b[A-Za-z_$][A-Za-z0-9_$]*\b)|(=>|===|!==|==|!=|>=|<=|&&|\|\||[+\-*/%!=<>&|])|([{}()[\],;:.])/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: text.slice(last, m.index) });
    const [full, comment, str, num, word, op, punct] = m;
    if (comment)    tokens.push({ kind: 'comment',  value: full });
    else if (str)   tokens.push({ kind: 'string',   value: full });
    else if (num)   tokens.push({ kind: 'number',   value: full });
    else if (word)  tokens.push({ kind: KEYWORDS.has(word) ? 'keyword' : TYPE_WORDS.has(word) ? 'type' : 'ident', value: word });
    else if (op)    tokens.push({ kind: 'operator', value: full });
    else if (punct) tokens.push({ kind: 'punct',    value: full });
    last = m.index + full.length;
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) });
  return tokens;
}

const KIND_COLORS = {
  keyword:   'var(--syn-keyword)',
  string:    'var(--syn-string)',
  number:    'var(--syn-number)',
  comment:   'var(--syn-comment)',
  type:      'var(--syn-type)',
  decorator: 'var(--syn-decorator)',
  operator:  'var(--syn-operator)',
  punct:     'var(--syn-punct)',
  ident:     'var(--syn-default)',
  text:      'var(--syn-default)',
};

// ─────────────────────────────────────────────────────────────────
// AI OPACITY MODEL
// When AI is reading: lines fade based on distance from focus.
// When AI is idle/resolved: all lines at full opacity.
// Code never moves — only AI attention moves.
// ─────────────────────────────────────────────────────────────────
function lineOpacity(dist, isAiActive) {
  if (!isAiActive) return 1.0;           // AI done → everything fully visible
  if (dist === 0) return 1.00;           // Focus line — full
  if (dist <= 2)  return 0.75;           // Close — still readable
  if (dist <= 4)  return 0.45;           // Medium distance — dimming
  if (dist <= 6)  return 0.22;           // Far — clearly faded
  return 0.10;                           // Very far — near-invisible
}

// ─────────────────────────────────────────────────────────────────
// READING DOTS
// ─────────────────────────────────────────────────────────────────
function ReadingDots({ active }) {
  return (
    <div className="flex items-center gap-[4px] px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: active ? 'var(--cs-accent)' : 'var(--cs-border)',
            opacity: active ? 0.4 + (i * 0.15) : 1,
            animation: active ? `pulse 1.5s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CONFIDENCE BAR
// ─────────────────────────────────────────────────────────────────
function Confidence({ level = 'High' }) {
  const filled = level === 'High' ? 4 : level === 'Medium' ? 2 : 1;
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--cs-hint)', fontSize: '10px' }}>
        Confidence <span style={{ color: 'var(--cs-text)', fontWeight: 600 }}>{level}</span>
      </span>
      <div className="flex items-center gap-[2px]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            width: '6px', height: '10px', borderRadius: '1px',
            background: i < filled ? 'var(--cs-green)' : 'rgba(191,200,216,0.12)',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI OVERLAY EDITOR
//
// This is the merged Observation + Focus component.
// The full file is always shown (developer view).
// AI reading creates an OVERLAY inside the same editor:
//   - Lines near AI focus: full opacity
//   - Lines far from AI: gently faded
//   - Read head: 2px left silver border on exact AI line
//   - Code never scrolls for AI — only AI attention indicator moves
//   - Developer can scroll freely (their view is independent)
// ─────────────────────────────────────────────────────────────────
export default function AIOverlayEditor({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  attention = {},
  insight,
  runtimeStatus,
}) {
  const scrollRef = useRef(null);

  const activeFile = activeTabId || attention.file;
  const content = MOCK_FILES[activeFile] || '';
  const lines = useMemo(() => content.split('\n'), [content]);

  const aiLine = attention.line ?? null;
  const isAiActive = runtimeStatus === 'reading' && !!aiLine && attention.file === activeFile;
  const isResolved = runtimeStatus === 'resolved';
  const confidence = isResolved ? 'High' : attention.type === 'insight' ? 'High' : 'Medium';

  // Softly scroll editor to keep AI focus visible — only on insight/jump, never on read
  useEffect(() => {
    if (!scrollRef.current || !aiLine) return;
    if (attention.type !== 'insight' && attention.type !== 'appear') return;
    const lineHeight = 22;
    const container = scrollRef.current;
    const target = (aiLine - 1) * lineHeight;
    const offset = container.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target - offset), behavior: 'smooth' });
  }, [aiLine, attention.type]);

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full"
      style={{ background: 'var(--cs-editor)' }}
    >
      {/* ── Tab bar ── */}
      <div
        className="flex items-end flex-shrink-0 overflow-x-auto no-scrollbar"
        style={{
          height: '40px',
          background: 'var(--cs-panel)',
          borderBottom: '1px solid var(--cs-border)',
        }}
      >
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab?.(tab.id)}
              className="flex items-center flex-shrink-0 cursor-pointer group transition-colors duration-[220ms]"
              style={{
                height: '40px',
                padding: '0 26px 0 24px',
                gap: '10px',
                background: isActive ? 'var(--cs-editor)' : 'transparent',
                borderRight: '1px solid var(--cs-border)',
                borderBottom: isActive ? '1px solid var(--cs-accent-bar)' : '1px solid transparent',
              }}
            >
              {/* Silver dot — AI opened this file */}
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: isActive ? 'var(--cs-accent)' : 'rgba(191,200,216,0.20)',
                flexShrink: 0,
              }} />

              <span style={{
                color: isActive ? 'var(--cs-text)' : 'var(--cs-faint)',
                fontSize: '12px',
                fontFamily: 'var(--cs-mono)',
                fontWeight: isActive ? 500 : 400,
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>
                {tab.name}
              </span>

              {isActive && (
                <button
                  onClick={e => { e.stopPropagation(); onCloseTab?.(tab.id); }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150"
                  style={{
                    width: '14px', height: '14px', borderRadius: '3px',
                    color: 'var(--cs-faint)', background: 'transparent', border: 'none', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--cs-panel-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
        {tabs.length > 0 && (
          <div style={{
            height: '40px', padding: '0 14px', display: 'flex', alignItems: 'center',
            color: 'var(--cs-hint)', fontSize: '16px', lineHeight: 1, cursor: 'default',
          }}>+</div>
        )}
      </div>

      {/* ── Full file — AI overlay applied in-place ── */}
      <div ref={scrollRef} className="flex-1 overflow-auto min-h-0">
        {!activeFile ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
              Waiting for AI to open a file...
            </p>
          </div>
        ) : (
          <div style={{ paddingTop: '16px', paddingBottom: '40px' }}>
            {lines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const dist = aiLine ? Math.abs(lineNum - aiLine) : Infinity;
              const opacity = lineOpacity(dist, isAiActive);
              const isAiFocus = isAiActive && dist === 0;

              return (
                <div
                  key={`${activeFile}-${lineNum}`}
                  className="flex items-start"
                  style={{
                    // Smooth opacity transition — AI attention shifts line by line
                    opacity,
                    transition: 'opacity 300ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                    // Read head: thin silver left border on exact AI focus line
                    borderLeft: isAiFocus
                      ? '2px solid rgba(191,200,216,0.55)'
                      : '2px solid transparent',
                    background: isAiFocus
                      ? 'rgba(191,200,216,0.02)'
                      : 'transparent',
                    transition: `opacity 300ms cubic-bezier(0.22, 0.61, 0.36, 1),
                                 background 300ms ease,
                                 border-color 300ms ease`,
                  }}
                >
                  {/* Line number */}
                  <span
                    className="flex-shrink-0 select-none text-right pr-5 pl-4"
                    style={{
                      width: '52px',
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '12px',
                      lineHeight: '22px',
                      color: isAiFocus ? 'var(--cs-accent)' : 'var(--cs-hint)',
                      userSelect: 'none',
                      transition: 'color 220ms ease',
                    }}
                  >
                    {lineNum}
                  </span>

                  {/* Code */}
                  <pre
                    style={{
                      flex: 1,
                      margin: 0,
                      padding: '0 24px 0 24px',
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '13px',
                      lineHeight: '22px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {tokenize(lineText).map((tok, i) => (
                      <span
                        key={i}
                        style={{
                          color: KIND_COLORS[tok.kind] || 'var(--syn-default)',
                          fontStyle: tok.kind === 'comment' ? 'italic' : 'normal',
                        }}
                      >
                        {tok.value}
                      </span>
                    ))}
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5"
        style={{
          height: '34px',
          background: 'var(--cs-panel)',
          borderTop: '1px solid var(--cs-border)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          {activeFile && (
            <div className="flex items-center gap-2">
              <span style={{
                color: 'var(--cs-faint)',
                fontSize: '11px',
                fontFamily: 'var(--cs-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <span>{isResolved ? 'Analysis complete' : isAiActive ? 'Reading' : 'Ready'}</span>
                <span style={{ color: 'var(--cs-text)' }}>{activeFile}</span>
                {aiLine && <span style={{ color: 'var(--cs-hint)' }}>Line {aiLine} / {lines.length}</span>}
              </span>
            </div>
          )}
        </div>

        {/* Center Dots */}
        {activeFile && <ReadingDots active={isAiActive} />}

        {/* Right */}
        {(isAiActive || isResolved) && <Confidence level={confidence} />}
      </div>

      {/* ── Active insight bar ── */}
      {insight && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 animate-slide"
          style={{
            height: '36px',
            background: 'var(--cs-editor)',
            borderTop: '1px solid var(--cs-border)',
          }}
        >
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: '16px' }}>
            <span style={{ color: 'var(--cs-accent)', fontSize: '13px' }}>✦</span>
          </div>
          <span style={{
            color: 'var(--cs-text)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            Active Insight
          </span>
          <span style={{
            color: 'var(--cs-muted)',
            fontSize: '11.5px',
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
              fontSize: '10.5px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--cs-sans)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cs-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--cs-faint)'}
          >
            View dependency map →
          </button>
        </div>
      )}
    </div>
  );
}
