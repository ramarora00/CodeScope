import { cn } from '@/shared/utils';
import { GlassPanel } from '@/shared/ui';

export default function InvestigationCanvasPlaceholder({ className }) {
  return (
    <div className={cn('flex-1 p-4 flex flex-col gap-4', className)}>
      <GlassPanel className="flex-1 flex items-center justify-center border-dashed">
        <span className="text-sm text-[var(--color-text-muted)]">Investigation Canvas Area</span>
      </GlassPanel>
    </div>
  );
}
