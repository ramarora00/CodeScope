/**
 * AppShell
 *
 * Purpose: Root layout component that defines the permanent spatial structure of the application.
 * Used By: All future screens (as the top‑level component in the React tree).
 * Dependencies: TopChrome, Workspace, cn helper.
 * Accessibility: Implements <header> role via TopChrome and <main> landmark for workspace.
 */

import React from 'react';
// import TopChrome from '@/shared/objects/TopChrome';
import Workspace from './Workspace';
import { cn } from '@/shared/utils';

export default function AppShell({ className, children, showTopChrome = false }) {
  return (
    <div className={cn('flex flex-col h-screen w-screen overflow-hidden', className)}>
      {showTopChrome && null /* <TopChrome /> disabled for now due to missing deps */}
      <Workspace>
        {children}
      </Workspace>
    </div>
  );
}
