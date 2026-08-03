const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EventEmitter = require('events');
const indexingEmitter = new EventEmitter();
indexingEmitter.setMaxListeners(100);


const REPOS_DIR = path.join(__dirname, '../../repos');

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

const { parseCode } = require('../utils/parser');
const { indexRepo } = require('../utils/vectorStore');

const TEXT_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'md', 'php'];
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '__pycache__', 'vendor', 'legacy', 'repos', 'scratch']);

/**
 * Runs AST parsing in a worker thread to avoid blocking the main event loop.
 * Accepts a batch of raw file objects, returns parsed results.
 */
const runParserWorker = (files, repoPath) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../utils/parseWorker.js'), {
      workerData: { files, repoPath }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Parser worker exited with code ${code}`));
    });
  });
};

/**
 * Normalize a file path for consistent comparison (forward slashes, no trailing slash).
 */
const normalizePath = (p) => p.replace(/\\/g, '/').replace(/\/$/, '');

/**
 * Resolve an import source against a file's directory, trying common extensions and index files.
 * Returns the matching File record from allFiles, or null.
 */
const resolveImportPath = (importSource, importingFilePath, allFilesMap) => {
  const importDir = path.dirname(importingFilePath);
  const resolvedPrefix = normalizePath(path.join(importDir, importSource));

  // Try exact match, then with extensions, then index files
  const candidates = [
    resolvedPrefix,
    resolvedPrefix + '.js',
    resolvedPrefix + '.jsx',
    resolvedPrefix + '.ts',
    resolvedPrefix + '.tsx',
    resolvedPrefix + '/index.js',
    resolvedPrefix + '/index.ts',
    resolvedPrefix + '/index.jsx',
    resolvedPrefix + '/index.tsx',
  ];

  for (const candidate of candidates) {
    const file = allFilesMap.get(candidate);
    if (file) return file;
  }

  return null;
};

/**
 * Collect all files recursively from a directory.
 */
const collectFilesFromDisk = (dirPath, relativePath = '') => {
  const rawFiles = [];
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    if (entry === 'package-lock.json' || entry === 'yarn.lock' || entry === 'pnpm-lock.yaml') continue;
    const fullPath = path.join(dirPath, entry);
    const relPath = path.join(relativePath, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      rawFiles.push(...collectFilesFromDisk(fullPath, relPath));
    } else {
      const language = path.extname(entry).slice(1);
      rawFiles.push({ path: relPath, language, filename: entry });
    }
  }
  return rawFiles;
};


// ============================================================================
//  MAIN INDEXING PIPELINE
// ============================================================================

const runBackgroundIndex = async (repoId, repoUrl, repoPath) => {
  let activeStep = 'cloning';
  try {
    const pass1Start = Date.now();
    // --- CLONE ---
    indexingEmitter.emit('progress', { repoId, step: 'cloning', status: 'running' });
    if (repoUrl.startsWith('local://')) {
      console.log(`[Background] Using local directory ${repoPath}, skipping clone.`);
      indexingEmitter.emit('progress', { repoId, step: 'cloning', status: 'done' });
    } else {
      console.log(`[Background] Cloning ${repoUrl}...`);
      await prisma.repo.update({ where: { id: repoId }, data: { status: 'cloning' } });
      await simpleGit().clone(repoUrl, repoPath);
      indexingEmitter.emit('progress', { repoId, step: 'cloning', status: 'done' });
    }

    // =========================================================================
    //  PASS 1: File Scanning + AST Symbol Extraction
    // =========================================================================
    console.log(`[Background] Starting PASS 1: Symbol Extraction for ${repoId}`);
    activeStep = 'reading';
    indexingEmitter.emit('progress', { repoId, step: 'reading', status: 'running' });
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'indexing' } });

    const rawFiles = collectFilesFromDisk(repoPath);
    console.log(`[Background] Collected ${rawFiles.length} files from disk.`);
    indexingEmitter.emit('progress', { repoId, step: 'reading', status: 'done', count: rawFiles.length });

    activeStep = 'parsing';
    indexingEmitter.emit('progress', { repoId, step: 'parsing', status: 'running' });

    // Parse files in worker thread (CPU-intensive, off main thread)
    const parsableFiles = rawFiles.filter(f => TEXT_EXTENSIONS.includes(f.language));
    const nonParsableFiles = rawFiles.filter(f => !TEXT_EXTENSIONS.includes(f.language));

    let parsedResults = [];
    if (parsableFiles.length > 0) {
      const workerBatchSize = 100;
      for (let i = 0; i < parsableFiles.length; i += workerBatchSize) {
        const batch = parsableFiles.slice(i, i + workerBatchSize);
        const batchResults = await runParserWorker(batch, repoPath);
        parsedResults.push(...batchResults);
      }
    }

    console.log(`[Background] Worker parsed ${parsedResults.length} files in ${Date.now() - pass1Start}ms.`);

    // Write to database
    const allParsed = [...parsedResults, ...nonParsableFiles.map(f => ({ ...f, metadata: null }))];

    for (const file of allParsed) {
      const contentHash = file.content ? crypto.createHash('sha256').update(file.content).digest('hex') : null;
      const normalizedPath = normalizePath(file.path);
      const fileRecord = await prisma.file.create({
        data: {
          path: normalizedPath,
          content: file.content,
          contentHash: contentHash,
          language: file.language,
          metadata: file.metadata,
          repoId: repoId
        }
      });

      // Stream file lines as they are processed
      if (file.content) {
        indexingEmitter.emit('progress', {
          repoId,
          step: 'parsing',
          status: 'running',
          file: normalizedPath,
          content: file.content,
          line: 1
        });

        if (file.metadata) {
          let parsedMeta;
          try { parsedMeta = JSON.parse(file.metadata); } catch { parsedMeta = null; }
          if (parsedMeta) {
            const symbolLines = [
              ...(parsedMeta.functions || []).map(f => f.lineStart),
              ...(parsedMeta.classes  || []).map(c => c.lineStart),
              ...(parsedMeta.routes   || []).map(r => r.lineStart)
            ].filter(Boolean).sort((a, b) => a - b);

            for (const line of symbolLines) {
              indexingEmitter.emit('progress', {
                repoId,
                step: 'parsing',
                status: 'running',
                file: normalizedPath,
                line
              });
            }
          }
        }
      }

      // P0-2: Guard against malformed metadata JSON
      if (file.metadata) {
        let parsedMeta;
        try { parsedMeta = JSON.parse(file.metadata); } catch { parsedMeta = null; }
        if (parsedMeta) {
        const symbolsToCreate = [
          {
            name: file.filename,
            qualifiedName: `${normalizedPath}#module`,
            type: 'module',
            fileId: fileRecord.id,
            repoId
          },
          ...parsedMeta.functions.map(f => ({
            name: f.name,
            qualifiedName: `${normalizedPath}#${f.name}`,
            type: 'function',
            lineStart: f.lineStart,
            lineEnd: f.lineEnd,
            fileId: fileRecord.id,
            repoId
          })),
          ...parsedMeta.classes.map(c => ({
            name: c.name,
            qualifiedName: `${normalizedPath}#${c.name}`,
            type: 'class',
            lineStart: c.lineStart,
            lineEnd: c.lineEnd,
            fileId: fileRecord.id,
            repoId
          })),
          ...(parsedMeta.routes || []).map(r => ({
            name: `${r.method} ${r.path}`,
            qualifiedName: `${normalizedPath}#${r.method} ${r.path}`,
            type: 'route',
            lineStart: r.lineStart,
            lineEnd: r.lineEnd,
            fileId: fileRecord.id,
            repoId
          }))
        ];
        if (symbolsToCreate.length > 0) {
          await prisma.symbol.createMany({ data: symbolsToCreate });
        }
      }
    }
    }

    indexingEmitter.emit('progress', { repoId, step: 'parsing', status: 'done' });
    console.log(`[Background] PASS 1 complete in ${Date.now() - pass1Start}ms. ${allParsed.length} files indexed.`);

    // =========================================================================
    //  PASS 1b: Import Graph Formalization
    //  Creates IMPORTS, EXPORTS, REEXPORTS relationships + External Dependencies
    // =========================================================================
    activeStep = 'resolve_imports';
    indexingEmitter.emit('progress', { repoId, step: 'resolve_imports', status: 'running' });
    console.log(`[Background] Starting PASS 1b: Import Graph Construction for ${repoId}`);
    const pass1bStart = Date.now();

    const allFiles = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
    const allFilesMap = new Map(allFiles.map(f => [normalizePath(f.path), f]));
    const allSymbols = await prisma.symbol.findMany({ where: { repoId } });
    const externalSymbolCache = new Map(); // source -> Symbol record

    for (const file of allFiles) {
      if (!file.metadata) continue;
      let meta;
      try { meta = JSON.parse(file.metadata); } catch { continue; }
      const normalizedFilePath = normalizePath(file.path);

      // --- Process ES6 imports ---
      if (meta.imports) {
        for (const imp of meta.imports) {
          if (imp.isRelative) {
            const targetFile = resolveImportPath(imp.source, normalizedFilePath, allFilesMap);
            if (targetFile) {
              const importerSymbol = file.symbols.find(s => s.type === 'module');
              // Create IMPORTS relationships for each specifier
              for (const spec of imp.specifiers) {
                // Find the target symbol (the exported name in the target file)
                const targetSymbol = targetFile.symbols.find(s =>
                  s.name === spec.imported ||
                  (spec.imported === 'default' && s.name === 'default') ||
                  s.name === spec.local
                );

                if (importerSymbol && targetSymbol) {
                  try {
                    await prisma.symbolRelationship.create({
                      data: {
                        callerId: importerSymbol.id,
                        calleeId: targetSymbol.id,
                        relationship: 'imports',
                        confidence: 1.0,
                        resolutionMethod: 'es6_import'
                      }
                    });
                  } catch (e) { /* unique constraint = already exists */ }
                }
              }
            }
          } else {
            // External dependency (e.g., import Stripe from 'stripe')
            const externalSource = imp.source;
            if (!externalSymbolCache.has(externalSource)) {
              const extSymbol = await prisma.symbol.create({
                data: {
                  name: externalSource,
                  qualifiedName: `external#${externalSource}`,
                  type: 'external_service',
                  isExternal: true,
                  fileId: file.id, // Associate with the first file that imports it
                  repoId
                }
              });
              externalSymbolCache.set(externalSource, extSymbol);
            }

            // Link the importing module to the external dependency
            const importerSymbol = file.symbols.find(s => s.type === 'module');
            for (const spec of imp.specifiers) {
              const extSymbol = externalSymbolCache.get(externalSource);
              if (importerSymbol && extSymbol) {
                try {
                  await prisma.symbolRelationship.create({
                    data: {
                      callerId: importerSymbol.id,
                      calleeId: extSymbol.id,
                      relationship: 'imports',
                      confidence: 1.0,
                      resolutionMethod: 'external_import'
                    }
                  });
                } catch (e) { /* unique constraint */ }
              }
            }
          }
        }
      }

      // --- Process CommonJS requires ---
      if (meta.requires) {
        for (const req of meta.requires) {
          if (req.isRelative) {
            const targetFile = resolveImportPath(req.source, normalizedFilePath, allFilesMap);
            if (targetFile) {
              const importerSymbol = file.symbols.find(s => s.type === 'module');
              const targetSymbol = targetFile.symbols.find(s =>
                s.name === req.imported ||
                (req.imported === 'default' && s.name === 'default') ||
                s.name === req.local
              );
              if (importerSymbol && targetSymbol) {
                try {
                  await prisma.symbolRelationship.create({
                    data: {
                      callerId: importerSymbol.id,
                      calleeId: targetSymbol.id,
                      relationship: 'imports',
                      confidence: 1.0,
                      resolutionMethod: 'commonjs_require'
                    }
                  });
                } catch (e) { /* unique constraint */ }
              }
            }
          } else {
            // External CommonJS require
            const externalSource = req.source;
            if (!externalSymbolCache.has(externalSource)) {
              const extSymbol = await prisma.symbol.create({
                data: {
                  name: externalSource,
                  qualifiedName: `external#${externalSource}`,
                  type: 'external_service',
                  isExternal: true,
                  fileId: file.id,
                  repoId
                }
              });
              externalSymbolCache.set(externalSource, extSymbol);
            }
          }
        }
      }

      // --- Process Re-exports: export { login } from './auth' ---
      if (meta.exports) {
        for (const exp of meta.exports) {
          if (exp.type === 'reexport' && exp.source) {
            const targetFile = resolveImportPath(exp.source, normalizedFilePath, allFilesMap);
            if (targetFile) {
              const reexportSymbol = file.symbols.find(s => s.name === exp.name) ||
                targetFile.symbols.find(s => s.name === (exp.originalName || exp.name));

              const originalSymbol = targetFile.symbols.find(s => s.name === (exp.originalName || exp.name));

              if (reexportSymbol && originalSymbol && reexportSymbol.id !== originalSymbol.id) {
                try {
                  await prisma.symbolRelationship.create({
                    data: {
                      callerId: reexportSymbol.id,
                      calleeId: originalSymbol.id,
                      relationship: 'reexports',
                      confidence: 1.0,
                      resolutionMethod: 'reexport_chain'
                    }
                  });
                } catch (e) { /* unique constraint */ }
              }
            }
          }
        }
      }
    }

    console.log(`[Background] PASS 1b (Import Graph) complete in ${Date.now() - pass1bStart}ms. External deps: ${externalSymbolCache.size}`);
    indexingEmitter.emit('progress', { repoId, step: 'resolve_imports', status: 'done' });

    // =========================================================================
    //  PASS 2: Call Graph Resolution (Cross-File, Alias-Aware)
    // =========================================================================
    activeStep = 'call_graph';
    indexingEmitter.emit('progress', { repoId, step: 'call_graph', status: 'running' });
    console.log(`[Background] Starting PASS 2: Call Graph Resolution for ${repoId}`);
    const pass2Start = Date.now();
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'mapping' } });

    // Refresh data after Pass 1b (new symbols may have been created)
    const allFilesPass2 = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
    const allFilesMapPass2 = new Map(allFilesPass2.map(f => [normalizePath(f.path), f]));
    const allSymbolsPass2 = await prisma.symbol.findMany({ where: { repoId } });

    for (const file of allFilesPass2) {
      if (!file.metadata) continue;
      const meta = JSON.parse(file.metadata);
      if (!meta.calls || meta.calls.length === 0) continue;
      const normalizedFilePath = normalizePath(file.path);

      // Build import alias map for this file: localName -> { importedName, resolvedFile }
      const aliasMap = new Map();
      if (meta.imports) {
        for (const imp of meta.imports) {
          if (!imp.isRelative) continue;
          const targetFile = resolveImportPath(imp.source, normalizedFilePath, allFilesMapPass2);
          if (targetFile) {
            for (const spec of imp.specifiers) {
              aliasMap.set(spec.local, { imported: spec.imported, targetFile });
            }
          }
        }
      }
      // CommonJS alias map
      if (meta.requires) {
        for (const req of meta.requires) {
          if (!req.isRelative) continue;
          const targetFile = resolveImportPath(req.source, normalizedFilePath, allFilesMapPass2);
          if (targetFile) {
            aliasMap.set(req.local, { imported: req.imported, targetFile });
          }
        }
      }

      for (const call of meta.calls) {
        let targetSymbol = null;
        let resolutionMethod = 'unknown';
        let confidence = 0.0;

        // 1. Local Resolution (Function called within the same file)
        targetSymbol = file.symbols.find(s => s.name === call.name && !s.isExternal);
        if (targetSymbol) {
          resolutionMethod = 'local_scope';
          confidence = 1.0;
        }

        // 2. Alias-Aware Import Resolution (Cross-file call)
        if (!targetSymbol) {
          // Check: is call.name a direct import alias?
          const alias = aliasMap.get(call.name);
          if (alias) {
            const symbolName = alias.imported === 'default' ? call.name : alias.imported;
            targetSymbol = alias.targetFile.symbols.find(s =>
              s.name === symbolName || s.name === call.name
            );
            if (targetSymbol) {
              resolutionMethod = 'named_import';
              confidence = 1.0;
            }
          }

          // Check: is call.objectName an imported module? (e.g., authService.login())
          if (!targetSymbol && call.objectName) {
            const moduleAlias = aliasMap.get(call.objectName);
            if (moduleAlias) {
              targetSymbol = moduleAlias.targetFile.symbols.find(s => s.name === call.name);
              if (targetSymbol) {
                resolutionMethod = 'member_access_import';
                confidence = 0.95;
              }
            }
          }
        }

        // 3. Global Fallback (lowest confidence)
        if (!targetSymbol) {
          targetSymbol = allSymbolsPass2.find(s => s.name === call.name && !s.isExternal);
          if (targetSymbol) {
            resolutionMethod = 'global_name_match';
            confidence = 0.35;
          }
        }

        if (targetSymbol) {
          // Find the symbol THAT IS CALLING (contextual lookup by line range)
          const callerSymbol = file.symbols.find(s =>
            s.lineStart && s.lineEnd && call.line >= s.lineStart && call.line <= s.lineEnd
          );

          if (callerSymbol && callerSymbol.id !== targetSymbol.id) {
            try {
              await prisma.symbolRelationship.upsert({
                where: {
                  callerId_calleeId_relationship: {
                    callerId: callerSymbol.id,
                    calleeId: targetSymbol.id,
                    relationship: 'calls'
                  }
                },
                create: {
                  callerId: callerSymbol.id,
                  calleeId: targetSymbol.id,
                  relationship: 'calls',
                  confidence,
                  resolutionMethod
                },
                update: {
                  confidence: Math.max(confidence, 0), // Keep highest confidence
                  resolutionMethod
                }
              });
            } catch (e) { /* constraint */ }
          }
        }
      }
    }

    console.log(`[Background] PASS 2 (Call Graph) complete in ${Date.now() - pass2Start}ms.`);

    // =========================================================================
    //  PASS 2b: Route Flow Mapping with Sequential Middleware Chains
    // =========================================================================
    console.log(`[Background] Starting PASS 2b: Route Flow Analysis for ${repoId}`);
    const pass2bStart = Date.now();

    const allFilesWithRoutes = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
    const allFilesMapRoutes = new Map(allFilesWithRoutes.map(f => [normalizePath(f.path), f]));
    const allSymbolsRoutes = await prisma.symbol.findMany({ where: { repoId } });

    for (const file of allFilesWithRoutes) {
      if (!file.metadata) continue;
      const meta = JSON.parse(file.metadata);
      if (!meta.routes || meta.routes.length === 0) continue;
      const normalizedFilePath = normalizePath(file.path);

      // Build alias map for this file
      const aliasMap = new Map();
      if (meta.imports) {
        for (const imp of meta.imports) {
          if (!imp.isRelative) continue;
          const targetFile = resolveImportPath(imp.source, normalizedFilePath, allFilesMapRoutes);
          if (targetFile) {
            for (const spec of imp.specifiers) {
              aliasMap.set(spec.local, { imported: spec.imported, targetFile });
            }
          }
        }
      }
      if (meta.requires) {
        for (const req of meta.requires) {
          if (!req.isRelative) continue;
          const targetFile = resolveImportPath(req.source, normalizedFilePath, allFilesMapRoutes);
          if (targetFile) {
            aliasMap.set(req.local, { imported: req.imported, targetFile });
          }
        }
      }

      for (const route of meta.routes) {
        const routeSymbol = file.symbols.find(s => s.name === `${route.method} ${route.path}` && s.type === 'route');
        if (!routeSymbol) continue;

        // Resolve each handler in order, creating sequential middleware chain
        let previousSymbol = routeSymbol;

        for (let handlerIdx = 0; handlerIdx < route.handlers.length; handlerIdx++) {
          const handlerName = route.handlers[handlerIdx];
          let handlerSymbol = null;
          let resolutionMethod = 'unknown';
          let confidence = 0.0;

          // 1. Local scope
          handlerSymbol = file.symbols.find(s => s.name === handlerName);
          if (handlerSymbol) {
            resolutionMethod = 'local_scope';
            confidence = 1.0;
          }

          // 2. Import alias resolution
          if (!handlerSymbol) {
            const alias = aliasMap.get(handlerName);
            if (alias) {
              const symbolName = alias.imported === 'default' ? handlerName : alias.imported;
              handlerSymbol = alias.targetFile.symbols.find(s => s.name === symbolName || s.name === handlerName);
              if (handlerSymbol) {
                resolutionMethod = 'named_import';
                confidence = 1.0;
              }
            }
          }

          // 3. Global fallback
          if (!handlerSymbol) {
            handlerSymbol = allSymbolsRoutes.find(s => s.name === handlerName && !s.isExternal);
            if (handlerSymbol) {
              resolutionMethod = 'global_name_match';
              confidence = 0.35;
            }
          }

          if (handlerSymbol) {
            try {
              await prisma.symbolRelationship.upsert({
                where: {
                  callerId_calleeId_relationship: {
                    callerId: previousSymbol.id,
                    calleeId: handlerSymbol.id,
                    relationship: 'calls'
                  }
                },
                create: {
                  callerId: previousSymbol.id,
                  calleeId: handlerSymbol.id,
                  relationship: 'calls',
                  confidence,
                  resolutionMethod,
                  executionOrder: handlerIdx
                },
                update: {
                  confidence,
                  resolutionMethod,
                  executionOrder: handlerIdx
                }
              });
            } catch (e) { /* constraint */ }

            // Chain: next handler is called BY this handler (sequential execution)
            previousSymbol = handlerSymbol;
          }
        }
      }
    }

    console.log(`[Background] PASS 2b (Route Flow) complete in ${Date.now() - pass2bStart}ms.`);
    indexingEmitter.emit('progress', { repoId, step: 'call_graph', status: 'done' });

    // =========================================================================
    //  PASS 3: Vector Embedding Sync (LanceDB)
    // =========================================================================
    activeStep = 'embeddings';
    indexingEmitter.emit('progress', { repoId, step: 'embeddings', status: 'running' });
    console.log(`[Background] Starting PASS 3: Vector Embedding Sync...`);
    const pass3Start = Date.now();
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'syncing' } });
    const allFilesForEmbed = await prisma.file.findMany({ where: { repoId } });
    await indexRepo(repoId, allFilesForEmbed);

    indexingEmitter.emit('progress', { repoId, step: 'embeddings', status: 'done' });
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'ready' } });
    activeStep = 'ready';
    indexingEmitter.emit('progress', { repoId, step: 'ready', status: 'done' });
    const totalTime = Date.now() - pass1Start;
    console.log(`[Background] PASS 3 (Embeddings) complete in ${Date.now() - pass3Start}ms.`);
    console.log(`[Background] ✅ Full pipeline complete for ${repoId} in ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s).`);
  } catch (err) {
    console.error(`[Background] Fatal Error indexing ${repoId}:`, err);
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'error' } }).catch(() => {});
    indexingEmitter.emit('progress', { repoId, step: activeStep, status: 'failed', error: err.message });
  }
};


// ============================================================================
//  API ROUTES
// ============================================================================

// @route   POST /api/repo/upload
router.post('/upload', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'URL required' });

  try {
    const repoName = repoUrl.split('/').pop().replace('.git', '') + '-' + Date.now();
    const repoPath = path.join(REPOS_DIR, repoName);

    console.log(`Initializing ${repoUrl} in background...`);

    const repo = await prisma.repo.create({
      data: {
        name: repoName,
        url: repoUrl,
        localPath: repoPath,
        status: 'cloning'
      }
    });

    // Fire and forget (Everything happens in background now)
    runBackgroundIndex(repo.id, repoUrl, repoPath);

    res.json(repo);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Cloning failed', details: error.message });
  }
});

// @route   POST /api/repo/index-local
// @desc    Test-only endpoint to index a local directory without cloning
router.post('/index-local', async (req, res) => {
  const { localPath, name } = req.body;
  if (!localPath || !name) return res.status(400).json({ error: 'localPath and name required' });

  try {
    const repo = await prisma.repo.create({
      data: {
        name,
        url: 'local://' + name,
        localPath,
        status: 'cloning'
      }
    });

    // Fire and forget (skip clone, just index)
    runBackgroundIndex(repo.id, 'local://' + name, localPath);

    res.json(repo);
  } catch (e) {
    res.status(500).json({ error: 'Failed', details: e.message });
  }
});

// @route   GET /api/repo
router.get('/', async (req, res) => {
  const repos = await prisma.repo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(repos);
});

// @route   GET /api/repo/:id/progress
// @desc    Stream real-time indexing progress events via SSE
router.get('/:id/progress', (req, res) => {
  const repoId = req.params.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const onProgress = (event) => {
    if (event.repoId === repoId) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  };

  indexingEmitter.on('progress', onProgress);

  // Send init event to confirm connection
  res.write(`data: ${JSON.stringify({ repoId, type: 'init' })}\n\n`);

  req.on('close', () => {
    indexingEmitter.off('progress', onProgress);
  });
});

// @route   GET /api/repo/:id/files
router.get('/:id/files', async (req, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: 'Repo not found' });

  const getFileTree = (dirPath, relativePath = '') => {
    const files = fs.readdirSync(dirPath);
    let tree = [];
    files.forEach((file) => {
      if (IGNORE_DIRS.has(file)) return;
      const fullPath = path.join(dirPath, file);
      const relPath = path.join(relativePath, file);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        tree.push({ name: file, path: relPath, type: 'directory', children: getFileTree(fullPath, relPath) });
      } else {
        tree.push({ name: file, path: relPath, type: 'file' });
      }
    });
    return tree;
  };

  res.json(getFileTree(repo.localPath));
});

// @route   GET /api/repo/:id/file/content
router.get('/:id/file/content', async (req, res) => {
  const { filePath } = req.query;
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: 'Repo not found' });

  const fullPath = path.join(repo.localPath, filePath);
  const fileRecord = await prisma.file.findUnique({
    where: { repoId_path: { repoId: req.params.id, path: filePath } }
  });

  if (fileRecord) {
    return res.json({ content: fileRecord.content || fs.readFileSync(fullPath, 'utf8'), metadata: fileRecord.metadata });
  }
  res.json({ content: fs.readFileSync(fullPath, 'utf8') });
});

// @route   GET /api/repo/:id/dependencies
router.get('/:id/dependencies', async (req, res) => {
  const files = await prisma.file.findMany({
    where: { repoId: req.params.id },
    select: { path: true, metadata: true, language: true, content: true }
  });
  const nodes = [];
  const edges = [];
  const pathMap = new Map();
  files.forEach(file => {
    nodes.push({ id: file.path, data: { label: file.path.split(/[\\/]/).pop(), path: file.path, language: file.language }, position: { x: 0, y: 0 } });
    pathMap.set(file.path, true);
    const base = file.path.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
    if (!pathMap.has(base)) pathMap.set(base, file.path);
  });
  files.forEach(file => {
    let importSources = [];
    if (file.metadata) {
      try { const meta = JSON.parse(file.metadata); if (meta.imports) importSources = meta.imports.map(i => i.source); } catch (e) {}
    }
    if (importSources.length === 0 && file.content && file.language === 'php') {
      const phpImports = file.content.match(/(?:require|include)(?:_once)?\s*\(?['"]([^'"]+)['"]\)?/g) || [];
      importSources = phpImports.map(m => { const match = m.match(/['"](.*?)['"]/); return match ? match[1] : null; }).filter(Boolean);
    }
    importSources.forEach(src => {
      const cleanSrc = src.replace(/^\.\//, '').replace(/\\/g, '/');
      const directMatch = Array.from(pathMap.keys()).find(p => p.replace(/\\/g, '/').endsWith(cleanSrc) || p.replace(/\\/g, '/').endsWith(cleanSrc + '.php'));
      if (directMatch && directMatch !== file.path) {
        edges.push({ id: `e-${file.path}--${directMatch}`, source: file.path, target: directMatch, animated: true, style: { stroke: '#3B82F6' } });
      }
    });
  });
  res.json({ nodes, edges });
});

// @route   GET /api/repo/:id/symbols/graph
// @desc    Get the function-to-function and route execution call graph nodes and edges
router.get('/:id/symbols/graph', async (req, res) => {
  try {
    const repoId = req.params.id;

    const symbols = await prisma.symbol.findMany({
      where: { repoId },
      include: { file: true }
    });

    const relationships = await prisma.symbolRelationship.findMany({
      where: {
        caller: { repoId },
        callee: { repoId }
      },
      include: {
        caller: true,
        callee: true
      }
    });

    const nodes = symbols.map(s => ({
      id: s.id,
      data: {
        label: `${s.name} (${s.type})`,
        name: s.name,
        qualifiedName: s.qualifiedName,
        type: s.type,
        isExternal: s.isExternal,
        filePath: s.file.path
      },
      position: { x: 0, y: 0 }
    }));

    const edges = relationships.map(r => ({
      id: `e-${r.callerId}--${r.calleeId}`,
      source: r.callerId,
      target: r.calleeId,
      animated: r.relationship === 'calls',
      label: r.relationship !== 'calls' ? r.relationship : undefined,
      data: { executionOrder: r.executionOrder, relationship: r.relationship },
      style: {
        stroke: r.relationship === 'calls' ? '#EC4899' :
                r.relationship === 'imports' ? '#3B82F6' :
                r.relationship === 'reexports' ? '#F59E0B' : '#6B7280',
        strokeWidth: 2
      }
    }));

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Symbols graph error:', error);
    res.status(500).json({ error: 'Failed to fetch symbols graph' });
  }
});

// @route   GET /api/repo/:id/impact
// @desc    Perform a deep upward trace to find all upstream systems affected by modifying this file.
router.get('/:id/impact', async (req, res) => {
  const { filePath } = req.query;
  const repoId = req.params.id;

  try {
    const targetFile = await prisma.file.findUnique({
      where: { repoId_path: { repoId, path: filePath } },
      include: { symbols: true }
    });

    if (!targetFile) return res.status(404).json({ error: 'File not found' });

    const { traverseGraph } = require('../utils/graphTraversal');
    const { generateResponse } = require('../utils/ai');

    let allPaths = [];
    for (const sym of targetFile.symbols) {
      const paths = await traverseGraph(repoId, sym.id, 'up', 4);
      allPaths.push(...paths);
    }

    const affectedSymbolNames = new Set();
    const affectedFilesSet = new Set();

    allPaths.forEach(pathArr => {
      for (let i = 1; i < pathArr.nodes.length; i++) {
        const upstreamSym = pathArr.nodes[i];
        affectedSymbolNames.add(`${upstreamSym.name} (${upstreamSym.type})`);
        if (upstreamSym.file) {
          affectedFilesSet.add(upstreamSym.file.path);
        }
      }
    });

    const affectedFiles = Array.from(affectedFilesSet);
    const affectedSymbols = Array.from(affectedSymbolNames);

    const promptContext = `
      The developer is modifying the file "${filePath}".
      Based on the deeply traced Knowledge Graph, this will potentially break or affect the following upstream systems:

      Files affected: ${affectedFiles.length > 0 ? affectedFiles.join(', ') : 'None detected upstream.'}
      Specific Upstream Symbols affected: ${affectedSymbols.length > 0 ? affectedSymbols.join(', ') : 'None detected upstream.'}

      Write a concise, professional Impact Analysis report for the developer warning them of what specific routes, controllers, or services they might break.
    `;

    const analysis = await generateResponse(promptContext, { fileName: filePath, content: targetFile.content });

    res.json({
      dependants: affectedFiles,
      affectedSymbols,
      analysis
    });
  } catch (error) {
    console.error('Impact Analysis Error:', error);
    res.status(500).json({ error: 'Failed to perform impact analysis' });
  }
});

// @route   GET /api/repo/:id/architecture
// @desc    Analyze the codebase for Domain Detection and high-level architectural insights
router.get('/:id/architecture', async (req, res) => {
  try {
    const repoId = req.params.id;
    const files = await prisma.file.findMany({
      where: { repoId },
      select: { path: true }
    });

    const stack = [];
    const paths = files.map(f => f.path);
    if (paths.some(p => p.includes('package.json'))) stack.push('Node.js');
    if (paths.some(p => p.includes('App.jsx'))) stack.push('React');
    if (paths.some(p => p.includes('composer.json'))) stack.push('PHP/Laravel');
    if (paths.some(p => p.includes('requirements.txt'))) stack.push('Python');

    // 1. Perform Deterministic Domain Detection
    const { detectDeterministicDomains } = require('../utils/domainClustering');
    const clusters = await detectDeterministicDomains(repoId);

    // 2. Format clustered domains for the LLM
    const clusterSummaryData = clusters.map((c, idx) => {
      return `Domain Candidate ${idx + 1}: [Inferred Name: ${c.inferredName}]
- Routes: ${c.routes.length > 0 ? c.routes.join(', ') : 'None'}
- Files: ${c.files.join(', ')}
- Core Symbols: ${c.symbols.slice(0, 15).join(', ')} ${c.symbols.length > 15 ? '...' : ''}`;
    }).join('\n\n---\n\n');

    const promptContext = `
      You are an elite Software Architect. Analyze the following deterministically clustered codebase components.
      Your task is to refine these groupings into Domain Driven Design (DDD) Bounded Contexts / Domains.

      For each domain candidate:
      1. Assign a professional Domain Name.
      2. Synthesize its architectural responsibility (Auth, Data Ingestion, User Management, etc.).
      3. List the key Routes, Files, and Symbols that form its boundaries.

      Clustered Domain Data:
      ${clusterSummaryData.slice(0, 15000)}

      Output a clean, structured Markdown response detailing these domains, boundary rules, and recommendations.
    `;

    const { generateResponse } = require('../utils/ai');
    const summary = await generateResponse(promptContext, {});

    res.json({ stack, summary, clusters });
  } catch (err) {
    console.error('Architecture Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze architecture' });
  }
});

// @route   POST /api/repo/:id/reindex
// @desc    Incremental delta-based reindexing: git pull, diff files, only re-process changed ones
router.post('/:id/reindex', async (req, res) => {
  const repoId = req.params.id;
  try {
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });
    if (repo.status !== 'ready' && repo.status !== 'error') {
      return res.status(409).json({ error: `Repo is currently ${repo.status}. Wait for it to finish.` });
    }

    res.json({ message: 'Incremental reindex started', repoId });

    // Run in background
    (async () => {
      try {
        const reindexStart = Date.now();
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'syncing' } });

        // STEP 1: Git Pull
        console.log(`[Reindex] Pulling latest changes for ${repo.name}...`);
        try {
          const git = simpleGit(repo.localPath);
          await git.pull();
        } catch (e) {
          console.warn(`[Reindex] Git pull failed (might be local-only repo): ${e.message}`);
        }

        // STEP 2: Collect current files from disk
        const diskFiles = collectFilesFromDisk(repo.localPath);
        diskFiles.forEach(f => {
          f.path = normalizePath(f.path);
          f.contentHash = f.content ? crypto.createHash('sha256').update(f.content).digest('hex') : null;
        });

        // STEP 3: Load existing DB files
        const dbFiles = await prisma.file.findMany({
          where: { repoId },
          select: { id: true, path: true, contentHash: true }
        });
        const dbFileMap = new Map(dbFiles.map(f => [f.path, f]));
        const diskFileMap = new Map(diskFiles.map(f => [f.path, f]));

        // STEP 4: Compute delta
        const added = [];
        const modified = [];
        const deleted = [];

        for (const df of diskFiles) {
          const existing = dbFileMap.get(df.path);
          if (!existing) {
            added.push(df);
          } else if (existing.contentHash !== df.contentHash) {
            modified.push({ ...df, existingId: existing.id });
          }
        }
        for (const dbf of dbFiles) {
          if (!diskFileMap.has(dbf.path)) {
            deleted.push(dbf);
          }
        }

        console.log(`[Reindex] Delta: +${added.length} added, ~${modified.length} modified, -${deleted.length} deleted`);

        // STEP 5a: Delete removed files (cascades symbols)
        if (deleted.length > 0) {
          await prisma.file.deleteMany({
            where: { id: { in: deleted.map(d => d.id) } }
          });
        }

        // STEP 5b: Parse new & modified files
        const filesToParse = [...added, ...modified].filter(f => f.content && TEXT_EXTENSIONS.includes(f.language));
        let parsedResults = [];
        if (filesToParse.length > 0) {
          const workerBatchSize = 100;
          for (let i = 0; i < filesToParse.length; i += workerBatchSize) {
            const batch = filesToParse.slice(i, i + workerBatchSize);
            const batchResults = await runParserWorker(batch);
            parsedResults.push(...batchResults);
          }
        }
        const parsedMap = new Map(parsedResults.map(p => [normalizePath(p.path), p]));

        // STEP 5c: Upsert modified files
        for (const mod of modified) {
          const parsed = parsedMap.get(mod.path);
          await prisma.symbol.deleteMany({ where: { fileId: mod.existingId } });
          await prisma.file.update({
            where: { id: mod.existingId },
            data: {
              content: mod.content,
              contentHash: mod.contentHash,
              metadata: parsed?.metadata || null,
              language: mod.language
            }
          });
          if (parsed?.metadata) {
            const meta = JSON.parse(parsed.metadata);
            const symbolsToCreate = [
              { name: mod.filename, qualifiedName: `${mod.path}#module`, type: 'module', fileId: mod.existingId, repoId },
              ...meta.functions.map(f => ({ name: f.name, qualifiedName: `${mod.path}#${f.name}`, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: mod.existingId, repoId })),
              ...meta.classes.map(c => ({ name: c.name, qualifiedName: `${mod.path}#${c.name}`, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: mod.existingId, repoId })),
              ...(meta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, qualifiedName: `${mod.path}#${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: mod.existingId, repoId }))
            ];
            if (symbolsToCreate.length > 0) {
              await prisma.symbol.createMany({ data: symbolsToCreate });
            }
          }
        }

        // STEP 5d: Insert added files
        for (const add of added) {
          const parsed = parsedMap.get(add.path);
          const fileRecord = await prisma.file.create({
            data: {
              path: add.path,
              content: add.content,
              contentHash: add.contentHash,
              language: add.language,
              metadata: parsed?.metadata || null,
              repoId
            }
          });
          if (parsed?.metadata) {
            const meta = JSON.parse(parsed.metadata);
            const symbolsToCreate = [
              { name: add.filename, qualifiedName: `${add.path}#module`, type: 'module', fileId: fileRecord.id, repoId },
              ...meta.functions.map(f => ({ name: f.name, qualifiedName: `${add.path}#${f.name}`, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: fileRecord.id, repoId })),
              ...meta.classes.map(c => ({ name: c.name, qualifiedName: `${add.path}#${c.name}`, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: fileRecord.id, repoId })),
              ...(meta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, qualifiedName: `${add.path}#${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: fileRecord.id, repoId }))
            ];
            if (symbolsToCreate.length > 0) {
              await prisma.symbol.createMany({ data: symbolsToCreate });
            }
          }
        }

        // STEP 6: Rebuild call graph (only if there were changes)
        if (added.length > 0 || modified.length > 0 || deleted.length > 0) {
          console.log(`[Reindex] Rebuilding relationships...`);
          await prisma.symbolRelationship.deleteMany({ where: { caller: { repoId } } });

          const allFiles = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
          const allFilesMap = new Map(allFiles.map(f => [normalizePath(f.path), f]));
          const allSymbols = await prisma.symbol.findMany({ where: { repoId } });

          for (const file of allFiles) {
            if (!file.metadata) continue;
            const meta = JSON.parse(file.metadata);
            const normalizedFilePath = normalizePath(file.path);

            // Build alias map
            const aliasMap = new Map();
            const allImports = [...(meta.imports || []), ...(meta.requires || []).map(r => ({ source: r.source, isRelative: r.isRelative, specifiers: [{ local: r.local, imported: r.imported }] }))];
            for (const imp of allImports) {
              if (!imp.isRelative) continue;
              const targetFile = resolveImportPath(imp.source, normalizedFilePath, allFilesMap);
              if (targetFile) {
                for (const spec of (imp.specifiers || [])) {
                  aliasMap.set(spec.local, { imported: spec.imported, targetFile });
                }
              }
            }

            if (meta.calls && meta.calls.length > 0) {
              for (const call of meta.calls) {
                let targetSymbol = null;
                let resolutionMethod = 'unknown';
                let confidence = 0.0;

                targetSymbol = file.symbols.find(s => s.name === call.name && !s.isExternal);
                if (targetSymbol) { resolutionMethod = 'local_scope'; confidence = 1.0; }

                if (!targetSymbol) {
                  const alias = aliasMap.get(call.name);
                  if (alias) {
                    const symbolName = alias.imported === 'default' ? call.name : alias.imported;
                    targetSymbol = alias.targetFile.symbols.find(s => s.name === symbolName || s.name === call.name);
                    if (targetSymbol) { resolutionMethod = 'named_import'; confidence = 1.0; }
                  }
                  if (!targetSymbol && call.objectName) {
                    const moduleAlias = aliasMap.get(call.objectName);
                    if (moduleAlias) {
                      targetSymbol = moduleAlias.targetFile.symbols.find(s => s.name === call.name);
                      if (targetSymbol) { resolutionMethod = 'member_access_import'; confidence = 0.95; }
                    }
                  }
                }

                if (!targetSymbol) {
                  targetSymbol = allSymbols.find(s => s.name === call.name && !s.isExternal);
                  if (targetSymbol) { resolutionMethod = 'global_name_match'; confidence = 0.35; }
                }

                if (targetSymbol) {
                  const callerSymbol = file.symbols.find(s => s.lineStart && s.lineEnd && call.line >= s.lineStart && call.line <= s.lineEnd);
                  if (callerSymbol && callerSymbol.id !== targetSymbol.id) {
                    try {
                      await prisma.symbolRelationship.upsert({
                        where: { callerId_calleeId_relationship: { callerId: callerSymbol.id, calleeId: targetSymbol.id, relationship: 'calls' } },
                        create: { callerId: callerSymbol.id, calleeId: targetSymbol.id, relationship: 'calls', confidence, resolutionMethod },
                        update: { confidence, resolutionMethod }
                      });
                    } catch (e) {}
                  }
                }
              }
            }
          }

          // STEP 7: Re-sync vector embeddings
          console.log(`[Reindex] Re-syncing vector embeddings...`);
          await indexRepo(repoId, allFiles);
        }

        await prisma.repo.update({ where: { id: repoId }, data: { status: 'ready' } });
        console.log(`[Reindex] ✅ Incremental reindex complete in ${Date.now() - reindexStart}ms. Δ +${added.length} ~${modified.length} -${deleted.length}`);
      } catch (err) {
        console.error(`[Reindex] Fatal Error:`, err);
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'error' } }).catch(() => {});
      }
    })();
  } catch (error) {
    console.error('Reindex Error:', error);
    res.status(500).json({ error: 'Reindex failed', details: error.message });
  }
});

// @route   POST /api/repo/:id/reindex/full
// @desc    Force full reindex — drops all intelligence and rebuilds from scratch.
//          Use when parser/schema changes or embeddings are corrupted.
router.post('/:id/reindex/full', async (req, res) => {
  const repoId = req.params.id;
  try {
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });
    if (repo.status !== 'ready' && repo.status !== 'error') {
      return res.status(409).json({ error: `Repo is currently ${repo.status}. Wait for it to finish.` });
    }

    res.json({ message: 'Full reindex started — all intelligence will be rebuilt.', repoId });

    (async () => {
      try {
        console.log(`[Full Reindex] Resetting intelligence for ${repo.name}...`);
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'indexing' } });

        // Drop all symbols and relationships (cascade from files)
        await prisma.file.deleteMany({ where: { repoId } });

        // Drop vector table
        try {
          const lancedb = require("@lancedb/lancedb");
          const DB_PATH = path.join(__dirname, "../data/vectors");
          const db = await lancedb.connect(DB_PATH);
          const tableName = `repo_${repoId.replace(/-/g, '_')}`;
          await db.dropTable(tableName);
        } catch (e) { /* table may not exist */ }

        // Git pull latest
        try {
          const git = simpleGit(repo.localPath);
          await git.pull();
        } catch (e) {
          console.warn(`[Full Reindex] Git pull failed: ${e.message}`);
        }

        // Re-run the full pipeline (Pass 1 through 3) using the same local path
        // We reuse runBackgroundIndex but skip the clone step
        const pass1Start = Date.now();
        const rawFiles = collectFilesFromDisk(repo.localPath);
        console.log(`[Full Reindex] Collected ${rawFiles.length} files from disk.`);

        const parsableFiles = rawFiles.filter(f => f.content && TEXT_EXTENSIONS.includes(f.language));
        const nonParsableFiles = rawFiles.filter(f => !f.content || !TEXT_EXTENSIONS.includes(f.language));

        let parsedResults = [];
        if (parsableFiles.length > 0) {
          const workerBatchSize = 100;
          for (let i = 0; i < parsableFiles.length; i += workerBatchSize) {
            const batch = parsableFiles.slice(i, i + workerBatchSize);
            const batchResults = await runParserWorker(batch);
            parsedResults.push(...batchResults);
          }
        }

        const allParsed = [...parsedResults, ...nonParsableFiles.map(f => ({ ...f, metadata: null }))];
        for (const file of allParsed) {
          const contentHash = file.content ? crypto.createHash('sha256').update(file.content).digest('hex') : null;
          const normalizedPath = normalizePath(file.path);
          const fileRecord = await prisma.file.create({
            data: { path: normalizedPath, content: file.content, contentHash, language: file.language, metadata: file.metadata, repoId }
          });
          if (file.metadata) {
            const parsedMeta = JSON.parse(file.metadata);
            const symbolsToCreate = [
              { name: file.filename, qualifiedName: `${normalizedPath}#module`, type: 'module', fileId: fileRecord.id, repoId },
              ...parsedMeta.functions.map(f => ({ name: f.name, qualifiedName: `${normalizedPath}#${f.name}`, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: fileRecord.id, repoId })),
              ...parsedMeta.classes.map(c => ({ name: c.name, qualifiedName: `${normalizedPath}#${c.name}`, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: fileRecord.id, repoId })),
              ...(parsedMeta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, qualifiedName: `${normalizedPath}#${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: fileRecord.id, repoId }))
            ];
            if (symbolsToCreate.length > 0) await prisma.symbol.createMany({ data: symbolsToCreate });
          }
        }

        // Pass 1b, 2, 2b, 3 reuse same logic — trigger by re-running background index phases
        // Import Graph
        const allFiles = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
        const allFilesMap = new Map(allFiles.map(f => [normalizePath(f.path), f]));
        const externalSymbolCache = new Map();

        for (const file of allFiles) {
          if (!file.metadata) continue;
          const meta = JSON.parse(file.metadata);
          const nfp = normalizePath(file.path);
          if (meta.imports) {
            for (const imp of meta.imports) {
              if (!imp.isRelative) {
                if (!externalSymbolCache.has(imp.source)) {
                  const extSym = await prisma.symbol.create({ data: { name: imp.source, qualifiedName: `external#${imp.source}`, type: 'external_service', isExternal: true, fileId: file.id, repoId } });
                  externalSymbolCache.set(imp.source, extSym);
                }
              }
            }
          }
          if (meta.requires) {
            for (const req of meta.requires) {
              if (!req.isRelative && !externalSymbolCache.has(req.source)) {
                const extSym = await prisma.symbol.create({ data: { name: req.source, qualifiedName: `external#${req.source}`, type: 'external_service', isExternal: true, fileId: file.id, repoId } });
                externalSymbolCache.set(req.source, extSym);
              }
            }
          }
        }

        // Call graph rebuild
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'mapping' } });
        const allSymbols = await prisma.symbol.findMany({ where: { repoId } });
        const allFilesRefresh = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
        const allFilesMapRefresh = new Map(allFilesRefresh.map(f => [normalizePath(f.path), f]));

        for (const file of allFilesRefresh) {
          if (!file.metadata) continue;
          const meta = JSON.parse(file.metadata);
          if (!meta.calls || meta.calls.length === 0) continue;
          const nfp = normalizePath(file.path);
          const aliasMap = new Map();
          const allImports = [...(meta.imports || []), ...(meta.requires || []).map(r => ({ source: r.source, isRelative: r.isRelative, specifiers: [{ local: r.local, imported: r.imported }] }))];
          for (const imp of allImports) {
            if (!imp.isRelative) continue;
            const tf = resolveImportPath(imp.source, nfp, allFilesMapRefresh);
            if (tf) { for (const spec of (imp.specifiers || [])) { aliasMap.set(spec.local, { imported: spec.imported, targetFile: tf }); } }
          }
          for (const call of meta.calls) {
            let ts = null, rm = 'unknown', conf = 0;
            ts = file.symbols.find(s => s.name === call.name && !s.isExternal);
            if (ts) { rm = 'local_scope'; conf = 1.0; }
            if (!ts) {
              const alias = aliasMap.get(call.name);
              if (alias) { const sn = alias.imported === 'default' ? call.name : alias.imported; ts = alias.targetFile.symbols.find(s => s.name === sn || s.name === call.name); if (ts) { rm = 'named_import'; conf = 1.0; } }
              if (!ts && call.objectName) { const ma = aliasMap.get(call.objectName); if (ma) { ts = ma.targetFile.symbols.find(s => s.name === call.name); if (ts) { rm = 'member_access_import'; conf = 0.95; } } }
            }
            if (!ts) { ts = allSymbols.find(s => s.name === call.name && !s.isExternal); if (ts) { rm = 'global_name_match'; conf = 0.35; } }
            if (ts) {
              const cs = file.symbols.find(s => s.lineStart && s.lineEnd && call.line >= s.lineStart && call.line <= s.lineEnd);
              if (cs && cs.id !== ts.id) { try { await prisma.symbolRelationship.upsert({ where: { callerId_calleeId_relationship: { callerId: cs.id, calleeId: ts.id, relationship: 'calls' } }, create: { callerId: cs.id, calleeId: ts.id, relationship: 'calls', confidence: conf, resolutionMethod: rm }, update: { confidence: conf, resolutionMethod: rm } }); } catch (e) {} }
            }
          }
        }

        // Vector sync
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'syncing' } });
        const embedFiles = await prisma.file.findMany({ where: { repoId } });
        await indexRepo(repoId, embedFiles);

        await prisma.repo.update({ where: { id: repoId }, data: { status: 'ready' } });
        console.log(`[Full Reindex] ✅ Complete in ${Date.now() - pass1Start}ms.`);
      } catch (err) {
        console.error(`[Full Reindex] Fatal Error:`, err);
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'error' } }).catch(() => {});
      }
    })();
  } catch (error) {
    console.error('Full Reindex Error:', error);
    res.status(500).json({ error: 'Full reindex failed', details: error.message });
  }
});

// @route   GET /api/repo/:id/stats
// @desc    Repository Intelligence Health Report.
router.get('/:id/stats', async (req, res) => {
  const repoId = req.params.id;

  try {
    const repo = await prisma.repo.findUnique({ where: { id: repoId } });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const symbolCounts = await prisma.symbol.groupBy({
      by: ['type'],
      where: { repoId },
      _count: { _all: true }
    });
    const totalSymbols = symbolCounts.reduce((s, g) => s + g._count._all, 0);
    const symbolsByType = Object.fromEntries(symbolCounts.map(g => [g.type, g._count._all]));

    const totalRelationships = await prisma.symbolRelationship.count({
      where: { caller: { repoId } }
    });

    const resolutionGroups = await prisma.symbolRelationship.groupBy({
      by: ['resolutionMethod'],
      where: { caller: { repoId } },
      _count: { _all: true }
    });
    const resolutionBreakdown = Object.fromEntries(
      resolutionGroups.map(g => [g.resolutionMethod || 'unknown', g._count._all])
    );

    const relationshipGroups = await prisma.symbolRelationship.groupBy({
      by: ['relationship'],
      where: { caller: { repoId } },
      _count: { _all: true }
    });
    const relationshipBreakdown = Object.fromEntries(
      relationshipGroups.map(g => [g.relationship, g._count._all])
    );

    const highConf = await prisma.symbolRelationship.count({
      where: { caller: { repoId }, confidence: { gte: 0.8 } }
    });
    const medConf = await prisma.symbolRelationship.count({
      where: { caller: { repoId }, confidence: { gte: 0.4, lt: 0.8 } }
    });
    const lowConf = await prisma.symbolRelationship.count({
      where: { caller: { repoId }, confidence: { lt: 0.4 } }
    });

    const avgResult = await prisma.symbolRelationship.aggregate({
      where: { caller: { repoId } },
      _avg: { confidence: true }
    });
    const avgConfidence = avgResult._avg.confidence;

    const fileCount = await prisma.file.count({ where: { repoId } });
    const languageGroups = await prisma.file.groupBy({
      by: ['language'],
      where: { repoId, language: { not: null } },
      _count: { _all: true }
    });
    const languageBreakdown = Object.fromEntries(
      languageGroups.map(g => [g.language, g._count._all])
    );

    const routeCount = await prisma.symbol.count({
      where: { repoId, type: 'route' }
    });

    const externalCount = await prisma.symbol.count({
      where: { repoId, isExternal: true }
    });

    const { detectDeterministicDomains } = require('../utils/domainClustering');
    const clusters = await detectDeterministicDomains(repoId);

    const filesWithMeta = await prisma.file.findMany({
      where: { repoId, metadata: { not: null } },
      select: { metadata: true }
    });
    let totalCallSites = 0;
    for (const f of filesWithMeta) {
      try {
        const meta = JSON.parse(f.metadata);
        if (meta.calls) totalCallSites += meta.calls.length;
      } catch {}
    }
    const unresolvedCount = Math.max(0, totalCallSites - (relationshipBreakdown['calls'] || 0));

    const callEdges = relationshipBreakdown['calls'] || 0;
    const resolvedPct = totalCallSites > 0
      ? ((callEdges / totalCallSites) * 100).toFixed(1)
      : '100.0';
    const highConfPct = totalRelationships > 0
      ? ((highConf / totalRelationships) * 100).toFixed(1)
      : '0.0';
    const lowConfPct = totalRelationships > 0
      ? ((lowConf / totalRelationships) * 100).toFixed(1)
      : '0.0';

    res.json({
      repoId,
      repoName: repo.name,
      status: repo.status,
      summary: {
        files: fileCount,
        symbols: totalSymbols,
        relationships: totalRelationships,
        routes: routeCount,
        externalDependencies: externalCount,
        domains: clusters.length,
        callSites: totalCallSites,
        resolvedCallSites: callEdges,
        unresolvedCallSites: unresolvedCount,
        resolvedPercentage: parseFloat(resolvedPct),
      },
      symbolsByType,
      languageBreakdown,
      relationshipBreakdown,
      graphQuality: {
        averageConfidence: avgConfidence ? parseFloat(avgConfidence.toFixed(3)) : null,
        highConfidenceEdges: highConf,
        mediumConfidenceEdges: medConf,
        lowConfidenceEdges: lowConf,
        highConfidencePercentage: parseFloat(highConfPct),
        lowConfidencePercentage: parseFloat(lowConfPct),
        healthGrade: avgConfidence >= 0.85 ? 'A' : avgConfidence >= 0.7 ? 'B' : avgConfidence >= 0.5 ? 'C' : 'D',
        warning: lowConf > 0 ? `${lowConf} edge(s) resolved via global name fallback (confidence ≤ 0.35). These may be inaccurate.` : null,
      },
      resolutionBreakdown,
      domains: clusters.map(c => ({
        name: c.inferredName,
        routeCount: c.routes.length,
        fileCount: c.files.length,
        routes: c.routes.slice(0, 5)
      }))
    });
  } catch (error) {
    console.error('[Stats] Error:', error);
    res.status(500).json({ error: 'Failed to compute repo stats', details: error.message });
  }
});

// @route   GET /api/repo/:id/graph/query
router.get('/:id/graph/query', async (req, res) => {
  const repoId = req.params.id;
  const { type, symbol } = req.query;

  const SUPPORTED_TYPES = ['upstream', 'downstream', 'routes_reaching', 'blast_radius', 'route_dependencies'];

  if (!type || !symbol) {
    return res.status(400).json({
      error: 'Missing required query parameters: type and symbol',
      supportedTypes: SUPPORTED_TYPES
    });
  }

  if (!SUPPORTED_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Unsupported query type: "${type}"`,
      supportedTypes: SUPPORTED_TYPES
    });
  }

  try {
    const GraphQueryService = require('../utils/graphQuery');
    let results = [];
    let description = '';

    if (type === 'upstream') {
      results = await GraphQueryService.whoCalls(repoId, symbol);
      description = `Symbols that directly call "${symbol}"`;
    } else if (type === 'downstream') {
      results = await GraphQueryService.whatDoesCall(repoId, symbol);
      description = `Symbols directly called by "${symbol}"`;
    } else if (type === 'routes_reaching') {
      results = await GraphQueryService.routesReaching(repoId, symbol);
      description = `API routes that eventually execute "${symbol}"`;
    } else if (type === 'blast_radius') {
      results = await GraphQueryService.blastRadius(repoId, symbol);
      description = `All upstream symbols affected if "${symbol}" changes`;
    } else if (type === 'route_dependencies') {
      results = await GraphQueryService.dependenciesTouchedBy(repoId, symbol);
      description = `All downstream dependencies executed by route "${symbol}"`;
    }

    const withConf = results.filter(r => r.confidence !== undefined);
    const avgConfidence = withConf.length > 0
      ? (withConf.reduce((s, r) => s + r.confidence, 0) / withConf.length).toFixed(3)
      : null;

    const highConf = withConf.filter(r => r.confidence >= 0.8).length;
    const lowConf  = withConf.filter(r => r.confidence < 0.4).length;

    res.json({
      query: { type, symbol, repoId },
      description,
      resultCount: results.length,
      confidenceSummary: avgConfidence !== null ? {
        average: parseFloat(avgConfidence),
        highConfidenceEdges: highConf,
        lowConfidenceEdges: lowConf,
        warning: lowConf > 0 ? `${lowConf} result(s) resolved via global fallback (confidence ≤ 0.35). Treat as approximate.` : null
      } : null,
      results: results.map(r => ({
        id: r.id,
        name: r.name,
        qualifiedName: r.qualifiedName || null,
        type: r.type,
        filePath: r.file?.path || null,
        confidence: r.confidence ?? null,
        resolutionMethod: r.resolutionMethod ?? null
      }))
    });
  } catch (error) {
    console.error('[Graph Query API] Error:', error);
    res.status(500).json({ error: 'Graph query failed', details: error.message });
  }
});

// @route   DELETE /api/repo/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const repo = await prisma.repo.findUnique({ where: { id } });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    // 1. Delete local files
    if (fs.existsSync(repo.localPath)) {
      fs.rmSync(repo.localPath, { recursive: true, force: true });
    }

    // 2. Delete Vector Table (LanceDB)
    try {
      const lancedb = require("@lancedb/lancedb");
      const DB_PATH = path.join(__dirname, "../data/vectors");
      const db = await lancedb.connect(DB_PATH);
      const tableName = `repo_${id.replace(/-/g, '_')}`;
      await db.dropTable(tableName);
    } catch (e) {}

    // 3. Delete from SQLite
    await prisma.repo.delete({ where: { id } });

    res.json({ message: 'Repository deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

module.exports = router;
