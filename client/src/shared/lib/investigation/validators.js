import { InvestigationState, InvestigationEvent } from './constants.js';
import { transitions } from './transitions.js';

export function canTransition(currentState, event) {
  if (!currentState || !event) return false;
  const stateTransitions = transitions[currentState];
  if (!stateTransitions) return false;
  return event in stateTransitions;
}

export function isTerminal(state) {
  return state === InvestigationState.DELETED;
}

export function isArchived(state) {
  return state === InvestigationState.ARCHIVED;
}

export function isRestorable(state) {
  return state === InvestigationState.ARCHIVED;
}

export function requiresConfirmation(event) {
  return event === InvestigationEvent.DELETE_CONFIRMED;
}

export function requiresPreviousState(event) {
  return event === InvestigationEvent.RESTORE_REQUESTED;
}
