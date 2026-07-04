/**
 * GraphLayer
 * Renders nodes and edges on the canvas. No visual style changes beyond token‑based colors.
 *
 * @typedef {Object} GraphLayerProps
 * @property {Array<Object>} nodes - Array of GraphNodeData objects (see types.js).
 * @property {Array<Object>} edges - Array of GraphEdgeData objects.
 * @property {Object} viewport - Viewport object with x, y, zoom.
 * @property {string|null} selectedNodeId
 * @property {string|null} hoveredNodeId
 * @property {Function} onSelect - Callback(id: string).
 * @property {Function} onHover - Callback(id: string|null).
 */
import { motion } from "framer-motion";
import { GraphEdge } from "./GraphEdge";
import { GraphNode } from "./GraphNode";
// Types are documented via JSDoc; import removed.

export function GraphLayer({ nodes, edges, viewport, selectedNodeId, hoveredNodeId, onSelect, onHover }) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const activeId = selectedNodeId ?? hoveredNodeId;
  const activeEdgeEndpoints = new Set();

  if (activeId) {
    edges.forEach((e) => {
      if (e.source === activeId || e.target === activeId) {
        activeEdgeEndpoints.add(e.source);
        activeEdgeEndpoints.add(e.target);
      }
    });
  }

  return (
    <motion.div
      className="absolute left-0 top-0 h-0 w-0"
      style={{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: "0 0",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
    >
      <svg className="absolute overflow-visible" width={1} height={1}>
        {edges.map((edge) => {
          const source = nodeById.get(edge.source);
          const target = nodeById.get(edge.target);
          if (!source || !target) return null;
          const isActive = !!activeId && (edge.source === activeId || edge.target === activeId);
          const isDimmed = !!activeId && !isActive;
          return (
            <GraphEdge
              key={edge.id}
              edge={edge}
              source={source}
              target={target}
              highlighted={isActive}
              dimmed={isDimmed}
            />
          );
        })}
      </svg>

      <div role="tree" aria-label="Repository dependency graph">
        {nodes.map((node) => {
          const isDimmed = !!activeId && node.id !== activeId && !activeEdgeEndpoints.has(node.id);
          return (
            <GraphNode
              key={node.id}
              node={node}
              selected={node.id === selectedNodeId}
              dimmed={isDimmed}
              onSelect={onSelect}
              onHover={onHover}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
