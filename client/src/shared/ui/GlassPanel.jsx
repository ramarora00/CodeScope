/**
 * GlassPanel
 *
 * Purpose:     Primary structural surface container using glassmorphism.
 *              The foundational building block for sidebars, modals, and
 *              overlay panels throughout the instrument.
 *
 * Used By:     Node Inspector, AI Observatory panel, Command Palette,
 *              Mission Control cards, all overlay surfaces.
 *
 * Dependencies: cn() utility, tokens.css (--color-glass-*, --color-border-*,
 *               --elevation-*, --radius-*)
 *
 * Accessibility: Uses semantic 'section' or 'div' based on `as` prop.
 *               Supports aria-label for landmark identification.
 */

import { cn } from '../utils/classNames';

const elevationMap = {
  0: '',
  1: 'util-shadow-depth-1',
  2: 'util-shadow-depth-2',
  3: 'util-shadow-depth-3',
};

const radiusMap = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  xl: 'rounded-[var(--radius-xl)]',
};

export function GlassPanel({
  children,
  className,
  elevation = 1,
  radius = 'lg',
  as: Tag = 'div',
  ambient = false,
  'aria-label': ariaLabel,
  ...props
}) {
  return (
    <Tag
      aria-label={ariaLabel}
      className={cn(
        'util-glass-panel',
        radiusMap[radius],
        elevationMap[elevation],
        ambient && 'util-ambient-glow',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
