require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Available embedding models:");
    data.models.forEach(m => {
      if (m.name.includes('embed') || m.supportedGenerationMethods.includes('embedContent')) {
        console.log(`- ${m.name}`);
      }
    });
  } catch (err) {
    console.error("❌ Failed to list models:", err.message);
  }
}

listModels();
