/**
 * HealthSignaturePanel
 *
 * Purpose: Placeholder panel showing health status indicators.
 * Used By: MissionControl screen.
 * Dependencies: GlassPanel, SectionHeader, StatusBadge.
 * Accessibility: role="region" with aria-label.
 */

import React from 'react';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { cn } from '@/shared/utils/cn';

export default function HealthSignaturePanel({ className }) {
  return (
    <GlassPanel className={cn('p-4', className)} aria-label="Health signature panel">
      <SectionHeader>Health Signature</SectionHeader>
      <div className="flex gap-2 mt-2">
        <StatusBadge variant="success" label="CPU" />
        <StatusBadge variant="warning" label="Memory" />
        <StatusBadge variant="critical" label="Disk" />
      </div>
    </GlassPanel>
  );
}
