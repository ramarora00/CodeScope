import { InvestigationState, InvestigationEvent } from './constants.js';
import { transitions } from './transitions.js';
import { canTransition, requiresPreviousState, isTerminal } from './validators.js';

export function transition(currentState, event, previousState = null) {
  if (isTerminal(currentState)) {
    return {
      valid: false,
      nextState: currentState,
      reason: 'Cannot transition from a terminal state (Deleted).'
    };
  }

  if (!canTransition(currentState, event)) {
    return {
      valid: false,
      nextState: currentState,
      reason: `Event '${event}' is not valid from state '${currentState}'.`
    };
  }

  if (requiresPreviousState(event)) {
    if (!previousState) {
      return {
        valid: false,
        nextState: currentState,
        reason: `Event '${event}' requires a valid previous state to restore to.`
      };
    }
    return {
      valid: true,
      nextState: previousState,
      reason: null
    };
  }

  const nextState = transitions[currentState][event];

  return {
    valid: true,
    nextState,
    reason: null
  };
}
