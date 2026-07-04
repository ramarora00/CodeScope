/**
 * MiniMapPlaceholder
 * Structural placeholder for a minimap – only visual layout, no interaction.
 *
 * @typedef {Object} MiniMapPlaceholderProps
 * @property {Array<Object>} nodes - GraphNodeData array
 * @property {Object} viewport - Viewport object
 */
import React from "react";
import { cn } from "@/shared/utils";

export function MiniMapPlaceholder({ nodes, viewport }) {
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(0, ...xs);
  const maxX = Math.max(1, ...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(1, ...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  return (
    <div
      role="img"
      aria-label="Minimap overview of the graph"
      className={cn(
        "absolute bottom-4 right-4 rounded-xl border border-token-muted/10 bg-token-muted/5",
        "p-2 backdrop-blur-xl"
      )}
      style={{ width: 148, height: 96 }}
    >
      <div className={cn("relative h-full w-full overflow-hidden rounded-md bg-token-surface/5")}>
        {nodes.map((n) => (
          <span
            key={n.id}
            aria-hidden="true"
            className={cn("absolute h-[3px] w-[3px] rounded-full bg-token-muted/70")}
            style={{
              left: `${((n.x - minX) / spanX) * 100}%`,
              top: `${((n.y - minY) / spanY) * 100}%`,
            }}
          />
        ))}
        <div
          aria-hidden="true"
          className={cn("absolute rounded-sm border border-token-primary/70")}
          style={{
            width: `${Math.min(100, (100 / viewport.zoom) * 0.6)}%`,
            height: `${Math.min(100, (100 / viewport.zoom) * 0.6)}%`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}
