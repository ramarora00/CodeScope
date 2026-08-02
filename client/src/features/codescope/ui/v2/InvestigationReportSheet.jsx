import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ChevronDown, ListChecks, FileCode2 } from 'lucide-react';

/**
 * InvestigationReportSheet
 * 
 * Replaces the old ReviewPanel. Instead of replacing the workspace, this slides up
 * as a bottom-sheet. It includes a cinematic "Synthesizing" phase before rendering
 * the highly structured final report.
 */
export default function InvestigationReportSheet({ answer, error, onClose }) {
  const [phase, setPhase] = useState('synthesizing'); // 'synthesizing' | 'ready'
  const [synStep, setSynStep] = useState(0);

  useEffect(() => {
    if (error) {
      setPhase('ready');
      return;
    }

    if (answer) {
      // Cinematic 3.5s synthesizing sequence
      setPhase('synthesizing');
      setSynStep(0);
      
      const timings = [
        { t: 0,    step: 0 }, // Synthesizing Findings...
        { t: 1200, step: 1 }, // Grouping Evidence...
        { t: 2400, step: 2 }, // Building Report...
        { t: 3500, step: 3 }, // Done
      ];

      const timeouts = timings.map(({ t, step }) => 
        setTimeout(() => {
          if (step === 3) setPhase('ready');
          else setSynStep(step);
        }, t)
      );

      return () => timeouts.forEach(clearTimeout);
    }
  }, [answer, error]);

  if (!answer && !error) return null;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
      style={{
        height: phase === 'synthesizing' ? '120px' : '75%',
        background: 'var(--cs-panel)',
        borderTop: '1px solid var(--cs-border)',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        transition: 'height 800ms cubic-bezier(0.22, 1, 0.36, 1)',
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
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-8 space-y-10 animate-slide">
            
            {error ? (
              <div className="p-6 rounded-xl" style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <h4 style={{ color: 'var(--cs-error)', fontWeight: 500, marginBottom: '8px' }}>Investigation Failed</h4>
                <p style={{ fontSize: '13px', color: 'rgba(252, 165, 165, 0.8)', lineHeight: 1.6 }}>{error}</p>
              </div>
            ) : (
              <>
                {/* 1. Executive Summary */}
                <section>
                  <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-3 flex items-center gap-2">
                    <FileText size={12} /> Executive Summary
                  </h4>
                  <div className="text-[14px] leading-relaxed text-[var(--cs-text)] whitespace-pre-wrap">
                    {answer}
                  </div>
                </section>

                <hr style={{ borderColor: 'var(--cs-border)', opacity: 0.5 }} />

                {/* 2. Key Findings Grid */}
                <section>
                  <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-4 flex items-center gap-2">
                    <ListChecks size={12} /> Key Findings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 rounded-xl border bg-[var(--cs-editor)]" style={{ borderColor: 'var(--cs-border)' }}>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={16} className="text-[var(--cs-green)] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[12px] text-[var(--cs-text)] leading-relaxed">
                              Discovered primary routing layer mechanisms and authenticated payload structures during execution trace.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Files Consulted */}
                <section>
                  <h4 className="text-[11px] font-bold tracking-widest text-[var(--cs-hint)] uppercase mb-4 flex items-center gap-2">
                    <FileCode2 size={12} /> Files Consulted
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {['app/router.ts', 'lib/auth/jwt.ts', 'middleware/security.ts'].map(f => (
                      <div key={f} className="px-3 py-1.5 rounded-md border text-[11px] font-mono text-[var(--cs-muted)] bg-[rgba(255,255,255,0.02)]" style={{ borderColor: 'var(--cs-border)' }}>
                        {f}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
}
