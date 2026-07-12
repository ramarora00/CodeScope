/**
 * InspectorViewport
 *
 * Purpose: Side panel that displays contextual information about the current
 *          selection using the reusable `SelectionInspector` object.
 * Used By: Workspace.
 * Dependencies: SelectionInspector (shared object), cn helper.
 * Accessibility: role="complementary" and aria-label="Inspector panel".
 */

import React from 'react';
import { ObservatoryShell } from '@/features/observatory';
import { cn } from '@/shared/utils';

export default function InspectorViewport({ className }) {
  // For now we render an empty inspector – future screens will provide sections.
  return (
    <aside
      className={cn('flex flex-col bg-secondary overflow-auto border-l border-border', className)}
      role="complementary"
      aria-label="Inspector panel"
    >
      <ObservatoryShell />
    </aside>
  );
}
