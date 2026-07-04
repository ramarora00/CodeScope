/**
 * GraphEdge
 * Renders a curved bezier edge between two nodes.
 * Only color values are token‑based; layout and animation remain unchanged.
 */
import { motion } from "framer-motion";
/** @typedef {Object} GraphEdgeProps
 * @property {any} edge - GraphEdgeData (structure defined in types.js)
 * @property {any} source - GraphNodeData
 * @property {any} target - GraphNodeData
 * @property {boolean} highlighted
 * @property {boolean} dimmed
 */
export function GraphEdge({ edge, source, target, highlighted, dimmed }) {
  const midX = (source.x + target.x) / 2;
  const path = `M ${source.x} ${source.y} Q ${midX} ${source.y}, ${midX} ${(source.y + target.y) / 2} T ${target.x} ${target.y}`;

  return (
    <motion.path
      d={path}
      fill="none"
      strokeLinecap="round"
      aria-hidden="true"
      data-edge-id={edge.id}
      animate={{
        stroke: highlighted ? "var(--color-primary)" : "var(--color-muted)",
        strokeWidth: highlighted ? 1.75 : 1,
        opacity: dimmed ? 0.12 : 1,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    />
  );
}
