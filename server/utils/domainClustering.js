const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { traverseGraph } = require('./graphTraversal');
const path = require('path');

/**
 * Cluster repo symbols and files deterministically using call-graph connectivity and folder groupings.
 */
const detectDeterministicDomains = async (repoId) => {
  // 1. Fetch all routes and symbols in the repo
  const routes = await prisma.symbol.findMany({
    where: { repoId, type: 'route' },
    include: { file: true }
  });

  const allSymbols = await prisma.symbol.findMany({
    where: { repoId },
    include: { file: true }
  });

  const clusters = [];
  const visitedSymbolIds = new Set();

  // 2. Perform graph-based clustering starting from API routes
  for (const route of routes) {
    const paths = await traverseGraph(repoId, route.id, 'down', 6);
    const clusterSymbols = new Set([route]);
    const clusterFiles = new Set([route.file.path]);

    for (const p of paths) {
      for (const node of p.nodes) {
        clusterSymbols.add(node);
        visitedSymbolIds.add(node.id);
        if (node.file) {
          clusterFiles.add(node.file.path);
        }
      }
    }

    // Try to guess a domain name based on the route path (e.g. /api/auth/login -> Auth)
    let domainGuess = 'General';
    const cleanPath = route.name.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '');
    const parts = cleanPath.split('/').filter(p => p && p !== 'api' && p !== 'v1' && p !== 'v2');
    if (parts.length > 0) {
      domainGuess = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    clusters.push({
      inferredName: domainGuess,
      routes: [route.name],
      files: Array.from(clusterFiles),
      symbols: Array.from(clusterSymbols).map(s => `${s.name} (${s.type})`)
    });
  }

  // 3. Group/merge route clusters that share high overlap in files (> 40% overlap)
  const mergedClusters = [];
  for (const cluster of clusters) {
    let merged = false;
    for (const target of mergedClusters) {
      const intersection = cluster.files.filter(f => target.files.includes(f));
      const overlapRatio = intersection.length / Math.min(cluster.files.length, target.files.length || 1);

      if (overlapRatio > 0.4 || cluster.inferredName.toLowerCase() === target.inferredName.toLowerCase()) {
        target.routes = Array.from(new Set([...target.routes, ...cluster.routes]));
        target.files = Array.from(new Set([...target.files, ...cluster.files]));
        target.symbols = Array.from(new Set([...target.symbols, ...cluster.symbols]));
        if (target.inferredName === 'General' && cluster.inferredName !== 'General') {
          target.inferredName = cluster.inferredName;
        }
        merged = true;
        break;
      }
    }
    if (!merged) {
      mergedClusters.push(cluster);
    }
  }

  // 4. Standalone/Orphan clustering by directory (for code not reached by routes)
  const unvisitedSymbols = allSymbols.filter(s => !visitedSymbolIds.has(s.id));
  const folderClusters = new Map();

  for (const sym of unvisitedSymbols) {
    const dir = path.dirname(sym.file.path).replace(/\\/g, '/');
    const folderKey = dir === '.' ? 'Root' : dir;

    if (!folderClusters.has(folderKey)) {
      folderClusters.set(folderKey, {
        inferredName: folderKey.split('/').pop().toUpperCase() + ' (Module)',
        routes: [],
        files: new Set(),
        symbols: new Set()
      });
    }

    const current = folderClusters.get(folderKey);
    current.files.add(sym.file.path);
    current.symbols.add(`${sym.name} (${sym.type})`);
  }

  for (const [key, cluster] of folderClusters.entries()) {
    mergedClusters.push({
      inferredName: cluster.inferredName,
      routes: [],
      files: Array.from(cluster.files),
      symbols: Array.from(cluster.symbols)
    });
  }

  return mergedClusters;
};

module.exports = { detectDeterministicDomains };
