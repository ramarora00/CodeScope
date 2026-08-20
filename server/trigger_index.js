const path = require('path');
require('dotenv').config({ path: './.env' });

async function getFirebaseToken() {
  const clientEnv = require('fs').readFileSync('../client/.env', 'utf8');
  const apiKeyMatch = clientEnv.match(/VITE_FIREBASE_API_KEY=(.*)/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1].replace(/"/g, '').trim() : null;
  if (!apiKey) throw new Error("Missing Firebase API Key");

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "test@example.com", password: "password123", returnSecureToken: true })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function trigger() {
  const localPath = path.resolve(__dirname, 'node_modules/component-emitter');
  const name = "component-emitter-test";
  
  try {
    const token = await getFirebaseToken();
    console.log("Token acquired, starting index...");

    const res = await fetch('http://127.0.0.1:5000/api/repo/index-local', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ localPath, name })
    });
    
    if (!res.ok) {
      console.error("Index request failed:", res.status, await res.text());
      return;
    }
    
    const data = await res.json();
    console.log("Response:", data);
    
    if (data.id) {
      console.log("Monitoring progress for repo:", data.id);
      const response = await fetch(`http://127.0.0.1:5000/api/repo/${data.id}/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        console.log(chunk.trim());
        if (chunk.includes('"step":"ready"') && chunk.includes('"status":"done"')) {
          console.log("Indexing completed successfully!");
          break;
        }
        if (chunk.includes('"status":"failed"')) {
          console.error("Indexing failed!");
          break;
        }
      }
    }
  } catch (err) {
    console.error("Error triggering index:", err);
  }
}

trigger();
