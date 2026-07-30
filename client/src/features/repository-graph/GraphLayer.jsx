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

export function GraphLayer({ nodes, edges, viewport, selectedNodeId, hoveredNodeId, focusNodeIds = [], onSelect, onHover }) {
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
          
          let isDimmed = false;
          if (activeId) {
            isDimmed = !isActive;
          } else if (focusNodeIds.length > 0) {
            // SPRINT 3: Predictive focus context
            // If there's an active focus context, dim edges where neither end is in focus
            const sourceInFocus = focusNodeIds.some(id => edge.source.includes(id) || id.includes(edge.source));
            const targetInFocus = focusNodeIds.some(id => edge.target.includes(id) || id.includes(edge.target));
            if (!sourceInFocus && !targetInFocus) {
              isDimmed = true;
            }
          }

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
          let isDimmed = false;
          let aiFocused = false;
          
          if (focusNodeIds.length > 0) {
            aiFocused = focusNodeIds.some(id => node.id.includes(id) || id.includes(node.id));
            if (!aiFocused) {
              isDimmed = true;
            }
          }

          // Hover/active overrides dimming
          if (activeId) {
            if (node.id !== activeId && !activeEdgeEndpoints.has(node.id)) {
               isDimmed = true;
            } else {
               isDimmed = false;
            }
          }

          return (
            <GraphNode
              key={node.id}
              node={node}
              userSelected={node.id === selectedNodeId}
              aiFocused={aiFocused}
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
