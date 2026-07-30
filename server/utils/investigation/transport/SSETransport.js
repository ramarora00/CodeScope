const { Transport } = require('./Transport');

/**
 * SSETransport
 * 
 * Adapts Domain Events into Server-Sent Events (SSE) format
 * and streams them to an Express HTTP Response object.
 */
class SSETransport extends Transport {
  constructor(res) {
    super();
    this.res = res;
    this.heartbeatInterval = null;
  }

  start(sessionId) {
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');

    // Send initial connection event
    this.publish({
      type: 'transport.connected',
      sessionId,
      timestamp: new Date().toISOString()
    });

    // Start 15s heartbeats to prevent proxy/browser timeouts
    this.heartbeatInterval = setInterval(() => {
      this.res.write(`:\n\n`); // Lightweight SSE comment heartbeat
    }, 15000);
  }

  publish(event) {
    if (!this.res.writableEnded) {
      // Serialize exactly as structured, no modifications.
      // We omit the 'event: ...' line so it defaults to the 'message' event on the client.
      this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  }

  close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (!this.res.writableEnded) {
      this.res.end();
    }
  }
}

module.exports = { SSETransport };
