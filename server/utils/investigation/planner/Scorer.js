/**
 * Stage B: Interest Scoring
 *
 * Scores every file in the snapshot based on multiple heuristics.
 * Reads the RepositoryModel (via profile.repositoryModel) for framework-aware bonuses.
 * Does NOT re-detect framework — RepositoryModel is the single authority (ADR-002).
 */

class Scorer {
  /**
   * @param {RepositorySnapshot} snapshot
   * @param {Object} profile  — includes profile.repositoryModel from Profiler
   * @returns {Map<string, Object>} Map of fileId -> { file, score, reasons: [] }
   */
  static scoreFiles(snapshot, profile) {
    const scores = new Map();
    const repositoryModel = profile.repositoryModel || null;
    const framework = repositoryModel?.framework || null;

    // Initialize scores
    for (const file of snapshot.files.values()) {
      scores.set(file.id, { file, score: 0, reasons: [] });
    }

    // 1. Graph Centrality (Incoming imports)
    for (const rel of snapshot.relationships) {
      if (rel.relationship === 'imports' && rel.callee && rel.callee.fileId) {
        const fileScore = scores.get(rel.callee.fileId);
        if (fileScore) {
          fileScore.score += 5;
          if (!fileScore.reasons.find(r => r.startsWith('Imported by'))) {
            fileScore.reasons.push('High import frequency (Graph centrality)');
          }
        }
      }
    }

    // 2. Exported Symbols (Utility files)
    for (const file of snapshot.files.values()) {
      // P0-1: Guard against null or unparseable metadata
      if (!file.metadata) continue;
      let meta;
      try { meta = JSON.parse(file.metadata); } catch { continue; }
      if (meta.exports && meta.exports.length > 0) {
        const fileScore = scores.get(file.id);
        if (!fileScore) continue;
        fileScore.score += meta.exports.length * 2;
        fileScore.reasons.push(`Exports ${meta.exports.length} symbols`);
      }
    }

    // 3. Route Importance
    for (const route of snapshot.routes) {
      if (route.fileId) {
        const fileScore = scores.get(route.fileId);
        if (fileScore) {
          fileScore.score += 20;
          if (!fileScore.reasons.includes('Contains API Route definitions')) {
            fileScore.reasons.push('Contains API Route definitions');
          }
        }
      }
    }

    // 4. Entry Points (from Profiler — driven by RepositoryModel entryPointStrategy)
    for (const ep of profile.entryPoints) {
      const fileScore = scores.get(ep.id);
      if (fileScore) {
        fileScore.score += 50;
        fileScore.reasons.push('Identified as application Entry Point');
      }
    }

    // 5. Framework-aware bonuses (reads RepositoryModel — does NOT re-detect)
    if (framework) {
      _applyFrameworkBonuses(scores, snapshot, framework);
    }

    // 6. Monorepo scoping (P1 requirement)
    // If it's a monorepo but has no entry points, package.json files act as anchors.
    if (repositoryModel?.isMonorepo) {
      for (const file of snapshot.files.values()) {
        if (file.path.endsWith('package.json')) {
          const score = scores.get(file.id);
          if (score) {
            score.score += 40;
            score.reasons.push('Monorepo package configuration');
          }
        }
      }
    }

    return scores;
  }
}

// ---------------------------------------------------------------------------
// Framework-specific scoring bonuses
// Each framework has files that are architecturally important beyond raw import count.
// ---------------------------------------------------------------------------
function _applyFrameworkBonuses(scores, snapshot, framework) {
  for (const file of snapshot.files.values()) {
    const p    = file.path.toLowerCase();
    const name = p.split('/').pop();
    const score = scores.get(file.id);
    if (!score) continue;

    if (framework === 'next') {
      // App Router: layout and page files define the UI tree
      if (name === 'layout.tsx' || name === 'layout.js' || name === 'layout.ts') {
        score.score += 30;
        score.reasons.push('Next.js layout file (App Router root)');
      }
      if (name === 'page.tsx' || name === 'page.js' || name === 'page.ts') {
        score.score += 20;
        score.reasons.push('Next.js page component');
      }
      // API routes are highly relevant
      if (p.includes('/api/') && (name === 'route.ts' || name === 'route.js')) {
        score.score += 25;
        score.reasons.push('Next.js API route handler');
      }
      // Middleware is architecturally significant
      if (name === 'middleware.ts' || name === 'middleware.js') {
        score.score += 30;
        score.reasons.push('Next.js middleware (request interception)');
      }
    }

    if (framework === 'nestjs') {
      if (name.endsWith('.module.ts') || name.endsWith('.module.js')) {
        score.score += 25;
        score.reasons.push('NestJS module (dependency container)');
      }
      if (name.endsWith('.controller.ts') || name.endsWith('.controller.js')) {
        score.score += 20;
        score.reasons.push('NestJS controller (route handler)');
      }
      if (name.endsWith('.service.ts') || name.endsWith('.service.js')) {
        score.score += 15;
        score.reasons.push('NestJS service (business logic)');
      }
      if (name.endsWith('.guard.ts') || name.endsWith('.interceptor.ts')) {
        score.score += 20;
        score.reasons.push('NestJS guard/interceptor (cross-cutting concern)');
      }
    }

    if (framework === 'express' || framework === 'fastify' || framework === 'hono') {
      // Middleware files are architecturally central in Express
      if (p.includes('/middleware/') || p.includes('/middlewares/')) {
        score.score += 15;
        score.reasons.push('Middleware directory file');
      }
      if (p.includes('/routes/') || p.includes('/routers/')) {
        score.score += 15;
        score.reasons.push('Route definition file');
      }
      if (p.includes('/controllers/') || p.includes('/handlers/')) {
        score.score += 12;
        score.reasons.push('Request handler file');
      }
    }

    if (framework === 'react') {
      // React SPA: App component and router are most important
      if (name === 'app.tsx' || name === 'app.jsx' || name === 'app.ts' || name === 'app.js') {
        score.score += 30;
        score.reasons.push('React App root component');
      }
      if (p.includes('/pages/') || p.includes('/views/') || p.includes('/screens/')) {
        score.score += 10;
        score.reasons.push('Page/view component');
      }
    }
  }
}

module.exports = {
  Scorer
};
