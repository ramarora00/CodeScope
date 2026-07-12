const path = require('path');

async function trigger() {
  const localPath = "C:/Users/ramar/.gemini/antigravity/scratch/ai-developer-copilot";
  const name = "ai-developer-copilot-test";
  
  try {
    const res = await fetch('http://localhost:5000/api/repo/index-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localPath, name })
    });
    const data = await res.json();
    console.log("Response:", data);
    
    if (data.id) {
      console.log("Monitoring progress for repo:", data.id);
      // Listen to SSE progress
      const response = await fetch(`http://localhost:5000/api/repo/${data.id}/progress`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        console.log(chunk);
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
    console.error("Error triggering index:", err.message);
  }
}

trigger();
