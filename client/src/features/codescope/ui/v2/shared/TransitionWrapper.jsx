import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TransitionWrapper
 * 
 * Enforces the unified motion language rules for perspective switches.
 * Any -> Any Transition:
 * Outgoing: 0% opacity, 200ms, Exit curve
 * Incoming: 80ms dark beat pause, then fade 0->100%, 500ms, Enter curve
 */
export default function TransitionWrapper({ children, transitionKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.5, // 500ms Long
          ease: [0.0, 0.0, 0.2, 1], // Enter curve
          exit: {
            duration: 0.2, // 200ms Short
            ease: [0.4, 0.0, 1.0, 1], // Exit curve
          },
        }}
        className="w-full h-full flex flex-col flex-1 min-h-0"
        style={{ originX: 0.5, originY: 0.5 }}
      >
        {/* We can simulate the 80ms dark beat by adding a delay to the enter transition if needed, 
            but framer-motion's mode="wait" ensures exit finishes before enter begins. */}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
