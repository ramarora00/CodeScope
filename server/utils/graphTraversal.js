const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Perform a deep graph traversal (BFS) to trace execution flow or impact.
 * @param {string} repoId - The repository ID.
 * @param {string} startSymbolId - The ID of the starting symbol.
 * @param {string} direction - "down" (Execution Trace) or "up" (Impact Analysis).
 * @param {number} maxDepth - Maximum depth to traverse.
 * @returns {Promise<Array>} - Array of traced paths (each path is an array of symbols).
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
  const queue = [{ current: startSymbol, path: [startSymbol], depth: 0 }];
  const visited = new Set([startSymbol.id]);

  while (queue.length > 0) {
    const { current, path, depth } = queue.shift();

    if (depth >= maxDepth) {
      paths.push(path);
      continue;
    }

    let neighbors = [];
    if (direction === 'down') {
      // Find what 'current' calls (Execution Flow)
      neighbors = relationships
        .filter(r => r.callerId === current.id)
        .map(r => r.callee);
    } else {
      // Find what calls 'current' (Impact Analysis)
      neighbors = relationships
        .filter(r => r.calleeId === current.id)
        .map(r => r.caller);
    }

    if (neighbors.length === 0) {
      paths.push(path);
    } else {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({
            current: neighbor,
            path: [...path, neighbor],
            depth: depth + 1
          });
        } else {
          // If already visited (cycle detected), just finish this path
          paths.push([...path, neighbor]);
        }
      }
    }
  }

  return paths;
};

module.exports = { traverseGraph };
