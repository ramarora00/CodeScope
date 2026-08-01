/**
 * PlannerStrategy Interface
 *
 * Defines the contract for an investigation planning strategy.
 *
 * Phase 0 Contract Freeze — ADR-005:
 * repositoryModel and query are future-ready parameters.
 * They may be null/empty until P2 wires up query-driven planning.
 * The signature is frozen now to prevent interface surgery later.
 */

class PlannerStrategy {
  /**
   * Generates a concrete investigation plan from a repository snapshot.
   *
   * @param {RepositorySnapshot} snapshot
   * @param {RepositoryModel|null} repositoryModel  — null until P1 Classification is built
   * @param {string|null}          query            — null until P2 Query-Driven Planning
   * @param {Object}               budget           — { maxFiles, maxJumps, maxTime, maxDepth }
   * @returns {Object} { profile, dag, plan }
   */
  generatePlan(snapshot, repositoryModel, query, budget) {
    throw new Error('PlannerStrategy.generatePlan() must be implemented by subclass.');
  }
}

module.exports = {
  PlannerStrategy
};
