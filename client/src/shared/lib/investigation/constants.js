export const InvestigationState = {
  CREATED: 'Created',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  STALE: 'Stale',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted'
};

export const InvestigationEvent = {
  INVESTIGATION_STARTED: 'InvestigationStarted',
  INVESTIGATION_COMPLETED: 'InvestigationCompleted',
  INVESTIGATION_CANCELLED: 'InvestigationCancelled',
  INVESTIGATION_FAILED: 'InvestigationFailed',
  ARCHIVE_REQUESTED: 'ArchiveRequested',
  FOLLOW_UP_REQUESTED: 'FollowUpRequested',
  STALE_DETECTED: 'StaleDetected',
  RESUME_REQUESTED: 'ResumeRequested',
  RETRY_REQUESTED: 'RetryRequested',
  ACKNOWLEDGE_REQUESTED: 'AcknowledgeRequested',
  REACTIVATION_OCCURRED: 'ReactivationOccurred',
  RESTORE_REQUESTED: 'RestoreRequested',
  DELETE_CONFIRMED: 'DeleteConfirmed'
};
