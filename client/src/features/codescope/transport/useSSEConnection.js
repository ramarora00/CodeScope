import { useEffect, useRef } from 'react';
import { apiFetch } from '../../../config/apiFetch';

export function dispatchDomainEvent(rawEvent, handlers) {
  const { onEvent, onError, onOpen, onClose } = handlers;
  try {
    if (onEvent) onEvent(rawEvent);
  } catch (err) {
    console.error('[EventDispatcher] Handler threw while dispatching event:', err);
    if (onError) onError(err);
  }
}

const CONNECTION_TIMEOUT_MS = 90_000; 

export function useSSEConnection({ url, enabled, onEvent, onError, onOpen, onClose }) {
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    let firstEventReceived = false;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const timeoutId = setTimeout(() => {
      if (!firstEventReceived) {
        console.warn('[SSEConnection] Timeout: no response from investigation stream within', CONNECTION_TIMEOUT_MS, 'ms.');
        if (onError) onError(new Error('Investigation timed out. The server did not respond in time.'));
        if (abortControllerRef.current) abortControllerRef.current.abort();
      }
    }, CONNECTION_TIMEOUT_MS);

    async function connect() {
      try {
        const response = await apiFetch(url, {
          headers: { 'Accept': 'text/event-stream' },
          signal
        });

        if (!response.ok) {
          throw new Error(`SSE Connection failed: ${response.statusText}`);
        }

        if (onOpen) onOpen();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf('\n\n');

          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');

            if (chunk.startsWith('data: ')) {
              firstEventReceived = true;
              clearTimeout(timeoutId);
              const dataString = chunk.slice(6);
              try {
                const raw = JSON.parse(dataString);
                dispatchDomainEvent(raw, { onEvent, onError });
              } catch (parseErr) {
                console.error('[SSEConnection] Failed to parse SSE payload:', parseErr);
              }
            }
          }
        }

        console.log('[SSEConnection] Stream closed gracefully by server.');
        if (onClose) onClose();
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('[SSEConnection] Aborted by client.');
        } else {
          console.error('[SSEConnection] SSE error:', err);
          clearTimeout(timeoutId);
          if (onError) onError(err);
        }
      }
    }

    connect();

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        if (onClose) onClose();
      }
    };
  }, [url, enabled]);
}
