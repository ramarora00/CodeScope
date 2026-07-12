import React from 'react';
import { cn } from '@/shared/utils';
import { SectionHeader, QueryInput } from '@/shared/ui';
import ArchivedInvestigationRow from './ArchivedInvestigationRow';

export default function ArchiveTray({ className, archivedInvestigations = [], onRestore, onDelete }) {
  // Always visible if not hidden by parent layout, but the original UI had "hidden" hardcoded for structural placeholder.
  // We will let the parent or css decide, or remove `hidden` if we want it visible.
  // The original has `hidden` hardcoded: flex flex-col hidden
  // Let's remove `hidden` and let the parent toggle it, or keep it always there as an aside.
  return (
    <div className={cn('absolute right-0 top-0 bottom-0 w-80 bg-[var(--color-surface-base)] border-l border-[var(--color-border-base)] flex flex-col', className)}>
      <div className="p-4 border-b border-[var(--color-border-base)]">
        <SectionHeader title="Archive" />
        <div className="mt-4">
          <QueryInput placeholder="Search archives..." />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {archivedInvestigations.length === 0 && (
          <div className="text-xs text-[var(--color-text-muted)] p-2 text-center">
            No archived investigations.
          </div>
        )}
        <div className="flex flex-col gap-1">
          {archivedInvestigations.map(inv => (
            <ArchivedInvestigationRow 
              key={inv.id}
              investigation={inv}
              onRestore={() => onRestore && onRestore(inv.id)}
              onDelete={() => onDelete && onDelete(inv.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
