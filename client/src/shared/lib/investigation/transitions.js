import { InvestigationState, InvestigationEvent } from './constants';

export const transitions = {
  [InvestigationState.CREATED]: {
    [InvestigationEvent.INVESTIGATION_STARTED]: InvestigationState.ACTIVE,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.ACTIVE]: {
    [InvestigationEvent.INVESTIGATION_COMPLETED]: InvestigationState.COMPLETED,
    [InvestigationEvent.INVESTIGATION_CANCELLED]: InvestigationState.CANCELLED,
    [InvestigationEvent.INVESTIGATION_FAILED]: InvestigationState.FAILED,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.COMPLETED]: {
    [InvestigationEvent.FOLLOW_UP_REQUESTED]: InvestigationState.ACTIVE,
    [InvestigationEvent.STALE_DETECTED]: InvestigationState.STALE,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.CANCELLED]: {
    [InvestigationEvent.RESUME_REQUESTED]: InvestigationState.ACTIVE,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.FAILED]: {
    [InvestigationEvent.RETRY_REQUESTED]: InvestigationState.ACTIVE,
    [InvestigationEvent.ACKNOWLEDGE_REQUESTED]: InvestigationState.COMPLETED,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.STALE]: {
    [InvestigationEvent.REACTIVATION_OCCURRED]: InvestigationState.COMPLETED,
    [InvestigationEvent.ARCHIVE_REQUESTED]: InvestigationState.ARCHIVED
  },
  [InvestigationState.ARCHIVED]: {
    [InvestigationEvent.RESTORE_REQUESTED]: 'DYNAMIC_PREVIOUS_STATE',
    [InvestigationEvent.DELETE_CONFIRMED]: InvestigationState.DELETED
  },
  [InvestigationState.DELETED]: {}
};
