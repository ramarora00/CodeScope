import { cn } from '@/shared/utils';
import { SectionHeader, QueryInput } from '@/shared/ui';
import ArchivedInvestigationRow from './ArchivedInvestigationRow';

export default function ArchiveTray({ className }) {
  // Closed by default, purely structural
  return (
    <div className={cn('absolute right-0 top-0 bottom-0 w-80 bg-[var(--color-surface-base)] border-l border-[var(--color-border-base)] flex flex-col hidden', className)}>
      <div className="p-4 border-b border-[var(--color-border-base)]">
        <SectionHeader title="Archive" />
        <div className="mt-4">
          <QueryInput placeholder="Search archives..." />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-[var(--color-text-muted)] p-2 text-center hidden">
          No archived investigations.
        </div>
        <div className="flex flex-col gap-1">
          <ArchivedInvestigationRow 
            investigation={{ title: 'Memory Leak in WebGL Canvas', archivedAt: '2026-07-03T10:00:00Z' }}
          />
        </div>
      </div>
    </div>
  );
}
