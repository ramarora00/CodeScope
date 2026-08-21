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
  
  // Repository Graph Data (Loaded once per repo)
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),

  // Investigation
  activeInvestigationId: null,
  setActiveInvestigationId: (id) => set({ activeInvestigationId: id }),

  // Global File Selection (User explicit interaction)
  userSelectedFile: null,
  setUserSelectedFile: (file) => set({ userSelectedFile: file }),

  // Workspace Memory (Persisted State for UI components)
  explorerState: { scrollPos: 0, expandedFolders: {} },
  setExplorerState: (stateUpdater) => set((prev) => ({ 
    explorerState: typeof stateUpdater === 'function' ? stateUpdater(prev.explorerState) : { ...prev.explorerState, ...stateUpdater } 
  })),

  architectureState: { camera: { x: 0, y: 0, zoom: 1 } },
  setArchitectureState: (state) => set({ architectureState: state }),

  // Camera Ownership
  userCamera: null, // { node, x, y, zoom }
  setUserCamera: (camera) => set({ userCamera: camera }),
  
  // Timeline Event Selection
  selectedTimelineEventId: null,
  setSelectedTimelineEventId: (id) => set({ selectedTimelineEventId: id }),

  // Reset
  resetWorkspace: () => set({
    selectedRepo: null,
    fileTree: [],
    activeInvestigationId: null,
    userSelectedFile: null,
    selectedTimelineEventId: null,
    explorerState: { scrollPos: 0, expandedFolders: {} },
    architectureState: { camera: { x: 0, y: 0, zoom: 1 } },
    userCamera: null
  })
}));

if (typeof window !== 'undefined') {
  window.__workspace_store__ = useWorkspaceStore;
}
