import React, { useState } from 'react';
import { Check, ChevronRight, GitBranch, Workflow, TestTube, Send } from 'lucide-react';

const FINDINGS_FILES = [
  { name: 'auth.middleware.ts', active: true },
  { name: 'jwt.service.ts' },
  { name: 'session.guard.ts' },
  { name: 'token.refresh.ts' },
  { name: 'user.repository.ts' },
];

const RELATED = [
  { symbol: 'verifyToken()',     file: 'auth',    line: 42  },
  { symbol: 'TokenExpiredError', file: 'jwt',     line: 13  },
  { symbol: 'refreshSession()',  file: 'refresh', line: 28  },
  { symbol: 'SessionGuard',      file: 'session', line: 8   },
  { symbol: 'JwtPayload',        file: 'jwt',     line: 4   },
];

const ACTIONS = [
  { id: 'dep-map',  icon: GitBranch,  label: 'View dependency map' },
  { id: 'explain',  icon: Workflow,   label: 'Explain this flow'   },
  { id: 'tests',    icon: TestTube,   label: 'Generate test cases' },
];

function SectionHeader({ label }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <span style={{
        color: 'var(--cs-faint)',
        fontSize: '9px',
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function KnowledgePanel() {
  const [askQuery, setAskQuery] = useState('');

  const handleAction = (id) => {
    console.log('action:', id);
  };

  const handleAsk = (e) => {
    e.preventDefault();
    if (askQuery.trim()) setAskQuery('');
  };

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '310px',
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
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Knowledge
        </span>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded"
          style={{ background: 'var(--cs-editor)', border: '1px solid var(--cs-border)' }}
        >
          <span style={{ color: 'var(--cs-accent)', fontSize: '10px' }}>✦</span>
          <span style={{ color: 'var(--cs-muted)', fontSize: '10px', fontWeight: 500 }}>
            Sourcegraph MCP
          </span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">

        {/* ── FINDINGS ── */}
        <div style={{ padding: '24px 24px 0' }}>
          <SectionHeader label="Findings" />

          {/* Denser file list */}
          <div className="space-y-0">
            {FINDINGS_FILES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded cursor-pointer transition-colors duration-[220ms]"
                style={{ height: '24px', padding: '0 4px', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cs-editor)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {f.active ? (
                  <Check size={10} style={{ color: 'var(--cs-green)', flexShrink: 0 }} />
                ) : (
                  <span style={{ color: 'transparent', width: '10px', display: 'inline-block' }} />
                )}
                <span style={{
                  color: f.active ? 'var(--cs-text)' : 'var(--cs-muted)',
                  fontSize: '11px',
                  fontFamily: 'var(--cs-mono)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RELATED SYMBOLS ── */}
        <div style={{ padding: '32px 24px 0' }}>
          <SectionHeader label="Related Symbols" />
          <div className="space-y-0">
            {RELATED.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded cursor-pointer transition-colors duration-[220ms]"
                style={{ height: '24px', padding: '0 4px', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--cs-editor)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-[8px] h-[8px] rounded-full border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: 'var(--cs-hint)' }}
                  />
                  <span style={{
                    color: 'var(--cs-text)',
                    fontSize: '11px',
                    fontFamily: 'var(--cs-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.symbol}
                  </span>
                </div>
                <span style={{ color: 'var(--cs-hint)', fontSize: '9.5px', fontFamily: 'var(--cs-mono)', flexShrink: 0 }}>
                  {item.file}:{item.line}
                </span>
              </div>
            ))}
          </div>
          
          <button style={{
            color: 'var(--cs-accent)',
            fontSize: '10px',
            fontFamily: 'var(--cs-sans)',
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            padding: '12px 4px 0',
            cursor: 'pointer',
          }}>
            View all references →
          </button>
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ padding: '32px 24px 24px' }}>
          <SectionHeader label="Actions" />
          <div className="space-y-2">
            {ACTIONS.map(action => (
              <div
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="flex items-center gap-3 cursor-pointer transition-colors duration-[220ms] group"
                style={{
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--cs-border)',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--cs-editor)';
                  e.currentTarget.style.borderColor = 'rgba(191,200,216,0.18)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--cs-border)';
                }}
              >
                <action.icon size={12} style={{ color: 'var(--cs-hint)' }} className="group-hover:text-[var(--cs-faint)] transition-colors" />
                <span style={{ color: 'var(--cs-muted)', fontSize: '11.5px', transition: 'color 150ms ease' }} className="group-hover:text-[var(--cs-text)]">
                  {action.label}
                </span>
              </div>
            ))}
          </div>
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
            placeholder="Ask Coding Agent..."
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
            <Send size={12} />
          </button>
        </div>
        
        {/* Model selector */}
        <div className="mt-3 flex items-center justify-between px-1">
          <span style={{ color: 'var(--cs-hint)', fontSize: '10px' }}>Claude 3.7 Sonnet ⌄</span>
        </div>
      </form>
    </div>
  );
}
