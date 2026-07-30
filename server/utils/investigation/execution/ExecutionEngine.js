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
  async execute(plan) {
    const executionSteps = plan.executionSteps || [];
    const cursor = new ExecutionCursor(executionSteps.length);

    this._publish(this.events.investigationStarted({
      maxFiles: 15,
      maxJumps: 25
    }));

    for (let i = 0; i < executionSteps.length; i++) {
      // Cancellation Check at the top of every step
      if (this.context.isCancelled) {
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
        await sleep(400);

        this._publish(this.events.fileReadStarted(step.target, step.reason));
        await sleep(200);

        // Simulate structured file reading with paced line progress
        // Use a pseudo-random line count based on string length to look realistic
        const lineCount = 30 + (step.target.length * 7) % 300; 
        
        // Emit 5 evenly-spaced progress markers across the file
        const chunks = 5;
        for (let c = 1; c <= chunks; c++) {
          cursor.fileProgress = c / chunks;
          const currentLine = Math.floor((c / chunks) * lineCount);
          this._publish(this.events.fileReadProgress(step.target, currentLine, lineCount, null));
          
          await sleep(500); // UI PACING FOR READING ANIMATION

          if (this.context.isCancelled) return;
        }

        // Emit a simulated finding for the knowledge panel
        this._publish(this.events.evidenceAdded(`Analyzed structural patterns in ${step.target.split('/').pop()}`, step.target, 0.9));

        await sleep(300);
        this._publish(this.events.fileReadCompleted(step.target, lineCount));
        await sleep(400);
      }

      // 2. Action: JUMP
      else if (step.action === 'jump') {
        cursor.jumps++;
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.jumpStarted(fromPath, step.target, step.reason, 'graph_traversal', null));
        await sleep(400);
        
        this._publish(this.events.fileSelected(step.target, `Jumped from ${fromPath}`, plan.confidence));
        await sleep(400);
        this._publish(this.events.fileReadStarted(step.target, `Checking dependency`));
        await sleep(300);
        this._publish(this.events.fileReadProgress(step.target, 1, 10, null));
        await sleep(500);
        this._publish(this.events.fileReadCompleted(step.target, 50));
        await sleep(200);
        this._publish(this.events.jumpCompleted(step.target));
        await sleep(200);
      }

      // 3. Action: RETURN
      else if (step.action === 'return') {
        const fromPath = this.context.currentFile || 'unknown';
        this._publish(this.events.returnStarted(fromPath, step.target, step.reason));
        this._publish(this.events.fileSelected(step.target, step.reason, plan.confidence));
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

