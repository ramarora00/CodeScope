/**
 * GraphNode
 * Renders a node button on the canvas. Only color values are replaced with design‑token classes.
 *
 * @typedef {Object} GraphNodeProps
 * @property {any} node - GraphNodeData (see types.js)
 * @property {boolean} selected
 * @property {boolean} dimmed
 * @property {Function} onSelect - Callback(id: string)
 * @property {Function} onHover - Callback(id: string|null)
 */
import { motion } from "framer-motion";
import { cn } from "@/shared/utils";

export function GraphNode({ node, selected, dimmed, onSelect, onHover }) {
  const tint = (function healthTint(health) {
    if (health === undefined) return "rgba(148,163,184,0.9)"; // neutral slate
    if (health >= 0.7) return "rgba(52,211,153,0.9)"; // emerald
    if (health >= 0.4) return "rgba(251,191,36,0.9)"; // amber
    return "rgba(248,113,113,0.9)"; // rose
  })(node.health);

  return (
    <motion.button
      type="button"
      role="treeitem"
      aria-selected={selected}
      aria-label={`${node.kind}: ${node.label}`}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node.id)}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-1.5",
        "text-[13px] font-medium tracking-tight text-token-foreground outline-none backdrop-blur-md",
        "transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        selected ? "border-token-primary/90 bg-token-primary/16" : "border-token-muted/10 bg-token-muted/5",
        dimmed && "opacity-25"
      )}
      style={{ left: node.x, top: node.y }}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        scale: selected ? 1.08 : 1,
      }}
      whileHover={{ scale: selected ? 1.08 : 1.05 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <span className={cn("text-[11px] leading-none")} style={{ color: tint }}>
        {({ file: "◇", module: "◆", symbol: "○" }[node.kind])}
      </span>
      <span className={cn("whitespace-nowrap")}>{node.label}</span>
    </motion.button>
  );
}
