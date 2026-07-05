import { cn } from '@/shared/utils';
import { GlassPanel, ActionButton } from '@/shared/ui';

export default function DeleteConfirmationDialog({ className }) {
  // Purely structural, static placeholder
  // Rendered hidden since there is no open/close logic
  return (
    <div className={cn('absolute inset-0 bg-black/50 hidden flex-col items-center justify-center', className)}>
      <GlassPanel className="w-[400px] p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-[var(--color-text-body)]">Delete Investigation?</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          This action cannot be undone. The investigation history and findings will be permanently removed.
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <ActionButton aria-label="Cancel">Cancel</ActionButton>
          <ActionButton aria-label="Delete" className="text-[var(--color-status-error)] border-[var(--color-status-error)]">
            Delete
          </ActionButton>
        </div>
      </GlassPanel>
    </div>
  );
}
