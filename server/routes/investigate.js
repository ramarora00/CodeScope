const express = require('express');
const router = express.Router();
const path = require('path');
const { sessionManager } = require('../utils/investigation/transport/SessionManager');
const { SSETransport } = require('../utils/investigation/transport/SSETransport');
const { RecorderTransport } = require('../utils/investigation/transport/RecorderTransport');

// @route   GET /api/repo/:id/investigate/stream
// @desc    Start an investigation and stream Domain Events via SSE
router.get('/:id/investigate/stream', async (req, res) => {
  const repoId = req.params.id;
  const mission = req.query.mission || 'Investigate repository structure and architecture.';
  const mode = req.query.mode || 'investigation';
  console.log(`[API] GET /api/repo/${repoId}/investigate/stream connected. Mission: "${mission}", Mode: "${mode}"`);

  if (!repoId) {
    console.log(`[API] Rejecting missing repoId.`);
    return res.status(400).json({ error: 'Repository ID is required' });
  }

  // Set up transports
  const sseTransport = new SSETransport(res);
  
  // Optionally, record all sessions to disk for replayability
  const logsDir = path.join(__dirname, '../../.logs/investigations');
  const recorderTransport = new RecorderTransport(logsDir);

  try {
    // SessionManager owns everything else (Lifecycle, Planner, Execution)
    await sessionManager.startInvestigation(repoId, mission, [sseTransport, recorderTransport], mode);
    console.log(`[API] Session started for ${repoId}. Connection kept open.`);
    
    // Connection stays open until the EventBus closes the transports
    req.on('close', () => {
      console.log(`[API] Client disconnected from stream for ${repoId}`);
      // If the client disconnects prematurely, cancel the investigation loop
      // (Requires finding the sessionId. For now we just let it run or need to return sessionId in headers)
      // Implementation note: SSETransport could emit a close event back to the manager.
    });

  } catch (error) {
    console.error('[Investigate Route] Failed to initialize session:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start investigation session' });
    }
  }
});

module.exports = router;
