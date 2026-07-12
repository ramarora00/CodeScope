import { cn } from '../utils/classNames';
import React from 'react';

/**
 * Enterprise Information Blocks
 * Replacing generic GlassPanels with specific, high-signal UI primitives
 * inspired by tools like Linear, Sourcegraph, and Cursor.
 */

export function OperationBlock({ className, title, status, children, icon }) {
  return (
    <div className={cn("flex flex-col rounded-[14px] bg-[#0A0D12] overflow-hidden border border-[#1C212B]", className)}>
      <div className="flex items-center gap-3 px-4 py-3 bg-[#12161E] border-b border-[#1C212B]">
        {icon && <span className="text-[#8E97A8] flex-shrink-0">{icon}</span>}
        <h4 className="text-[13px] font-semibold text-[#D8DCE6] m-0">{title}</h4>
        {status && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-mono text-[#5C657A]">{status}</span>
          </div>
        )}
      </div>
      <div className="p-3 text-[13px] text-[#8E97A8] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function EvidenceBlock({ className, title, source, children }) {
  return (
    <div className={cn("flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-base-gunmetal)] overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-base)] border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M2.75 2A1.75 1.75 0 001 3.75v8.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0015 12.25v-8.5A1.75 1.75 0 0013.25 2H2.75zM2.5 3.75a.25.25 0 01.25-.25h10.5a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25H2.75a.25.25 0 01-.25-.25v-8.5z"/>
          </svg>
          {title || "Evidence"}
        </div>
        {source && (
          <span className="text-xs font-mono text-[var(--color-accent-soft-cyan)] opacity-80">{source}</span>
        )}
      </div>
      <div className="p-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
        {children}
      </div>
    </div>
  );
}

export function CodePreviewBlock({ className, code, language, fileName, lines }) {
  return (
    <div className={cn("rounded-lg border border-[var(--color-border-strong)] bg-[#0A0D12] overflow-hidden flex flex-col font-mono text-sm shadow-md", className)}>
      {(fileName || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1C212B] bg-[#12161E] select-none">
          <div className="flex items-center gap-2">
            <span className="text-[#8E97A8] text-xs">{fileName}</span>
          </div>
          {language && (
            <span className="text-[#5C657A] text-[10px] uppercase tracking-wider font-sans font-medium">{language}</span>
          )}
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="m-0 p-0 text-[var(--color-accent-ice-blue)] leading-relaxed tab-size-2">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function MetricBlock({ className, label, value, trend }) {
  return (
    <div className={cn("flex flex-col p-4 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] shadow-sm", className)}>
      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight">{value}</span>
        {trend && (
          <span className={cn("text-xs font-medium", trend.startsWith('+') ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-warning)]')}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatusBlock({ className, status, message, details = [] }) {
  const isSuccess = status === 'success' || status === 'done';
  const isError = status === 'error';
  const isLoading = status === 'loading';
  
  return (
    <div className={cn("flex flex-col rounded-xl border border-[#1C212B] bg-[#05070B] overflow-hidden", className)}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex-shrink-0 flex items-center justify-center w-4 h-4">
          {isLoading && (
            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-[#5C657A] border-t-transparent animate-spin" />
          )}
          {isSuccess && (
            <div className="w-3.5 h-3.5 rounded-full border border-[#238636] flex items-center justify-center bg-[#238636]/10">
              <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="#2ea043" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 8 7 12 13 4" />
              </svg>
            </div>
          )}
          {isError && (
            <div className="w-3.5 h-3.5 rounded-full border border-[#f85149] flex items-center justify-center bg-[#f85149]/10">
              <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="#f85149" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="4" x2="12" y2="12" />
                <line x1="12" y1="4" x2="4" y2="12" />
              </svg>
            </div>
          )}
          {(!isLoading && !isSuccess && !isError) && (
            <div className="w-2 h-2 rounded-full bg-[#5C657A]" />
          )}
        </div>
        <span className={cn("text-[13px] font-mono", isSuccess ? "text-[#2ea043]" : isError ? "text-[#f85149]" : "text-[#D8DCE6]")}>
          {message}
        </span>
      </div>
      
      {details && details.length > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-[#1C212B]/50 flex flex-col gap-1.5 bg-[#05070B]">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[12px] text-[#8E97A8] font-mono">
              <span className="text-[#5C657A] mt-[2px]">{'>'}</span>
              <span>{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
