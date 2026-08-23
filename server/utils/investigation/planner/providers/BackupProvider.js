const { LLMProvider } = require('./LLMProvider');

/**
 * BackupProvider
 * 
 * Implements the LLMProvider interface for the tertiary fallback reasoning model.
 * Intended for an OpenRouter or OpenAI-compatible endpoint.
 */
class BackupProvider extends LLMProvider {
  constructor(
    apiKey = process.env.BACKUP_API_KEY, 
    apiUrl = process.env.BACKUP_API_URL || 'https://api.openai.com/v1/chat/completions'
  ) {
    super();
    if (!apiKey) {
      throw new Error('Backup API key is required');
    }
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
    this.model = process.env.BACKUP_MODEL || 'gpt-4o-mini';
  }

  async generatePlan(mission, context, constraints) {
    const safeContext = context || '';
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
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backup API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      const rawJson = this._extractJson(text);
      
      const planningTimeMs = Date.now() - startTime;
      const contextFilesCount = (context.match(/FILE PATH:/g) || []).length;

      return {
        planJson: rawJson,
        metadata: {
          provider: 'backup',
          model: this.model,
          generatedAt: new Date().toISOString(),
          planningTimeMs,
          contextFiles: contextFilesCount,
          promptVersion: 1,
          providerUsed: 'backup' 
        }
      };
    } catch (err) {
      console.error('[BackupProvider] Plan generation failed:', err.message);
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
  "isResolved": false, 
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
      throw new Error('Backup LLM did not return a valid JSON object');
    }
    return text.substring(start, end + 1);
  }
}

module.exports = { BackupProvider };
