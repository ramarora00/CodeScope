const { InvestigationResult } = require('../domain/result');



/**
 * Execution Cursor
 * Tracks the exact position in the Investigation Plan.
 */
class ExecutionCursor {
  constructor(totalSteps) {
    this.stepIndex = 0;
    this.totalSteps = totalSteps;
    this.currentFile = null;
    this.currentAction = null;
    this.fileProgress = 0;
    this.startTime = Date.now();
    this.jumps = 0;
  }
}

/**
 * ExecutionEngine
 * 
 * Takes an InvestigationPlan, an EventFactory, and an InvestigationContext.
 * It is a pure conductor. It does not decide what to investigate; it simply
 * executes the instructions in the plan, updating the context and emitting
 * Domain Events sequentially.
 *
 * PACING: Events are time-gated so the UI animator can render between frames.
 * Without pacing, all events fire synchronously in a single tick and the
 * UI never updates because React batches all state changes.
 */
class ExecutionEngine {
  constructor(context, eventFactory, emitCallback) {
    this.context = context;
    this.events = eventFactory;
    this.emit = emitCallback; // Function to push events to EventBus
  }

  _publish(event) {
    // 1. Mutate Context (Event Sourcing Reducer)
    this.context.applyEvent(event);
    // 2. Emit to Transport Layer
    this.emit(event);
  }

  /**
   * Run the Execution Engine instantly.
   * All events are emitted immediately; pacing is handled by the frontend PlaybackController.
   *
   * @param {Object} planData { profile, dag, plan }
   * @param {AbortSignal} signal - Optional abort signal
   */
  async execute(plan, signal = null) {
    const executionSteps = plan.executionSteps || [];
    const cursor = new ExecutionCursor(executionSteps.length);

    this._publish(this.events.investigationStarted({
      maxFiles: 15,
      maxJumps: 25
    }));

    for (let i = 0; i < executionSteps.length; i++) {
      if (this.context.isCancelled || (signal && signal.aborted)) {
        this._publish(this.events.investigationCancelled('User aborted investigation.'));
        return;
      }

      cursor.stepIndex = i;
      const step = executionSteps[i];
      cursor.currentAction = step.action;
      cursor.currentFile = step.target;

      // 1. Action: READ
      if (step.action === 'read') {
        this._publish(this.events.fileSelected(step.target, step.reason, plan.confidence));
        this._publish(this.events.fileReadStarted(step.target, step.reason));

        const lineCount = 30 + (step.target.length * 7) % 300; 
        
        const chunks = 5;
        for (let c = 1; c <= chunks; c++) {
          cursor.fileProgress = c / chunks;
          const currentLine = Math.floor((c / chunks) * lineCount);
          this._publish(this.events.fileReadProgress(step.target, currentLine, lineCount, null));
          
          if (this.context.isCancelled) return;
        }

        this._publish(this.events.evidenceAdded(`Analyzed structural patterns in ${step.target.split('/').pop()}`, step.target, 0.9));
        this._publish(this.events.fileReadCompleted(step.target, lineCount));
      }

      // 2. Action: JUMP
      else if (step.action === 'jump') {
        cursor.jumps++;
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.jumpStarted(fromPath, step.target, step.reason, 'graph_traversal', null));
        this._publish(this.events.fileSelected(step.target, `Jumped from ${fromPath}`, plan.confidence));
        this._publish(this.events.fileReadStarted(step.target, `Checking dependency`));
        this._publish(this.events.fileReadProgress(step.target, 1, 10, null));
        this._publish(this.events.fileReadCompleted(step.target, 50));
        this._publish(this.events.jumpCompleted(step.target));
      }

      // 3. Action: RETURN
      else if (step.action === 'return') {
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.returnStarted(fromPath, step.target, step.reason));
        this._publish(this.events.fileSelected(step.target, step.reason, plan.confidence));
      }
    }

    const elapsed = Date.now() - cursor.startTime;
    const result = new InvestigationResult(this.context, elapsed);
    
    this._publish(this.events.investigationCompleted(result));
  }
}

module.exports = {
  ExecutionEngine,
  ExecutionCursor
};

