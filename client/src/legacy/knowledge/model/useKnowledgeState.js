import { useState, useCallback } from 'react';

/**
 * useKnowledgeState manages the core Focus state for the Repository Knowledge capability.
 * Instead of separate states for search and graph, the "Focus" is the single source of truth.
 * Changing focus updates the entire capability.
 */
export function useKnowledgeState() {
  const [focus, setFocus] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const updateFocus = useCallback((newFocus) => {
    setFocus(newFocus);
    setIsSearching(false); // Focusing inherently resolves an active search
  }, []);

  const clearFocus = useCallback(() => {
    setFocus(null);
  }, []);

  return {
    focus,
    updateFocus,
    clearFocus,
    isSearching,
    setIsSearching
  };
}
