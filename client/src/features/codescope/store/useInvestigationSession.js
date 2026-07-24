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
  
  // Event Queues
  incomingEvents: [],
  processedEvents: [],
  
  // Investigation Data
  evidence: [],
  bookmarks: [],
  statistics: {
    filesRead: 0,
    jumps: 0,
    symbolsDiscovered: 0
  },
  metadata: {
    sessionId: null,
    repoId: null,
    budget: null
  },
  
  // Derived visible UI state (what the user actually sees at this moment)
  currentActiveFile: null,
  currentReason: null,
  fileProgress: 0,

  // --- ACTIONS ---

  // Called when SSE connects / starts sending
  startSession: (sessionId, repoId) => set({
    sessionState: SESSION_STATES.STARTING,
    metadata: { sessionId, repoId, budget: null },
    incomingEvents: [],
    processedEvents: [],
    evidence: [],
    bookmarks: [],
    statistics: { filesRead: 0, jumps: 0, symbolsDiscovered: 0 },
    currentActiveFile: null,
    currentReason: null,
    fileProgress: 0,
  }),

  // Called when a raw event comes over the wire
  receiveEvent: (event) => {
    const { sessionState, incomingEvents } = get();
    
    // Automatically transition to receiving if we just started getting events
    const newState = (sessionState === SESSION_STATES.IDLE || sessionState === SESSION_STATES.STARTING) 
      ? SESSION_STATES.RECEIVING 
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
    
    set({
      incomingEvents: remainingEvents,
      processedEvents: [...processedEvents, nextEvent]
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
  applyEventToState: (event) => {
    switch (event.type) {
      case 'investigation.started':
        set((state) => ({ metadata: { ...state.metadata, budget: event.budget } }));
        break;
      
      case 'file.selected':
        set({ currentActiveFile: event.file, currentReason: event.reason, fileProgress: 0 });
        break;
        
      case 'file.read.progress':
        set({ fileProgress: event.line / Math.max(event.totalLines, 1) });
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
        set((state) => ({
          evidence: [...state.evidence, { fact: event.fact, source: event.source, eventId: event.eventId }]
        }));
        break;
        
      case 'symbol.discovered':
        set((state) => ({
          statistics: { ...state.statistics, symbolsDiscovered: state.statistics.symbolsDiscovered + 1 }
        }));
        break;
        
      case 'investigation.completed':
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
        set({ currentActiveFile: targetEvent.file, currentReason: targetEvent.reason || 'History Replay' });
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
