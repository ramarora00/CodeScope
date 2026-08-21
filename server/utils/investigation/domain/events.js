/**
 * Immutable Domain Events for CodeScope Investigation Engine
 * 
 * Pattern: Event Sourcing
 * Every state change in the investigation must be represented as an immutable event.
 */

const crypto = require('crypto');

function createBaseEvent(sessionId, repoId, type, sequence, parentEventId) {
  const eventId = crypto.randomUUID();
  return {
    protocolVersion: 1,
    eventId,
    sessionId,
    repoId,
    type,
    timestamp: new Date().toISOString(),
    sequence,
    parentEventId,
  };
}

class EventFactory {
  constructor(sessionId, repoId) {
    this.sessionId = sessionId;
    this.repoId = repoId;
    this.sequence = 1;
    this.lastEventId = null;
  }

  _base(type) {
    const event = createBaseEvent(this.sessionId, this.repoId, type, this.sequence++, this.lastEventId);
    this.lastEventId = event.eventId;
    return event;
  }

  // --- Core Lifecycle ---
  stateTransition(newState, metadata = {}) {
    return { ...this._base('state.transition'), state: newState, metadata };
  }

  investigationStarted(budget) {
    return { ...this._base('investigation.started'), budget };
  }
  
  investigationCompleted(result) {
    return { ...this._base('investigation.completed'), result };
  }

  investigationCancelled(reason) {
    return { ...this._base('investigation.cancelled'), reason };
  }

  // --- Planner Events ---
  plannerStarted(mission) {
    return { ...this._base('planner.started'), mission };
  }

  plannerCompleted(plan, metadata) {
    return { ...this._base('planner.completed'), plan, metadata };
  }

  plannerFailed(reason) {
    return { ...this._base('planner.failed'), reason };
  }

  // --- Execution ---
  fileSelected(filePath, reason, confidence, isAsset = false) {
    return { ...this._base('file.selected'), file: filePath, reason, confidence, isAsset };
  }

  fileReadStarted(filePath, reason, startLine, endLine) {
    return { ...this._base('file.read.started'), file: filePath, reason, startLine, endLine };
  }

  fileReadProgress(filePath, currentLine, totalLines, symbolFocus) {
    return { ...this._base('file.read.progress'), file: filePath, line: currentLine, totalLines, symbol: symbolFocus };
  }

  fileReadCompleted(filePath, elapsedTimeMs) {
    return { ...this._base('file.read.completed'), file: filePath, elapsedTimeMs };
  }

  jumpStarted(fromPath, toPath, reason, reasonType, symbol) {
    return { ...this._base('jump.started'), from: fromPath, to: toPath, reason, reasonType, symbol };
  }

  jumpCompleted(toPath) {
    return { ...this._base('jump.completed'), file: toPath };
  }

  returnStarted(fromPath, toPath, reason) {
    return { ...this._base('return.started'), from: fromPath, to: toPath, reason };
  }

  // --- Knowledge / Discoveries ---
  symbolDiscovered(symbolName, type, confidence, source) {
    return { ...this._base('symbol.discovered'), symbol: symbolName, symbolType: type, confidence, source };
  }

  evidenceAdded(fact, source) {
    return { ...this._base('evidence.added'), fact, source };
  }

  knowledgeAdded(knowledgeStr, confidence, source, reason, reasonType) {
    return { ...this._base('knowledge.added'), knowledge: knowledgeStr, confidence, source, reason, reasonType };
  }

  knowledgePromoted(knowledgeStr, newConfidence, source) {
    return { ...this._base('knowledge.promoted'), knowledge: knowledgeStr, confidence: newConfidence, source };
  }

  knowledgeVerified(knowledgeStr, source) {
    return { ...this._base('knowledge.verified'), knowledge: knowledgeStr, confidence: 1.0, source };
  }

  knowledgeRetracted(knowledgeStr, reason) {
    return { ...this._base('knowledge.retracted'), knowledge: knowledgeStr, confidence: 0.0, reason };
  }

  // --- Internal Reasoning ---
  reasoningUpdated(thought, visibility = 'internal') {
    return { ...this._base('reasoning.updated'), thought, visibility };
  }
}

module.exports = {
  EventFactory
};
