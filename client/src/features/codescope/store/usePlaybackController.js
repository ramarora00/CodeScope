import { useEffect, useRef } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';

const isBlockingEvent = (type) => {
  // Define which events require the Orchestrator to pause and wait for UI animation
  return ['file.selected', 'file.read.progress', 'file.read.completed', 'jump.started'].includes(type);
};

/**
 * usePlaybackController (Playback Orchestrator)
 * 
 * Orchestrates the execution of the investigation timeline.
 * It strictly separates backend speed from UI pacing by awaiting
 * a 'UI Animation Completed' signal before pulling the next event.
 * 
 * ARCHITECTURAL RULE: The Playback Orchestrator may know only the current event
 * and animation completion status. It must never know about repositories, graphs,
 * timelines, knowledge panels, explorers, or AI state.
 */
export function usePlaybackController() {
  const consumeNextEvent = useInvestigationSession(state => state.consumeNextEvent);
  const sessionState = useInvestigationSession(state => state.sessionState);
  const isAnimating = useInvestigationSession(state => state.isAnimating);
  const playbackProfile = useInvestigationSession(state => state.playbackProfile);
  
  const loopRef = useRef(null);

  useEffect(() => {
    if (sessionState !== SESSION_STATES.PLAYING) {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
        loopRef.current = null;
      }
      return;
    }
    
    // Orchestrator pauses until the Presentation layer signals it has finished animating
    if (isAnimating) {
      return;
    }

    const processNext = () => {
      // Safety check in case state changed during timeout
      if (useInvestigationSession.getState().sessionState !== SESSION_STATES.PLAYING) return;
      
      // If a Visual Owner is actively animating a cognitive event, pause the loop
      if (useInvestigationSession.getState().activeCognitiveEvent) {
        // We poll waiting for the Visual Owner to commit the event
        loopRef.current = setTimeout(processNext, 50);
        return;
      }

      const result = consumeNextEvent();
      
      if (!result) {
        // Queue is empty, return to RECEIVING state to await more events
        useInvestigationSession.setState({ sessionState: SESSION_STATES.RECEIVING });
        return;
      }

      // Result contains { event, type }
      // If cognitive, activeCognitiveEvent is now set in the store, and the next tick will wait for it.
      // If infrastructure, it was applied instantly.
      loopRef.current = setTimeout(processNext, 0);
    };

    // Kick off the orchestrator loop
    loopRef.current = setTimeout(processNext, 0);

    return () => {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
      }
    };
  }, [sessionState, isAnimating, consumeNextEvent, playbackProfile.speedMultiplier]);
}
