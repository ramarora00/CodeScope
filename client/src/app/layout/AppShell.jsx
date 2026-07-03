/**
 * AppShell
 *
 * Purpose: Root layout component that defines the permanent spatial structure of the application.
 * Used By: All future screens (as the top‑level component in the React tree).
 * Dependencies: TopChrome, Workspace, cn helper.
 * Accessibility: Implements <header> role via TopChrome and <main> landmark for workspace.
 */

import React from 'react';
import TopChrome from '@/shared/objects/TopChrome';
import Workspace from './Workspace';
import { cn } from '@/shared/utils/cn';

export default function AppShell({ className }) {
  return (
    <div className={cn('flex flex-col h-screen w-screen overflow-hidden', className)}>
      <TopChrome />
      <Workspace />
    </div>
  );
}
