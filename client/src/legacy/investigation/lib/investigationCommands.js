// client/src/features/investigation/lib/investigationCommands.js
//
// Thin command wrappers over investigationService.
// No business logic — these simply delegate to the service.

import {
  createInvestigation,
  renameInvestigation,
  archiveInvestigation,
  restoreInvestigation,
  deleteInvestigation,
  startInvestigation,
  completeInvestigation,
  cancelInvestigation,
} from './investigationService.js';

export const createInvestigationCommand = (payload) =>
  createInvestigation(payload);

export const renameInvestigationCommand = (id, newTitle) =>
  renameInvestigation(id, newTitle);

export const archiveInvestigationCommand = (id) =>
  archiveInvestigation(id);

export const restoreInvestigationCommand = (id) =>
  restoreInvestigation(id);

export const deleteInvestigationCommand = (id) =>
  deleteInvestigation(id);

export const startInvestigationCommand = (id) =>
  startInvestigation(id);

export const completeInvestigationCommand = (id) =>
  completeInvestigation(id);

export const cancelInvestigationCommand = (id) =>
  cancelInvestigation(id);
