require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getEmbeddingsBatch(texts, stats, batchIndex) {
  const startTime = Date.now();
  let retries = 0;
  let maxRetries = 8;
  const delay = 3000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      stats.apiRequests++;
      console.log(`    [Batch ${batchIndex}] Attempt ${i + 1} sending ${texts.length} chunks...`);
      const result = await model.batchEmbedContents({
        requests: texts.map(text => ({
          content: { parts: [{ text }] }
        }))
      });
      const latency = Date.now() - startTime;
      stats.totalLatency += latency;
      stats.successfulBatches++;
      console.log(`    [Batch ${batchIndex}] Success in ${latency}ms`);
      return result.embeddings.map(e => e.values);
    } catch (err) {
      if (err.message?.includes("Quota exceeded") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        stats.quotaErrors++;
        console.error(`    [Batch ${batchIndex}] Quota error: ${err.message}`);
        throw err;
      }
      
      const isRateLimit = (err.message?.includes("429") || err.status === 429);
      const is503 = (err.message?.includes("503") || err.status === 503);
      
      if (isRateLimit) stats.err429++;
      if (is503) stats.err503++;
      
      if (i < maxRetries - 1) {
        retries++;
        stats.retries++;
        let waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        
        if (err.errorDetails && Array.isArray(err.errorDetails)) {
          const retryInfo = err.errorDetails.find(d => d.retryDelay || d['@type']?.includes('RetryInfo'));
          if (retryInfo && retryInfo.retryDelay) {
             const seconds = parseFloat(retryInfo.retryDelay);
             if (!isNaN(seconds)) waitTime = Math.max(seconds * 1000, waitTime);
          }
        }
        console.warn(`    [Batch ${batchIndex}] Error (429/503). Retrying in ${Math.round(waitTime)}ms. Msg: ${err.message}`);
        await sleep(waitTime);
        continue;
      }
      console.error(`    [Batch ${batchIndex}] Failed after max retries.`);
      throw err;
    }
  }
}

async function runBenchmark(batchSize, totalChunks, withArtificialDelay) {
  console.log(`\n--- Running Benchmark: BatchSize=${batchSize}, Delay=${withArtificialDelay ? '12s' : '0s'} ---`);
  
  const stats = {
    totalChunks,
    apiRequests: 0,
    err429: 0,
    err503: 0,
    retries: 0,
    quotaErrors: 0,
    successfulBatches: 0,
    totalLatency: 0, 
    startTime: Date.now(),
    elapsedTime: 0
  };

  const dummyChunk = "function example() { return 'hello world'; }\n".repeat(25);
  const allChunks = Array(totalChunks).fill(dummyChunk);

  try {
    let batchIndex = 0;
    for (let i = 0; i < allChunks.length; i += batchSize) {
      batchIndex++;
      const batch = allChunks.slice(i, i + batchSize);
      
      if (i > 0 && withArtificialDelay) {
        console.log(`  Artificial delay 12s before batch ${batchIndex}...`);
        await sleep(12000);
      }
      
      await getEmbeddingsBatch(batch, stats, batchIndex);
    }
    stats.elapsedTime = Date.now() - stats.startTime;
    stats.status = "SUCCESS";
  } catch (err) {
    stats.elapsedTime = Date.now() - stats.startTime;
    stats.status = "FAILED: " + err.message;
  }
  
  stats.avgRequestLatency = stats.successfulBatches > 0 ? (stats.totalLatency / stats.successfulBatches) : 0;
  
  console.log("RESULT:", JSON.stringify(stats, null, 2));
  return stats;
}

async function main() {
  const totalChunks = 100; // testing with 100 chunks for speed

  await runBenchmark(5, totalChunks, true); // Current
  await runBenchmark(25, totalChunks, false);
  await runBenchmark(50, totalChunks, false);
  await runBenchmark(100, totalChunks, false);
}

main();
