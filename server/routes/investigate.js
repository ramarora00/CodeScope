const express = require('express');
const router = express.Router();
const path = require('path');
const { sessionManager } = require('../utils/investigation/transport/SessionManager');
const { SSETransport } = require('../utils/investigation/transport/SSETransport');
const { RecorderTransport } = require('../utils/investigation/transport/RecorderTransport');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Cheap server-side question relevance guard ───────────────────────────────
// Mirrors the frontend heuristic. Pure string ops — zero API calls.
// Protects vector search + Gemini planning from clearly off-topic questions.
// If a question bypasses the frontend, this catches it before any cost is incurred.
const REPO_SIGNALS = [
  /\b(function|class|method|module|component|service|hook|interface|type|api|route|endpoint|auth|login|token|database|query|fetch|import|export|dependency|package|build|deploy|config|env|test|spec|schema|model|controller|middleware|handler|pipeline|store|state|redux|context|zustand|firebase|supabase|prisma|sql|lancedb|vector|embed|graph|node|edge|file|folder|directory|repo|repository|codebase|architecture|pattern|flow|layer|logic|refactor|bug|error|exception|stack|trace|log)\b/i,
  // Starts with natural code-question verbs ('what' removed — repo questions with 'what' always carry a code keyword)
  /^(explain|where|how|why|show|find|list|trace|describe|summarize|identify|review|compare)\b/i,
  /\.(js|ts|jsx|tsx|py|go|java|rs|rb|cs|php|json|yaml|yml|toml|md|css|html|sql|sh|env)\b/i,
  /[/\\][a-z]/i,
];
const GENERAL_KNOWLEDGE_PATTERNS = [
  /^who (is|was|are|were) the /i,
  /^who (is|was) /i,
  /^what is (an? |the )?(iphone|android|mac|windows|linux|google|apple|microsoft|amazon|meta|twitter|tesla|bitcoin|ethereum|nft|ai|chatgpt|openai|gemini)\b/i,
  /^what is the (capital|population|currency|flag|president|prime minister|leader|ruler|king|queen|ceo|founder) of /i,
  /^(tell me|give me|list) (some )?(fun )?facts about /i,
  /^(what|which) (country|city|state|nation|continent|planet|star|ocean|sea|river|mountain|animal|plant|food|sport|game|song|movie|book|language) /i,
  /\b(president|prime minister|capital city|population of|currency of|national anthem|geography|history of|founded in|born in|died in|recipe|calories|weather|temperature|forecast|oldest civilization|ancient civilization)\b/i,
  // Targeted: 'tell me a joke/story/poem/...' (no 'facts about' required)
  /^tell me (a |an )?(joke|story|poem|riddle|random|something random|fun fact)\b/i,
];

function isOutOfContext(query) {
  if (!query || query.length < 3) return false;
  // Understnading passes are always on-topic
  if (query === 'Repository Understanding') return false;
  if (REPO_SIGNALS.some(r => r.test(query))) return false;
  if (GENERAL_KNOWLEDGE_PATTERNS.some(r => r.test(query))) return true;
  return false;
}

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

  // Enforce repository ownership
  const repo = await prisma.repo.findUnique({ where: { id: repoId } });
  if (!repo || repo.userId !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // ── Zero-cost question guard (runs BEFORE vector search / Gemini) ─────────
  if (mode === 'investigation' && isOutOfContext(mission)) {
    console.log(`[API] Question out of context, rejecting early (no API cost): "${mission}"`);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const outOfContextEvent = {
      type: 'planner.failed',
      sessionId: 'rejected',
      timestamp: new Date().toISOString(),
      reason: 'That question is outside the scope of this repository. Try asking something about the codebase, architecture, files, dependencies, or implementation.',
    };
    res.write(`data: ${JSON.stringify(outOfContextEvent)}\n\n`);
    res.end();
    return;
  }

  // Set up transports
  const sseTransport = new SSETransport(res);
  
  // Optionally, record all sessions to disk for replayability
  const logsDir = path.join(__dirname, '../../.logs/investigations');
  const recorderTransport = new RecorderTransport(logsDir);

  try {
    // SessionManager owns everything else (Lifecycle, Planner, Execution)
    const sessionId = await sessionManager.startInvestigation(repoId, mission, [sseTransport, recorderTransport], mode);
    console.log(`[API] Session started for ${repoId}. Connection kept open.`);
    
    // Connection stays open until the EventBus closes the transports
    req.on('close', () => {
      console.log(`[API] Client disconnected from stream for ${repoId}`);
      // Remove this transport from the EventBus so we don't leak it
      const session = sessionManager.activeSessions.get(sessionId);
      if (session) {
        session.eventBus.unsubscribe(sseTransport);
      }
    });

  } catch (error) {
    console.error('[Investigate Route] Failed to initialize session:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start investigation session' });
    }
  }
});

// @route   DELETE /api/repo/:id/investigate
// @desc    Cancel the active investigation for a repository
router.delete('/:id/investigate', async (req, res) => {
  const repoId = req.params.id;

  const repo = await prisma.repo.findUnique({
    where: { id: repoId }
  });
  if (!repo || repo.userId !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  if (sessionManager.repoToSession.has(repoId)) {
    const sessionId = sessionManager.repoToSession.get(repoId);
    sessionManager.cancelInvestigation(sessionId);
    return res.json({ message: 'Investigation cancelled successfully' });
  }
  
  return res.status(404).json({ error: 'No active investigation found for this repository' });
});

module.exports = router;
