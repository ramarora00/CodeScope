/**
 * Classification — Stage 0
 *
 * Runs before every other planner stage.
 * Reads indexed package.json content from the snapshot and produces a RepositoryModel.
 *
 * RepositoryModel Rule (ADR-002):
 *   This is the single source of truth for repository facts.
 *   No downstream stage (Profiler, Scorer, DagBuilder, PlanGenerator)
 *   may re-derive what Classification determined here.
 *
 * Detection priority:
 *   1. package.json dependencies      — High confidence
 *   2. package.json devDependencies   — Medium confidence
 *   3. Config file presence           — Medium confidence (next.config, vite.config, nest-cli.json)
 *   4. File path patterns             — Low confidence, fallback only
 */

const { RepositoryModel, createUnknownModel } = require('../domain/RepositoryModel');

// ---------------------------------------------------------------------------
// Dependency → Framework mapping
// Key: exact package name in dependencies/devDependencies
// Value: { framework, type, entryPointStrategy }
// ---------------------------------------------------------------------------
const FRAMEWORK_MAP = {
  // Next.js (must be before React — Next also has react as dep)
  'next':              { framework: 'next',    type: 'ssr',     strategy: null }, // strategy set after router detection
  // NestJS
  '@nestjs/core':      { framework: 'nestjs',  type: 'api',     strategy: 'nestjs-main' },
  '@nestjs/common':    { framework: 'nestjs',  type: 'api',     strategy: 'nestjs-main' },
  // React SPA (checked after next so Next.js isn't misclassified as spa)
  'react':             { framework: 'react',   type: 'spa',     strategy: 'react-main' },
  // Express
  'express':           { framework: 'express', type: 'api',     strategy: 'express-entry' },
  // Fastify (common alternative)
  'fastify':           { framework: 'fastify', type: 'api',     strategy: 'express-entry' },
  // Hono (edge-first)
  'hono':              { framework: 'hono',    type: 'api',     strategy: 'express-entry' },
};

// Config files that reliably indicate a framework, even without package.json
const CONFIG_SIGNALS = {
  'next.config.js':    { framework: 'next',    type: 'ssr' },
  'next.config.ts':    { framework: 'next',    type: 'ssr' },
  'next.config.mjs':   { framework: 'next',    type: 'ssr' },
  'nest-cli.json':     { framework: 'nestjs',  type: 'api' },
  'vite.config.js':    { framework: 'react',   type: 'spa' },
  'vite.config.ts':    { framework: 'react',   type: 'spa' },
  'vite.config.mjs':   { framework: 'react',   type: 'spa' },
};

// Package manager lock files → packageManager value
const LOCK_FILES = {
  'pnpm-lock.yaml':   'pnpm',
  'yarn.lock':        'yarn',
  'package-lock.json':'npm',
};

// Monorepo signal files at root level
const MONOREPO_SIGNALS = new Set([
  'pnpm-workspace.yaml',
  'turbo.json',
  'nx.json',
  'lerna.json',
  'rush.json',
]);

class Classification {
  /**
   * @param {RepositorySnapshot} snapshot
   * @returns {RepositoryModel}
   */
  static classify(snapshot) {
    // ----- Step 1: Find and parse package.json -----
    let packageJson = null;
    let packageJsonFile = null;

    for (const file of snapshot.files.values()) {
      // Root-level package.json only (not inside node_modules, packages/, apps/)
      const parts = file.path.split('/');
      if (file.path === 'package.json' || (parts.length === 1 && parts[0] === 'package.json')) {
        packageJsonFile = file;
        break;
      }
    }

    if (packageJsonFile && packageJsonFile.content) {
      try {
        packageJson = JSON.parse(packageJsonFile.content);
      } catch {
        packageJson = null;
      }
    }

    // ----- Step 2: Detect language -----
    let hasTs = false, hasJs = false;
    for (const file of snapshot.files.values()) {
      const p = file.path;
      if (p.endsWith('.ts') || p.endsWith('.tsx')) hasTs = true;
      if (p.endsWith('.js') || p.endsWith('.jsx')) hasJs = true;
      if (hasTs) break; // TypeScript takes priority, stop early
    }
    const primaryLanguage = hasTs ? 'typescript' : hasJs ? 'javascript' : 'unknown';

    // ----- Step 3: Detect monorepo -----
    let isMonorepo = false;
    if (packageJson && Array.isArray(packageJson.workspaces)) {
      isMonorepo = true;
    }
    if (!isMonorepo) {
      for (const file of snapshot.files.values()) {
        const filename = file.path.split('/').pop();
        if (MONOREPO_SIGNALS.has(filename)) {
          isMonorepo = true;
          break;
        }
      }
    }

    // ----- Step 4: Detect package manager -----
    let packageManager = null;
    for (const file of snapshot.files.values()) {
      const filename = file.path.split('/').pop();
      if (LOCK_FILES[filename]) {
        packageManager = LOCK_FILES[filename];
        break;
      }
    }
    if (!packageManager && packageJson) {
      packageManager = 'npm'; // default assumption if package.json exists
    }

    // ----- Step 5: Framework detection (High confidence — from package.json deps) -----
    let framework      = null;
    let frameworkConf  = 0.0;
    let repoType       = 'unknown';
    let entryStrategy  = 'filesystem-fallback';
    let detectedNext   = false;

    if (packageJson) {
      const allDeps = {
        ...( packageJson.dependencies    || {} ),
        ...( packageJson.devDependencies || {} ),
      };

      // Check primary dependency signal (ordered: next before react to avoid misclassification)
      for (const [pkgName, mapping] of Object.entries(FRAMEWORK_MAP)) {
        if (allDeps[pkgName] !== undefined) {
          // If we already found Next.js, skip React (Next.js depends on React)
          if (framework === 'next' && pkgName === 'react') continue;

          framework     = mapping.framework;
          repoType      = mapping.type;
          frameworkConf = 0.80; // P1.1: Base high confidence from dependency
          if (mapping.strategy) entryStrategy = mapping.strategy;
          if (pkgName === 'next') detectedNext = true;
          break; // First match wins
        }
      }

      // Library / CLI detection (overrides type only, not framework)
      if (packageJson.bin && Object.keys(packageJson.bin).length > 0) {
        repoType      = 'cli';
        entryStrategy = 'bin-field';
        frameworkConf = Math.max(frameworkConf, 0.85);
      } else if (!packageJson.scripts?.start && !packageJson.scripts?.dev && packageJson.main) {
        // Has a main field but no start script → likely a library
        repoType      = 'library';
        entryStrategy = 'index-export';
      }
    }

    // ----- Step 6: Config file signals (Medium confidence — fills gaps or boosts existing) -----
    for (const file of snapshot.files.values()) {
      const filename = file.path.split('/').pop();
      const signal = CONFIG_SIGNALS[filename];
      if (signal) {
        if (!framework) {
          framework     = signal.framework;
          repoType      = signal.type;
          frameworkConf = 0.70; // Medium confidence (no package.json dep, but config exists)
        } else if (framework === signal.framework) {
          frameworkConf += 0.10; // Corroborating evidence
        }
        break;
      }
    }

    // ----- Step 7: Next.js — detect App Router vs Pages Router -----
    if (detectedNext || framework === 'next') {
      let hasAppDir   = false;
      let hasPagesDir = false;

      for (const file of snapshot.files.values()) {
        const p = file.path;
        if (p.startsWith('app/') && (p.endsWith('layout.tsx') || p.endsWith('layout.js'))) {
          hasAppDir = true;
        }
        if (p.startsWith('pages/') && (p.endsWith('_app.tsx') || p.endsWith('_app.js'))) {
          hasPagesDir = true;
        }
      }

      // App Router takes precedence when both exist (Next.js 13+ behaviour)
      if (hasAppDir) {
        entryStrategy = 'app-router';
        frameworkConf += 0.05; // Corroborating structural evidence
      } else if (hasPagesDir) {
        entryStrategy = 'pages-router';
        frameworkConf += 0.05; // Corroborating structural evidence
      } else {
        entryStrategy = 'filesystem-fallback'; // Next.js detected but no recognisable structure
      }
    }

    // ----- Step 8: Monorepo type override -----
    if (isMonorepo && repoType !== 'cli' && repoType !== 'library') {
      repoType = 'monorepo';
    }

    // ----- Result -----
    return new RepositoryModel({
      type:                repoType,
      primaryLanguage,
      framework,
      frameworkConfidence: frameworkConf,
      packageManager,
      isMonorepo,
      entryPointStrategy:  entryStrategy,
    });
  }
}

module.exports = { Classification };
