const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REPOS_DIR = path.join(__dirname, '../../repos');

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

const { parseCode } = require('../utils/parser');
const { indexRepo } = require('../utils/vectorStore');

// Helper: Background Indexing
const runBackgroundIndex = async (repoId, repoUrl, repoPath) => {
  try {
    console.log(`[Background] Cloning ${repoUrl}...`);
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'cloning' } });
    await simpleGit().clone(repoUrl, repoPath);
    
    console.log(`[Background] Starting PASS 1: Symbol Extraction for ${repoId}`);
    
    const indexFiles = async (dirPath, relativePath = '') => {
      await prisma.repo.update({ where: { id: repoId }, data: { status: 'indexing' } });
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        if (file === '.git' || file === 'node_modules') continue;
        const fullPath = path.join(dirPath, file);
        const relPath = path.join(relativePath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          await indexFiles(fullPath, relPath);
        } else {
          let content = null;
          let metadata = null;
          let language = path.extname(file).slice(1);
          const textExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'md', 'php'];
          
          if (textExtensions.includes(language)) {
            try {
              content = fs.readFileSync(fullPath, 'utf8');
              const parsed = parseCode(content, file);
              if (parsed) metadata = JSON.stringify(parsed);
            } catch (e) {
              console.error(`Error reading ${file}:`, e.message);
            }
          }

          const fileRecord = await prisma.file.create({
            data: {
              path: relPath,
              content: content,
              language: language,
              metadata: metadata,
              repoId: repoId
            }
          });

          // Save Symbols from metadata
          if (metadata) {
            const parsedMeta = JSON.parse(metadata);
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
      }
    };

    await indexFiles(repoPath);
    
    console.log(`[Background] Starting PASS 2: Relationship Mapping (Call Graph) for ${repoId}`);
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

    // --- PASS 2b: Route Flow Mapping ---
    console.log(`[Background] Starting PASS 2b: Route Flow Analysis for ${repoId}`);
    
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

    console.log(`[Background] Indexing complete. Syncing vector embeddings...`);
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'syncing' } });
    await indexRepo(repoId, allFiles);
    
    await prisma.repo.update({ where: { id: repoId }, data: { status: 'ready' } });
    console.log(`[Background] Knowledge Graph built for ${repoId}.`);
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

// @route   GET /api/repo/:id/impact
router.get('/:id/impact', async (req, res) => {
  const { filePath } = req.query;
  const repoId = req.params.id;
  const targetFile = await prisma.file.findUnique({ where: { repoId_path: { repoId, path: filePath } } });
  if (!targetFile) return res.status(404).json({ error: 'File not found' });
  const allFiles = await prisma.file.findMany({ where: { repoId } });
  const dependants = allFiles.filter(f => {
    if (f.path === filePath) return false;
    if (f.metadata) {
      try { const meta = JSON.parse(f.metadata); if (meta.imports && meta.imports.some(imp => filePath.includes(imp.source.replace(/^\.\//, '')))) return true; } catch (e) {}
    }
    if (f.content && f.language === 'php') {
      const targetBase = filePath.split(/[\\/]/).pop();
      const phpImportRegex = /(?:require|include)(?:_once)?\s*[\('"]([^'"]+)['"]\)?/g;
      let match; while ((match = phpImportRegex.exec(f.content)) !== null) { if (match[1] && match[1].includes(targetBase.replace(/\.[^.]+$/, ''))) return true; }
    }
    return false;
  });
  const { generateResponse } = require('../utils/ai');
  const analysis = await generateResponse(`Perform an Impact Analysis for: "${filePath}". Dependants: ${dependants.map(d => d.path).join(', ')}`, { fileName: filePath, content: targetFile.content });
  res.json({ dependants: dependants.map(d => d.path), analysis });
});

// @route   GET /api/repo/:id/architecture
router.get('/:id/architecture', async (req, res) => {
  const files = await prisma.file.findMany({ where: { repoId: req.params.id }, select: { path: true, language: true } });
  const stack = [];
  const paths = files.map(f => f.path);
  if (paths.some(p => p.includes('package.json'))) stack.push('Node.js');
  if (paths.some(p => p.includes('App.jsx'))) stack.push('React');
  const folders = {};
  files.forEach(f => { const root = f.path.split(/[\\/]/)[0]; folders[root] = (folders[root] || 0) + 1; });
  const { generateResponse } = require('../utils/ai');
  const summary = await generateResponse(`Analyze architecture: Stack: ${stack.join(', ')}, Folders: ${JSON.stringify(folders)}`, {});
  res.json({ stack, folders, summary });
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
