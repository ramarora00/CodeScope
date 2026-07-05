import { cn } from '@/shared/utils';
import { ActionButton } from '@/shared/ui';
import { X } from 'lucide-react';
import InvestigationStatusBadge from './InvestigationStatusBadge';
import RenameInlineField from './RenameInlineField';

export default function InvestigationTab({ investigation, isActive, className }) {
  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-t-md border-t border-x cursor-pointer max-w-[200px]',
        isActive 
          ? 'bg-[var(--color-surface-elevated)] border-[var(--color-border-accent)]' 
          : 'bg-[var(--color-surface-base)] border-[var(--color-border-base)] opacity-70 hover:opacity-100',
        className
      )}
    >
      <InvestigationStatusBadge status={investigation.status} dotOnly={true} />
      <div className="flex-1 overflow-hidden">
        <RenameInlineField title={investigation.title} isEditing={false} />
      </div>
      <ActionButton
        icon={X}
        variant="ghost"
        size="sm"
        aria-label="Archive Investigation"
      />
    </div>
  );
}
