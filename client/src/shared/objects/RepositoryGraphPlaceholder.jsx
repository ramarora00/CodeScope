/**
 * RepositoryGraphPlaceholder
 *
 * Purpose: Structural placeholder representing a code graph canvas.
 * Used By: MissionControl screen.
 * Dependencies: GlassPanel, SectionHeader.
 * Accessibility: role="region" with aria-label="Repository graph placeholder".
 */

import React from 'react';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { SectionHeader } from '@/shared/ui/SectionHeader';
import { cn } from '@/shared/utils/cn';

export default function RepositoryGraphPlaceholder({ className }) {
  return (
    <GlassPanel
      className={cn('p-4 flex flex-col items-center justify-center', className)}
      aria-label="Repository graph placeholder"
    >
      <SectionHeader>Repository Graph</SectionHeader>
      <div
        className="mt-2 w-full h-60 border border-dashed border-gray-400 rounded-md flex items-center justify-center relative"
        style={{ backgroundColor: 'var(--color-background-muted)' }}
      >
        {/* faint node circles */}
        <div className="absolute w-8 h-8 border border-gray-300 rounded-full opacity-30" style={{ top: '20%', left: '30%' }} />
        <div className="absolute w-8 h-8 border border-gray-300 rounded-full opacity-30" style={{ top: '50%', left: '50%' }} />
        <div className="absolute w-8 h-8 border border-gray-300 rounded-full opacity-30" style={{ top: '70%', left: '20%' }} />
        {/* connecting lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line x1="30%" y1="20%" x2="50%" y2="50%" stroke="gray" strokeOpacity="0.2" strokeWidth="2" />
          <line x1="50%" y1="50%" x2="20%" y2="70%" stroke="gray" strokeOpacity="0.2" strokeWidth="2" />
        </svg>
        {/* subtle label */}
        <span className="absolute text-sm text-gray-500" style={{ top: '10%', left: '45%' }}>graph canvas</span>
      </div>
    </GlassPanel>
  );
}
