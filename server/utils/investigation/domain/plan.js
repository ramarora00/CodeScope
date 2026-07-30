/**
 * InvestigationPlan
 * 
 * The strict interface for the Planning Engine output.
 * ExecutionEngine consumes this directly.
 */
class InvestigationPlan {
  /**
   * @param {Object} planData
   * @param {string} planData.mission - The original user request
   * @param {string} planData.hypothesis - The overarching reasoning or hypothesis for the plan
   * @param {number} planData.confidence - Estimated confidence (0.0 to 1.0)
   * @param {Array<{action: string, target: string, reason: string}>} planData.executionSteps - Deterministic steps
   */
  constructor(planData) {
    this.mission = planData.mission || '';
    this.hypothesis = planData.hypothesis || '';
    this.confidence = planData.confidence || 0;
    this.executionSteps = planData.executionSteps || [];
  }
}

module.exports = { InvestigationPlan };
