require('dotenv').config({ path: './.env' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("❌ No API key found in .env");
    return;
  }

  const cleanKey = key.replace(/['"]/g, '');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;

  try {
    console.log("🔍 Probing Google API for supported models...");
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
       console.log("❌ PROBE FAILED:", data.error.message);
       return;
    }

    const models = data.models;
    console.log("\n✅ SUCCESS! Here are the models your key can see:\n");
    models.forEach(m => {
      if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name.replace('models/', '')}`);
      }
    });
  } catch (err) {
    console.log("❌ SYSTEM ERROR:", err.message);
  }
}

listModels();
