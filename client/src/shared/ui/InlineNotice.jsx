/**
 * InlineNotice
 *
 * Purpose:     A calm, contextual, non-floating notice for communicating
 *              system feedback within a specific panel or region. This is NOT
 *              a toast — it is anchored to its context, never overlapping other
 *              content. Per the Product Bible: "State the fact, state the
 *              consequence, offer the one most likely next action."
 *
 * Used By:     Parse error state on failed AST nodes, empty state messages in
 *              graph views, AI Observatory warnings, Impact Analysis readouts.
 *
 * Dependencies: cn(), tokens.css (--color-status-*, --color-border-*,
 *               --color-surface-elevated, --spacing-*, --radius-md),
 *               lucide-react for status icons.
 *
 * Accessibility: role="alert" for error/warning variants to trigger
 *               immediate screen reader announcements. role="note" for
 *               info/neutral variants as supplementary information.
 */

import { cn } from '../utils/classNames';
import { AlertCircle, Info, CheckCircle, AlertTriangle, X } from '../icons';

const variantConfig = {
  error: {
    icon: AlertCircle,
    border: 'border-[var(--color-status-error)] border-opacity-40',
    bg: 'bg-[var(--color-status-error)] bg-opacity-5',
    iconColor: 'text-[var(--color-status-error)]',
    role: 'alert',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-[var(--color-status-warning)] border-opacity-40',
    bg: 'bg-[var(--color-status-warning)] bg-opacity-5',
    iconColor: 'text-[var(--color-status-warning)]',
    role: 'alert',
  },
  success: {
    icon: CheckCircle,
    border: 'border-[var(--color-status-success)] border-opacity-40',
    bg: 'bg-[var(--color-status-success)] bg-opacity-5',
    iconColor: 'text-[var(--color-status-success)]',
    role: 'note',
  },
  info: {
    icon: Info,
    border: 'border-[var(--color-status-info)] border-opacity-40',
    bg: 'bg-[var(--color-status-info)] bg-opacity-5',
    iconColor: 'text-[var(--color-status-info)]',
    role: 'note',
  },
};

export function InlineNotice({
  children,
  className,
  variant = 'info',
  title,
  action,
  onDismiss,
}) {
  const config = variantConfig[variant] ?? variantConfig.info;
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      className={cn(
        'flex items-start gap-[var(--spacing-sm)]',
        'p-[var(--spacing-sm)] rounded-[var(--radius-md)]',
        'border',
        config.border,
        config.bg,
        className
      )}
    >
      <Icon
        size={14}
        aria-hidden="true"
        className={cn('flex-shrink-0 mt-px', config.iconColor)}
      />

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-xs font-medium text-[var(--color-text-body)] mb-[var(--spacing-xs)]">
            {title}
          </p>
        )}
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          {children}
        </p>
        {action && (
          <div className="mt-[var(--spacing-sm)]">{action}</div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className={cn(
            'flex-shrink-0 text-[var(--color-text-muted)]',
            'hover:text-[var(--color-text-body)] motion-transition-fast'
          )}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
