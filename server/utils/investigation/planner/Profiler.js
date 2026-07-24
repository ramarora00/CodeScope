/**
 * Stage A: Repository Profiling
 *
 * Reads the RepositoryModel produced by Classification (Stage 0) and the
 * RepositorySnapshot, and produces a profile with entry points and config files.
 *
 * RepositoryModel Rule (ADR-002):
 *   This stage does NOT re-detect language or framework.
 *   It reads repositoryModel.entryPointStrategy and builds entry point lists accordingly.
 *   If repositoryModel is null (backwards compatibility), falls back to filesystem heuristics.
 */

class Profiler {
  /**
   * @param {RepositorySnapshot} snapshot
   * @param {RepositoryModel|null} repositoryModel  — from Classification Stage 0
   * @returns {Object} profile
   */
  static profile(snapshot, repositoryModel = null) {
    const profile = {
      frameworks:   [],
      language:     'Unknown',
      entryPoints:  [],
      configFiles:  [],
      coreDirs:     new Set(),
      // Carry the RepositoryModel forward so Scorer can read it
      repositoryModel,
    };

    // -------------------------------------------------------------------
    // Collect config files (always — useful for context regardless of model)
    // -------------------------------------------------------------------
    for (const file of snapshot.files.values()) {
      const filename = file.path.split('/').pop().toLowerCase();
      if (
        filename === 'package.json'    ||
        filename === 'tsconfig.json'   ||
        filename === 'next.config.js'  ||
        filename === 'next.config.ts'  ||
        filename === 'next.config.mjs' ||
        filename === 'nest-cli.json'   ||
        filename === 'vite.config.js'  ||
        filename === 'vite.config.ts'  ||
        filename === 'vite.config.mjs'
      ) {
        profile.configFiles.push(file);
      }
    }

    // -------------------------------------------------------------------
    // Use RepositoryModel (P1 path — Classification ran)
    // -------------------------------------------------------------------
    // P1.1: Legacy path removed. We strictly depend on RepositoryModel (ADR-002)
    profile.language   = _toDisplayLanguage(repositoryModel.primaryLanguage);
    profile.frameworks = repositoryModel.framework ? [repositoryModel.framework] : [];

    profile.entryPoints = _findEntryPoints(
      snapshot,
      repositoryModel.entryPointStrategy,
      repositoryModel.framework
    );

    // Identify core source directories from entry points
    for (const ep of profile.entryPoints) {
      const dir = ep.path.split('/').slice(0, -1).join('/');
      if (dir) profile.coreDirs.add(dir);
    }

    return profile;
  }
}

// ---------------------------------------------------------------------------
// Entry point finder — driven by entryPointStrategy from RepositoryModel
// ---------------------------------------------------------------------------
function _findEntryPoints(snapshot, strategy, framework) {
  const files = Array.from(snapshot.files.values());

  switch (strategy) {

    case 'app-router':
      // Next.js App Router: app/layout.tsx is the true root
      return _findByPatterns(files, [
        f => f.path === 'app/layout.tsx' || f.path === 'app/layout.js',
        f => f.path.match(/^app\/layout\.(tsx|jsx|ts|js)$/),
        f => f.path.match(/^src\/app\/layout\.(tsx|jsx|ts|js)$/),
        f => f.path.match(/^app\/page\.(tsx|jsx|ts|js)$/),
      ]);

    case 'pages-router':
      // Next.js Pages Router: pages/_app.tsx → pages/index.tsx
      return _findByPatterns(files, [
        f => f.path.match(/^pages\/_app\.(tsx|jsx|ts|js)$/),
        f => f.path.match(/^src\/pages\/_app\.(tsx|jsx|ts|js)$/),
        f => f.path.match(/^pages\/index\.(tsx|jsx|ts|js)$/),
      ]);

    case 'nestjs-main':
      // NestJS: main.ts (NestFactory.create) → AppModule
      return _findByPatterns(files, [
        f => f.path.match(/^src\/main\.(ts|js)$/),
        f => f.path === 'main.ts' || f.path === 'main.js',
        f => f.path.match(/^src\/app\.module\.(ts|js)$/),
      ]);

    case 'react-main':
      // React SPA: src/main.tsx or src/index.tsx
      return _findByPatterns(files, [
        f => f.path.match(/^src\/main\.(tsx|jsx|ts|js)$/),
        f => f.path.match(/^src\/index\.(tsx|jsx|ts|js)$/),
        f => f.path === 'index.tsx' || f.path === 'index.jsx',
        f => f.path.match(/^src\/App\.(tsx|jsx|ts|js)$/),
      ]);

    case 'express-entry':
      // Express / Fastify / Hono: root index or server file
      return _findByPatterns(files, [
        f => f.path.match(/^(src\/)?(index|server|app|main)\.(ts|js)$/),
        f => f.path.match(/^(index|server|app|main)\.(ts|js)$/),
      ]);

    case 'bin-field':
      // CLI tools: file referenced by package.json bin (best effort — use cli.ts or similar)
      return _findByPatterns(files, [
        f => f.path.startsWith('bin/'),
        f => f.path.match(/^(src\/)?(cli|main|bin)\.(ts|js)$/),
        f => f.path.match(/^(src\/)?(index)\.(ts|js)$/),
      ]);

    case 'index-export':
      // Library: root index.ts is the public API
      return _findByPatterns(files, [
        f => f.path === 'index.ts' || f.path === 'index.js',
        f => f.path === 'src/index.ts' || f.path === 'src/index.js',
      ]);

    case 'filesystem-fallback':
    default:
      // Generic: any file named index, app, server, main at root or src/
      return _findByPatterns(files, [
        f => f.path.match(/^(src\/)?(index|app|server|main)\.(ts|tsx|js|jsx)$/),
      ]);
  }
}

/**
 * Applies an ordered list of predicates, returns first non-empty match set.
 * Falls back to empty array if nothing matches.
 */
function _findByPatterns(files, predicates) {
  for (const predicate of predicates) {
    const matches = files.filter(predicate);
    if (matches.length > 0) return matches;
  }
  return [];
}

function _toDisplayLanguage(lang) {
  switch (lang) {
    case 'typescript': return 'TypeScript';
    case 'javascript': return 'JavaScript';
    default:           return 'Unknown';
  }
}

module.exports = { Profiler };
