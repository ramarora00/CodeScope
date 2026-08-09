const { LLMProvider } = require('./LLMProvider');

/**
 * FallbackProvider
 * 
 * Implements the LLMProvider interface for the secondary/fallback reasoning model.
 * Defaults to a generic OpenAI-compatible REST endpoint (like Groq or OpenRouter)
 * so no new SDK dependencies are required.
 */
class FallbackProvider extends LLMProvider {
  constructor(
    apiKey = process.env.FALLBACK_API_KEY, 
    apiUrl = process.env.FALLBACK_API_URL || 'https://api.groq.com/openai/v1/chat/completions'
  ) {
    super();
    if (!apiKey) {
      throw new Error('Fallback API key is required');
    }
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = 'llama-3.1-8b-instant'; // Used 8b model for higher TPM (30k) on free tier
  }

  async generatePlan(mission, context, constraints) {
    // Groq's Free Tier has a strict 6,000 TPM (Tokens Per Minute) limit for this model.
    // 6,000 tokens is roughly 24,000 characters. We truncate the context to ensure it fits.
    const maxChars = 20000; 
    let safeContext = context;
    if (safeContext && safeContext.length > maxChars) {
      safeContext = safeContext.substring(0, maxChars) + "\n\n...[CONTEXT TRUNCATED FOR FALLBACK API LIMITS]...";
    }
    const prompt = this._buildPrompt(mission, safeContext, constraints);
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" } // Enforce JSON if provider supports it
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fallback API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      const rawJson = this._extractJson(text);
      
      const planningTimeMs = Date.now() - startTime;
      const contextFilesCount = (context.match(/FILE PATH:/g) || []).length;

      return {
        planJson: rawJson,
        metadata: {
          provider: 'fallback',
          model: this.model,
          generatedAt: new Date().toISOString(),
          planningTimeMs,
          contextFiles: contextFilesCount,
          promptVersion: 1,
          providerUsed: 'fallback' // Explicit flag for frontend observer
        }
      };
    } catch (err) {
      console.error('[FallbackProvider] Plan generation failed:', err.message);
      throw err;
    }
  }

  _buildPrompt(mission, context, constraints) {
    return `
You are an expert software engineer analyzing a codebase.
Your goal is to investigate a repository to fulfill the following mission:
MISSION: "${mission}"

Here are the most relevant files from the repository based on vector search:
--- REPOSITORY CONTEXT ---
${context}
--------------------------

CONSTRAINTS:
- Maximum files to read or jump to: ${constraints.maxSteps || 5}
- You must output your plan strictly in JSON format.
- Do NOT include markdown blocks like \`\`\`json. Return raw JSON.

JSON SCHEMA:
{
  "mission": "The mission statement",
  "hypothesis": "Your reasoning or hypothesis of where to look and why.",
  "confidence": 0.95, 
  "executionSteps": [
    {
      "action": "read", 
      "target": "path/to/file.ts", 
      "reason": "Why you need to read this file"
    }
  ]
}

Output ONLY valid JSON matching the exact schema above.
`.trim();
  }

  _extractJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('Fallback LLM did not return a valid JSON object');
    }
    return text.substring(start, end + 1);
  }
}

module.exports = { FallbackProvider };
