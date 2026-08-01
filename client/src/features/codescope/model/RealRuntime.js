/**
 * RealRuntime.js
 *
 * The live backend runtime adapter for CodeScope.
 * Consumes the SSE investigation stream from the backend and
 * feeds normalized events through InvestigationStore into the UI.
 *
 * Interface matches ClaudeRuntime exactly:
 *   subscribe(listener) -> unsubscribe fn
 *   start()
 *   stop()
 *   reset()
 */

import { InvestigationStore } from './InvestigationStore';

export class RealRuntime {
  constructor(repoId) {
    this.repoId = repoId;
    this.store = new InvestigationStore();
    this.eventSource = null;
    this.isPlaying = false;
  }

  // --- Public Interface (matches ClaudeRuntime) ---

  subscribe(listener) {
    return this.store.subscribe(listener);
  }

  start() {
    console.log('[RealRuntime] start() called', { isPlaying: this.isPlaying, repoId: this.repoId });
    if (this.isPlaying || !this.repoId) return;
    this.isPlaying = true;
    this._connect();
  }

  stop() {
    console.log('[RealRuntime] stop() called');
    this.isPlaying = false;
    this._disconnect();
  }

  reset() {
    console.log('[RealRuntime] reset() called');
    this.stop();
  }

  // --- Private SSE Plumbing ---

  _connect() {
    const url = `http://localhost:5000/api/repo/${this.repoId}/investigate/stream`;
    console.log('[RealRuntime] Connecting EventSource to:', url);
    this.eventSource = new EventSource(url);

    // Handle any event from the SSE stream by routing it through the store
    this.eventSource.onmessage = (event) => {
      console.log('[RealRuntime] Received generic message:', event.data);
      this._handleRawEvent(event.data);
    };

    // Handle named events (event: file.selected, data: {...})
    const namedEventTypes = [
      'transport.connected',
      'investigation.started',
      'investigation.completed',
      'investigation.cancelled',
      'investigation.failed',
      'file.selected',
      'file.read.started',
      'file.read.progress',
      'file.read.completed',
      'jump.started',
      'jump.completed',
      'return.started',
      'symbol.discovered',
      'evidence.added',
      'knowledge.added',
      'knowledge.promoted',
      'knowledge.verified',
      'knowledge.retracted',
      'reasoning.updated',
    ];

    for (const eventType of namedEventTypes) {
      this.eventSource.addEventListener(eventType, (event) => {
        console.log(`[RealRuntime] Received named event [${eventType}]:`, event.data);
        this._handleRawEvent(event.data);
      });
    }

    this.eventSource.onerror = (err) => {
      console.error('[RealRuntime] SSE connection error:', err);
      this._disconnect();
      // P0-4: Emit failure through the store so the UI shows an error state
      // instead of freezing silently.
      this.store.apply({
        type: 'investigation.failed',
        sessionId: null,
        repoId: this.repoId,
        stage: 'transport',
        reason: 'Lost connection to investigation stream. Please try again.'
      });
    };
  }

  _handleRawEvent(rawData) {
    try {
      if (rawData === ':') return; // Ignore SSE heartbeat comments
      const domainEvent = JSON.parse(rawData);
      console.log('[RealRuntime] Routing domain event to Store:', domainEvent.type);
      this.store.apply(domainEvent);
    } catch (e) {
      console.warn('[RealRuntime] Failed to parse event data:', rawData, e);
    }
  }

  _disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
