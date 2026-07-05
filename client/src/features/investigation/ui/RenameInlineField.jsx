import { cn } from '@/shared/utils';

export default function RenameInlineField({ title, isEditing, className }) {
  // Render only structural component.
  // No internal state, no keyboard logic, no double-click logic.
  
  if (isEditing) {
    return (
      <input 
        type="text" 
        defaultValue={title}
        className={cn('w-full bg-transparent border-b border-[var(--color-border-accent)] text-xs outline-none', className)}
        autoFocus
      />
    );
  }
  
  return (
    <span className={cn('text-xs truncate block text-[var(--color-text-body)]', className)}>
      {title}
    </span>
  );
}
