/**
 * GraphBackground
 * Plain background component for the repository graph canvas.
 * Uses design‑token classes for color; no GlassPanel wrapper.
 *
 * @param {Object} props
 * @param {Object} props.viewport
 * @param {number} props.viewport.zoom
 * @param {number} props.viewport.x
 * @param {number} props.viewport.y
 */
import React from "react";
import { cn } from "@/shared/utils";

export function GraphBackground({ viewport }) {
  const size = 28 * viewport.zoom;
  const offsetX = viewport.x % size;
  const offsetY = viewport.y % size;

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-token-surface")}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    >
      {/* radial vignette so the grid fades toward the edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, #08090b 85%)",
        }}
      />
    </div>
  );
}
