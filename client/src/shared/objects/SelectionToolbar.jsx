/**
 * SelectionToolbar
 *
 * Purpose:   Horizontal toolbar providing contextual actions for a selected entity.
 * Used By:   Various panels that operate on a selection (e.g., graph panels, code view).
 * Dependencies: ActionButton (shared UI primitive), cn helper.
 * Accessibility: Uses role="toolbar" and proper aria-labels for each button.
 */

import React from 'react';
import { ActionButton } from '@/shared/ui/ActionButton';
import { cn } from '@/shared/utils/cn';

export default function SelectionToolbar({ className, actions = [] }) {
  return (
    <div
      className={cn('flex items-center gap-2 p-2', className)}
      role="toolbar"
      aria-label="Selection actions toolbar"
    >
      {actions.map((action, idx) => (
        <ActionButton
          key={idx}
          onClick={action.onClick}
          aria-label={action.label}
          icon={action.icon}
        >
          {action.label}
        </ActionButton>
      ))}
    </div>
  );
}
