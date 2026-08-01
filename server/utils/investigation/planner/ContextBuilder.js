const { searchRepo } = require('../../vectorStore');

/**
 * ContextBuilder
 * 
 * Prepares the repository context for the LLM Planner by gathering
 * relevant files, filtering out noise, and formatting it into a text string.
 */
class ContextBuilder {
  /**
   * Retrieves top N relevant files and formats them into a context string.
   * 
   * @param {string} repoId 
   * @param {string} mission 
   * @param {Object} options 
   * @returns {Promise<string>}
   */
  async buildContext(repoId, mission, options = {}) {
    const maxFiles = options.maxFiles || 50;
    const threshold = options.threshold || 1.2; // L2 distance threshold

    console.log(`[ContextBuilder] Searching vector store for mission: "${mission}"`);
    const results = await searchRepo(repoId, mission, maxFiles);

    if (!results || results.length === 0) {
      console.warn(`[ContextBuilder] No vector results found for repo ${repoId}. Returning empty context.`);
      return '';
    }

    // Filter by relevance threshold and limit N dynamically
    // In LanceDB, distance is L2 by default (lower is better, typically 0.0 to 2.0)
    const relevantResults = results.filter(r => r.score < threshold);
    
    console.log(`[ContextBuilder] Found ${results.length} total hits, ${relevantResults.length} passed threshold.`);
    
    // If we filtered too aggressively, ensure we return at least a few top results
    const finalResults = relevantResults.length > 0 ? relevantResults : results.slice(0, 5);

    // Format the output specifically for the LLM prompt
    let contextStr = '';
    finalResults.forEach((res, index) => {
      contextStr += `FILE PATH: ${res.path}\n`;
      // Cap the text length per snippet to avoid blowing up the context window
      const snippet = res.text.substring(0, 1500); 
      contextStr += `SNIPPET:\n${snippet}\n\n`;
    });

    return contextStr;
  }
}

module.exports = { ContextBuilder };
