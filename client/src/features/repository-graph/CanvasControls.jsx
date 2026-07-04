/**
 * CanvasControls
 * Bottom‑left UI for zoom controls and a placeholder search input.
 * Uses shared ActionButton and design‑token classes.
 *
 * @param {Object} props
 * @param {number} props.zoom
 * @param {Function} props.onZoomIn
 * @param {Function} props.onZoomOut
 * @param {Function} props.onReset
 */
import React from 'react';
import { ActionButton } from '@/shared/ui/ActionButton';
import { cn } from '@/shared/utils';

export function CanvasControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  return (
    <>
      {/* Search placeholder – UI only, no functionality */}
      <div className={cn('absolute left-4 top-4 w-56') }>
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border border-token-muted/10 bg-token-muted/5',
            'px-3 py-2 text-token-muted backdrop-blur-xl'
          )}
        >
          <span aria-hidden="true" className={cn('text-[13px]')}>⌘K</span>
          <input
            type="text"
            disabled
            placeholder="Search this graph…"
            aria-label="Search this graph (use Command Palette)"
            className={cn(
              'w-full cursor-not-allowed bg-transparent text-[13px] text-token-muted',
              'placeholder:text-token-muted outline-none'
            )}
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div
        role="group"
        aria-label="Canvas zoom controls"
        className={cn(
          'absolute bottom-4 left-4 flex items-center gap-1 rounded-xl border border-token-muted/10',
          'bg-token-muted/5 p-1 text-token-muted backdrop-blur-xl'
        )}
      >
        <ActionButton label="Zoom out" onClick={onZoomOut} variant="secondary">
          −
        </ActionButton>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset zoom to 100%"
          className={cn(
            'min-w-[3.25rem] rounded-lg px-2 py-1 text-[12px] tabular-numbers text-token-muted',
            'outline-none transition-colors hover:bg-token-muted/8',
            'focus-visible:ring-2 focus-visible:ring-indigo-400'
          )}
        >
          {Math.round(zoom * 100)}%
        </button>
        <ActionButton label="Zoom in" onClick={onZoomIn} variant="secondary">
          +
        </ActionButton>
      </div>
    </>
  );
}
