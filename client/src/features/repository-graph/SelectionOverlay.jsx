/**
 * @typedef {Object} SelectionOverlayProps
 * @property {any} node - GraphNodeData (or null)
 * @property {Function} onClose - Callback to close overlay
 */

import { AnimatePresence, motion } from "framer-motion";

export function SelectionOverlay({ node, onClose }) {
  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          role="region"
          aria-label={`Details for ${node.label}`}
          initial={{ opacity: 0, x: 12, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="absolute right-4 top-4 w-64 rounded-2xl border border-token-muted/10 bg-token-muted/6 p-4 text-token-foreground shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-token-muted">{node.kind}</p>
              <h3 className="mt-0.5 text-sm font-semibold">{node.label}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close selection details"
              className="rounded-full p-1 text-token-muted outline-none transition-colors hover:text-token-foreground focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              ✕
            </button>
          </div>

          {node.health !== undefined && (
            <div className="mt-3">
              <p className="text-[11px] text-token-muted">Health</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-token-muted/10">
                <motion.div
                  className="h-full rounded-full bg-token-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${node.health * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-1.5">
            {["Trace", "Impact", "Ask AI"].map((action) => (
              <button
                key={action}
                type="button"
                className="rounded-lg border border-token-muted/10 bg-token-muted/4 px-2.5 py-1 text-[12px] text-token-foreground outline-none transition-colors hover:bg-token-muted/9 focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                {action}
              </button>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
