/**
 * SectionHeader
 *
 * Purpose:     Standardizes the typographic treatment for panel and sidebar
 *              section titles. Optionally accepts an action slot for right-
 *              aligned controls (e.g., a collapse button, count badge).
 *              Enforces the single-weight-change typography rule from the Bible.
 *
 * Used By:     Node Inspector sections, AI Observatory panel headers,
 *              sidebar navigation group labels, Mission Control quadrant titles.
 *
 * Dependencies: cn(), typography.css (.text-caption, .text-section),
 *               tokens.css (--color-border-subtle, --spacing-*)
 *
 * Accessibility: Renders as the appropriate heading level via the `as` prop
 *               (defaults to h2). Screen readers correctly parse document
 *               structure when heading levels are used.
 */

import { cn } from '../utils/classNames';

export function SectionHeader({
  children,
  className,
  action,
  as: Tag = 'h2',
  divider = false,
  size = 'section',
}) {
  const sizeClass = {
    caption: 'text-caption',
    section: 'text-section',
    heading: 'text-heading',
  }[size] ?? 'text-section';

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'px-[var(--spacing-md)] py-[var(--spacing-sm)]',
        divider && 'border-b border-[var(--color-border-subtle)]',
        className
      )}
    >
      <Tag className={cn(sizeClass, 'flex-1 min-w-0 truncate')}>
        {children}
      </Tag>
      {action && (
        <div className="flex items-center gap-[var(--spacing-xs)] flex-shrink-0 ml-[var(--spacing-sm)]">
          {action}
        </div>
      )}
    </div>
  );
}
