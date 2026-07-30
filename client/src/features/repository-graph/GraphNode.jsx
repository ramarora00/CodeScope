/**
 * GraphNode
 * Renders a node button on the canvas. Only color values are replaced with design‑token classes.
 *
 * @typedef {Object} GraphNodeProps
 * @property {any} node - GraphNodeData (see types.js)
 * @property {boolean} userSelected
 * @property {boolean} aiFocused
 * @property {boolean} dimmed
 * @property {Function} onSelect - Callback(id: string)
 * @property {Function} onHover - Callback(id: string|null)
 */
import { motion } from "framer-motion";
import { cn } from "@/shared/utils";

export function GraphNode({ node, userSelected, aiFocused, dimmed, onSelect, onHover }) {
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
      aria-selected={userSelected}
      aria-label={`${node.kind}: ${node.label}`}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(node.id)}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full px-3 py-1.5 transition-all outline-none backdrop-blur-md",
        "text-[13px] font-medium tracking-tight text-[#D8DCE6]",
        // SPRINT 3B: Dual Selection Visuals
        userSelected ? "ring-2 ring-white border border-white bg-white/10 z-20" : "border border-white/10 bg-[#0A0E15]",
        aiFocused && !userSelected ? "border-[#3B82F6] bg-[#3B82F6]/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] z-10" : "",
        dimmed && "opacity-25"
      )}
      style={{ left: node.x, top: node.y }}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        scale: userSelected ? 1.08 : aiFocused ? 1.05 : 1,
      }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <span className={cn("text-[11px] leading-none")} style={{ color: tint }}>
        {({ file: "◇", module: "◆", symbol: "○" }[node.kind])}
      </span>
      <span className={cn("whitespace-nowrap")}>{node.label}</span>
    </motion.button>
  );
}
