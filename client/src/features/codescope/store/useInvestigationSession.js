import { create } from 'zustand';

export const PLAYBACK_PROFILES = {
  NORMAL: { name: 'Normal', baseDelayMs: 200, speedMultiplier: 1.0 },
  FAST: { name: 'Fast', baseDelayMs: 100, speedMultiplier: 2.0 },
  INSTANT: { name: 'Instant', baseDelayMs: 0, speedMultiplier: 100.0 },
  DEMO: { name: 'Demo Mode', baseDelayMs: 400, speedMultiplier: 0.5 },
};

export const SESSION_STATES = {
  IDLE: 'Idle',
  STARTING: 'Starting',
  RECEIVING: 'Receiving',
  PLAYING: 'Playing',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ERROR: 'Error'
};

export const useInvestigationSession = create((set, get) => ({
  // Core Session State
  sessionState: SESSION_STATES.IDLE,
  playbackProfile: PLAYBACK_PROFILES.NORMAL,
  
  // UI Orchestration
  isAnimating: false,
  completeAnimation: () => set({ isAnimating: false }),

  // Event Queues
  incomingEvents: [],
  processedEvents: [],
  
  // Investigation Data
  bookmarks: [],
  statistics: {
    filesRead: 0,
    jumps: 0,
    symbolsDiscovered: 0
  },
  metadata: {
    sessionId: null,
    repoId: null,
    budget: null,
    isUnderstandingMode: false
  },

  // Persistent Repository Context (survives across sessions)
  repositoryContext: {
    framework: null,
    findings: [],
    stats: {
      filesIndexed: 0,
      entryPoints: 0,
      services: 0
    }
  },
  
  // SPRINT 3: Predictive Focus Context (temporary per investigation)
  focusContext: {
    id: null,
    mission: null,
    status: 'repository', // 'repository' | 'planning' | 'investigating' | 'review'
    currentStep: null,
    relatedNodes: [],
    findings: [],
    answer: null,
    confidence: null
  },
  
  // Derived visible UI state (what the user actually sees at this moment)
  // aiFocusFile: owned by AI runtime (useInvestigationSession)
  // userSelectedFile: owned by user interaction (useWorkspaceStore)
  aiFocusFile: null,
  currentReason: null,
  fileProgress: 0,
  currentLine: 0,
  totalLines: 0,


  // --- ACTIONS ---

  // Called when SSE connects / starts sending
  // Called when SSE connects / starts sending
  startSession: (sessionId, repoId) => {
    const currentState = get();
    if (currentState.metadata.sessionId === sessionId && currentState.sessionState !== SESSION_STATES.IDLE && currentState.sessionState !== SESSION_STATES.ERROR) {
      // Already tracking this session, do not wipe state
      return;
    }
    
    set({
      sessionState: SESSION_STATES.STARTING,
      metadata: { sessionId, repoId, budget: null },
      incomingEvents: [],
      processedEvents: [],
      bookmarks: [],
      statistics: { filesRead: 0, jumps: 0, symbolsDiscovered: 0 },
      aiFocusFile: null,
      currentReason: null,
      fileProgress: 0,
      currentLine: 0,
      totalLines: 0,
      focusContext: {
        id: sessionId,
        mission: null,
        status: 'repository',
        currentStep: null,
        relatedNodes: [],
        findings: [],
        answer: null,
        confidence: null
      }
    });
  },

  // Called when a raw event comes over the wire
  receiveEvent: (event) => {
    const { sessionState, incomingEvents } = get();
    
    // Automatically transition to PLAYING if we just started getting events
    // (Auto-play is required since we removed the manual play controls)
    const newState = (sessionState === SESSION_STATES.IDLE || sessionState === SESSION_STATES.STARTING || sessionState === SESSION_STATES.RECEIVING) 
      ? SESSION_STATES.PLAYING 
      : sessionState;
      
    set({
      incomingEvents: [...incomingEvents, event],
      sessionState: newState
    });
  },

  // Called by the Playback Controller loop to process one event
  consumeNextEvent: () => {
    const { incomingEvents, processedEvents, sessionState } = get();
    
    if (incomingEvents.length === 0 || sessionState !== SESSION_STATES.PLAYING) {
      return null;
    }
    
    const nextEvent = incomingEvents[0];
    const remainingEvents = incomingEvents.slice(1);
    
    // Apply event to state
    get().applyEventToState(nextEvent);
    
    // Bound processed events array to prevent unbounded memory leak (Item 26)
    const newProcessedEvents = [...processedEvents, nextEvent];
    if (newProcessedEvents.length > 2000) {
      newProcessedEvents.splice(0, newProcessedEvents.length - 2000);
    }
    
    set({
      incomingEvents: remainingEvents,
      processedEvents: newProcessedEvents
    });
    
    return nextEvent;
  },

  // Playback Controls
  play: () => {
    const { sessionState } = get();
    if (sessionState === SESSION_STATES.RECEIVING || sessionState === SESSION_STATES.PAUSED) {
      set({ sessionState: SESSION_STATES.PLAYING });
    }
  },
  
  pause: () => {
    const { sessionState } = get();
    if (sessionState === SESSION_STATES.PLAYING) {
      set({ sessionState: SESSION_STATES.PAUSED });
    }
  },
  
  setPlaybackProfile: (profile) => set({ playbackProfile: profile }),

  // State Machine Transitions
  completeSession: () => set({ sessionState: SESSION_STATES.COMPLETED }),
  cancelSession: () => set({ sessionState: SESSION_STATES.CANCELLED }),
  errorSession: () => set({ sessionState: SESSION_STATES.ERROR }),

  // The Reducer: Applies a single event to the visible UI state
  
  // Rule 25 & 34: Reset state when repository switches
  resetSession: (repoId) => {
    set({
      sessionState: SESSION_STATES.IDLE,
      isAnimating: false,
      incomingEvents: [],
      processedEvents: [],
      bookmarks: [],
      statistics: { filesRead: 0, jumps: 0, symbolsDiscovered: 0 },
      metadata: { sessionId: null, repoId, budget: null, isUnderstandingMode: false },
      repositoryContext: { framework: null, findings: [], stats: { filesIndexed: 0, entryPoints: 0, services: 0 } },
      focusContext: { id: null, mission: null, status: 'repository', currentStep: null, answer: null, confidence: null, findings: [], relatedNodes: [] },
      aiFocusFile: null,
      currentReason: null,
      fileProgress: 0,
      currentLine: 0,
      totalLines: 0
    });
  },
  applyEventToState: (event) => {
    switch (event.type) {
      case 'transport.connected':
        set((state) => ({
          metadata: { ...state.metadata, sessionId: event.sessionId },
          focusContext: { ...state.focusContext, id: event.sessionId }
        }));
        break;

      case 'planner.started': {
        const isUnderstanding = event.mission === 'Repository Understanding';
        set((state) => ({
          metadata: { ...state.metadata, isUnderstandingMode: isUnderstanding },
          focusContext: {
            ...state.focusContext,
            mission: event.mission,
            status: 'planning',
            currentStep: isUnderstanding ? 'Building repository context...' : 'Planning investigation...'
          }
        }));
        break;
      }

      case 'planner.completed': {
        // Extract targets from execution steps to use as predictive nodes
        const targets = event.plan?.executionSteps?.map(step => step.target) || [];
        set((state) => ({
          focusContext: {
            ...state.focusContext,
            status: 'investigating',
            currentStep: state.metadata.isUnderstandingMode ? 'Understanding repository' : 'Plan generated',
            answer: event.plan.hypothesis,
            confidence: event.plan.confidence,
            relatedNodes: targets
          }
        }));
        break;
      }

      case 'planner.failed':
        set((state) => ({
          currentReason: 'API Error: ' + event.reason,
          focusContext: { ...state.focusContext, status: 'review' }
        }));
        get().errorSession();
        break;

      case 'investigation.started':
        set((state) => ({ metadata: { ...state.metadata, budget: event.budget } }));
        break;
      
      case 'file.selected':
        set((state) => ({ 
        aiFocusFile: event.file, 
        currentReason: event.reason, 
          fileProgress: 0, 
          currentLine: 0, 
          totalLines: 0,
          focusContext: { ...state.focusContext, currentStep: `Selected ${event.file?.split('/').pop() || 'file'}` }
        }));
        break;
        
      case 'file.read.progress':
        set({ 
          fileProgress: event.line / Math.max(event.totalLines, 1),
          currentLine: event.line,
          totalLines: event.totalLines
        });
        break;
        
      case 'file.read.completed':
        set((state) => ({ 
          statistics: { ...state.statistics, filesRead: state.statistics.filesRead + 1 },
          fileProgress: 1.0
        }));
        break;
        
      case 'jump.started':
        set((state) => ({
          currentReason: event.reason,
          statistics: { ...state.statistics, jumps: state.statistics.jumps + 1 }
        }));
        break;
        
      case 'evidence.added':
        set((state) => {
          if (state.metadata.isUnderstandingMode) {
            return {
              repositoryContext: {
                ...state.repositoryContext,
                findings: [...state.repositoryContext.findings, { fact: event.fact, source: event.source, eventId: event.eventId }]
              }
            };
          } else {
            return {
              focusContext: {
                ...state.focusContext,
                findings: [...state.focusContext.findings, { fact: event.fact, source: event.source, eventId: event.eventId }]
              }
            };
          }
        });
        break;
        
      case 'symbol.discovered':
        set((state) => ({
          statistics: { ...state.statistics, symbolsDiscovered: state.statistics.symbolsDiscovered + 1 }
        }));
        break;
        
      case 'investigation.completed':
        set((state) => ({
          focusContext: { 
            ...state.focusContext, 
            status: 'review', 
            currentStep: state.metadata.isUnderstandingMode ? 'Repository Understanding complete' : 'Investigation completed',
            answer: event.answer || state.focusContext.answer
          }
        }));
        get().completeSession();
        break;
        
      case 'investigation.cancelled':
        get().cancelSession();
        break;
    }
  },

  // --- SPRINT 3: HISTORY TRAVERSAL ---
  seekToEvent: (targetEventId) => {
    // Currently in-memory playback doesn't fully reverse state in this MVP, 
    // but we can snap the active file to the target event's context.
    const { processedEvents } = get();
    const targetEvent = processedEvents.find(e => e.eventId === targetEventId);
    
    if (targetEvent) {
      if (targetEvent.file) {
        set({ aiFocusFile: targetEvent.file, currentReason: targetEvent.reason || 'History Replay' });
      }
    }
  },

  // --- SPRINT 5: BOOKMARKS ---
  toggleBookmark: (eventId) => {
    const { bookmarks } = get();
    if (bookmarks.includes(eventId)) {
      set({ bookmarks: bookmarks.filter(id => id !== eventId) });
    } else {
      set({ bookmarks: [...bookmarks, eventId] });
    }
  }
}));
