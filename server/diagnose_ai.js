const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './.env' });

async function diagnose() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("❌ No API key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(key.replace(/['"]/g, ''));
  
  try {
    console.log("🔍 Fetching available models...");
    // Note: The SDK doesn't have a direct listModels, but we can try a simple request
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("✅ SUCCESS: gemini-1.5-flash is working!");
  } catch (err) {
    console.log("❌ ERROR:", err.message);
    console.log("\n💡 Possible Fix: Your key might be restricted. Let's try gemini-1.0-pro...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
      await model.generateContent("test");
      console.log("✅ SUCCESS: gemini-1.0-pro is working!");
    } catch (err2) {
      console.log("❌ ERROR with gemini-1.0-pro:", err2.message);
    }
  }
}

diagnose();
