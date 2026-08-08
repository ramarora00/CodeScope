import { useState, useCallback, useRef } from 'react';

/**
 * useAnimationQueue
 * 
 * Enforces the "One Primary Motion" rule from the Product Specification.
 * Allows components to push animations to a queue and run them sequentially,
 * waiting for each to finish before starting the next.
 */
export function useAnimationQueue() {
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef([]);

  const processQueue = useCallback(async () => {
    if (queueRef.current.length === 0) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const nextAnimation = queueRef.current.shift();
    
    try {
      await nextAnimation();
    } catch (e) {
      console.error('[AnimationQueue] Animation failed', e);
    } finally {
      // Process next immediately, rely on the animation promise to handle its own duration
      processQueue();
    }
  }, []);

  const enqueue = useCallback((animationPromiseFn) => {
    queueRef.current.push(animationPromiseFn);
    if (!isPlaying && queueRef.current.length === 1) {
      processQueue();
    }
  }, [isPlaying, processQueue]);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setIsPlaying(false);
  }, []);

  return { enqueue, clearQueue, isPlaying };
}
