import React from 'react';
import { FileText, ChevronDown, ListChecks, FileCode2, RefreshCw } from 'lucide-react';

/**
 * InvestigationReportSheet
 *
 * Mounts ONLY when investigation is terminal (PerspectiveRouter.isReadingComplete gate).
 * Cinematic slide-up entrance. Content immediately in concluded state.
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return (
    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', lineHeight: '1.7', color: 'var(--cs-text)' }}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const content = match[2];
            const style = level === 1
              ? { fontSize: '15px', fontWeight: 600, color: 'var(--cs-text)', marginTop: '24px', marginBottom: '8px' }
              : level === 2
                ? { fontSize: '13px', fontWeight: 600, color: 'var(--cs-text)', marginTop: '20px', marginBottom: '6px' }
                : { fontSize: '12px', fontWeight: 600, color: 'var(--cs-muted)', marginTop: '16px', marginBottom: '4px' };
            return <div key={index} style={style}>{content}</div>;
          }
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n[-*]\s+/).map(item => item.replace(/^[-*]\s+/, '').trim());
          return (
            <ul key={index} style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px' }}>
              {items.map((item, itemIdx) => (
                <li key={itemIdx} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px', lineHeight: '1.6' }}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} style={{ color: 'var(--cs-text)', marginBottom: '12px', lineHeight: '1.7' }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function InvestigationReportSheet({ answer, error, findings = [], providerUsed, onClose, onRetryInvestigation, query }) {
  const consultedFiles = [...new Set(
    findings
      .map(f => f.filePath?.split(/[\\/]/).pop())
      .filter(Boolean)
  )];

  // Guard: never render without content
  if (!answer && !error && findings.length === 0) return null;

  return (
    <>
      {/* Backdrop handled by PerspectiveRouter */}

      {/* Report sheet — slides up cinematically */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col animate-slide-up-report"
        style={{
          height: '68%',
          background: 'var(--cs-glass-report)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--cs-border-strong)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.6), var(--cs-inset-top)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start justify-between flex-shrink-0"
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex flex-col" style={{ gap: '3px' }}>
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--cs-text)',
              letterSpacing: '-0.01em',
            }}>
              Investigation Report
            </span>
            {query && (
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '12px',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--cs-muted)',
                lineHeight: 1.5,
              }}>
                {query}
              </span>
            )}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--cs-faint)',
              marginTop: '2px',
            }}>
              {error ? 'Failed' : 'Concluded'}
              {!error && consultedFiles.length > 0 && ` · ${consultedFiles.length} files`}
              {!error && findings.length > 0 && ` · ${findings.length} insights`}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--cs-faint)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'color 150ms ease, background 150ms ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--cs-text)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--cs-faint)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar animate-fade-in">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 48px' }}>
            {error ? (
              <div style={{
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.04)',
              }}>
                <div style={{ color: 'var(--cs-red)', fontWeight: 500, fontSize: '13px', marginBottom: '8px' }}>
                  Investigation Failed
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(252, 165, 165, 0.8)', lineHeight: 1.6 }}>{error}</p>
                {onRetryInvestigation && (
                  <button
                    onClick={onRetryInvestigation}
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: 'rgba(252, 165, 165, 0.9)',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                    }}
                  >
                    <RefreshCw size={11} />
                    Retry Investigation
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* 1. Executive Summary */}
                <section>
                  <div style={{
                    fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-ui)',
                    opacity: 0.8, color: 'var(--cs-text)',
                    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <FileText size={14} /> Executive summary
                  </div>
                  <MarkdownRenderer text={answer || '*The AI completed its investigation and collected evidence, but did not formulate a final executive summary. Please review the key findings below.*'} />
                </section>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

                {/* 2. Key Findings */}
                <section>
                  <div style={{
                    fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-ui)',
                    opacity: 0.8, color: 'var(--cs-text)',
                    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <ListChecks size={14} /> Key findings
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {findings.length > 0 ? findings.map((f, idx) => (
                      <div key={idx} style={{
                        padding: '16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        background: 'rgba(255,255,255,0.015)',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                      }}>
                        {f.filePath && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--cs-accent)' }}>
                              {f.filePath.split(/[\\/]/).pop()}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--cs-muted)' }}>
                              · L{f.startLine}–L{f.endLine}
                            </span>
                          </div>
                        )}
                        <p style={{ fontSize: '12px', color: 'var(--cs-text)', lineHeight: 1.6, margin: 0 }}>
                          {f.reason}
                        </p>
                        {f.filePath && (
                          <button
                            onClick={() => {
                              const wsStore = window.__workspace_store__;
                              if (wsStore) {
                                wsStore.getState().setUserSelectedFile({ name: f.filePath.split(/[\\/]/).pop(), path: f.filePath, type: 'file' });
                              }
                              window.dispatchEvent(new CustomEvent('editor-highlight', {
                                detail: { file: f.filePath, line: f.startLine }
                              }));
                              onClose();
                            }}
                            style={{
                              alignSelf: 'flex-start', fontSize: '10px',
                              fontFamily: 'var(--font-ui)', fontStyle: 'italic', color: 'var(--cs-accent)',
                              background: 'transparent', border: 'none',
                              cursor: 'pointer', opacity: 0.65, padding: 0,
                              transition: 'opacity 150ms ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.65'}
                          >
                            → Open in editor
                          </button>
                        )}
                      </div>
                    )) : (
                      <div style={{
                        gridColumn: '1 / -1', padding: '16px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        color: 'var(--cs-muted)', fontSize: '12px',
                      }}>
                        No direct evidence was collected during this investigation.
                      </div>
                    )}
                  </div>
                </section>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }} />

                {/* 3. Files Consulted */}
                <section>
                  <div style={{
                    fontSize: '11px', fontWeight: 600,
                    color: 'var(--cs-faint)',
                    marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                    fontFamily: 'var(--font-ui)',
                  }}>
                    <FileCode2 size={12} /> Files consulted
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {consultedFiles.length > 0 ? consultedFiles.map((f, idx) => (
                      <div key={idx} style={{
                        padding: '4px 10px', borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.02)',
                        fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cs-muted)',
                      }}>
                        {f}
                      </div>
                    )) : (
                      <span style={{ fontSize: '12px', color: 'var(--cs-muted)', fontStyle: 'italic' }}>
                        No files consulted.
                      </span>
                    )}
                  </div>
                </section>

                {/* Footer metadata — very quiet */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)', fontSize: '10px',
                  color: 'var(--cs-hint)', opacity: 0.6,
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span>{consultedFiles.length} files consulted</span>
                    <span>·</span>
                    <span>{findings.length} insights extracted</span>
                  </div>
                  {providerUsed === 'fallback' && (
                    <span style={{ fontStyle: 'italic', opacity: 0.4 }}>
                      provider: fallback
                    </span>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
