import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronDown, ListChecks, FileCode2, RefreshCw } from 'lucide-react';

/**
 * InvestigationReportSheet
 * 
 * Replaces the old ReviewPanel. Instead of replacing the workspace, this slides up
 * as a bottom-sheet. It includes a cinematic "Synthesizing" phase before rendering
 * the highly structured final report.
 */
function MarkdownRenderer({ text }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--cs-sans)', fontSize: '13px', lineHeight: '1.7', color: 'var(--cs-text)' }}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
          if (match) {
            const level = match[1].length;
            const content = match[2];
            const size = level === 1 ? 'text-lg font-bold' : level === 2 ? 'text-base font-bold' : 'text-sm font-semibold';
            return (
              <h5 key={index} className={`${size} text-[var(--cs-text)] mt-6 mb-2`}>
                {content}
              </h5>
            );
          }
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n[-*]\s+/).map(item => item.replace(/^[-*]\s+/, '').trim());
          return (
            <ul key={index} className="list-disc pl-5 space-y-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="leading-relaxed text-[var(--cs-text)] opacity-95">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function InvestigationReportSheet({ answer, error, intelligenceStream = [], onClose, onRetryInvestigation }) {
  const [phase, setPhase] = useState('synthesizing'); // 'synthesizing' | 'ready'
  const [synStep, setSynStep] = useState(0);

  const findings = intelligenceStream.filter(i => i.type === 'Evidence' || i.type === 'Just learned');
  const consultedFiles = [...new Set(intelligenceStream.filter(i => i.source).map(i => typeof i.source === 'string' ? i.source.split('/').pop() : i.source.file.split('/').pop()))];

  useEffect(() => {
    if (error) {
      setPhase('ready');
      return;
    }

    if (answer || (intelligenceStream && intelligenceStream.length > 0)) {
      // Cinematic 4.5s synthesizing sequence: Synthesize → Group → Build → Conclude → Silence → Ready
      setPhase('synthesizing');
      setSynStep(0);

      const timings = [
        { t: 0, step: 0 }, // Synthesizing Findings...
        { t: 1200, step: 1 }, // Grouping Evidence...
        { t: 2400, step: 2 }, // Building Report...
        { t: 3400, step: 3 }, // Concluding...
        { t: 4500, step: 4 }, // Done — 1 second silence before sheet expands
      ];

      const timeouts = timings.map(({ t, step }) =>
        setTimeout(() => {
          if (step === 4) setPhase('ready');
          else setSynStep(step);
        }, t)
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [answer, error, intelligenceStream]);

  if (!answer && !error && (!intelligenceStream || intelligenceStream.length === 0)) return null;

  return (
    <>
      {/* Law of Representation: Dim Context (40% visibility) */}
      <div
        className="absolute inset-0 z-40"
        style={{ background: '#000', opacity: 0.6, transition: 'opacity 800ms var(--ease-premium)' }}
        onClick={onClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{
          height: phase === 'synthesizing' ? '120px' : '75%',
          background: 'var(--cs-panel)',
          borderTop: '1px solid var(--cs-border)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          transition: 'height 800ms var(--ease-premium)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--cs-border)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border flex items-center justify-center bg-[var(--cs-editor)]" style={{ borderColor: 'var(--cs-border)' }}>
              <Sparkles size={14} className="text-[var(--cs-accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--cs-text)]">Investigation Report</h3>
              <span className="text-[11px] text-[var(--cs-hint)] font-mono">
                {phase === 'synthesizing' ? 'In Progress' : 'Final Conclusion'}
              </span>
            </div>
          </div>

          {phase === 'ready' && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--cs-editor)] text-[var(--cs-muted)] hover:text-[var(--cs-text)] transition-colors"
            >
              <ChevronDown size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {phase === 'synthesizing' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 animate-fade-in">
              <div className="w-48 h-1 bg-[var(--cs-editor)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--cs-accent)]"
                  style={{
                    width: `${(synStep + 1) * 33.3}%`,
                    transition: 'width 1000ms ease-out'
                  }}
                />
              </div>
              <div className="text-[12px] text-[var(--cs-muted)] font-mono flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-[var(--cs-accent)] border-t-transparent rounded-full animate-spin" />
                {synStep === 0 && 'Synthesizing Findings...'}
                {synStep === 1 && 'Grouping Evidence...'}
                {synStep === 2 && 'Building Report...'}
                {synStep === 3 && 'Concluding...'}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-8 space-y-10 animate-slide">

              {error ? (
                <div className="p-6 rounded-xl" style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 style={{ color: 'var(--cs-error)', fontWeight: 500, marginBottom: '8px' }}>Investigation Failed</h4>
                  <p style={{ fontSize: '13px', color: 'rgba(252, 165, 165, 0.8)', lineHeight: 1.6 }}>{error}</p>
                  {onRetryInvestigation && (
                    <button
                      onClick={onRetryInvestigation}
                      className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'rgba(252, 165, 165, 0.9)',
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw size={12} />
                      Retry Investigation
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* 1. Executive Summary */}
                  <section>
                    <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-3 flex items-center gap-2">
                      <FileText size={12} /> Executive Summary
                    </h4>
                    <div className="text-[14px] leading-relaxed text-[var(--cs-text)]">
                      <MarkdownRenderer text={answer || "*The AI completed its investigation and collected evidence, but did not formulate a final executive summary. Please review the key findings below.*"} />
                    </div>
                  </section>

                  <hr style={{ borderColor: 'var(--cs-border)', opacity: 0.5 }} />

                  {/* 2. Key Findings Grid */}
                  <section>
                    <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-4 flex items-center gap-2">
                      <ListChecks size={12} /> Key Findings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {findings.length > 0 ? findings.map((f, i) => (
                        <div key={i} className="p-4 rounded-xl border bg-[var(--cs-editor)]" style={{ borderColor: 'var(--cs-border)' }}>
                          <div className="flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-[var(--cs-green)] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-[12px] text-[var(--cs-text)] leading-relaxed">
                                {f.text}
                              </p>
                              {f.source && typeof f.source !== 'string' && f.source.line && (
                                <button
                                  onClick={() => window.dispatchEvent(new CustomEvent('editor-highlight', { detail: { file: f.source.file, line: f.source.line } }))}
                                  className="mt-2 text-[10px] font-mono text-[var(--cs-accent)] hover:underline opacity-80"
                                >
                                  {f.source.file.split('/').pop()}:{f.source.line}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 rounded-xl border bg-[var(--cs-editor)] text-[var(--cs-muted)] text-[12px]" style={{ borderColor: 'var(--cs-border)' }}>
                          No direct evidence was collected.
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 3. Files Consulted */}
                  <section>
                    <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-4 flex items-center gap-2">
                      <FileCode2 size={12} /> Files Consulted
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {consultedFiles.length > 0 ? consultedFiles.map((f, idx) => (
                        <div key={idx} className="px-3 py-1.5 rounded-md border text-[11px] font-mono text-[var(--cs-muted)] bg-[rgba(255,255,255,0.02)]" style={{ borderColor: 'var(--cs-border)' }}>
                          {f}
                        </div>
                      )) : (
                        <div className="text-[12px] text-[var(--cs-muted)] italic">No files consulted.</div>
                      )}
                    </div>
                  </section>
                </>
              )}

              {!error && phase === 'ready' && (
                <div className="pt-6 mt-8 border-t" style={{ borderColor: 'var(--cs-border)' }}>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--cs-muted)]">
                    <span>{consultedFiles.length} files consulted</span>
                    <span>·</span>
                    <span>{findings.length} insights extracted</span>
                    <span>·</span>
                    <span>{intelligenceStream.length} total cognitive events</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
