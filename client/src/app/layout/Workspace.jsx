/**
 * Workspace
 *
 * Purpose: Container that splits the screen into a main content area and an inspector side‑panel.
 * Used By: AppShell.
 * Dependencies: MainViewport, InspectorViewport, cn helper.
 * Accessibility: Implements a flex container with appropriate ARIA landmarks.
 */

import React from 'react';
import MainViewport from './MainViewport';
import InspectorViewport from './InspectorViewport';
import { cn } from '@/shared/utils/cn';

export default function Workspace({ className }) {
  return (
    <div
      className={cn('flex flex-1 overflow-hidden', className)}
      role="region"
      aria-label="Workspace layout"
    >
      <MainViewport className="flex-1" />
      <InspectorViewport className="w-80" />
    </div>
  );
}
