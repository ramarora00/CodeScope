/**
 * MainViewport
 *
 * Purpose: Primary content area for all future screens. It occupies the remaining
 *          space beside the inspector. No business logic or mock data is added
 *          here – it simply provides a semantic <main> landmark.
 * Used By: Workspace.
 * Dependencies: cn helper.
 * Accessibility: role="main" and aria-label="Main content area".
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

export default function MainViewport({ className, children }) {
  return (
    <main
      className={cn('flex-1 overflow-auto bg-background', className)}
      role="main"
      aria-label="Main content area"
    >
      {children}
      <MissionControl />
    </main>
  );
}
