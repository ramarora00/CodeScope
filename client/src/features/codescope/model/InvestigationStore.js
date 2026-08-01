/**
 * InvestigationStore
 * 
 * Anti-Corruption Layer (ACL) between the backend Domain Events and
 * the frozen UI event schema. The UI never sees backend event names
 * or payload structures — only normalized UI events.
 *
 * Backend domain event -> normalize -> UI ClaudeRuntime-compatible event
 */

export class InvestigationStore {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _emit(uiEvent) {
    this.listeners.forEach(l => l(uiEvent));
  }

  /**
   * Normalize a backend Domain Event into a UI event.
   * If the domain event doesn't map to a UI event, it is silently ignored.
   *
   * @param {Object} domainEvent
   */
  apply(domainEvent) {
    switch (domainEvent.type) {
      // ── Investigation lifecycle -> Timeline entries ──
      case 'investigation.started':
        this._emit({
          type: 'timeline',
          id: 'investigation',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          label: 'Investigation started',
          sublabel: `Budget: ${domainEvent.budget?.maxFiles ?? '?'} files`,
          status: 'active',
        });
        break;

      // ── File selected by planner -> appear (AI opens a new file) ──
      case 'file.selected':
        this._emit({
          type: 'appear',
          file: domainEvent.file,
          reason: domainEvent.reason,
        });
        this._emit({
          type: 'timeline',
          id: `file-${domainEvent.file}`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          label: `Reading ${domainEvent.file.split('/').pop()}`,
          sublabel: domainEvent.reason,
          status: 'active',
        });
        break;

      // ── File read progress -> read (Observation scan head moves) ──
      case 'file.read.progress':
        this._emit({
          type: 'read',
          file: domainEvent.file,
          line: domainEvent.line,
          duration: 120, // normalized pacing for the UI animator
          text: domainEvent.symbol ? `// scanning… ${domainEvent.symbol}` : '',
        });
        break;

      // ── Jump started -> jump ──
      case 'jump.started':
        this._emit({
          type: 'jump',
          file: domainEvent.to,
          reason: domainEvent.reason,
        });
        break;

      // ── Return started -> jump back (same UI type) ──
      case 'return.started':
        this._emit({
          type: 'jump',
          file: domainEvent.to,
          reason: domainEvent.reason,
        });
        break;

      // ── Symbol discovered -> follow ──
      case 'symbol.discovered':
        this._emit({
          type: 'follow',
          file: domainEvent.source?.file,
          line: domainEvent.source?.line,
          symbol: domainEvent.symbol,
          reason: `Discovered ${domainEvent.symbolType}: ${domainEvent.symbol}`,
        });
        break;

      // ── Evidence found -> insight ──
      case 'evidence.added':
        this._emit({
          type: 'insight',
          file: domainEvent.source?.file,
          line: domainEvent.source?.line,
          text: domainEvent.fact,
          confidence: 'High',
        });
        break;

      // ── Investigation completed -> resolve ──
      case 'investigation.completed': {
        const result = domainEvent.result;
        this._emit({
          type: 'resolve',
          confidence: Math.round((result?.confidence ?? 1) * 100),
          reason: result?.summary ?? 'Investigation complete.',
        });
        break;
      }

      // ── Structured failure -> timeline error entry ──
      case 'investigation.failed':
        this._emit({
          type: 'timeline',
          id: 'investigation-failed',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          label: `Investigation failed at ${domainEvent.stage}`,
          sublabel: domainEvent.reason,
          status: 'error',
        });
        break;

      // All other domain events (internal planner states, transport heartbeats) are ignored.
      default:
        break;
    }
  }
}
