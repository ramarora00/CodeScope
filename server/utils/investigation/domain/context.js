/**
 * InvestigationContext
 * 
 * Event Sourcing pattern: The context is mutated strictly by appending Domain Events.
 * It tracks the state of the investigation for the Execution Engine.
 */

class InvestigationContext {
  constructor(sessionId, repoId) {
    this.sessionId = sessionId;
    this.repoId = repoId;
    this.status = 'idle'; // idle, scanning, indexing, graph, planning, investigating, verifying, summarizing, done
    this.currentFile = null;
    
    // Core data
    this.visitedFiles = []; // { file, reason, confidence }
    this.knowledge = new Map(); // string -> { confidence, source, state }
    this.facts = [];
    this.hypotheses = [];
    
    this.activeHypothesis = null;
    this.events = [];
    this.isCancelled = false;
  }

  // Pure event reducer
  applyEvent(event) {
    this.events.push(event);

    switch (event.type) {
      case 'investigation.started':
        this.status = 'investigating';
        break;
      
      case 'investigation.completed':
        this.status = 'done';
        break;

      case 'investigation.cancelled':
        this.status = 'done';
        this.isCancelled = true;
        break;

      case 'file.selected':
        this.currentFile = event.file;
        if (!this.visitedFiles.find(f => f.file === event.file)) {
          this.visitedFiles.push({ file: event.file, reason: event.reason, confidence: event.confidence });
        }
        break;

      case 'knowledge.added':
        this.knowledge.set(event.knowledge, {
          state: 'added',
          confidence: event.confidence,
          source: event.source
        });
        break;

      case 'knowledge.promoted':
      case 'knowledge.verified':
        if (this.knowledge.has(event.knowledge)) {
          const k = this.knowledge.get(event.knowledge);
          k.state = event.type.split('.')[1];
          k.confidence = event.confidence;
        }
        break;
      
      case 'knowledge.retracted':
        this.knowledge.delete(event.knowledge);
        break;

      case 'evidence.added':
        this.facts.push({ fact: event.fact, source: event.source });
        break;
      
      case 'reasoning.updated':
        // Update active hypothesis if it's a hypothesis
        if (event.visibility === 'summary') {
           this.activeHypothesis = event.thought;
        }
        break;
    }
  }

  getKnowledgeList() {
    return Array.from(this.knowledge.entries()).map(([k, v]) => ({
      knowledge: k,
      ...v
    }));
  }
}

module.exports = {
  InvestigationContext
};
