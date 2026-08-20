const { ContextBuilder } = require('./ContextBuilder');
const { PlanValidator } = require('./PlanValidator');
const { ProviderRouter } = require('./providers/ProviderRouter');

/**
 * Investigation Planner
 * 
 * Orchestrates the generation of an InvestigationPlan from a user mission.
 * Workflow: Mission -> ContextBuilder -> LLM Provider -> PlanValidator -> InvestigationPlan
 */
class Planner {
  constructor(provider = new ProviderRouter()) {
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
    const plannerStart = Date.now();
    
    // 1. Build Context
    const ctxStart = Date.now();
    const context = await this.contextBuilder.buildContext(repoId, mission, {
      maxFiles: 50,
      threshold: 1.2
    });
    console.log(`[BENCHMARK_AI] Context retrieval: ${((Date.now() - ctxStart) / 1000).toFixed(2)}s`);

    if (context == null) {
      throw new Error('Planner Failed: Could not build repository context.');
    }

    // 2. Generate Raw Plan via LLM Provider
    console.log(`[Planner] Requesting plan from LLM Provider...`);
    const llmStart = Date.now();
    const { planJson, metadata } = await this.provider.generatePlan(mission, context, options);
    console.log(`[BENCHMARK_AI] Gemini reasoning (plan generation): ${((Date.now() - llmStart) / 1000).toFixed(2)}s`);

    // 3. Validate and Parse
    console.log(`[Planner] Validating LLM output...`);
    const validateStart = Date.now();
    const plan = this.validator.validate(planJson, context);
    console.log(`[BENCHMARK_AI] Plan validation: ${((Date.now() - validateStart) / 1000).toFixed(2)}s`);

    console.log(`[Planner] Plan generated successfully with ${plan.executionSteps.length} steps.`);
    console.log(`[BENCHMARK_AI] Total planner: ${((Date.now() - plannerStart) / 1000).toFixed(2)}s`);
    return { plan, metadata };
  }
}

module.exports = { Planner };
