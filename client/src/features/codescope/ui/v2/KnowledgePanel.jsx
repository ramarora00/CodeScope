import React, { useState } from 'react';
import { Check, ChevronRight, GitBranch, Workflow, TestTube, Send } from 'lucide-react';

const ACTIONS = [
  { id: 'dep-map',  icon: GitBranch,  label: 'View dependency map' },
  { id: 'explain',  icon: Workflow,   label: 'Explain this flow'   },
  { id: 'tests',    icon: TestTube,   label: 'Generate test cases' },
];

function SectionHeader({ label }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <span style={{
        color: 'rgba(255,255,255,0.07)',
        fontSize: '8.5px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function KnowledgePanel({ 
  repo, 
  findings = [], 
  relatedSymbols = [], 
  onNewInvestigation, 
  selectedFile,
  selectedTimelineEventId,
  onReturnToPresent 
}) {
  const [askQuery, setAskQuery] = useState('');
  const [activeTab, setActiveTab] = useState('repository'); // 'repository' or 'investigation'

  const activeFilePath = typeof selectedFile === 'string' ? selectedFile : selectedFile?.path;
  const displayFindings = activeFilePath
    ? findings.filter(f => f.filePath === activeFilePath)
    : findings;

  const handleAction = (id) => {
    console.log(`KnowledgePanel action clicked: ${id}`);
  };

  const handleAsk = (e) => {
    e.preventDefault();
    if (askQuery.trim() && onNewInvestigation) {
      onNewInvestigation(askQuery.trim());
      setAskQuery('');
    }
  };

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: '310px',
        background: 'var(--cs-panel)',
      }}
    >
      {/* ── Header with Tabs ── */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{ borderBottom: '1px solid var(--cs-border)' }}
      >
        <div className="flex items-center justify-between px-5" style={{ height: '40px' }}>
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
        
        {/* Tabs */}
        <div className="flex px-5 gap-4">
          <button
            onClick={() => setActiveTab('repository')}
            style={{
              paddingBottom: '8px',
              fontSize: '11px',
              color: activeTab === 'repository' ? 'var(--cs-text)' : 'var(--cs-muted)',
              borderBottom: activeTab === 'repository' ? '2px solid var(--cs-accent)' : '2px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'repository' ? 600 : 400
            }}
          >
            Repository
          </button>
          <button
            onClick={() => setActiveTab('investigation')}
            style={{
              paddingBottom: '8px',
              fontSize: '11px',
              color: activeTab === 'investigation' ? 'var(--cs-text)' : 'var(--cs-muted)',
              borderBottom: activeTab === 'investigation' ? '2px solid var(--cs-accent)' : '2px solid transparent',
              background: 'transparent',
              fontWeight: activeTab === 'investigation' ? 600 : 400
            }}
          >
            Investigation
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        
        {activeTab === 'repository' && (
          <div style={{ padding: '24px' }} className="flex flex-col gap-6 animate-fade-in">
            {/* ── REPOSITORY OVERVIEW ── */}
            <div>
              <SectionHeader label="Repository Context" />
              <div className="text-sm font-bold text-[var(--cs-text)] font-mono truncate">{repo?.name || 'Workspace'}</div>
              {repo?.repositorySummary && (
                <div className="text-[11px] text-[var(--cs-muted)] mt-2 leading-relaxed italic">
                  {repo.repositorySummary}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border flex flex-col" style={{ borderColor: 'var(--cs-border)', background: 'rgba(255,255,255,0.01)' }}>
                <span className="text-[10px] text-[var(--cs-hint)] uppercase tracking-wider">Total Files</span>
                <span className="text-lg font-mono text-[var(--cs-text)] font-bold mt-1">
                  {repo?.fileCount || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg border flex flex-col" style={{ borderColor: 'var(--cs-border)', background: 'rgba(255,255,255,0.01)' }}>
                <span className="text-[10px] text-[var(--cs-hint)] uppercase tracking-wider">Framework</span>
                <span className="text-lg font-mono text-[var(--cs-text)] font-bold mt-1">
                  {repo?.framework || 'Unknown'}
                </span>
              </div>
            </div>

            {/* ── ACTIONS ── */}
            <div style={{ marginTop: '16px' }}>
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
                      borderRadius: '12px',
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
        )}

        {activeTab === 'investigation' && (
          <div style={{ padding: '24px 0' }} className="flex flex-col gap-6 animate-fade-in">
            {selectedTimelineEventId ? (
              /* ── TIMELINE EVENT CONTEXT ── */
              <div style={{ padding: '0 24px' }}>
                <SectionHeader label="Historical Context" />
                <div className="text-[13px] text-[var(--cs-text)] leading-relaxed">
                  Viewing investigation state at this past moment. 
                </div>
                <button 
                  onClick={onReturnToPresent}
                  className="mt-4 text-[11px] text-[var(--cs-accent)] hover:underline"
                >
                  Return to present
                </button>
              </div>
            ) : (
              <>
                {/* ── FILE CONTEXT (IF FILE SELECTED) ── */}
                {activeFilePath && (
                  <div style={{ padding: '0 24px' }}>
                    <SectionHeader label="File Focus" />
                    <div className="text-sm font-bold text-[var(--cs-text)] font-mono truncate">{activeFilePath.split('/').pop()}</div>
                    <div className="text-[10px] text-[var(--cs-hint)] font-mono mt-1 truncate">{activeFilePath}</div>
                  </div>
                )}

                {/* ── FINDINGS ── */}
                <div style={{ padding: '0 24px' }}>
                  <SectionHeader label={activeFilePath ? `Evidence for File` : "Investigation Evidence"} />

                  <div className="space-y-0">
                    {displayFindings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[var(--cs-border)] rounded-lg mt-2">
                        <Workflow size={16} className="text-[var(--cs-hint)] mb-2" />
                        <div style={{ color: 'var(--cs-muted)', fontSize: '11px', textAlign: 'center' }}>
                          No AI findings for this context yet.
                        </div>
                      </div>
                    ) : displayFindings.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded cursor-pointer transition-colors duration-[220ms]"
                        style={{ height: '28px', padding: '0 4px', borderRadius: '4px' }}
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
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── RELATED SYMBOLS ── */}
                <div style={{ padding: '0 24px' }}>
                  <SectionHeader label="Related Symbols" />
                  <div className="space-y-0">
                    {relatedSymbols.length === 0 ? (
                      <div style={{ color: 'var(--cs-muted)', fontSize: '11px', padding: '12px 0' }}>
                        No related symbols identified.
                      </div>
                    ) : relatedSymbols.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded cursor-pointer transition-colors duration-[220ms]"
                        style={{ height: '28px', padding: '0 4px', borderRadius: '4px' }}
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
                </div>
              </>
            )}
          </div>
        )}
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
