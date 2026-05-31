const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REPOS_DIR = path.join(__dirname, '../../repos');

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

const { parseCode } = require('../utils/parser');
const { indexRepo } = require('../utils/vectorStore');

/**
 * Runs AST parsing in a worker thread to avoid blocking the main event loop.
 * Accepts a batch of raw file objects, returns parsed results.
 */
const runParserWorker = (files) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, '../utils/parseWorker.js'), {
      workerData: { files }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Parser worker exited with code ${code}`));
    });
  });
};

// Helper: Background Indexing
const runBackgroundIndex = async (repoId, repoUrl, repoPath) => {
  try {
    console.log(`[Background] Cloning ${repoUrl}...`);
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'cloning' } });
    await simpleGit().clone(repoUrl, repoPath);
    
    console.log(`[Background] Starting PASS 1: Symbol Extraction for ${repoId}`);
    const pass1Start = Date.now();
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'indexing' } });

    // STEP 1: Collect all raw files from disk (main thread, I/O only)
    const rawFiles = [];
    const textExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'md', 'php'];

    const collectFiles = (dirPath, relativePath = '') => {
      const entries = fs.readdirSync(dirPath);
      for (const entry of entries) {
        if (entry === '.git' || entry === 'node_modules') continue;
        const fullPath = path.join(dirPath, entry);
        const relPath = path.join(relativePath, entry);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          collectFiles(fullPath, relPath);
        } else {
          const language = path.extname(entry).slice(1);
          let content = null;
          if (textExtensions.includes(language)) {
            try {
              content = fs.readFileSync(fullPath, 'utf8');
            } catch (e) {
              console.error(`Error reading ${entry}:`, e.message);
            }
          }
          rawFiles.push({ path: relPath, content, language, filename: entry });
        }
      }
    };

    collectFiles(repoPath);
    console.log(`[Background] Collected ${rawFiles.length} files from disk.`);

    // STEP 2: Parse files in a worker thread (CPU-intensive, off main thread)
    const parsableFiles = rawFiles.filter(f => f.content && textExtensions.includes(f.language));
    const nonParsableFiles = rawFiles.filter(f => !f.content || !textExtensions.includes(f.language));

    let parsedResults = [];
    if (parsableFiles.length > 0) {
      // Split into worker batches of 100 files to avoid memory pressure
      const workerBatchSize = 100;
      for (let i = 0; i < parsableFiles.length; i += workerBatchSize) {
        const batch = parsableFiles.slice(i, i + workerBatchSize);
        const batchResults = await runParserWorker(batch);
        parsedResults.push(...batchResults);
      }
    }

    console.log(`[Background] Worker parsed ${parsedResults.length} files in ${Date.now() - pass1Start}ms.`);

    // STEP 3: Write to database (main thread, I/O)
    const allParsed = [...parsedResults, ...nonParsableFiles.map(f => ({ ...f, metadata: null }))];

    for (const file of allParsed) {
      const contentHash = file.content ? crypto.createHash('sha256').update(file.content).digest('hex') : null;
      const fileRecord = await prisma.file.create({
        data: {
          path: file.path,
          content: file.content,
          contentHash: contentHash,
          language: file.language,
          metadata: file.metadata,
          repoId: repoId
        }
      });

      // Save Symbols from metadata
      if (file.metadata) {
        const parsedMeta = JSON.parse(file.metadata);
        const symbolsToCreate = [
          ...parsedMeta.functions.map(f => ({ name: f.name, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: fileRecord.id, repoId })),
          ...parsedMeta.classes.map(c => ({ name: c.name, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: fileRecord.id, repoId })),
          ...(parsedMeta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: fileRecord.id, repoId }))
        ];
        if (symbolsToCreate.length > 0) {
          await prisma.symbol.createMany({ data: symbolsToCreate });
        }
      }
    }

    console.log(`[Background] PASS 1 complete in ${Date.now() - pass1Start}ms. ${allParsed.length} files indexed.`);
    
    console.log(`[Background] Starting PASS 2: Relationship Mapping (Call Graph) for ${repoId}`);
    const pass2Start = Date.now();
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'mapping' } });
    
    const allFiles = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
    const allSymbols = await prisma.symbol.findMany({ where: { repoId } });

    for (const file of allFiles) {
      if (!file.metadata) continue;
      const meta = JSON.parse(file.metadata);
      if (!meta.calls || meta.calls.length === 0) continue;

      for (const call of meta.calls) {
        let targetSymbol = null;

        // 1. Local Resolution (Function called within the same file)
        targetSymbol = file.symbols.find(s => s.name === call.name);

        // 2. Import-Based Resolution (Cross-file call)
        if (!targetSymbol && meta.imports) {
          for (const imp of meta.imports) {
            const specifier = imp.specifiers?.find(spec => spec.local === call.name);
            if (specifier && imp.source.startsWith('.')) {
              const resolvedPrefix = path.join(path.dirname(file.path), imp.source).replace(/\\/g, '/');
              const importedFile = allFiles.find(f => 
                f.path === resolvedPrefix || 
                f.path.startsWith(resolvedPrefix + '.') ||
                f.path === resolvedPrefix + '/index.js' ||
                f.path === resolvedPrefix + '/index.ts' ||
                f.path === resolvedPrefix + '/index.jsx' ||
                f.path === resolvedPrefix + '/index.tsx'
              );
              
              if (importedFile && importedFile.symbols) {
                targetSymbol = importedFile.symbols.find(s => 
                  s.name === specifier.imported || 
                  (specifier.imported === 'default' && s.name === 'default') || 
                  s.name === call.name
                );
              }
              break;
            }
          }
        }

        // 3. Global Fallback
        if (!targetSymbol) {
          targetSymbol = allSymbols.find(s => s.name === call.name);
        }

        if (targetSymbol) {
          // Find the symbol THAT IS CALLING (contextual lookup)
          const callerSymbol = file.symbols.find(s => call.line >= s.lineStart && call.line <= s.lineEnd);
          
          if (callerSymbol) {
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
                relationship: 'calls'
              },
              update: {}
            });
          }
        }
      }
    }

    console.log(`[Background] PASS 2 (Call Graph) complete in ${Date.now() - pass2Start}ms.`);

    // --- PASS 2b: Route Flow Mapping ---
    console.log(`[Background] Starting PASS 2b: Route Flow Analysis for ${repoId}`);
    const pass2bStart = Date.now();
    
    // Fetch updated lists including route symbols
    const allFilesWithRoutes = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
    const allSymbolsWithRoutes = await prisma.symbol.findMany({ where: { repoId } });
    
    for (const file of allFilesWithRoutes) {
      if (!file.metadata) continue;
      const meta = JSON.parse(file.metadata);
      if (!meta.routes || meta.routes.length === 0) continue;
      
      for (const route of meta.routes) {
        const routeSymbol = file.symbols.find(s => s.name === `${route.method} ${route.path}` && s.type === 'route');
        if (!routeSymbol) continue;
        
        for (const handlerName of route.handlers) {
          let handlerSymbol = file.symbols.find(s => s.name === handlerName);
          
          if (!handlerSymbol && meta.imports) {
            for (const imp of meta.imports) {
              const specifier = imp.specifiers?.find(spec => spec.local === handlerName);
              if (specifier && imp.source.startsWith('.')) {
                const resolvedPrefix = path.join(path.dirname(file.path), imp.source).replace(/\\/g, '/');
                const importedFile = allFilesWithRoutes.find(f => 
                  f.path === resolvedPrefix || 
                  f.path.startsWith(resolvedPrefix + '.') ||
                  f.path === resolvedPrefix + '/index.js' ||
                  f.path === resolvedPrefix + '/index.ts' ||
                  f.path === resolvedPrefix + '/index.jsx' ||
                  f.path === resolvedPrefix + '/index.tsx'
                );
                
                if (importedFile && importedFile.symbols) {
                  handlerSymbol = importedFile.symbols.find(s => 
                    s.name === specifier.imported || 
                    (specifier.imported === 'default' && s.name === 'default') || 
                    s.name === handlerName
                  );
                }
                break;
              }
            }
          }
          
          if (!handlerSymbol) {
            handlerSymbol = allSymbolsWithRoutes.find(s => s.name === handlerName);
          }
          
          if (handlerSymbol) {
            await prisma.symbolRelationship.upsert({
              where: {
                callerId_calleeId_relationship: {
                  callerId: routeSymbol.id,
                  calleeId: handlerSymbol.id,
                  relationship: 'calls'
                }
              },
              create: {
                callerId: routeSymbol.id,
                calleeId: handlerSymbol.id,
                relationship: 'calls'
              },
              update: {}
            });
          }
        }
      }
    }

    console.log(`[Background] PASS 2b (Route Flow) complete in ${Date.now() - pass2bStart}ms.`);

    console.log(`[Background] Starting PASS 3: Vector Embedding Sync...`);
    const pass3Start = Date.now();
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'syncing' } });
    await indexRepo(repoId, allFiles);
    
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'ready' } });
    const totalTime = Date.now() - pass1Start;
    console.log(`[Background] PASS 3 (Embeddings) complete in ${Date.now() - pass3Start}ms.`);
    console.log(`[Background] ✅ Full pipeline complete for ${repoId} in ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s).`);
  } catch (err) {
    console.error(`[Background] Fatal Error indexing ${repoId}:`, err);
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'error' } });
  }
};

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

// @route   GET /api/repo
router.get('/', async (req, res) => {
  const repos = await prisma.repo.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(repos);
});

// @route   GET /api/repo/:id/files
router.get('/:id/files', async (req, res) => {
  const repo = await prisma.repo.findUnique({ where: { id: req.params.id } });
  if (!repo) return res.status(404).json({ error: 'Repo not found' });

  const getFileTree = (dirPath, relativePath = '') => {
    const files = fs.readdirSync(dirPath);
    let tree = [];
    files.forEach((file) => {
      if (file === '.git' || file === 'node_modules') return;
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
      const phpImports = file.content.match(/(?:require|include)(?:_once)?\s*[\('"]([^'"]+)['"]\)?/g) || [];
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
    
    // Fetch all symbols with their files
    const symbols = await prisma.symbol.findMany({
      where: { repoId },
      include: { file: true }
    });
    
    // Fetch all call graph relationships
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
        type: s.type, 
        filePath: s.file.path 
      },
      position: { x: 0, y: 0 }
    }));

    const edges = relationships.map(r => ({
      id: `e-${r.callerId}--${r.calleeId}`,
      source: r.callerId,
      target: r.calleeId,
      animated: r.relationship === 'calls',
      style: { stroke: '#EC4899', strokeWidth: 2 } // Vibrant hot pink for execution tracing
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
    
    // We want to trace UP from every symbol inside this file.
    let allPaths = [];
    for (const sym of targetFile.symbols) {
      const paths = await traverseGraph(repoId, sym.id, 'up', 4);
      allPaths.push(...paths);
    }
    
    // Flatten and deduplicate the list of uniquely affected files and symbols
    const affectedSymbolNames = new Set();
    const affectedFilesSet = new Set();
    
    allPaths.forEach(pathArr => {
      // Path array goes: [modified_symbol, caller_1, caller_2, ...]
      for (let i = 1; i < pathArr.length; i++) {
        const upstreamSym = pathArr[i];
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
      select: { path: true, language: true, symbols: { select: { name: true, type: true } } } 
    });

    const stack = [];
    const paths = files.map(f => f.path);
    if (paths.some(p => p.includes('package.json'))) stack.push('Node.js');
    if (paths.some(p => p.includes('App.jsx'))) stack.push('React');
    if (paths.some(p => p.includes('composer.json'))) stack.push('PHP/Laravel');
    if (paths.some(p => p.includes('requirements.txt'))) stack.push('Python');

    // Prepare data for Domain Detection
    const structuralData = files.map(f => {
      const syms = f.symbols.length > 0 ? ` [Symbols: ${f.symbols.map(s => s.name).join(', ')}]` : '';
      return `${f.path}${syms}`;
    }).join('\n');

    const promptContext = `
      You are an elite Software Architect. Analyze the following repository structure and symbols.
      Your task is to perform "Domain Detection" (Domain Driven Design).
      
      Group the files and symbols into high-level DOMAINS (e.g., AUTH DOMAIN, PAYMENT DOMAIN, DASHBOARD DOMAIN).
      For each domain, briefly list what routes, middleware, services, and models belong to it.
      
      Repository Data:
      ${structuralData.slice(0, 15000)} // Capped to avoid token limits
      
      Output a clean, structured Markdown response detailing the inferred domains and the overall architecture.
    `;

    const { generateResponse } = require('../utils/ai');
    const summary = await generateResponse(promptContext, {});
    
    res.json({ stack, summary });
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
        const textExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'md', 'php'];
        const diskFiles = [];

        const collectFiles = (dirPath, relativePath = '') => {
          const entries = fs.readdirSync(dirPath);
          for (const entry of entries) {
            if (entry === '.git' || entry === 'node_modules') continue;
            const fullPath = path.join(dirPath, entry);
            const relPath = path.join(relativePath, entry);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              collectFiles(fullPath, relPath);
            } else {
              const language = path.extname(entry).slice(1);
              let content = null;
              if (textExtensions.includes(language)) {
                try { content = fs.readFileSync(fullPath, 'utf8'); } catch (e) {}
              }
              const hash = content ? crypto.createHash('sha256').update(content).digest('hex') : null;
              diskFiles.push({ path: relPath, content, language, filename: entry, contentHash: hash });
            }
          }
        };

        collectFiles(repo.localPath);

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
        const filesToParse = [...added, ...modified].filter(f => f.content && textExtensions.includes(f.language));
        let parsedResults = [];
        if (filesToParse.length > 0) {
          const workerBatchSize = 100;
          for (let i = 0; i < filesToParse.length; i += workerBatchSize) {
            const batch = filesToParse.slice(i, i + workerBatchSize);
            const batchResults = await runParserWorker(batch);
            parsedResults.push(...batchResults);
          }
        }
        const parsedMap = new Map(parsedResults.map(p => [p.path, p]));

        // STEP 5c: Upsert modified files
        for (const mod of modified) {
          const parsed = parsedMap.get(mod.path);
          // Delete old symbols for this file
          await prisma.symbol.deleteMany({ where: { fileId: mod.existingId } });
          // Update file record
          await prisma.file.update({
            where: { id: mod.existingId },
            data: {
              content: mod.content,
              contentHash: mod.contentHash,
              metadata: parsed?.metadata || null,
              language: mod.language
            }
          });
          // Re-create symbols
          if (parsed?.metadata) {
            const meta = JSON.parse(parsed.metadata);
            const symbolsToCreate = [
              ...meta.functions.map(f => ({ name: f.name, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: mod.existingId, repoId })),
              ...meta.classes.map(c => ({ name: c.name, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: mod.existingId, repoId })),
              ...(meta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: mod.existingId, repoId }))
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
              ...meta.functions.map(f => ({ name: f.name, type: 'function', lineStart: f.lineStart, lineEnd: f.lineEnd, fileId: fileRecord.id, repoId })),
              ...meta.classes.map(c => ({ name: c.name, type: 'class', lineStart: c.lineStart, lineEnd: c.lineEnd, fileId: fileRecord.id, repoId })),
              ...(meta.routes || []).map(r => ({ name: `${r.method} ${r.path}`, type: 'route', lineStart: r.lineStart, lineEnd: r.lineEnd, fileId: fileRecord.id, repoId }))
            ];
            if (symbolsToCreate.length > 0) {
              await prisma.symbol.createMany({ data: symbolsToCreate });
            }
          }
        }

        // STEP 6: Rebuild call graph (only if there were changes)
        if (added.length > 0 || modified.length > 0 || deleted.length > 0) {
          console.log(`[Reindex] Rebuilding call graph...`);
          // Clear old relationships and rebuild
          await prisma.symbolRelationship.deleteMany({ where: { caller: { repoId } } });

          const allFiles = await prisma.file.findMany({ where: { repoId }, include: { symbols: true } });
          const allSymbols = await prisma.symbol.findMany({ where: { repoId } });

          for (const file of allFiles) {
            if (!file.metadata) continue;
            const meta = JSON.parse(file.metadata);
            if (!meta.calls || meta.calls.length === 0) continue;

            for (const call of meta.calls) {
              let targetSymbol = null;
              targetSymbol = file.symbols.find(s => s.name === call.name);

              if (!targetSymbol && meta.imports) {
                for (const imp of meta.imports) {
                  const specifier = imp.specifiers?.find(spec => spec.local === call.name);
                  if (specifier && imp.source.startsWith('.')) {
                    const resolvedPrefix = path.join(path.dirname(file.path), imp.source).replace(/\\/g, '/');
                    const importedFile = allFiles.find(f =>
                      f.path === resolvedPrefix ||
                      f.path.startsWith(resolvedPrefix + '.') ||
                      f.path === resolvedPrefix + '/index.js' ||
                      f.path === resolvedPrefix + '/index.ts' ||
                      f.path === resolvedPrefix + '/index.jsx' ||
                      f.path === resolvedPrefix + '/index.tsx'
                    );
                    if (importedFile && importedFile.symbols) {
                      targetSymbol = importedFile.symbols.find(s =>
                        s.name === specifier.imported ||
                        (specifier.imported === 'default' && s.name === 'default') ||
                        s.name === call.name
                      );
                    }
                    break;
                  }
                }
              }

              if (!targetSymbol) {
                targetSymbol = allSymbols.find(s => s.name === call.name);
              }

              if (targetSymbol) {
                const callerSymbol = file.symbols.find(s => call.line >= s.lineStart && call.line <= s.lineEnd);
                if (callerSymbol) {
                  await prisma.symbolRelationship.upsert({
                    where: { callerId_calleeId_relationship: { callerId: callerSymbol.id, calleeId: targetSymbol.id, relationship: 'calls' } },
                    create: { callerId: callerSymbol.id, calleeId: targetSymbol.id, relationship: 'calls' },
                    update: {}
                  });
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
        await prisma.repo.update({ where: { id: repoId }, data: { status: 'error' } });
      }
    })();
  } catch (error) {
    console.error('Reindex Error:', error);
    res.status(500).json({ error: 'Reindex failed', details: error.message });
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
    const { searchRepo } = require('../utils/vectorStore'); // Import just to get DB path
    const lancedb = require("@lancedb/lancedb");
    const path = require("path");
    const DB_PATH = path.join(__dirname, "../data/vectors");
    const db = await lancedb.connect(DB_PATH);
    const tableName = `repo_${id.replace(/-/g, '_')}`;
    try { await db.dropTable(tableName); } catch (e) {}

    // 3. Delete from SQLite
    await prisma.repo.delete({ where: { id } });

    res.json({ message: 'Repository deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete repository' });
  }
});

module.exports = router;
