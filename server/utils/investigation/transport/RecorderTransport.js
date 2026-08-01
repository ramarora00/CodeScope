const { Transport } = require('./Transport');
const fs = require('fs');
const path = require('path');

/**
 * RecorderTransport
 *
 * Writes the entire immutable event stream to a JSON lines file
 * for replay, debugging, and analytics. Uses synchronous writes
 * to guarantee the file is complete and readable immediately.
 */
class RecorderTransport extends Transport {
  constructor(outputDir) {
    super();
    this.outputDir = outputDir;
    this.filePath = null;
  }

  start(sessionId) {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    this.filePath = path.join(this.outputDir, `investigation_${sessionId}.jsonl`);
  }

  publish(event) {
    if (this.filePath) {
      fs.appendFileSync(this.filePath, JSON.stringify(event) + '\n');
    }
  }

  close() {
    // No-op: sync writes are already flushed
    this.filePath = null;
  }
}

module.exports = { RecorderTransport };

