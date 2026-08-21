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

    // --- NEW: Immediate Resolution Path ---
    if (plan.isResolved && plan.consultedFiles && plan.consultedFiles.length > 0) {
      for (const file of plan.consultedFiles) {
        // Emit fileSelected so it counts as a consulted file in the result context.
        this._publish(this.events.fileSelected(file.path, `Context consulted: ${file.reason}`, plan.confidence, false));
        // Emit evidenceAdded so it populates the findings array in the UI, without falsely pretending it was an execution step.
        this._publish(this.events.evidenceAdded(file.reason, file.path, plan.confidence));
      }
    }

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
        const isAsset = /\.(png|jpe?g|gif|svg|pdf|webm|mp4|ico|woff2?|ttf|eot)$/i.test(step.target);
        this._publish(this.events.stateTransition('READING', { target: step.target }));
        this._publish(this.events.fileSelected(step.target, step.reason, plan.confidence, isAsset));
        
        const lineCount = 30 + (step.target.length * 7) % 300; 
        
        // Mock a realistic target range for the focus box since the planner schema doesn't yet provide line numbers.
        // Use a hash of the target name so it's deterministic per file.
        const targetHash = step.target.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let defaultStartLine = 1 + (targetHash % Math.max(1, lineCount - 25));
        if (defaultStartLine < 1) defaultStartLine = 1;
        
        const startLine = step.startLine || defaultStartLine;
        const endLine = step.endLine || Math.min(lineCount, startLine + 3 + (targetHash % 3));
        
        this._publish(this.events.fileReadStarted(step.target, step.reason, startLine, endLine));

        const regionLines = endLine - startLine;
        const chunks = 5;
        for (let c = 1; c <= chunks; c++) {
          cursor.fileProgress = c / chunks;
          const currentLine = startLine + Math.floor((c / chunks) * regionLines);
          this._publish(this.events.fileReadProgress(step.target, currentLine, lineCount, null));
          
          if (this.context.isCancelled) return;
        }

        this._publish(this.events.stateTransition('EVIDENCE_EARNED', { target: step.target }));
        this._publish(this.events.evidenceAdded(step.reason || `Mapped structural patterns in ${step.target.split('/').pop()}`, step.target, 0.9));
        this._publish(this.events.fileReadCompleted(step.target, lineCount));
      }

      // 2. Action: JUMP
      else if (step.action === 'jump') {
        cursor.jumps++;
        const fromPath = this.context.currentFile || 'unknown';
        const isAsset = /\.(png|jpe?g|gif|svg|pdf|webm|mp4|ico|woff2?|ttf|eot)$/i.test(step.target);
        this._publish(this.events.stateTransition('CROSS_CHECKING', { from: fromPath, to: step.target }));
        this._publish(this.events.jumpStarted(fromPath, step.target, step.reason, 'graph_traversal', null));
        this._publish(this.events.fileSelected(step.target, `Jumped from ${fromPath}`, plan.confidence, isAsset));
        
        const jumpTargetHash = step.target.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jumpStartLine = 1 + (jumpTargetHash % 50);
        const jumpEndLine = jumpStartLine + 8 + (jumpTargetHash % 5);
        
        this._publish(this.events.fileReadStarted(step.target, `Checking dependency`, jumpStartLine, jumpEndLine));
        this._publish(this.events.fileReadProgress(step.target, jumpStartLine, jumpEndLine, null));
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

    this._publish(this.events.stateTransition('CONCLUSION_READY'));
    this._publish(this.events.stateTransition('SILENCE'));
    this._publish(this.events.stateTransition('REPORT_READY'));

    const elapsed = Date.now() - cursor.startTime;
    const result = new InvestigationResult(this.context, elapsed);
    
    this._publish(this.events.investigationCompleted(result));
  }
}

module.exports = {
  ExecutionEngine,
  ExecutionCursor
};

