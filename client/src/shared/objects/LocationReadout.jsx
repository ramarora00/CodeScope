/**
 * LocationReadout
 *
 * Purpose:   Displays the current location/path within the application (e.g., breadcrumb).
 * Used By:   TopChrome.
 * Dependencies: BreadcrumbSegment (primitive), cn helper.
 * Accessibility: Uses <nav aria-label="breadcrumb"> with appropriate aria-current on the last segment.
 */

import React from 'react';
import { BreadcrumbSegment } from '@/shared/ui/BreadcrumbSegment';
import { cn } from '@/shared/utils/cn';

export default function LocationReadout({ className, segments = [] }) {
  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="breadcrumb"
    >
      {segments.map((seg, idx) => (
        <BreadcrumbSegment
          key={seg.id ?? idx}
          label={seg.label}
          href={seg.href}
          isCurrent={idx === segments.length - 1}
        />
      ))}
    </nav>
  );
}
