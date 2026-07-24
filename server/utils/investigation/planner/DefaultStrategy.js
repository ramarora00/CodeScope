/**
 * DefaultStrategy — Planner Implementation
 *
 * Implements the full planning pipeline:
 *   Stage 0: Classification  → RepositoryModel
 *   Stage A: Profiler        → profile (entry points, config files)
 *   Stage B: Scorer          → scored files
 *   Stage C: DagBuilder      → investigation DAG
 *   Stage D: PlanGenerator   → sequential plan (with Layer 5 fallback)
 *
 * RepositoryModel Rule (ADR-002):
 *   Classification runs first and produces the single source of truth.
 *   All downstream stages read from it — none re-derive repository facts.
 */

const { PlannerStrategy } = require('./Strategy');
const { Classification }  = require('./Classification');
const { Profiler }        = require('./Profiler');
const { Scorer }          = require('./Scorer');
const { DagBuilder }      = require('./DagBuilder');
const { PlanGenerator }   = require('./PlanGenerator');

class DefaultStrategy extends PlannerStrategy {
  /**
   * @param {RepositorySnapshot} snapshot
   * @param {RepositoryModel|null} repositoryModel — overrides Classification when provided (testing)
   * @param {string|null}          query           — unused until P2 Query-Driven Planning
   * @param {Object}               budget          — { maxFiles, maxJumps, maxTime, maxDepth }
   */
  generatePlan(snapshot, repositoryModel, query, budget) {
    // Stage 0: Classification — run if no model was injected
    const repoModel = repositoryModel ?? Classification.classify(snapshot);
    console.log(`[DefaultStrategy] Repository classified as: ${repoModel.describe()}`);

    // Stage A: Repository Profiling (reads RepositoryModel for entry point strategy)
    const profile = Profiler.profile(snapshot, repoModel);
    console.log(`[DefaultStrategy] Profiler found ${profile.entryPoints.length} entry points via strategy '${repoModel.entryPointStrategy}'`);

    // Stage B: Interest Scoring (reads RepositoryModel via profile.repositoryModel)
    const scores = Scorer.scoreFiles(snapshot, profile);

    // Stage C: Investigation DAG
    const dag = DagBuilder.buildDag(snapshot, scores, budget);

    // Stage D: Investigation Plan (snapshot passed for Layer 5 fallback guarantee)
    const steps = PlanGenerator.generate(dag, budget, snapshot);
    console.log(`[DefaultStrategy] Plan generated: ${steps.length} steps`);

    return {
      profile,
      dag,
      plan: steps,
      repositoryModel: repoModel  // carry forward for result metadata
    };
  }
}

module.exports = { DefaultStrategy };
