/**
 * Skeleton
 *
 * Purpose:     A shimmering block element that mirrors the final layout's
 *              structure while content is loading. Prevents layout shift
 *              and trains the user's spatial attention before data arrives.
 *              Spinners are banned for structural content per the Product Bible.
 *
 * Used By:     Repository cards while list loads, node inspector while data
 *              resolves, AI response stream before first token arrives.
 *
 * Dependencies: cn(), animations.css (.motion-skeleton-shimmer),
 *               tokens.css (--radius-*, --spacing-*)
 *
 * Accessibility: aria-hidden="true" — Skeleton is decorative. The parent
 *               container must provide aria-busy="true" and aria-label to
 *               communicate loading state to screen readers.
 */

import { cn } from '../utils/classNames';

export function Skeleton({
  className,
  width,
  height,
  radius = 'md',
  circle = false,
}) {
  const radiusMap = {
    xs: 'rounded-[var(--radius-xs)]',
    sm: 'rounded-[var(--radius-sm)]',
    md: 'rounded-[var(--radius-md)]',
    lg: 'rounded-[var(--radius-lg)]',
    pill: 'rounded-[var(--radius-pill)]',
  };

  return (
    <span
      aria-hidden="true"
      role="presentation"
      className={cn(
        'block motion-skeleton-shimmer',
        circle ? 'rounded-full' : radiusMap[radius],
        className
      )}
      style={{
        width: width ?? '100%',
        height: height ?? '1em',
        ...(circle && width ? { height: width } : {}),
      }}
    />
  );
}

/**
 * SkeletonGroup — renders multiple Skeleton rows of varying widths
 * to simulate a text block or list section.
 */
export function SkeletonGroup({ lines = 3, className }) {
  const widths = ['100%', '80%', '60%'];

  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col gap-[var(--spacing-sm)]', className)}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={widths[i % widths.length]}
          radius="sm"
        />
      ))}
    </div>
  );
}
