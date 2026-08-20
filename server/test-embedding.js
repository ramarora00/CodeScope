require('dotenv').config({ path: './.env' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testEmbedding() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'test_key') {
    console.error("❌ GEMINI_API_KEY is missing or invalid in .env");
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  try {
    const result = await model.embedContent("Hello world");
    console.log("✅ Embedding successful. Vector length:", result.embedding.values.length);
  } catch (err) {
    console.error("❌ Embedding failed:", err.message);
  }
}

testEmbedding();
