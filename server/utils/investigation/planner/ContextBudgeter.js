/**
 * ContextBudgeter
 * 
 * Takes raw vector search results, deduplicates by file, ranks by relevance,
 * and enforces a token/character budget to prevent LLM payload overflow.
 */
class ContextBudgeter {
  /**
   * Processes vector results into a bounded string suitable for LLM context.
   * 
   * @param {Array} results - Raw hits from LanceDB searchRepo
   * @param {number} maxTokens - Estimated token limit (default: 3500)
   * @param {Object} options - Additional context hints for boosting (e.g., currentFile)
   * @returns {string} The budgeted context string
   */
  budgetContext(results, maxTokens = 3500, options = {}) {
    if (!results || results.length === 0) return '';

    // Roughly 4 chars per token for typical code/text
    const maxChars = maxTokens * 4;

    // 1. Deduplicate by file path, keeping the best (lowest) score per file
    // and merging texts if we wanted to (but here we'll just take the top chunk's text or full file if available)
    const fileMap = new Map();
    
    for (const hit of results) {
      if (!fileMap.has(hit.path)) {
        fileMap.set(hit.path, {
          path: hit.path,
          score: hit.score,
          text: hit.text,
          // Boost score if it's the current file the user/agent is focused on
          boostedScore: (options.currentFile && hit.path === options.currentFile) ? hit.score - 0.5 : hit.score
        });
      } else {
        const existing = fileMap.get(hit.path);
        // If this chunk has a better score, update the base score
        if (hit.score < existing.score) {
          existing.score = hit.score;
        }
        
        // We append chunk text to get a fuller picture of the file, avoiding pure duplicates
        // Note: In LanceDB, overlapping chunks might duplicate text. A simple include check avoids exact duplicates.
        if (!existing.text.includes(hit.text)) {
          existing.text += '\n...\n' + hit.text;
        }
      }
    }

    // 2. Rank by boosted score (lower is better for L2 distance)
    const rankedFiles = Array.from(fileMap.values()).sort((a, b) => a.boostedScore - b.boostedScore);

    // 3. Accumulate text until budget is reached
    let contextStr = '';
    let currentChars = 0;

    for (const file of rankedFiles) {
      // 1500 chars limit per file to ensure diversity, unless it's the very first highly relevant file
      const charsAllowedForFile = (currentChars === 0) ? 3000 : 1500;
      
      const snippet = file.text.substring(0, charsAllowedForFile);
      const fileEntry = `FILE PATH: ${file.path}\nSNIPPET:\n${snippet}\n\n`;
      
      if (currentChars + fileEntry.length > maxChars && currentChars > 0) {
        break; // Budget exceeded, stop adding more files
      }
      
      contextStr += fileEntry;
      currentChars += fileEntry.length;
    }

    return contextStr;
  }
}

module.exports = { ContextBudgeter };
