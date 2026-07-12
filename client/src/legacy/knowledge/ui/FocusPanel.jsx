import React from 'react';
import { GlassPanel } from '../../../shared/ui/GlassPanel';
import { SectionHeader } from '../../../shared/ui/SectionHeader';
import { ActionButton } from '../../../shared/ui/ActionButton';

export function FocusPanel({ focus, clearFocus }) {
  if (!focus) return null;

  return (
    <GlassPanel 
      elevation={3} 
      className="absolute right-6 top-24 bottom-6 w-96 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 pointer-events-auto"
    >
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-[var(--color-surface-sunken)]/50 backdrop-blur-md">
        <div>
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Focus
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {focus.name}
          </h2>
        </div>
        <ActionButton onClick={clearFocus} icon="✕" variant="ghost" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <section>
          <SectionHeader title="Relationships" />
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            <p><strong>Used By:</strong> 3 modules</p>
            <p><strong>Depends On:</strong> 1 module</p>
          </div>
        </section>

        <section>
          <SectionHeader title="Insights" />
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            AI has not yet generated an architectural summary for this node.
          </div>
        </section>
        
        <section>
          <SectionHeader title="References" />
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            Found 12 references across 4 files.
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-sunken)]/50">
        <button className="w-full bg-[var(--color-primary)] text-[var(--color-background)] font-medium text-sm py-2 px-4 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] transition-colors">
          Open in Analysis Session
        </button>
      </div>
    </GlassPanel>
  );
}
