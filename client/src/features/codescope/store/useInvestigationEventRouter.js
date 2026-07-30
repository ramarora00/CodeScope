import { useEffect, useState } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';
import { investigationRecorder } from './InvestigationRecorder';

/**
 * Single Event Translation Layer (Rule 10)
 * Connects to SSE, normalizes events, and dispatches them to the Workspace Store.
 */
export function useInvestigationEventRouter(repoId, activeInvestigation) {
  const [error, setError] = useState(null);
  
  // Get store actions
  const startSession = useInvestigationSession(state => state.startSession);
  const receiveEvent = useInvestigationSession(state => state.receiveEvent);
  const errorSession = useInvestigationSession(state => state.errorSession);
  const sessionState = useInvestigationSession(state => state.sessionState);
  const metadata = useInvestigationSession(state => state.metadata);

  useEffect(() => {
    console.log('[EventRouter] useEffect triggered.', { repoId, activeId: activeInvestigation?.id, sessionState, metadataSessionId: metadata?.sessionId });
    
    // Only connect if we have a repo and an active investigation requested
    if (!repoId || !activeInvestigation) {
      console.log('[EventRouter] Missing repoId or activeInvestigation. Skipping.');
      return;
    }
    
    // Don't reconnect if already connected to THIS specific investigation
    if (metadata.sessionId === activeInvestigation.id && sessionState !== SESSION_STATES.IDLE && sessionState !== SESSION_STATES.ERROR) {
      console.log(`[EventRouter] Already connected to ${activeInvestigation.id} (state: ${sessionState}). Skipping connection.`);
      return;
    }

    let eventSource;
    try {
      // Phase 1: Mission starts -> SSE Connected
      const mode = activeInvestigation.mode || 'investigation';
      const url = `http://localhost:5000/api/repo/${repoId}/investigate/stream?mission=${encodeURIComponent(activeInvestigation.title || activeInvestigation.query || '')}&mode=${encodeURIComponent(mode)}`;
      console.log(`[EventRouter] Connecting to ${url}`);
      
      startSession(activeInvestigation.id || 'mission', repoId);
      
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[EventRouter] SSE Connection Established');
        setError(null);
      };

      eventSource.onmessage = (e) => {
        try {
          const rawEvent = JSON.parse(e.data);
          
          // Rule 12 prep: Append to formal recorder first
          investigationRecorder.append(rawEvent);
          
          // Add them to the Event Log (Workspace Store)
          receiveEvent(rawEvent);
        } catch (err) {
          console.error('[EventRouter] Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[EventRouter] SSE Error:', err);
        setError('Connection lost to investigation stream.');
        errorSession();
        eventSource.close();
      };
    } catch (err) {
      console.error('[EventRouter] Setup error:', err);
      setError('Failed to setup investigation stream.');
      errorSession();
    }

    return () => {
      if (eventSource) {
        console.log('[EventRouter] Closing SSE Connection');
        eventSource.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId, activeInvestigation?.id]);

  return { error };
}
