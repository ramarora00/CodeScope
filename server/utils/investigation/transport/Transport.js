/**
 * Abstract Transport Interface
 * 
 * All Transports (SSE, WebSocket, ReplayRecorder) must implement this.
 */

class Transport {
  /**
   * Called before any events are sent.
   * @param {string} sessionId 
   */
  start(sessionId) {
    throw new Error('Not implemented');
  }

  /**
   * Called to serialize and dispatch an event.
   * MUST NOT mutate the event payload.
   * @param {Object} event 
   */
  publish(event) {
    throw new Error('Not implemented');
  }

  /**
   * Called when the session is closed or completed.
   */
  close() {
    throw new Error('Not implemented');
  }
}

module.exports = { Transport };
