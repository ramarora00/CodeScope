/**
 * RepositoryModel
 *
 * The single source of truth for repository classification facts.
 * Produced by the Classification stage (Stage 0) before any other stage runs.
 * All downstream stages — Profiler, Scorer, DagBuilder, PlanGenerator — read from this.
 * No downstream stage re-derives repository facts.
 *
 * ADR-002: RepositoryModel as Single Source of Truth
 */

class RepositoryModel {
  constructor(overrides = {}) {
    // Repository type classification
    this.type = overrides.type ?? 'unknown'; // spa|ssr|api|library|cli|monorepo|unknown

    // Language and framework
    this.primaryLanguage = overrides.primaryLanguage ?? 'unknown'; // typescript|javascript|unknown
    this.framework       = overrides.framework ?? null;            // react|next|express|nestjs|null
    this.frameworkConfidence = overrides.frameworkConfidence ?? 0.0;

    // Tooling
    this.packageManager = overrides.packageManager ?? null; // npm|yarn|pnpm|null
    this.isMonorepo     = overrides.isMonorepo ?? false;

    // Entry point strategy — read by Profiler and PlanGenerator
    // app-router|pages-router|express-entry|nestjs-main|react-main|
    // bin-field|index-export|filesystem-fallback
    this.entryPointStrategy = overrides.entryPointStrategy ?? 'filesystem-fallback';

    // Query — null until P2 wires up query-driven planning (ADR-005)
    this.query         = overrides.query ?? null;
    this.queryKeywords = overrides.queryKeywords ?? [];

    // P1.1: Enforce immutability. Nobody except Classification writes to this model.
    Object.freeze(this);
  }

  /**
   * Returns true if this repo is in the first-class JS/TS ecosystem.
   * Only first-class repos receive framework-specific scoring bonuses and entry strategies.
   */
  isFirstClass() {
    return this.primaryLanguage === 'typescript' || this.primaryLanguage === 'javascript';
  }

  /**
   * Produces a human-readable summary for logging and debugging.
   */
  describe() {
    const parts = [this.primaryLanguage];
    if (this.framework) parts.push(this.framework);
    if (this.isMonorepo) parts.push('monorepo');
    parts.push(`(${this.entryPointStrategy})`);
    return parts.join(' / ');
  }
}

/**
 * Creates a default RepositoryModel used when classification is skipped or unavailable.
 * Represents the safest possible assumption: unknown language, filesystem fallback.
 */
function createUnknownModel(overrides = {}) {
  return new RepositoryModel(overrides);
}

module.exports = { RepositoryModel, createUnknownModel };
