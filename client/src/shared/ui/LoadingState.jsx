/**
 * LoadingState
 *
 * Purpose:     Named, text-driven loading indicator that replaces generic
 *              spinners for content areas. Communicates *what* is loading,
 *              not just *that* something is loading — per the Product Bible's
 *              rule: "If something takes longer than 2s, name what's happening."
 *
 * Used By:     Graph canvas while topology resolves, AI Observatory while
 *              the model reasons, Execution Trace while indexing, File Tree.
 *
 * Dependencies: cn(), animations.css (.motion-loading-pulse),
 *               tokens.css (--color-text-muted, --color-accent-aurora-blue,
 *               --spacing-*)
 *
 * Accessibility: role="status" and aria-live="polite" ensure screen readers
 *               announce the loading message. aria-busy="true" on the parent
 *               container should be set by the feature using this component.
 */

import { cn } from '../utils/classNames';

export function LoadingState({
  className,
  message = 'Loading…',
  detail,
  size = 'md',
}) {
  const sizeMap = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={detail ? `${message} ${detail}` : message}
      className={cn(
        'flex flex-col items-center justify-center gap-[var(--spacing-sm)]',
        'text-center select-none',
        className
      )}
    >
      {/* Orbital dot ring — replaces the generic spinner */}
      <div className="relative w-6 h-6 flex-shrink-0">
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-0 rounded-full border border-[var(--color-border-base)]'
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-1.5 h-1.5 rounded-full bg-[var(--color-accent-aurora-blue)]',
            'motion-orbital-glow'
          )}
        />
      </div>

      <div className="flex flex-col gap-[var(--spacing-xs)]">
        <span
          className={cn(
            sizeMap[size],
            'text-[var(--color-text-muted)] motion-loading-pulse font-medium'
          )}
        >
          {message}
        </span>
        {detail && (
          <span className="text-[10px] text-[var(--color-text-muted)] opacity-60 font-mono">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}
