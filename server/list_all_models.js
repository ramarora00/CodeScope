require('dotenv').config({ path: './.env' });

async function listAllModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("❌ No API key found in .env");
    return;
  }

  const cleanKey = key.replace(/['"]/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;

  try {
    console.log("🔍 Fetching all models from Google API...");
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
       console.log("❌ FAILED:", data.error.message);
       return;
    }

    console.log("\nAll models:");
    data.models.forEach(m => {
      console.log(`- ${m.name.replace('models/', '')} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.log("❌ SYSTEM ERROR:", err.message);
  }
}

listAllModels();
