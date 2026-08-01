const { ContextBuilder } = require('./ContextBuilder');
const { PlanValidator } = require('./PlanValidator');
const { GeminiProvider } = require('./providers/GeminiProvider');

/**
 * Investigation Planner
 * 
 * Orchestrates the generation of an InvestigationPlan from a user mission.
 * Workflow: Mission -> ContextBuilder -> LLM Provider -> PlanValidator -> InvestigationPlan
 */
class Planner {
  constructor(provider = new GeminiProvider()) {
    this.provider = provider;
    this.contextBuilder = new ContextBuilder();
    this.validator = new PlanValidator();
  }

  /**
   * Generates a validated InvestigationPlan.
   * 
   * @param {string} repoId - The repository ID to search
   * @param {string} mission - The user's goal
   * @param {Object} options - Planning constraints
   * @returns {Promise<import('../domain/plan').InvestigationPlan>}
   */
  async plan(repoId, mission, options = { maxSteps: 5 }) {
    console.log(`[Planner] Starting planning phase for mission: "${mission}"`);
    
    // 1. Build Context
    const context = await this.contextBuilder.buildContext(repoId, mission, {
      maxFiles: 50,
      threshold: 1.2
    });

    if (context == null) {
      throw new Error('Planner Failed: Could not build repository context.');
    }

    // 2. Generate Raw Plan via LLM Provider
    console.log(`[Planner] Requesting plan from LLM Provider...`);
    const { planJson, metadata } = await this.provider.generatePlan(mission, context, options);

    // 3. Validate and Parse
    console.log(`[Planner] Validating LLM output...`);
    const plan = this.validator.validate(planJson);

    console.log(`[Planner] Plan generated successfully with ${plan.executionSteps.length} steps.`);
    return { plan, metadata };
  }
}

module.exports = { Planner };
