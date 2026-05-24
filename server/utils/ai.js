const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generates an AI response based on codebase context
 * @param {string} prompt - The user's question
 * @param {object} context - Codebase context (file content, metadata, etc.)
 * @returns {Promise<string>} - AI response
 */
const generateResponse = async (prompt, context = {}) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return "❌ AI Service is not configured. Please add `GEMINI_API_KEY` to your server/.env file and restart the server.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.replace(/['"]/g, ''));
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `
      You are an elite AI Codebase Intelligence Copilot. 
      Your goal is to help developers understand, navigate, and debug their code.
      
      Context provided:
      - Current File: ${context.fileName || 'None'}
      - File Language: ${context.language || 'None'}
      - Code Content: 
      \`\`\`
      ${context.content || 'No code provided'}
      \`\`\`
      
      - Extracted Metadata (AST Symbols): ${context.metadata || 'None'}

      - Related Global Context (other files):
      ${context.globalContext || 'None'}

      Instructions:
      - Be concise, precise, and highly technical.
      - If explaining code, use step-by-step breakdowns.
      - If the answer is not in the provided context, state that you don't have enough information about the rest of the codebase yet.
      - Use a "Senior Engineer" tone: intuitive, helpful, and direct.
    `;

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    if (error.message.includes("API_KEY_INVALID")) {
      return "❌ ERROR: Your API Key is invalid. Please ensure there are NO quotes in your .env file.";
    }
    return `❌ AI Error: ${error.message}`;
  }
};

module.exports = { generateResponse };
