/**
 * ActionButton
 *
 * Purpose:     Icon-driven contextual button for local actions within panels
 *              and inspectors. Intentionally smaller and lower visual weight
 *              than CommandButton — it is for secondary manipulation, not
 *              primary invocation. Follows the Analyze/Trace/Ask/Open verb
 *              grammar defined in the Product Experience Bible.
 *
 * Used By:     Graph node inspector actions, code view context rail,
 *              AI response reference chips, section header action slots.
 *
 * Dependencies: cn(), tokens.css (--color-text-muted, --color-border-*,
 *               --transition-fast, --radius-sm), lucide-react for icons.
 *
 * Accessibility: Always requires an aria-label when icon-only (no children).
 *               Uses <button> with full keyboard operability. Focus ring
 *               is provided via util-focus-ring.
 */

import { cn } from '../utils/classNames';

export function ActionButton({
  children,
  className,
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  ...props
}) {
  if (!children && !ariaLabel) {
    console.warn('[ActionButton] Icon-only buttons require an aria-label prop.');
  }

  const sizeMap = {
    sm: { padding: 'p-[var(--spacing-xs)]', iconSize: 12 },
    md: { padding: 'p-[var(--spacing-sm)]', iconSize: 14 },
    lg: { padding: 'p-[var(--spacing-md)]', iconSize: 16 },
  };

  const variantMap = {
    ghost: 'bg-transparent hover:bg-[var(--color-glass-hover)] border-transparent',
    outlined: 'bg-transparent border border-[var(--color-border-subtle)] hover:border-[var(--color-border-base)]',
  };

  const { padding, iconSize } = sizeMap[size] ?? sizeMap.md;

  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-[var(--spacing-xs)]',
        'rounded-[var(--radius-sm)] border motion-transition-fast util-focus-ring',
        'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantMap[variant],
        padding,
        className
      )}
      {...props}
    >
      {Icon && <Icon size={iconSize} aria-hidden="true" />}
      {children && <span className="text-xs">{children}</span>}
    </button>
  );
}
