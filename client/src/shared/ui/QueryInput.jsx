/**
 * QueryInput
 *
 * Purpose:     A text input field optimized for semantic search and structured
 *              queries within panels (e.g., filtering graph nodes, searching
 *              the file tree). Not the Command Palette input — see PaletteInput
 *              for that. This is for inline, contextual querying.
 *
 * Used By:     Architecture Graph filter bar, File Tree search,
 *              Impact Analysis target selector.
 *
 * Dependencies: cn(), tokens.css (--color-surface-elevated, --color-border-*,
 *               --color-text-*, --radius-sm, --transition-fast),
 *               lucide-react for the optional leading/trailing icon.
 *
 * Accessibility: Always requires an associated <label> or aria-label.
 *               Input has role="searchbox" when used for search. Focus ring
 *               via util-focus-ring. Placeholder text meets contrast minimums.
 */

import { cn } from '../utils/classNames';

export function QueryInput({
  className,
  placeholder = 'Search...',
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  onTrailingClick,
  role = 'searchbox',
  'aria-label': ariaLabel,
  id,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative flex items-center',
        'rounded-[var(--radius-sm)] border border-[var(--color-border-base)]',
        'bg-[var(--color-surface-elevated)]',
        'focus-within:border-[var(--color-border-accent)]',
        'motion-transition-fast',
        className
      )}
    >
      {LeadingIcon && (
        <span
          aria-hidden="true"
          className="pl-[var(--spacing-sm)] text-[var(--color-text-muted)] flex-shrink-0"
        >
          <LeadingIcon size={14} />
        </span>
      )}

      <input
        id={id}
        role={role}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent text-body text-[var(--color-text-body)]',
          'placeholder:text-[var(--color-text-muted)]',
          'px-[var(--spacing-sm)] py-[var(--spacing-xs)]',
          'outline-none border-none',
          LeadingIcon && 'pl-[var(--spacing-xs)]'
        )}
        {...props}
      />

      {TrailingIcon && (
        <button
          type="button"
          onClick={onTrailingClick}
          aria-label="Clear input"
          className={cn(
            'pr-[var(--spacing-sm)] text-[var(--color-text-muted)]',
            'hover:text-[var(--color-text-body)] motion-transition-fast flex-shrink-0'
          )}
        >
          <TrailingIcon size={14} />
        </button>
      )}
    </div>
  );
}
