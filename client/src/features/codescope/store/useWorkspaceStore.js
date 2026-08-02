import { create } from 'zustand';

/**
 * useWorkspaceStore
 * 
 * Manages the global singleton state for the active repository and investigation.
 * Replaces prop-drilling from App.jsx -> WorkspaceRoot -> PerspectiveRouter.
 */
export const useWorkspaceStore = create((set) => ({
  // Repository
  selectedRepo: null,
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),

  // Investigation
  activeInvestigationId: null,
  setActiveInvestigationId: (id) => set({ activeInvestigationId: id }),

  // Global File Selection (for cross-perspective sync)
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // Timeline Event Selection
  selectedTimelineEventId: null,
  setSelectedTimelineEventId: (id) => set({ selectedTimelineEventId: id }),

  // Reset
  resetWorkspace: () => set({
    selectedRepo: null,
    activeInvestigationId: null,
    selectedFile: null,
    selectedTimelineEventId: null
  })
}));
