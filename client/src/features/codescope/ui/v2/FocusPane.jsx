import React, { useMemo } from 'react';
import { MOCK_FILES } from '../../model/ClaudeRuntime';
import { X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// SYNTAX HIGHLIGHTER
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
// READING DOTS — small moving indicators, replaces waveform
// ─────────────────────────────────────────────────────────────────
function ReadingDots({ active, count = 6 }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: active ? 'var(--cs-accent)' : 'var(--cs-hint)',
            animation: active ? `reading-wave ${0.8 + i * 0.1}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CONFIDENCE DISPLAY — filled silver squares
// ─────────────────────────────────────────────────────────────────
function Confidence({ level = 'High' }) {
  const filled = level === 'High' ? 5 : level === 'Medium' ? 3 : 2;
  return (
    <div className="flex items-center gap-1">
      <span style={{ color: 'var(--cs-faint)', fontSize: '10px', marginRight: '3px' }}>
        Confidence
      </span>
      <span style={{ color: 'var(--cs-accent)', fontSize: '10px', fontWeight: 700 }}>
        {level}
      </span>
      <div className="flex items-center gap-[2px] ml-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '8px',
              borderRadius: '2px',
              background: i < filled ? 'var(--cs-accent)' : 'var(--cs-border-strong)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FOCUS PANE — developer's editor, largest panel
// ─────────────────────────────────────────────────────────────────
export default function FocusPane({
  tabs = [],
  activeTabId,
  onSelectTab,
  onCloseTab,
  attention = {},
  insight,
  runtimeStatus,
}) {
  const activeFile = activeTabId || attention.file;
  const content = MOCK_FILES[activeFile] || '';
  const lines = useMemo(() => content.split('\n'), [content]);

  // Focus only scrolls when AI fires an insight or jump (not on every read)
  const highlightLine = (attention.type === 'insight' || attention.type === 'jump' || attention.type === 'appear')
    ? attention.line
    : null;

  const isResolved = runtimeStatus === 'resolved';
  const confidence = isResolved ? 'High' : attention.type === 'insight' ? 'High' : 'Medium';

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
                padding: '0 14px',
                gap: '8px',
                background: isActive ? 'var(--cs-editor)' : 'transparent',
                borderRight: '1px solid var(--cs-border)',
                borderBottom: isActive ? `2px solid var(--cs-accent-bar)` : '2px solid transparent',
                position: 'relative',
              }}
            >
              {/* AI-opened dot */}
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--cs-accent)' : 'var(--cs-faint)',
                  flexShrink: 0,
                }}
              />
              <span style={{
                color: isActive ? 'var(--cs-text)' : 'var(--cs-faint)',
                fontSize: '12px',
                fontFamily: 'var(--cs-mono)',
                fontWeight: isActive ? 500 : 400,
                lineHeight: '40px',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>
                {tab.name}
              </span>
              {isActive && (
                <button
                  onClick={e => { e.stopPropagation(); onCloseTab?.(tab.id); }}
                  className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{
                    width: '16px', height: '16px',
                    borderRadius: '3px',
                    color: 'var(--cs-faint)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
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

        {/* Add tab hint */}
        {tabs.length > 0 && (
          <div style={{
            height: '40px', padding: '0 12px',
            display: 'flex', alignItems: 'center',
            color: 'var(--cs-hint)', fontSize: '16px', lineHeight: 1,
            cursor: 'default',
          }}>
            +
          </div>
        )}
      </div>

      {/* ── Code editor ── */}
      <div className="flex-1 overflow-auto min-h-0 relative">
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
              const isHighlighted = highlightLine === lineNum;

              return (
                <div
                  key={lineNum}
                  className="flex items-start"
                  style={{
                    background: isHighlighted ? 'rgba(191,200,216,0.06)' : 'transparent',
                    borderLeft: isHighlighted
                      ? '2px solid rgba(191,200,216,0.50)'
                      : '2px solid transparent',
                    transition: 'background 220ms var(--ease-out), border-color 220ms var(--ease-out)',
                  }}
                >
                  {/* Line number */}
                  <span
                    className="flex-shrink-0 select-none text-right pr-4 pl-4"
                    style={{
                      width: '52px',
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '12px',
                      lineHeight: '22px',
                      color: isHighlighted ? 'var(--cs-muted)' : 'var(--cs-hint)',
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
                      padding: '0 24px 0 4px',
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '13px',
                      lineHeight: '22px',
                      whiteSpace: 'pre',
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

      {/* ── Bottom status bar ── */}
      <div
        className="flex-shrink-0 flex items-center gap-4 px-4 justify-between"
        style={{
          height: '30px',
          background: 'var(--cs-panel)',
          borderTop: '1px solid var(--cs-border)',
        }}
      >
        {/* Left: Reading status */}
        <div className="flex items-center gap-3">
          {activeFile && (
            <>
              <div className="flex items-center gap-2">
                <ReadingDots active={runtimeStatus === 'reading'} count={6} />
                <span style={{
                  color: 'var(--cs-faint)',
                  fontSize: '10.5px',
                  fontFamily: 'var(--cs-mono)',
                }}>
                  {isResolved ? 'Analysis complete' : 'Reading'}
                  {' · '}{activeFile}
                  {attention.line && ` · ${attention.line}`}
                  {lines.length > 0 && ` / ${lines.length}`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Confidence */}
        {(runtimeStatus === 'reading' || isResolved) && (
          <Confidence level={confidence} />
        )}
      </div>

      {/* ── Active insight bar ── */}
      {insight && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 animate-slide"
          style={{
            height: '32px',
            background: 'var(--cs-editor)',
            borderTop: '1px solid var(--cs-border)',
          }}
        >
          <span style={{ color: 'var(--cs-accent)', fontSize: '12px', flexShrink: 0 }}>✦</span>
          <span style={{
            color: 'var(--cs-faint)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.10em',
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
              fontFamily: 'var(--cs-sans)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
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
