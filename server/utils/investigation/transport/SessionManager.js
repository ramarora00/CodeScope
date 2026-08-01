const { v4: uuidv4 } = require('uuid');
const { EventBus } = require('./EventBus');
const { RepositorySnapshot } = require('../domain/snapshot');
const { InvestigationContext } = require('../domain/context');
const { EventFactory } = require('../domain/events');
// DefaultStrategy removed
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
    this.repoToSession = new Map();
  }

  /**
   * Start a new investigation session or attach to existing.
   */
  async startInvestigation(repoId, mission, transports = [], mode = 'investigation') {
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) throw new Error(`Repository ${repoId} not found.`);
    if (repo.status !== 'ready') throw new Error(`Repository ${repoId} is not ready.`);

    if (this.repoToSession.has(repoId)) {
      const existingSessionId = this.repoToSession.get(repoId);
      const session = this.activeSessions.get(existingSessionId);
      if (session) {
        console.log(`[SessionManager] Reattaching to existing session ${existingSessionId} for repo ${repoId}`);
        for (const transport of transports) {
          // Only reattach SSETransports to avoid duplicate log writes
          if (transport.constructor.name === 'SSETransport') {
            transport.start(existingSessionId);
            session.eventBus.subscribe(transport);
          }
        }
        return existingSessionId;
      } else {
        this.repoToSession.delete(repoId); // Cleanup stale map
      }
    }

    const sessionId = uuidv4();
    console.log(`[SessionManager] startInvestigation: repoId: ${repoId}, sessionId: ${sessionId}`);
    const eventBus = new EventBus(sessionId);

    for (const transport of transports) {
      transport.start(sessionId);
      eventBus.subscribe(transport);
    }

    const context = new InvestigationContext(sessionId, repoId);
    const eventFactory = new EventFactory(sessionId, repoId);
    
    this.activeSessions.set(sessionId, { context, eventBus, repoId });
    this.repoToSession.set(repoId, sessionId);

    this._runLifecycle(sessionId, repoId, mission, context, eventFactory, eventBus, mode).catch(err => {
      console.error(`[SessionManager] Investigation failed:`, err);
      eventBus.publish(eventFactory.plannerFailed(err.message || 'Unknown error'));
      eventBus.closeAll();
      this.activeSessions.delete(sessionId);
      this.repoToSession.delete(repoId);
    });

    return sessionId;
  }

  async _runLifecycle(sessionId, repoId, mission, context, eventFactory, eventBus, mode) {
    try {
      console.log(`[SessionManager] Building snapshot for repo: ${repoId}`);
      // 1. Snapshot
      context.applyEvent(eventFactory._base('snapshot.building')); // internal state
      const snapshot = await RepositorySnapshot.build(prisma, repoId);

      console.log(`[SessionManager] Snapshot built. Starting planner...`);
      // 2. Planning
      eventBus.publish(eventFactory.plannerStarted(mode === 'understanding' ? 'Repository Understanding' : mission));
      
      let planData;
      try {
        if (mode === 'understanding') {
          const { UnderstandingPlanBuilder } = require('../planner/UnderstandingPlanBuilder');
          const plan = UnderstandingPlanBuilder.build(snapshot);
          planData = { plan, metadata: { strategy: 'UnderstandingPlanBuilder' } };
        } else {
          const { Planner } = require('../planner/Planner');
          const planner = new Planner();
          planData = await planner.plan(repoId, mission, { maxSteps: 5 });
        }
        eventBus.publish(eventFactory.plannerCompleted(planData.plan, planData.metadata));
      } catch (plannerErr) {
        console.error(`[SessionManager] Planner failed: ${plannerErr.message}`);
        eventBus.publish(eventFactory.plannerFailed(plannerErr.message));
        throw plannerErr;
      }

      console.log(`[SessionManager] Planner completed. Plan size: ${planData.plan.executionSteps.length} steps. Starting ExecutionEngine...`);
      // 3. Execution
      const engine = new ExecutionEngine(context, eventFactory, (evt) => {
        eventBus.publish(evt);
      });
      console.log(`[SessionManager] Engine execute starting...`);
      
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.abortController = new AbortController();
        await engine.execute(planData.plan, session.abortController.signal);
      } else {
        await engine.execute(planData.plan);
      }
      
      console.log(`[SessionManager] Engine execute finished for session: ${sessionId}`);

    } finally {
      console.log(`[SessionManager] Cleanup for session: ${sessionId}`);
      // 4. Cleanup (idempotent — cancelInvestigation may have already cleaned up)
      if (this.activeSessions.has(sessionId)) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
          session.eventBus.closeAll();
        }
        this.activeSessions.delete(sessionId);
        this.repoToSession.delete(repoId);
      }
    }
  }

  cancelInvestigation(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.context.isCancelled = true;
      if (session.abortController) {
        session.abortController.abort();
      }
      // Clean up mappings so next startInvestigation creates a fresh session
      session.eventBus.closeAll();
      this.activeSessions.delete(sessionId);
      if (session.repoId) {
        this.repoToSession.delete(session.repoId);
      }
      return true;
    }
    return false;
  }
}

// Singleton instance
const sessionManager = new SessionManager();

module.exports = { sessionManager, SessionManager };
