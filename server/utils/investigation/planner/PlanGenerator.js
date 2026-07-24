/**
 * Stage D: Investigation Plan
 *
 * Flattens the DAG into a sequential execution plan.
 * Understands how to "Jump" down a branch and "Return" up the tree naturally.
 *
 * Layer 5 Guarantee (ADR-004):
 * When the DAG is empty, falls back to the 5 largest files in the snapshot.
 * ExecutionEngine must never receive an empty plan.
 */

class PlanGenerator {
  /**
   * @param {Object} dag
   * @param {Object} budget
   * @param {RepositorySnapshot|null} snapshot  — used for Layer 5 fallback
   * @returns {Array} List of plan steps
   */
  static generate(dag, budget, snapshot = null) {
    const plan = [];

    if (dag.root) {
      let jumpsCount = 0;
      const maxJumps = budget.maxJumps || 25;
      const maxDepth = budget.maxDepth || 4;

      const traverse = (node, depth, parentReason = null) => {
        if (jumpsCount >= maxJumps) return;
        if (depth > maxDepth) return;

        jumpsCount++;

        if (depth === 0) {
          plan.push({
            action: 'read',
            file: node.file,
            reason: node.reasons.join(', '),
            confidence: 0.95
          });
        } else {
          plan.push({
            action: 'jump',
            file: node.file,
            reason: parentReason,
            confidence: 0.85
          });
        }

        for (const childEdge of node.children) {
          traverse(childEdge.node, depth + 1, childEdge.reason);
          if (jumpsCount < maxJumps) {
            plan.push({
              action: 'return',
              file: node.file,
              reason: `Return to continue investigating ${node.file.path}`,
              confidence: 0.90
            });
          }
        }
      };

      traverse(dag.root, 0);
    }

    // Layer 5 Fallback — ADR-004
    // If the DAG produced zero steps (no root, or empty snapshot),
    // take the 5 largest files by content length and generate read steps.
    // This guarantees a non-empty plan for every repository.
    if (plan.length === 0 && snapshot) {
      const files = Array.from(snapshot.files.values());
      const largest = files
        .filter(f => f.content) // only files with stored content
        .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0))
        .slice(0, 5);

      for (const file of largest) {
        plan.push({
          action: 'read',
          file,
          reason: 'Layer 5 fallback — no structured data available, reading by content size',
          confidence: 0.15,
          fallbackLevel: 5
        });
      }

      if (plan.length > 0) {
        console.log(`[PlanGenerator] Layer 5 fallback activated — ${plan.length} files selected by content size.`);
      }
    }

    return plan;
  }
}

module.exports = {
  PlanGenerator
};
