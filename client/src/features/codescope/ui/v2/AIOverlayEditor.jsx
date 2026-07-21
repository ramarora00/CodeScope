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
  if (!isAiActive) return 1.0;
  if (dist === 0) return 1.00;
  if (dist <= 2)  return 0.55;
  if (dist <= 4)  return 0.28;
  if (dist <= 6)  return 0.12;
  return 0.05;
}

// ─────────────────────────────────────────────────────────────────
// SEQUENTIAL READING DOTS
// Fills dots one-by-one like a loading sequence, not all pulsing together.
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
// CONFIDENCE BAR
// Displays as text percentage + subtle bar.
// ─────────────────────────────────────────────────────────────────
function Confidence({ level = 'High' }) {
  const pct = level === 'High' ? 97 : level === 'Medium' ? 68 : 42;
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>Confidence</span>
      <span style={{ color: 'var(--cs-text)', fontSize: '10px', fontWeight: 600 }}>{level}</span>
      <div style={{ width: '36px', height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: level === 'High' ? 'var(--cs-green)' : 'var(--cs-accent)',
          transition: 'width 600ms var(--ease-premium)',
        }} />
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
  aiPhase = 'searching',
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


      {/* ── Full file — AI overlay applied in-place ── */}
      <div ref={scrollRef} key={activeFile} className="flex-1 overflow-auto min-h-0 animate-crossfade">
        {!activeFile ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'var(--cs-hint)', fontSize: '12px', fontStyle: 'italic' }}>
              Waiting for AI to open a file...
            </p>
          </div>
        ) : (
          <div style={{ paddingTop: '40px', paddingBottom: '48px' }}>
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
                    opacity,
                    transition: `opacity 280ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
                    // Active line: 2px left border + wider soft glow background
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

                  {/* Code */}
                  <pre
                    style={{
                      flex: 1,
                      margin: 0,
                      padding: '0 24px 0 28px',
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '13px',
                      lineHeight: '24px',
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

      {/* ── Status bar — single flowing sentence ── */}
      <div
        className="flex-shrink-0 flex items-center"
        style={{
          height: '34px',
          padding: '0 24px',
          background: 'transparent',
          borderTop: '1px solid var(--cs-border)',
        }}
      >
        {/* Left — one continuous sentence */}
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
                  <span>Line {aiLine}/{lines.length}</span>
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

        {/* Right — reading dots, always pinned */}
        {activeFile && <ReadingDots active={isAiActive} />}
      </div>

      {/* ── Insight bar — no label, just signal ── */}
      {insight && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 animate-slide"
          style={{ height: '32px', borderTop: '1px solid var(--cs-border)' }}
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
