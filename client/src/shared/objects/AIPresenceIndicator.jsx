/**
 * AIPresenceIndicator
 *
 * Purpose:   Visual indicator of AI subsystem presence/status.
 * Used By:   TopChrome.
 * Dependencies: StatusDot (shared UI primitive), cn helper.
 * Accessibility: Uses aria-label to describe status.
 */

import React from 'react';
import { StatusDot } from '@/shared/ui/StatusDot';
import { cn } from '@/shared/utils/cn';

export default function AIPresenceIndicator({ className, status = 'idle' }) {
  // status: 'idle' | 'thinking' | 'error'
  const colorMap = {
    idle: 'bg-muted',
    thinking: 'bg-primary',
    error: 'bg-destructive',
  };

  return (
    <div className={cn('flex items-center', className)} aria-label="AI status">
      <StatusDot className={colorMap[status]} />
    </div>
  );
}
