const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './.env' });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API key");
    return;
  }
  const genAI = new GoogleGenerativeAI(key.replace(/['"]/g, ''));
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await model.embedContent("Hello world");
    console.log("✅ SUCCESS: gemini-embedding-2 works! Values length:", result.embedding.values.length);
  } catch (err) {
    console.error("❌ ERROR embedding with gemini-embedding-2:", err.message);
    console.log("Let's try gemini-embedding-001...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent("Hello world");
      console.log("✅ SUCCESS: gemini-embedding-001 works! Values length:", result.embedding.values.length);
    } catch (err2) {
      console.error("❌ ERROR embedding with gemini-embedding-001:", err2.message);
    }
  }
}

main();
