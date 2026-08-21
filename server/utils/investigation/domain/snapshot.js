/**
 * RepositorySnapshot
 * 
 * Provides a read-only, in-memory representation of the parsed repository.
 * The Planner uses this snapshot to generate the InvestigationPlan.
 * It abstracts away direct Prisma DB calls during the planning phase.
 */

class RepositorySnapshot {
  constructor(repoId) {
    this.repoId = repoId;
    this.files = new Map();
    this.symbols = new Map();
    this.relationships = [];
    this.entryPoints = [];
    this.routes = [];
  }

  // Builder method to populate from Prisma
  static async build(prisma, repoId) {
    const snapshot = new RepositorySnapshot(repoId);

    // Load Files
    const files = await prisma.file.findMany({ where: { repoId } });
    for (const f of files) {
      snapshot.files.set(f.id, f);
    }

    // Load Symbols
    const symbols = await prisma.symbol.findMany({ where: { repoId } });
    for (const s of symbols) {
      snapshot.symbols.set(s.id, s);
      if (s.type === 'route') {
        snapshot.routes.push(s);
      }
    }

    // Load Relationships
    const rels = await prisma.symbolRelationship.findMany({
      where: { caller: { repoId } },
      include: { caller: true, callee: true }
    });
    snapshot.relationships = rels;

    return snapshot;
  }

  // Queries for the planner
  getFilesByRanking() {
    // Basic ranking: files with most incoming dependencies
    const score = new Map();
    for (const rel of this.relationships) {
      if (rel.relationship === 'imports' && rel.callee.fileId) {
         score.set(rel.callee.fileId, (score.get(rel.callee.fileId) || 0) + 1);
      }
    }
    const ranked = Array.from(this.files.values()).sort((a, b) => (score.get(b.id) || 0) - (score.get(a.id) || 0));
    return ranked;
  }
}

module.exports = {
  RepositorySnapshot
};
