/**
 * InvestigationResult
 * 
 * Formal result object emitted at the completion of an investigation.
 */

class InvestigationResult {
  constructor(context, elapsedTimeMs) {
    this.summary = context.activeHypothesis || "Investigation completed.";
    this.findings = context.facts;
    this.knowledge = context.getKnowledgeList();
    this.evidence = []; // Extract from facts/knowledge
    this.filesVisited = context.visitedFiles.map(f => f.file);
    
    // Average confidence across visited files and knowledge
    let totalConf = 0, count = 0;
    context.visitedFiles.forEach(f => { totalConf += f.confidence || 0.5; count++; });
    context.getKnowledgeList().forEach(k => { totalConf += k.confidence || 0.5; count++; });
    
    this.confidence = count > 0 ? (totalConf / count).toFixed(2) : 1.0;
    this.elapsedTimeMs = elapsedTimeMs;
    this.graphStats = {
      totalEvents: context.events.length,
      jumps: context.visitedFiles.length
    };
  }
}

module.exports = {
  InvestigationResult
};
