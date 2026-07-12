const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './.env' });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(key.replace(/['"]/g, ''));
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent("Hello world");
    console.log("✅ SUCCESS: gemini-embedding-001 works! Values length:", result.embedding.values.length);
  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}
main();
