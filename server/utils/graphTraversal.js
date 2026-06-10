const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Perform a deep graph traversal (BFS) to trace execution flow or impact.
 * @param {string} repoId - The repository ID.
 * @param {string} startSymbolId - The ID of the starting symbol.
 * @param {string} direction - "down" (Execution Trace) or "up" (Impact Analysis).
 * @param {number} maxDepth - Maximum depth to traverse.
 * @returns {Promise<Array>} - Array of traced paths with edge confidence metadata.
 */
const traverseGraph = async (repoId, startSymbolId, direction = 'down', maxDepth = 5) => {
  // Fetch all relationships for the repo in memory for fast traversal
  const relationships = await prisma.symbolRelationship.findMany({
    where: {
      caller: { repoId },
      callee: { repoId }
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
    minConfidence: 1.0
  }];
  const visited = new Set([startSymbol.id]);

  while (queue.length > 0) {
    const { current, path, edges, depth, pathConfidence, minConfidence } = queue.shift();

    if (depth >= maxDepth) {
      paths.push({ nodes: path, edges, pathConfidence, minConfidence });
      continue;
    }

    let relations = [];
    if (direction === 'down') {
      // Find what 'current' calls (Execution Flow)
      relations = relationships.filter(r => r.callerId === current.id);
    } else {
      // Find what calls 'current' (Impact Analysis)
      relations = relationships.filter(r => r.calleeId === current.id);
    }

    if (relations.length === 0) {
      paths.push({ nodes: path, edges, pathConfidence, minConfidence });
    } else {
      for (const rel of relations) {
        const neighbor = direction === 'down' ? rel.callee : rel.caller;
        const edgeMeta = {
          callerId: rel.callerId,
          calleeId: rel.calleeId,
          confidence: rel.confidence ?? 1.0,
          resolutionMethod: rel.resolutionMethod ?? 'unknown'
        };

        const nextPathConfidence = pathConfidence * edgeMeta.confidence;
        const nextMinConfidence = Math.min(minConfidence, edgeMeta.confidence);

        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({
            current: neighbor,
            path: [...path, neighbor],
            edges: [...edges, edgeMeta],
            depth: depth + 1,
            pathConfidence: nextPathConfidence,
            minConfidence: nextMinConfidence
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
