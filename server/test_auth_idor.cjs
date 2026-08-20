const fs = require('fs');
require('dotenv').config({ path: './server/.env' });

async function getFirebaseToken(email, password) {
  const apiKey = process.env.VITE_FIREBASE_API_KEY; 
  if (!apiKey) throw new Error("Missing Firebase API Key");

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

async function run() {
  const clientEnv = fs.readFileSync('../client/.env', 'utf8');
  const apiKeyMatch = clientEnv.match(/VITE_FIREBASE_API_KEY=(.*)/);
  if (apiKeyMatch) {
    process.env.VITE_FIREBASE_API_KEY = apiKeyMatch[1].replace(/"/g, '').trim();
  } else {
    console.error("Could not find VITE_FIREBASE_API_KEY");
    return;
  }

  try {
    console.log("Getting tokens...");
    const tokenA = await getFirebaseToken("test@example.com", "password123");
    let tokenB;
    try {
      tokenB = await getFirebaseToken("userb@example.com", "password123");
    } catch (e) {
      console.log("User B doesn't exist, creating...");
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.VITE_FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "userb@example.com", password: "password123", returnSecureToken: true })
      });
      const data = await res.json();
      tokenB = data.idToken;
    }
    
    console.log("User A token acquired.");
    console.log("User B token acquired.");

    console.log("\nUser A creating repository...");
    const createRes = await fetch("http://127.0.0.1:5000/api/repo/index-local", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenA}`
      },
      body: JSON.stringify({ localPath: __dirname, name: "test-repo-" + Date.now() })
    });
    const repoA = await createRes.json();
    console.log("Repo created:", repoA.id);

    console.log("\nUser A connecting to SSE progress...");
    const progressResA = await fetch(`http://127.0.0.1:5000/api/repo/${repoA.id}/progress`, {
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    console.log("User A progress status:", progressResA.status);

    console.log("\nUser B attempting to connect to User A's SSE progress...");
    const progressResB = await fetch(`http://127.0.0.1:5000/api/repo/${repoA.id}/progress`, {
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    console.log("User B progress status:", progressResB.status);

    console.log("\nUser B attempting to delete User A's repo...");
    const delResB = await fetch(`http://127.0.0.1:5000/api/repo/${repoA.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenB}` }
    });
    console.log("User B delete status:", delResB.status);

    console.log("\nUser A deleting their own repo...");
    const delResA = await fetch(`http://127.0.0.1:5000/api/repo/${repoA.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${tokenA}` }
    });
    console.log("User A delete status:", delResA.status);

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
