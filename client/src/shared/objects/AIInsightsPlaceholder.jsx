/**
 * AIInsightsPlaceholder
 *
 * Purpose: Placeholder panel showing static AI insight items.
 * Used By: MissionControl screen.
 * Dependencies: GlassPanel, SectionHeader.
 * Accessibility: role="region" with aria-label="AI insights placeholder".
 */

import React from 'react';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { cn } from '@/shared/utils/cn';

const insights = [
  'Circular dependency detected',
  'Dead module candidate',
  'High blast radius',
  'Missing documentation',
  'Recently indexed',
];

export default function AIInsightsPlaceholder({ className }) {
  return (
    <GlassPanel
      className={cn('p-4', className)}
      aria-label="AI insights placeholder"
    >
      <SectionHeader>AI Insights</SectionHeader>
      <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground">
        {insights.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </GlassPanel>
  );
}
