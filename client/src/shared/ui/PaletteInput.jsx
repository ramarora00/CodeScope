/**
 * PaletteInput
 *
 * Purpose:     The singular, oversized input field for the Command Palette /
 *              Omnibar. This is the "nervous system" input described in §1 of
 *              the Product Experience Bible. It must feel weightier and more
 *              intentional than QueryInput — it IS the primary navigation method.
 *
 * Used By:     CommandPalette feature (shared/ui or features/command-palette).
 *              Only one instance should be mounted in the application at a time.
 *
 * Dependencies: cn(), tokens.css (--color-glass-base, --color-border-accent,
 *               --color-text-display, --radius-lg, --spacing-*),
 *               lucide-react for the search icon.
 *
 * Accessibility: role="combobox" with aria-expanded, aria-controls, and
 *               aria-autocomplete set by the parent CommandPalette component.
 *               This primitive only handles input rendering.
 */

import { cn } from '../utils/classNames';
import { Search } from '../icons';

export function PaletteInput({
  className,
  placeholder = 'Search anything, ask anything…',
  'aria-label': ariaLabel = 'Command palette input',
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  id,
  ...props
}) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-[var(--spacing-md)]',
        'px-[var(--spacing-md)] py-[var(--spacing-md)]',
        'border-b border-[var(--color-border-base)]',
        className
      )}
    >
      <Search
        size={18}
        aria-hidden="true"
        className="text-[var(--color-text-muted)] flex-shrink-0"
      />
      <input
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent outline-none border-none',
          'text-[var(--color-text-display)] text-base font-light',
          'placeholder:text-[var(--color-text-muted)]',
          'font-[var(--font-sans)]'
        )}
        {...props}
      />
    </div>
  );
}
