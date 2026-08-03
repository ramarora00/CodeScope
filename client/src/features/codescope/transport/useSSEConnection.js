import { useEffect, useRef } from 'react';
import { API_BASE } from '../../../config/api';

/**
 * dispatchDomainEvent
 *
 * Pure event dispatcher — knows nothing about stores or reducers.
 * Lifecycle owns the SSE connection and calls this to emit events.
 * The store (useInvestigationSession) is the single consumer.
 *
 * Architecture: Lifecycle → Event Dispatcher → Store
 */
export function dispatchDomainEvent(rawEvent, handlers) {
  const { onEvent, onError, onOpen, onClose } = handlers;
  try {
    if (onEvent) onEvent(rawEvent);
  } catch (err) {
    console.error('[EventDispatcher] Handler threw while dispatching event:', err);
    if (onError) onError(err);
  }
}

/**
 * useSSEConnection
 *
 * Manages a single EventSource connection lifecycle.
 * Owned by useWorkspaceLifecycle — NOT by the session store.
 *
 * Responsibilities:
 *   - Open SSE connection when (repoId + investigationId) change
 *   - Dispatch raw events to the provided handlers
 *   - Close connection on unmount or dependency change
 *   - Handle graceful close vs error
 *   - Fire timeout error if no event arrives within CONNECTION_TIMEOUT_MS
 *
 * It does NOT know about store shape, reducers, or UI.
 */

const CONNECTION_TIMEOUT_MS = 90_000; // 90 seconds — safe demo limit

export function useSSEConnection({ url, enabled, onEvent, onError, onOpen, onClose }) {
  const esRef = useRef(null);

  useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    let es;
    let firstEventReceived = false;

    // Timeout guard: if no event arrives within CONNECTION_TIMEOUT_MS, treat as error
    const timeoutId = setTimeout(() => {
      if (!firstEventReceived) {
        console.warn('[SSEConnection] Timeout: no response from investigation stream within', CONNECTION_TIMEOUT_MS, 'ms.');
        if (onError) onError(new Error('Investigation timed out. The server did not respond in time.'));
        if (es) es.close();
      }
    }, CONNECTION_TIMEOUT_MS);

    try {
      es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        console.log('[SSEConnection] Connected:', url);
        if (onOpen) onOpen();
      };

      es.onmessage = (e) => {
        firstEventReceived = true;
        clearTimeout(timeoutId);
        try {
          const raw = JSON.parse(e.data);
          dispatchDomainEvent(raw, { onEvent, onError });
        } catch (parseErr) {
          console.error('[SSEConnection] Failed to parse SSE payload:', parseErr);
        }
      };

      es.onerror = (err) => {
        console.warn('[SSEConnection] SSE error fired. Checking if this is a graceful close.');
        clearTimeout(timeoutId);
        if (onError) onError(err);
        es.close();
      };
    } catch (err) {
      console.error('[SSEConnection] Failed to open EventSource:', err);
      clearTimeout(timeoutId);
      if (onError) onError(err);
    }

    return () => {
      clearTimeout(timeoutId);
      if (es) {
        console.log('[SSEConnection] Closing connection:', url);
        es.close();
        esRef.current = null;
        if (onClose) onClose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);
}
