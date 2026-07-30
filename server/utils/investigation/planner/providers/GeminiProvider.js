const { GoogleGenerativeAI } = require('@google/generative-ai');
const { LLMProvider } = require('./LLMProvider');

/**
 * GeminiProvider
 * 
 * Implements the LLMProvider interface using Google's Gemini models.
 */
class GeminiProvider extends LLMProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super();
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-pro for reasoning/planning
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async generatePlan(mission, context, constraints) {
    const prompt = this._buildPrompt(mission, context, constraints);
    const startTime = Date.now();
    
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Try to clean markdown fences if Gemini returned them
      const rawJson = this._extractJson(text);
      
      const planningTimeMs = Date.now() - startTime;
      const contextFilesCount = (context.match(/FILE PATH:/g) || []).length;

      return {
        planJson: rawJson,
        metadata: {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          generatedAt: new Date().toISOString(),
          planningTimeMs,
          contextFiles: contextFilesCount,
          promptVersion: 1
        }
      };
    } catch (err) {
      console.error('[GeminiProvider] Plan generation failed:', err);
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
  "confidence": 0.95, // 0.0 to 1.0
  "executionSteps": [
    {
      "action": "read", // or "jump"
      "target": "path/to/file.ts", // MUST be a real file path from the context
      "reason": "Why you need to read this file"
    }
  ]
}

Output ONLY valid JSON.
`.trim();
  }

  _extractJson(text) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('LLM did not return a valid JSON object');
    }
    return text.substring(start, end + 1);
  }
}

module.exports = { GeminiProvider };
