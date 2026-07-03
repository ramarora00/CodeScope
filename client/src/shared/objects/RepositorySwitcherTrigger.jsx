/**
 * RepositorySwitcherTrigger
 *
 * Purpose:   Small interactive trigger that allows switching the current repository.
 * Used By:   TopChrome.
 * Dependencies: GlassPanel, HealthGlyph, CommandButton.
 * Accessibility: button with aria-label="Switch repository".
 */

import React from 'react';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { HealthGlyph } from '@/shared/ui/HealthGlyph';
import { CommandButton } from '@/shared/ui/CommandButton';
import { cn } from '@/shared/utils/cn';

export default function RepositorySwitcherTrigger({ className, onClick }) {
  return (
    <GlassPanel className={cn('p-1', className)}>
      <CommandButton
        onClick={onClick}
        aria-label="Switch repository"
        icon={<HealthGlyph />}
      >
        Repo
      </CommandButton>
    </GlassPanel>
  );
}
