/**
 * CommandButton
 *
 * Purpose:     Primary action button for command-driven interactions.
 *              Renders a keyboard shortcut hint alongside the label.
 *              Models the "keyboard-first" UX philosophy from the Product Bible.
 *
 * Used By:     Command Palette triggers, top chrome action zones,
 *              quick-action toolbars.
 *
 * Dependencies: cn(), tokens.css (--color-surface-elevated, --color-accent-*,
 *               --transition-fast, --radius-sm), lucide-react for icons.
 *
 * Accessibility: Uses <button> with role="button". Keyboard hint rendered in
 *               <kbd> for semantic screen-reader meaning. Full focus-visible ring.
 */

import { cn } from '../utils/classNames';

export function CommandButton({
  children,
  className,
  shortcut,
  icon: Icon,
  variant = 'default',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  ...props
}) {
  const variants = {
    default: cn(
      'bg-[var(--color-surface-elevated)] border border-[var(--color-border-base)]',
      'hover:border-[var(--color-border-strong)] hover:bg-[var(--color-glass-hover)]'
    ),
    ghost: cn(
      'bg-transparent border border-transparent',
      'hover:bg-[var(--color-glass-hover)] hover:border-[var(--color-border-subtle)]'
    ),
    accent: cn(
      'bg-[var(--color-accent-aurora-blue)] bg-opacity-20 border border-[var(--color-border-accent)]',
      'hover:bg-opacity-30'
    ),
  };

  return (
    <button
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-[var(--spacing-sm)] px-[var(--spacing-sm)] py-[var(--spacing-xs)]',
        'rounded-[var(--radius-sm)] text-body motion-transition-fast util-focus-ring',
        'text-[var(--color-text-body)] disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children && <span className="text-[var(--color-text-body)] text-sm">{children}</span>}
      {shortcut && (
        <kbd
          className={cn(
            'ml-auto text-[10px] font-mono tracking-wide',
            'text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]',
            'rounded-[var(--radius-xs)] px-1 py-px leading-none'
          )}
          aria-label={`Keyboard shortcut: ${shortcut}`}
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
