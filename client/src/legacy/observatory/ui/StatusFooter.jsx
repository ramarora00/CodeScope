import { cn } from '@/shared/utils';
import { StatusBadge } from '@/shared/ui';

export default function StatusFooter({ className }) {
  return (
    <div className={cn('flex items-center gap-4 p-2 border-t border-[var(--color-border-base)]', className)}>
      <StatusBadge variant="success">Repository Ready</StatusBadge>
      <StatusBadge variant="success">Graph Ready</StatusBadge>
      <StatusBadge variant="neutral">AI Unavailable</StatusBadge>
      <StatusBadge variant="success">Memory Ready</StatusBadge>
    </div>
  );
}
