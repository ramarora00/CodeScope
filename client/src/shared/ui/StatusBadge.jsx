/**
 * StatusBadge
 *
 * Purpose:     Compact, pill-shaped indicator for system states and semantic
 *              classifications. Uses desaturated status colors to communicate
 *              severity without alarming the operator. Color is never the
 *              sole encoder — shape + label always accompany it.
 *
 * Used By:     Repository health indicators, node inspector state labels,
 *              AI presence states (idle / thinking / has-insight),
 *              indexing pipeline phases.
 *
 * Dependencies: cn(), tokens.css (--color-status-*, --color-text-*,
 *               --radius-pill, --spacing-*)
 *
 * Accessibility: Renders as <span>. Provides aria-label when only a dot is
 *               shown. Status meaning is conveyed by both color and text label.
 */

import { cn } from '../utils/classNames';

const variantStyles = {
  success: {
    dot: 'bg-[var(--color-status-success)]',
    text: 'text-[var(--color-status-success)]',
    container: 'border-[var(--color-status-success)] border-opacity-30',
  },
  warning: {
    dot: 'bg-[var(--color-status-warning)]',
    text: 'text-[var(--color-status-warning)]',
    container: 'border-[var(--color-status-warning)] border-opacity-30',
  },
  error: {
    dot: 'bg-[var(--color-status-error)]',
    text: 'text-[var(--color-status-error)]',
    container: 'border-[var(--color-status-error)] border-opacity-30',
  },
  info: {
    dot: 'bg-[var(--color-status-info)]',
    text: 'text-[var(--color-status-info)]',
    container: 'border-[var(--color-status-info)] border-opacity-30',
  },
  neutral: {
    dot: 'bg-[var(--color-text-muted)]',
    text: 'text-[var(--color-text-muted)]',
    container: 'border-[var(--color-border-base)]',
  },
};

export function StatusBadge({
  children,
  className,
  variant = 'neutral',
  pulse = false,
  dotOnly = false,
  'aria-label': ariaLabel,
}) {
  const styles = variantStyles[variant] ?? variantStyles.neutral;

  return (
    <span
      role="status"
      aria-label={ariaLabel ?? (dotOnly ? variant : undefined)}
      className={cn(
        'inline-flex items-center gap-[var(--spacing-xs)]',
        !dotOnly && [
          'px-[var(--spacing-sm)] py-[var(--spacing-xs)]',
          'rounded-[var(--radius-pill)] border',
          'bg-[var(--color-surface-elevated)]',
          styles.container,
        ],
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full flex-shrink-0',
          'w-[6px] h-[6px]',
          styles.dot,
          pulse && 'motion-node-pulse'
        )}
      />
      {!dotOnly && children && (
        <span className={cn('text-[11px] font-medium tracking-wide', styles.text)}>
          {children}
        </span>
      )}
    </span>
  );
}
