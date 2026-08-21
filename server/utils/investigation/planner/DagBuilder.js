/**
 * Stage C: Investigation DAG
 * 
 * Takes the scored files and the repository relationships,
 * and builds a directed acyclic graph (DAG) representing
 * the logical paths the investigation could take.
 */

class DagBuilder {
  /**
   * @param {RepositorySnapshot} snapshot 
   * @param {Map<string, Object>} scores 
   * @param {Object} budget 
   */
  static buildDag(snapshot, scores, budget) {
    const dag = {
      nodes: new Map(), // fileId -> { file, score, reasons, children: [] }
      root: null
    };

    // Sort files by score
    const rankedFiles = Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, budget.maxFiles || 15);

    if (rankedFiles.length === 0) return dag;

    // P1.1: Ensure structured investigation is possible.
    // If the best file has no meaningful score, return an empty DAG
    // so PlanGenerator can trigger the Layer 5 unstructured fallback.
    const STRUCTURED_ROOT_THRESHOLD = 0;
    const rootScore = rankedFiles[0];
    if (rootScore.score <= STRUCTURED_ROOT_THRESHOLD) {
      return dag;
    }

    // The highest scored file is the root entry point
    dag.root = {
      id: rootScore.file.id,
      file: rootScore.file,
      score: rootScore.score,
      reasons: rootScore.reasons,
      children: []
    };
    dag.nodes.set(rootScore.file.id, dag.root);

    // Build branches based on call relationships and imports
    // (A simplistic DAG for now: connect highly scored files to the root if they are related)
    for (let i = 1; i < rankedFiles.length; i++) {
      const current = rankedFiles[i];
      const node = {
        id: current.file.id,
        file: current.file,
        score: current.score,
        reasons: current.reasons,
        children: []
      };
      dag.nodes.set(node.id, node);

      // Find if this file is called by/imported by any existing node in the DAG
      let connected = false;
      for (const rel of snapshot.relationships) {
        // If current file is the callee, and the caller is in our DAG
        if (rel.callee.fileId === node.id && rel.caller.fileId && dag.nodes.has(rel.caller.fileId)) {
           const parentNode = dag.nodes.get(rel.caller.fileId);
           parentNode.children.push({
             node: node,
             reason: `Symbol referenced: ${rel.callee.name}`
           });
           connected = true;
           break; // Just connect to the first found parent for tree simplicity
        }
      }

      // If no direct graph edge is found, attach it to root as a separate branch (fallback)
      if (!connected && dag.root.id !== node.id) {
        dag.root.children.push({
          node: node,
          reason: `High relevance score (${node.score})`
        });
      }
    }

    return dag;
  }
}

module.exports = {
  DagBuilder
};
