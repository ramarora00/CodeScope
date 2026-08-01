/**
 * Lightweight append-only event log for the investigation.
 * Allows future replay capability, export, and time-travel debugging.
 */
class InvestigationRecorder {
  constructor() {
    this.eventLog = [];
  }

  append(event) {
    this.eventLog.push(event);
    
    // In the future, this could dump to IndexedDB or localStorage.
    // For now, in-memory array is sufficient.
  }

  getLog() {
    return [...this.eventLog];
  }

  clear() {
    this.eventLog = [];
  }
}

export const investigationRecorder = new InvestigationRecorder();
