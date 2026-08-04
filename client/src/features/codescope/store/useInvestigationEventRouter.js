import { useCallback } from 'react';
import { useInvestigationSession, SESSION_STATES } from './useInvestigationSession';
import { investigationRecorder } from './InvestigationRecorder';
import { useSSEConnection } from '../transport/useSSEConnection';
import { API_BASE } from '../../../config/api';

/**
 * useInvestigationEventRouter
 *
 * Architecture: Lifecycle → useSSEConnection → useInvestigationEventRouter → useInvestigationSession
 *
 * Responsibilities:
 *   - Builds the SSE URL from (repoId + activeInvestigation)
 *   - Delegates connection lifecycle to useSSEConnection
 *   - Maps raw domain events to session store actions (the ONLY store-aware layer)
 *   - Does NOT own the EventSource
 *   - Does NOT contain connection retry logic
 */
export function useInvestigationEventRouter(repoId, activeInvestigation) {
  const startSession  = useInvestigationSession(s => s.startSession);
  const receiveEvent  = useInvestigationSession(s => s.receiveEvent);
  const errorSession  = useInvestigationSession(s => s.errorSession);

  // ── Build the SSE URL ──────────────────────────────────────────
  const enabled = Boolean(repoId && activeInvestigation);
  const mode    = activeInvestigation?.mode || 'investigation';
  const mission = activeInvestigation?.title || activeInvestigation?.query || '';
  const url     = enabled
    ? `${API_BASE}/api/repo/${repoId}/investigate/stream?mission=${encodeURIComponent(mission)}&mode=${encodeURIComponent(mode)}`
    : null;

  // ── Event Handlers (store mutations only) ─────────────────────
  const onOpen = useCallback(() => {
    if (activeInvestigation) {
      startSession(activeInvestigation.id || 'mission', repoId);
    }
  }, [activeInvestigation, repoId, startSession]);

  const onEvent = useCallback((rawEvent) => {
    // 1. Formal recording (audit trail)
    investigationRecorder.append(rawEvent);
    // 2. Dispatch to session store reducer
    receiveEvent(rawEvent);
  }, [receiveEvent]);

  const onError = useCallback((err) => {
    const state = useInvestigationSession.getState();

    // Graceful close: backend finished cleanly
    const hasCompletedEvent =
      state.incomingEvents.some(e => e.type === 'investigation.completed') ||
      state.processedEvents.some(e => e.type === 'investigation.completed');

    const alreadyTerminal =
      hasCompletedEvent ||
      state.sessionState === SESSION_STATES.COMPLETED ||
      state.sessionState === SESSION_STATES.CANCELLED ||
      state.sessionState === SESSION_STATES.ERROR;

    if (alreadyTerminal) {
      console.log('[EventRouter] SSE closed normally (investigation already terminal).');
      return;
    }

    console.error('[EventRouter] Unexpected SSE error:', err);
    errorSession();
  }, [errorSession]);

  // ── Delegate connection ownership to transport layer ──────────
  useSSEConnection({
    url,
    enabled,
    onOpen,
    onEvent,
    onError,
  });
}

