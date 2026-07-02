const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Perform a deep graph traversal (BFS) to trace execution flow or impact.
 * Uses token-budget aware expansion instead of fixed depth.
 *
 * @param {string} repoId - The repository ID.
 * @param {string} startSymbolId - The ID of the starting symbol.
 * @param {string} direction - "down" (Execution Trace) or "up" (Impact Analysis).
 * @param {number} maxDepth - Hard maximum depth to traverse (safety limit).
 * @param {object} options - Additional traversal options.
 * @param {number} options.tokenBudget - Approximate token budget for assembled context (default 4000).
 * @param {number} options.minConfidence - Stop expanding when edge confidence drops below this (default 0.3).
 * @returns {Promise<Array>} - Array of traced paths with edge confidence metadata.
 */
const traverseGraph = async (repoId, startSymbolId, direction = 'down', maxDepth = 10, options = {}) => {
  const { tokenBudget = 4000, minConfidence = 0.3 } = options;

  // Fetch all relationships for the repo in memory for fast traversal
  const relationships = await prisma.symbolRelationship.findMany({
    where: {
      caller: { repoId },
      callee: { repoId },
      relationship: 'calls' // Only traverse call edges, not imports/exports
    },
    include: {
      caller: { include: { file: true } },
      callee: { include: { file: true } }
    }
  });

  const startSymbol = await prisma.symbol.findUnique({
    where: { id: startSymbolId },
    include: { file: true }
  });

  if (!startSymbol) return [];

  const paths = [];
  const queue = [{
    current: startSymbol,
    path: [startSymbol],
    edges: [],
    depth: 0,
    pathConfidence: 1.0,
    minEdgeConfidence: 1.0
  }];
  const visited = new Set([startSymbol.id]);

  // Track approximate token usage across all paths
  let estimatedTokens = 0;
  const estimateSymbolTokens = (sym) => {
    // Rough estimate: symbol name + type + file path ≈ 20-40 tokens
    return (sym.name?.length || 0) / 4 + 10;
  };

  estimatedTokens += estimateSymbolTokens(startSymbol);

  while (queue.length > 0) {
    const { current, path, edges, depth, pathConfidence, minEdgeConfidence } = queue.shift();

    // Stop conditions:
    // 1. Hard depth limit reached
    // 2. Token budget exhausted
    // 3. Confidence degraded below threshold
    if (depth >= maxDepth || estimatedTokens >= tokenBudget || minEdgeConfidence < minConfidence) {
      paths.push({ nodes: path, edges, pathConfidence, minConfidence: minEdgeConfidence });
      continue;
    }

    let relations = [];
    if (direction === 'down') {
      // Find what 'current' calls (Execution Flow)
      // Sort by executionOrder if available (preserves middleware chain sequence)
      relations = relationships
        .filter(r => r.callerId === current.id)
        .sort((a, b) => (a.executionOrder ?? 999) - (b.executionOrder ?? 999));
    } else {
      // Find what calls 'current' (Impact Analysis)
      relations = relationships.filter(r => r.calleeId === current.id);
    }

    if (relations.length === 0) {
      paths.push({ nodes: path, edges, pathConfidence, minConfidence: minEdgeConfidence });
    } else {
      for (const rel of relations) {
        const neighbor = direction === 'down' ? rel.callee : rel.caller;
        const edgeConf = rel.confidence ?? 1.0;
        const edgeMeta = {
          callerId: rel.callerId,
          calleeId: rel.calleeId,
          confidence: edgeConf,
          resolutionMethod: rel.resolutionMethod ?? 'unknown',
          executionOrder: rel.executionOrder
        };

        const nextPathConfidence = pathConfidence * edgeConf;
        const nextMinConfidence = Math.min(minEdgeConfidence, edgeConf);
        const neighborTokenCost = estimateSymbolTokens(neighbor);

        if (!visited.has(neighbor.id)) {
          // Check if adding this neighbor would bust the token budget
          if (estimatedTokens + neighborTokenCost > tokenBudget) {
            paths.push({
              nodes: [...path, neighbor],
              edges: [...edges, edgeMeta],
              pathConfidence: nextPathConfidence,
              minConfidence: nextMinConfidence
            });
            continue;
          }

          visited.add(neighbor.id);
          estimatedTokens += neighborTokenCost;

          queue.push({
            current: neighbor,
            path: [...path, neighbor],
            edges: [...edges, edgeMeta],
            depth: depth + 1,
            pathConfidence: nextPathConfidence,
            minEdgeConfidence: nextMinConfidence
          });
        } else {
          // Cycle detected, record and finish this path branch
          paths.push({
            nodes: [...path, neighbor],
            edges: [...edges, edgeMeta],
            pathConfidence: nextPathConfidence,
            minConfidence: nextMinConfidence
          });
        }
      }
    }
  }

  return paths;
};

module.exports = { traverseGraph };
