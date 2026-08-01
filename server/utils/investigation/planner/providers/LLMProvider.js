/**
 * LLMProvider
 * 
 * Abstract base class for all LLM providers in the Planning Engine.
 * Providers must implement the generatePlan method.
 */
class LLMProvider {
  /**
   * Evaluates the mission and context, and returns a JSON string representing the plan.
   * 
   * @param {string} mission - The user's goal
   * @param {string} context - The repository summary / file contexts
   * @param {Object} constraints - Planning constraints (e.g., max steps)
   * @returns {Promise<string>} - A raw JSON string containing the InvestigationPlan data
   */
  async generatePlan(mission, context, constraints) {
    throw new Error('LLMProvider subclasses must implement generatePlan()');
  }
}

module.exports = { LLMProvider };
