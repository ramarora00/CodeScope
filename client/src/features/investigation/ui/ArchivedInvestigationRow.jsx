import { cn } from '@/shared/utils';
import { ActionButton } from '@/shared/ui';
import { RefreshCcw, Trash2 } from 'lucide-react';

export default function ArchivedInvestigationRow({ investigation, className }) {
  return (
    <div className={cn('flex items-center gap-2 p-2 rounded-md hover:bg-[var(--color-surface-elevated)] group', className)}>
      <div className="flex-1 overflow-hidden">
        <div className="text-xs truncate text-[var(--color-text-body)]">{investigation.title}</div>
        <div className="text-[10px] text-[var(--color-text-muted)]">{investigation.archivedAt}</div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <ActionButton icon={RefreshCcw} aria-label="Reopen" size="sm" />
        <ActionButton icon={Trash2} aria-label="Delete" size="sm" />
      </div>
    </div>
  );
}
