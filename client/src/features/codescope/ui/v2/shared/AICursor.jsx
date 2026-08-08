import React from 'react';
import { motion } from 'framer-motion';

/**
 * AICursor Component
 * 
 * Rules:
 * - 2px vertical bar
 * - Accent color
 * - 70% opacity
 * - 0 blink rate (never blinks)
 * - Soft glow (4px blur)
 */
export default function AICursor({ 
  active = true, 
  height = '20px', 
  color = 'var(--color-accent-soft-teal, #3FB950)',
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 0.7 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.0, 0.0, 0.2, 1] // Enter curve
      }}
      className={`inline-block pointer-events-none ${className}`}
      style={{
        width: '2px',
        height,
        backgroundColor: color,
        boxShadow: `0 0 4px ${color}`,
        borderRadius: '1px'
      }}
    />
  );
}
