const { InvestigationResult } = require('../domain/result');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
   * Run the Execution Engine with UI-paced timing.
   * Each step is gated with small delays so React can render between events.
   *
   * @param {Object} planData { profile, dag, plan }
   */
  async execute(planData) {
    const { plan } = planData;
    const cursor = new ExecutionCursor(plan.length);

    this._publish(this.events.investigationStarted({
      maxFiles: 15,
      maxJumps: 25
    }));

    for (let i = 0; i < plan.length; i++) {
      // Cancellation Check at the top of every step
      if (this.context.isCancelled) {
        this._publish(this.events.investigationCancelled('User aborted investigation.'));
        return;
      }

      cursor.stepIndex = i;
      const step = plan[i];
      cursor.currentAction = step.action;
      cursor.currentFile = step.file.path;

      // 1. Action: READ
      if (step.action === 'read') {
        this._publish(this.events.fileSelected(step.file.path, step.reason, step.confidence));

        this._publish(this.events.fileReadStarted(step.file.path, step.reason));

        // Simulate structured file reading with paced line progress
        const lineCount = step.file.content ? step.file.content.split('\n').length : 100;
        
        // Emit 5 evenly-spaced progress markers across the file
        const chunks = 5;
        for (let c = 1; c <= chunks; c++) {
          cursor.fileProgress = c / chunks;
          const currentLine = Math.floor((c / chunks) * lineCount);
          this._publish(this.events.fileReadProgress(step.file.path, currentLine, lineCount, null));
          
          if (this.context.isCancelled) return;
        }

        // Emit symbol discovery if metadata has functions
        if (step.file.metadata) {
          try {
            const meta = JSON.parse(step.file.metadata);
            if (meta.functions && meta.functions.length > 0) {
              const sym = meta.functions[0];
              this._publish(this.events.symbolDiscovered(sym.name, 'function', 0.9, { file: step.file.path, line: sym.lineStart }));
              this._publish(this.events.evidenceAdded(`Found function ${sym.name} in ${step.file.filename}`, { file: step.file.path, line: sym.lineStart }));
            }
          } catch (e) { /* ignore parse errors */ }
        }

        this._publish(this.events.fileReadCompleted(step.file.path, 150));
      }

      // 2. Action: JUMP
      else if (step.action === 'jump') {
        cursor.jumps++;
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.jumpStarted(fromPath, step.file.path, step.reason, 'graph_traversal', null));
        
        this._publish(this.events.fileSelected(step.file.path, `Jumped from ${fromPath}`, step.confidence));
        this._publish(this.events.fileReadStarted(step.file.path, `Checking dependency`));
        this._publish(this.events.fileReadProgress(step.file.path, 1, 10, null));
        this._publish(this.events.fileReadCompleted(step.file.path, 50));
        this._publish(this.events.jumpCompleted(step.file.path));
      }

      // 3. Action: RETURN
      else if (step.action === 'return') {
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.returnStarted(fromPath, step.file.path, step.reason));
        this._publish(this.events.fileSelected(step.file.path, step.reason, step.confidence));
      }
    }

    // Final result aggregation
    const elapsed = Date.now() - cursor.startTime;
    const result = new InvestigationResult(this.context, elapsed);
    
    this._publish(this.events.investigationCompleted(result));
  }
}

module.exports = {
  ExecutionEngine,
  ExecutionCursor
};

