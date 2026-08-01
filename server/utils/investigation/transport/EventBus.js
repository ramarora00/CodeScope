/**
 * EventBus
 * 
 * Transport-agnostic publisher/subscriber for Domain Events.
 * The Execution Engine pushes events here.
 * Any number of Transports (SSE, WebSocket, ReplayRecorder) can subscribe.
 */

class EventBus {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.subscribers = new Set();
  }

  subscribe(transport) {
    this.subscribers.add(transport);
  }

  unsubscribe(transport) {
    this.subscribers.delete(transport);
  }

  publish(event) {
    // Forward the immutable event to all transports
    for (const transport of this.subscribers) {
      try {
        transport.publish(event);
      } catch (err) {
        console.error(`[EventBus] Transport error on session ${this.sessionId}:`, err);
      }
    }
  }

  closeAll() {
    for (const transport of this.subscribers) {
      if (typeof transport.close === 'function') {
        transport.close();
      }
    }
    this.subscribers.clear();
  }
}

module.exports = { EventBus };
