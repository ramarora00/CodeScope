// client/src/features/investigation/lib/investigationFactory.js
//
// Pure factory for creating Investigation objects.
// No persistence, no event bus, no state machine.

import { InvestigationState } from '@/shared/lib/investigation';

/**
 * Create a new Investigation object with default values.
 *
 * @param {Object} params
 * @param {string} params.id    - Externally provided unique identifier.
 * @param {string} params.title - Human-readable title for the investigation.
 * @returns {Object} A plain Investigation object in CREATED state.
 */
export function createInvestigation({ id, title }) {
  if (!id) {
    throw new Error('Investigation id is required');
  }
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Investigation title is required');
  }

  const now = Date.now();

  return {
    id,
    title: title.trim(),
    status: InvestigationState.CREATED,
    archived: false,
    previousStatus: null,
    createdAt: now,
    updatedAt: now,
  };
}
