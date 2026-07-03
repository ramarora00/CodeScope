/**
 * SelectionInspector
 *
 * Purpose:   Provides a vertically‑stacked panel that displays contextual information
 *              about the current selection (metrics, actions, details).
 * Used By:   Any panel that needs a side inspector (e.g., GraphPanel, CodeSurface).
 * Dependencies: SectionHeader, MetricRow, ActionRow – all shared UI primitives.
 * Accessibility: Uses role="region" with aria‑label and ensures each SectionHeader
 *                has appropriate heading levels.
 */

import React from 'react';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { MetricRow } from '@/shared/ui/MetricRow';
import { ActionRow } from '@/shared/ui/ActionRow';
import { cn } from '@/shared/utils/cn';

/**
 * Props shape
 * sections: Array<{
 *   title: string,
 *   metrics?: Array<{ label: string, value: string }>,
 *   actions?: Array<{ label: string, onClick: () => void, icon?: ReactNode }>
 * }>
 */
export default function SelectionInspector({ className, sections = [] }) {
  return (
    <aside
      className={cn('flex flex-col gap-4 p-4 overflow-y-auto', className)}
      role="region"
      aria-label="Selection inspector"
    >
      {sections.map((sec, idx) => (
        <div key={idx}>
          <SectionHeader>{sec.title}</SectionHeader>
          {sec.metrics && sec.metrics.map((m, mi) => (
            <MetricRow key={mi} label={m.label} value={m.value} />
          ))}
          {sec.actions && sec.actions.length > 0 && (
            <ActionRow>
              {sec.actions.map((a, ai) => (
                <ActionRow.Button
                  key={ai}
                  onClick={a.onClick}
                  aria-label={a.label}
                  icon={a.icon}
                >
                  {a.label}
                </ActionRow.Button>
              ))}
            </ActionRow>
          )}
        </div>
      ))}
    </aside>
  );
}
