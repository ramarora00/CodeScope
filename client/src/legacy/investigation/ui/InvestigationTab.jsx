import React, { useState } from 'react';
import { cn } from '@/shared/utils';
import { ActionButton } from '@/shared/ui';
import { X } from 'lucide-react';
import InvestigationStatusBadge from './InvestigationStatusBadge';
import RenameInlineField from './RenameInlineField';

export default function InvestigationTab({ investigation, isActive, onClick, onRename, onArchive, className }) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleRenameComplete = (newTitle) => {
    setIsEditing(false);
    if (newTitle && newTitle.trim() && newTitle !== investigation.title) {
      onRename(newTitle);
    }
  };

  return (
    <div 
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
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
        <RenameInlineField 
          title={investigation.title} 
          isEditing={isEditing} 
          onRename={handleRenameComplete}
        />
      </div>
      <ActionButton
        icon={X}
        variant="ghost"
        size="sm"
        aria-label="Archive Investigation"
        onClick={(e) => {
          e.stopPropagation();
          onArchive();
        }}
      />
    </div>
  );
}
