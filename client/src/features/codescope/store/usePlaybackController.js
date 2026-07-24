import { useEffect, useRef } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';

// Event specific delays (base delay logic)
// These delays are multiplied by the playbackProfile.speedMultiplier
const getEventDelayMs = (eventType, baseDelayMs) => {
  switch (eventType) {
    case 'investigation.started': return 300;
    case 'file.selected': return 150;
    case 'file.read.started': return 80;
    case 'file.read.progress': return Math.max(50, baseDelayMs); 
    case 'file.read.completed': return 250;
    case 'jump.started': return 300;
    case 'jump.completed': return 200;
    case 'return.started': return 200;
    case 'symbol.discovered': return 120;
    case 'evidence.added': return 200;
    case 'investigation.completed': return 400;
    default: return baseDelayMs;
  }
};

/**
 * usePlaybackController
 * 
 * A headless hook that runs the event consumption loop.
 * It subscribes to the Zustand store, and when in PLAYING state,
 * it recursively calls `setTimeout` to pop events off the queue.
 */
export function usePlaybackController() {
  const consumeNextEvent = useInvestigationSession(state => state.consumeNextEvent);
  const sessionState = useInvestigationSession(state => state.sessionState);
  const playbackProfile = useInvestigationSession(state => state.playbackProfile);
  
  // Ref to hold the current timeout ID so we can clear it if paused/unmounted
  const timeoutRef = useRef(null);

  useEffect(() => {
    // We only run the loop if we are PLAYING
    if (sessionState !== SESSION_STATES.PLAYING) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const processNext = () => {
      if (!isSubscribed) return;

      const event = consumeNextEvent();
      
      if (!event) {
        // No more events (queue is empty)
        // Note: the backend might still be sending. If it's done, it sends 'investigation.completed'
        // which the reducer handles and changes state to COMPLETED, causing this effect to re-run and stop.
        // If it's just temporarily empty but receiving, we could change state back to RECEIVING.
        useInvestigationSession.setState({ sessionState: SESSION_STATES.RECEIVING });
        return;
      }

      // Calculate delay for the NEXT tick based on the event we just processed
      const rawDelay = getEventDelayMs(event.type, playbackProfile.baseDelayMs);
      const scaledDelay = Math.floor(rawDelay * playbackProfile.speedMultiplier);

      // If we are in INSTANT mode, we can process immediately with no delay (or 0ms via setTimeout)
      if (playbackProfile.speedMultiplier >= 100) {
        // To prevent call stack exceeded, we still use 0ms timeout
        timeoutRef.current = setTimeout(processNext, 0);
      } else {
        timeoutRef.current = setTimeout(processNext, scaledDelay);
      }
    };

    // Kick off the loop
    processNext();

    return () => {
      isSubscribed = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [sessionState, consumeNextEvent, playbackProfile]);
}
