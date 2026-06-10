const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { traverseGraph } = require('./graphTraversal');

class GraphQueryService {
  /**
   * Find all upstream callers of a specific symbol (Depth 1)
   */
  static async whoCalls(repoId, symbolName) {
    const relationships = await prisma.symbolRelationship.findMany({
      where: {
        callee: { repoId, name: symbolName },
        relationship: 'calls'
      },
      include: {
        caller: { include: { file: true } }
      }
    });
    return relationships.map(r => ({
      ...r.caller,
      confidence: r.confidence,
      resolutionMethod: r.resolutionMethod
    }));
  }

  /**
   * Find all downstream callees of a specific symbol (Depth 1)
   */
  static async whatDoesCall(repoId, symbolName) {
    const relationships = await prisma.symbolRelationship.findMany({
      where: {
        caller: { repoId, name: symbolName },
        relationship: 'calls'
      },
      include: {
        callee: { include: { file: true } }
      }
    });
    return relationships.map(r => ({
      ...r.callee,
      confidence: r.confidence,
      resolutionMethod: r.resolutionMethod
    }));
  }

  /**
   * Find all routes that eventually reach a specific symbol (Deep Upward Trace)
   */
  static async routesReaching(repoId, symbolName) {
    const targetSymbols = await prisma.symbol.findMany({
      where: { repoId, name: symbolName }
    });

    const routeSet = new Map();

    for (const sym of targetSymbols) {
      // traverseGraph(repoId, startSymbolId, direction, maxDepth)
      const paths = await traverseGraph(repoId, sym.id, 'up', 10);
      
      for (const path of paths) {
        const upstreamRoot = path.nodes[path.nodes.length - 1];
        if (upstreamRoot && upstreamRoot.type === 'route') {
          routeSet.set(upstreamRoot.id, upstreamRoot);
        }
      }
    }

    return Array.from(routeSet.values());
  }

  /**
   * Find all DB models or deep dependencies touched by a specific route (Deep Downward Trace)
   */
  static async dependenciesTouchedBy(repoId, routeName) {
    const targetRoutes = await prisma.symbol.findMany({
      where: { repoId, name: routeName, type: 'route' }
    });

    const dependencySet = new Map();

    for (const route of targetRoutes) {
      const paths = await traverseGraph(repoId, route.id, 'down', 10);
      
      for (const path of paths) {
        // Add all downstream nodes (excluding the route itself)
        for (let i = 1; i < path.nodes.length; i++) {
          const dep = path.nodes[i];
          if (!dependencySet.has(dep.id)) {
            dependencySet.set(dep.id, dep);
          }
        }
      }
    }

    return Array.from(dependencySet.values());
  }

  /**
   * Calculate the entire upstream blast radius if a symbol changes
   */
  static async blastRadius(repoId, symbolName) {
    const targetSymbols = await prisma.symbol.findMany({
      where: { repoId, name: symbolName }
    });

    const affectedSet = new Map();

    for (const sym of targetSymbols) {
      const paths = await traverseGraph(repoId, sym.id, 'up', 10);
      
      for (const path of paths) {
        for (let i = 1; i < path.nodes.length; i++) {
          const upstream = path.nodes[i];
          if (!affectedSet.has(upstream.id)) {
            affectedSet.set(upstream.id, upstream);
          }
        }
      }
    }

    return Array.from(affectedSet.values());
  }
}

module.exports = GraphQueryService;
