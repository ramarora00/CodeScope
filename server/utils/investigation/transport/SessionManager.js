const { v4: uuidv4 } = require('uuid');
const { EventBus } = require('./EventBus');
const { RepositorySnapshot } = require('../domain/snapshot');
const { InvestigationContext } = require('../domain/context');
const { EventFactory } = require('../domain/events');
const { DefaultStrategy } = require('../planner/DefaultStrategy');
const { ExecutionEngine } = require('../execution/ExecutionEngine');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * SessionManager
 * 
 * Owns the lifecycle of investigations. Creates sessions, handles cancellation,
 * initializes the EventBus, Planner, and Execution Engine.
 * Isolates all investigation logic from Express/HTTP.
 */
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
  }

  /**
   * Start a new investigation session.
   * @param {string} repoId 
   * @param {Array<Transport>} transports 
   * @returns {string} sessionId
   */
  async startInvestigation(repoId, transports = []) {
    // P0-6: Verify repository is ready before starting investigation.
    // Prevents investigation on incomplete snapshots from in-progress indexing.
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) {
      throw new Error(`Repository ${repoId} not found.`);
    }
    if (repo.status !== 'ready') {
      throw new Error(`Repository ${repoId} is not ready for investigation (current status: '${repo.status}'). Wait for indexing to complete.`);
    }

    const sessionId = uuidv4();
    console.log(`[SessionManager] startInvestigation called. repoId: ${repoId}, sessionId: ${sessionId}`);
    const eventBus = new EventBus(sessionId);

    // Register transports
    for (const transport of transports) {
      transport.start(sessionId);
      eventBus.subscribe(transport);
    }

    const context = new InvestigationContext(sessionId, repoId);
    const eventFactory = new EventFactory(sessionId, repoId);
    
    this.activeSessions.set(sessionId, { context, eventBus });

    console.log(`[SessionManager] Running lifecycle asynchronously for session: ${sessionId}`);
    // Run investigation asynchronously so HTTP can return/stream immediately
    this._runLifecycle(sessionId, repoId, context, eventFactory, eventBus).catch(err => {
      console.error(`[SessionManager] Investigation failed for session ${sessionId}:`, err);
      eventBus.publish({
        type: 'investigation.failed',
        sessionId,
        repoId,
        stage: context.status,
        reason: err.message || 'Unknown execution failure'
      });
      eventBus.closeAll();
      this.activeSessions.delete(sessionId);
    });

    return sessionId;
  }

  async _runLifecycle(sessionId, repoId, context, eventFactory, eventBus) {
    try {
      console.log(`[SessionManager] Building snapshot for repo: ${repoId}`);
      // 1. Snapshot
      context.applyEvent(eventFactory._base('snapshot.building')); // internal state
      const snapshot = await RepositorySnapshot.build(prisma, repoId);

      console.log(`[SessionManager] Snapshot built. Starting planner...`);
      // 2. Planning
      context.applyEvent(eventFactory._base('planner.started'));
      const strategy = new DefaultStrategy();
      const budget = { maxFiles: 12, maxJumps: 25, maxDepth: 4 };
      // repositoryModel=null (wired in P1), query=null (wired in P2)
      const planData = strategy.generatePlan(snapshot, null, null, budget);
      context.applyEvent(eventFactory._base('planner.finished'));

      console.log(`[SessionManager] Planner completed. Plan size: ${planData.plan.length} steps. Starting ExecutionEngine...`);
      // 3. Execution
      const engine = new ExecutionEngine(context, eventFactory, (evt) => {
        eventBus.publish(evt);
      });
      console.log(`[SessionManager] Engine execute starting...`);
      await engine.execute(planData);
      console.log(`[SessionManager] Engine execute finished for session: ${sessionId}`);

    } finally {
      console.log(`[SessionManager] Cleanup for session: ${sessionId}`);
      // 4. Cleanup
      eventBus.closeAll();
      this.activeSessions.delete(sessionId);
    }
  }

  cancelInvestigation(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.context.isCancelled = true;
      // The ExecutionEngine will pick this up on its next loop boundary
      return true;
    }
    return false;
  }
}

// Singleton instance
const sessionManager = new SessionManager();

module.exports = { sessionManager, SessionManager };
