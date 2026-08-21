/**
 * Formal Event Contract
 * 
 * Every backend event must follow this structure:
 * {
 *   protocolVersion: 1,
 *   eventId: string,
 *   sessionId: string,
 *   repoId: string,
 *   type: string,
 *   timestamp: string,
 *   sequence: number,
 *   parentEventId: string | null,
 *   ...payload
 * }
 */

// Core Lifecycle
export const INVESTIGATION_STARTED = 'investigation.started';
export const INVESTIGATION_COMPLETED = 'investigation.completed';
export const INVESTIGATION_CANCELLED = 'investigation.cancelled';

// Planner / Execution
export const FILE_SELECTED = 'file.selected';
export const FILE_READ_STARTED = 'file.read.started';
export const FILE_READ_PROGRESS = 'file.read.progress';
export const FILE_READ_COMPLETED = 'file.read.completed';
export const JUMP_STARTED = 'jump.started';
export const JUMP_COMPLETED = 'jump.completed';
export const RETURN_STARTED = 'return.started';

// Knowledge / Discoveries
export const SYMBOL_DISCOVERED = 'symbol.discovered';
export const EVIDENCE_ADDED = 'evidence.added';
export const KNOWLEDGE_ADDED = 'knowledge.added';
export const KNOWLEDGE_PROMOTED = 'knowledge.promoted';
export const KNOWLEDGE_VERIFIED = 'knowledge.verified';
export const KNOWLEDGE_RETRACTED = 'knowledge.retracted';

// Internal Reasoning
export const REASONING_UPDATED = 'reasoning.updated';
