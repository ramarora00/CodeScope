import React, { useEffect, useRef, useState } from 'react';
import { MOCK_FILES } from '../../model/ClaudeRuntime';

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
// OPACITY MAP — cinematic non-linear falloff from read head
// ─────────────────────────────────────────────────────────────────
function lineOpacity(dist) {
  if (dist === 0) return 1.0;
  if (dist === 1) return 0.60;
  if (dist === 2) return 0.38;
  if (dist === 3) return 0.22;
  if (dist === 4) return 0.13;
  if (dist === 5) return 0.08;
  return 0.05;
}

// ─────────────────────────────────────────────────────────────────
// READING DOTS — replaces waveform in header
// ─────────────────────────────────────────────────────────────────
function ReadingDots({ active }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: active ? 'var(--cs-accent)' : 'var(--cs-faint)',
            animation: active ? `pulse-dot ${1.2 + i * 0.15}s ease-in-out infinite` : 'none',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OBSERVATION PANE — AI Vision Viewport
//   NOT an editor. 360px fixed. 32px padding. 17 visible lines.
//   NO line numbers. NO scrollbar. NO cursor. NO tabs.
//   Steep cinematic opacity falloff.
// ─────────────────────────────────────────────────────────────────
const WINDOW_RADIUS = 8; // 8 above + head + 8 below = 17 lines

export default function ObservationPane({ attention = {} }) {
  const [displayedFile, setDisplayedFile] = useState(null);
  const [lines, setLines] = useState([]);
  const [fading, setFading] = useState(false);
  const [jumpIndicator, setJumpIndicator] = useState(null);

  const prevFileRef = useRef(null);
  const jumpTimer = useRef(null);

  // File transition with cross-fade + slide
  useEffect(() => {
    const newFile = attention.file;
    if (!newFile) return;

    if (newFile !== prevFileRef.current) {
      const prev = prevFileRef.current;
      prevFileRef.current = newFile;

      if (prev) {
        setJumpIndicator(`← ${prev}`);
        clearTimeout(jumpTimer.current);
        jumpTimer.current = setTimeout(() => setJumpIndicator(null), 1800);
      }

      setFading(true);
      setTimeout(() => {
        setLines((MOCK_FILES[newFile] || '').split('\n'));
        setDisplayedFile(newFile);
        setFading(false);
      }, 180);
    }
  }, [attention.file]);

  const currentLine = attention.line ?? 1;
  const totalLines = lines.length;
  const isActive = !!attention.file;

  // 17-line sliding window
  const windowStart = Math.max(0, currentLine - 1 - WINDOW_RADIUS);
  const windowEnd   = Math.min(totalLines, currentLine - 1 + WINDOW_RADIUS + 1);
  const windowLines = lines.slice(windowStart, windowEnd);

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '360px',
        background: 'var(--cs-bg)',
        borderRight: '1px solid var(--cs-border)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-8"
        style={{ height: '48px', borderBottom: '1px solid var(--cs-border)' }}
      >
        <div className="flex flex-col justify-center">
          <span style={{
            color: 'var(--cs-faint)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Observation
          </span>
          <span style={{
            color: 'var(--cs-hint)',
            fontSize: '10px',
            fontStyle: 'italic',
            marginTop: '1px',
          }}>
            {isActive ? 'AI is reading...' : 'Waiting...'}
          </span>
        </div>

        {/* Reading dots indicator */}
        <ReadingDots active={isActive} />
      </div>

      {/* ── File name bar ── */}
      {displayedFile && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-8"
          style={{
            height: '36px',
            background: 'var(--cs-panel)',
            borderBottom: '1px solid var(--cs-border-subtle)',
          }}
        >
          <span style={{
            color: 'var(--cs-muted)',
            fontSize: '11.5px',
            fontFamily: 'var(--cs-mono)',
            fontWeight: 400,
          }}>
            {displayedFile}
          </span>
          <span style={{
            color: 'var(--cs-faint)',
            fontSize: '10px',
            fontFamily: 'var(--cs-mono)',
          }}>
            Line {currentLine} / {totalLines}
          </span>
        </div>
      )}

      {/* ── Jump indicator — appears briefly on file switch ── */}
      {jumpIndicator && (
        <div
          className="flex-shrink-0 animate-slide mx-8 mt-3"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'var(--cs-panel)',
            border: '1px solid var(--cs-border)',
          }}
        >
          <span style={{ color: 'var(--cs-faint)', fontSize: '10px', fontFamily: 'var(--cs-mono)' }}>
            {jumpIndicator}
          </span>
        </div>
      )}

      {/* ── Cinematic code viewport ── */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          paddingTop: '28px',
          paddingBottom: '28px',
          paddingLeft: '32px',
          paddingRight: '24px',
          opacity: fading ? 0 : 1,
          transition: 'opacity 180ms var(--ease-out)',
        }}
      >
        {!displayedFile ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <ReadingDots active={false} />
              <span style={{ color: 'var(--cs-hint)', fontSize: '11px', fontStyle: 'italic' }}>
                Waiting for AI...
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {windowLines.map((lineText, idx) => {
              const lineNum = windowStart + idx + 1;
              const isHead  = lineNum === currentLine;
              const dist    = Math.abs(lineNum - currentLine);
              const opacity = lineOpacity(dist);

              return (
                <div
                  key={`${displayedFile}-${lineNum}`}
                  className="flex items-center"
                  style={{
                    paddingTop:    isHead ? '6px' : '1.5px',
                    paddingBottom: isHead ? '6px' : '1.5px',
                    paddingLeft:   isHead ? '10px' : '12px',
                    opacity,
                    transition: 'opacity 300ms var(--ease-out)',
                    background: isHead ? 'rgba(191,200,216,0.04)' : 'transparent',
                    borderLeft: isHead
                      ? '2px solid var(--cs-accent-bar)'
                      : '2px solid transparent',
                    borderRadius: isHead ? '0 3px 3px 0' : '0',
                  }}
                >
                  {/* Read head symbol — ONLY on active line */}
                  {isHead && (
                    <span
                      className="flex-shrink-0 animate-read-blink"
                      style={{
                        fontFamily: 'var(--cs-mono)',
                        fontSize: '10px',
                        color: 'var(--cs-accent)',
                        marginRight: '10px',
                        lineHeight: '1.7',
                        userSelect: 'none',
                      }}
                    >
                      ▶
                    </span>
                  )}

                  {/* Code — NO line numbers, NOT an editor */}
                  <pre
                    style={{
                      flex: 1,
                      margin: 0, padding: 0,
                      fontFamily: 'var(--cs-mono)',
                      fontSize: '12px',
                      lineHeight: '1.7',
                      whiteSpace: 'pre',
                      overflow: 'hidden',
                      userSelect: 'none',
                      pointerEvents: 'none',
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

      {/* ── AI reading status — bottom ── */}
      <div
        className="flex-shrink-0 px-8"
        style={{
          borderTop: '1px solid var(--cs-border-subtle)',
          paddingTop: '10px',
          paddingBottom: '12px',
        }}
      >
        <div style={{
          color: 'var(--cs-faint)',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          AI Reading
        </div>
        {isActive ? (
          <div className="space-y-1">
            {[
              'Understanding token refresh logic...',
              'Following verify() call',
              'Looking for error handling',
            ].map((msg, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                  style={{
                    background: i === 0 ? 'var(--cs-accent)' : 'var(--cs-faint)',
                    animation: i === 0 ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
                  }}
                />
                <span style={{
                  color: i === 0 ? 'var(--cs-muted)' : 'var(--cs-faint)',
                  fontSize: '10.5px',
                  fontStyle: i > 0 ? 'italic' : 'normal',
                }}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: 'var(--cs-hint)', fontSize: '10.5px', fontStyle: 'italic' }}>Idle</span>
        )}
      </div>
    </div>
  );
}
