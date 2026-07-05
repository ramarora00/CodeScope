import { cn } from '@/shared/utils';
import { ActionButton } from '@/shared/ui';

export default function ReopenToast({ className }) {
  // Purely structural, hidden by default
  return (
    <div className={cn('absolute bottom-6 right-6 hidden flex-col', className)}>
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-base)] rounded-md p-3 flex items-center gap-4 shadow-lg">
        <span className="text-sm text-[var(--color-text-body)]">Investigation reopened</span>
        <ActionButton aria-label="Undo" size="sm" variant="outlined">Undo</ActionButton>
      </div>
    </div>
  );
}
