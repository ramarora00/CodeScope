import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SharedCaption
 * 
 * Rules:
 * - Inter 13px italic, opacity 60%
 * - Fade in 200ms (Enter), fade out 200ms (Exit)
 * - Terse, lowercase, engineer-speak
 */
export default function SharedCaption({ text, isVisible = true }) {
  return (
    <AnimatePresence>
      {isVisible && text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2, // 200ms
            ease: [0.0, 0.0, 0.2, 1], // Enter
            exit: {
              ease: [0.4, 0.0, 1.0, 1], // Exit
            }
          }}
          className="font-sans text-[13px] italic tracking-wide text-white pointer-events-none select-none"
        >
          {text.toLowerCase()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
