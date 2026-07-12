import React from 'react';
import { cn } from '@/shared/utils';

export default function RenameInlineField({ title, isEditing, onRename, className }) {
  
  if (isEditing) {
    return (
      <input 
        type="text" 
        defaultValue={title}
        className={cn('w-full bg-transparent border-b border-[var(--color-border-accent)] text-xs outline-none text-[var(--color-text-body)]', className)}
        autoFocus
        onBlur={(e) => {
          if (onRename) onRename(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            e.currentTarget.value = title;
            e.currentTarget.blur();
          }
        }}
      />
    );
  }
  
  return (
    <span className={cn('text-xs truncate block text-[var(--color-text-body)]', className)}>
      {title}
    </span>
  );
}
