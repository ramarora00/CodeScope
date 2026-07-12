// client/src/features/investigation/lib/investigationService.js
//
// Application service that orchestrates:
//   1. Validation
//   2. State Machine transitions
//   3. Persistence
//   4. Event emission
//
// Persistence never emits.
// State Machine never persists.
// This service coordinates both.

import {
  InvestigationState,
  InvestigationEvent,
  transition,
} from '@/shared/lib/investigation';

import { persistenceAdapter } from '@/shared/lib/persistence';

import {
  emit,
  INVESTIGATION_CREATED,
  INVESTIGATION_STARTED,
  INVESTIGATION_COMPLETED,
  INVESTIGATION_CANCELLED,
  INVESTIGATION_ARCHIVED,
  INVESTIGATION_RESTORED,
  INVESTIGATION_DELETED,
  INVESTIGATION_RENAMED,
} from '@/shared/lib/events';

import { createInvestigation as buildInvestigation } from './investigationFactory.js';

// ---------------------------------------------------------------------------
// Private helper — shared transition workflow
// ---------------------------------------------------------------------------

/**
 * Load → Validate → Transition → Persist → Emit.
 *
 * @param {string}  id         - Investigation id.
 * @param {string}  event      - InvestigationEvent constant.
 * @param {string}  emitType   - Event bus event name to emit on success.
 * @returns {Object} The updated investigation.
 */
function applyTransition(id, event, emitType) {
  const inv = persistenceAdapter.loadInvestigation(id);
  if (!inv) {
    throw new Error(`Investigation not found: ${id}`);
  }

  const result = transition(inv.status, event, inv.previousStatus);

  if (!result.valid) {
    throw new Error(result.reason);
  }

  const updated = {
    ...inv,
    previousStatus: inv.status,
    status: result.nextState,
    archived: result.nextState === InvestigationState.ARCHIVED,
    updatedAt: Date.now(),
  };

  persistenceAdapter.saveInvestigation(updated);
  emit(emitType, updated);

  return updated;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new investigation and persist it.
 *
 * @param {Object} params
 * @param {string} params.id    - Unique identifier (caller-provided).
 * @param {string} params.title - Human-readable title.
 * @returns {Object} The created investigation.
 */
export function createInvestigation({ id, title }) {
  const inv = buildInvestigation({ id, title });
  persistenceAdapter.saveInvestigation(inv);
  emit(INVESTIGATION_CREATED, inv);
  return inv;
}

/**
 * Rename an existing investigation.
 *
 * @param {string} id       - Investigation id.
 * @param {string} newTitle - New title string.
 * @returns {Object} The updated investigation.
 */
export function renameInvestigation(id, newTitle) {
  if (!newTitle || typeof newTitle !== 'string' || newTitle.trim().length === 0) {
    throw new Error('New title is required');
  }

  const inv = persistenceAdapter.loadInvestigation(id);
  if (!inv) {
    throw new Error(`Investigation not found: ${id}`);
  }

  const updated = {
    ...inv,
    title: newTitle.trim(),
    updatedAt: Date.now(),
  };

  persistenceAdapter.saveInvestigation(updated);
  emit(INVESTIGATION_RENAMED, updated);

  return updated;
}

/**
 * Archive an investigation.
 * Delegates to the state machine via ARCHIVE_REQUESTED event.
 */
export function archiveInvestigation(id) {
  return applyTransition(id, InvestigationEvent.ARCHIVE_REQUESTED, INVESTIGATION_ARCHIVED);
}

/**
 * Restore an archived investigation to its previous state.
 * Delegates to the state machine via RESTORE_REQUESTED event.
 */
export function restoreInvestigation(id) {
  return applyTransition(id, InvestigationEvent.RESTORE_REQUESTED, INVESTIGATION_RESTORED);
}

/**
 * Delete an investigation (terminal state).
 * Delegates to the state machine via DELETE_CONFIRMED event.
 */
export function deleteInvestigation(id) {
  const inv = persistenceAdapter.loadInvestigation(id);
  if (!inv) {
    throw new Error(`Investigation not found: ${id}`);
  }

  const result = transition(inv.status, InvestigationEvent.DELETE_CONFIRMED, inv.previousStatus);

  if (!result.valid) {
    throw new Error(result.reason);
  }

  persistenceAdapter.deleteInvestigation(id);
  emit(INVESTIGATION_DELETED, { id });

  return { id, deleted: true };
}

/**
 * Start an investigation (CREATED → ACTIVE).
 * Delegates to the state machine via INVESTIGATION_STARTED event.
 */
export function startInvestigation(id) {
  return applyTransition(id, InvestigationEvent.INVESTIGATION_STARTED, INVESTIGATION_STARTED);
}

/**
 * Complete an investigation (ACTIVE → COMPLETED).
 * Delegates to the state machine via INVESTIGATION_COMPLETED event.
 */
export function completeInvestigation(id) {
  return applyTransition(id, InvestigationEvent.INVESTIGATION_COMPLETED, INVESTIGATION_COMPLETED);
}

/**
 * Cancel an investigation (ACTIVE → CANCELLED).
 * Delegates to the state machine via INVESTIGATION_CANCELLED event.
 */
export function cancelInvestigation(id) {
  return applyTransition(id, InvestigationEvent.INVESTIGATION_CANCELLED, INVESTIGATION_CANCELLED);
}

/**
 * Load all investigations.
 * Delegates to persistence adapter.
 */
export function loadAll() {
  return persistenceAdapter.loadAllInvestigations();
}
