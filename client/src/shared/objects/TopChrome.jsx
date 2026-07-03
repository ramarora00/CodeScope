/**
 * TopChrome
 *
 * Purpose:   Global top‑level chrome that houses global navigation and status indicators.
 * Used By:   AppShell (future), any layout that needs a top bar.
 * Dependencies: GlassPanel, RepositorySwitcherTrigger, LocationReadout, AIPresenceIndicator, ToggleGroup, FilterControl.
 * Accessibility: Uses role="banner" and appropriate aria‑labels.
 */

import React from 'react';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import RepositorySwitcherTrigger from './RepositorySwitcherTrigger';
import LocationReadout from './LocationReadout';
import AIPresenceIndicator from './AIPresenceIndicator';
import ToggleGroup from '@/shared/ui/ToggleGroup';
import FilterControl from '@/shared/ui/FilterControl';
import { cn } from '@/shared/utils/cn';

export default function TopChrome({ className }) {
  return (
    <header
      className={cn(
        'flex items-center justify-between w-full p-2 backdrop-blur-md',
        className,
      )}
      role="banner"
      aria-label="Application top chrome"
    >
      <GlassPanel className="flex-1 flex items-center gap-2 p-1">
        <RepositorySwitcherTrigger />
        <LocationReadout />
        <AIPresenceIndicator />
      </GlassPanel>
      <div className="flex items-center gap-2">
        <ToggleGroup />
        <FilterControl />
      </div>
    </header>
  );
}
