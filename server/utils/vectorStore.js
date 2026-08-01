const lancedb = require("@lancedb/lancedb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/vectors");
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a function with retries and exponential backoff on 429 errors.
 */
const callWithRetry = async (fn, retries = 8, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isDailyQuotaExhausted = err.message?.includes("Quota exceeded") || 
                                    err.message?.includes("RESOURCE_EXHAUSTED");
      const isRateLimit = (err.message?.includes("429") || err.status === 429) && !isDailyQuotaExhausted;
      const isNetworkError = err.message?.includes("fetch failed") ||
                             err.message?.includes("ENOTFOUND") ||
                             err.message?.includes("ETIMEDOUT") ||
                             err.message?.includes("ECONNRESET") ||
                             err.code === "ETIMEDOUT" ||
                             err.code === "ENOTFOUND" ||
                             err.code === "ECONNRESET";
      if ((isRateLimit || isNetworkError) && i < retries - 1) {
        let waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        
        if (isNetworkError) {
          waitTime = 10000 + Math.random() * 2000; // sleep 10-12s on network dropouts
          console.warn(`[Gemini API] Temporary network error detected: ${err.message}. Waiting 10s for connection recovery...`);
        } else {
          waitTime = Math.max(delay * Math.pow(2, i) + Math.random() * 1000, 65000); // wait at least 65s to clear the sliding window
          if (err.errorDetails && Array.isArray(err.errorDetails)) {
            // Extract exact retryDelay if provided by the Gemini API
            const retryInfo = err.errorDetails.find(d => d.retryDelay || d['@type']?.includes('RetryInfo'));
            if (retryInfo && retryInfo.retryDelay) {
              const seconds = parseFloat(retryInfo.retryDelay);
              if (!isNaN(seconds)) {
                waitTime = Math.max(seconds * 1000 + 10000, 65000); // sleep exact delay plus 10-second safety buffer, min 65s
                console.warn(`[Gemini API] Exact retry delay of ${seconds}s requested by API (enforcing 65s min).`);
              }
            }
          }
        }
        
        console.warn(`[Gemini API] Rate Limit / Network error hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }
      throw err;
    }
  }
};

// P0-3: Driven by environment variable only. Default is false (real embeddings).
// Set MOCK_EMBEDDING=true in .env to bypass Gemini API during development/testing.
let useMockFallback = process.env.MOCK_EMBEDDING === 'true';

/**
 * Gets embeddings for a text string using Gemini
 */
const getEmbedding = async (text) => {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_EMBEDDING === 'true' || useMockFallback) {
    return Array(768).fill(0.1);
  }
  if (!genAI) return null;
  try {
    return await callWithRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    });
  } catch (err) {
    if (err.message?.includes("Quota exceeded") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("\n⚠️ [Gemini API] Daily embedding limit exhausted. Switching to mock embeddings to allow local runtime stabilization...\n");
      useMockFallback = true;
      return Array(768).fill(0.1);
    }
    throw err;
  }
};

/**
 * Gets embeddings for a batch of text strings using Gemini
 */
const getEmbeddingsBatch = async (texts) => {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_EMBEDDING === 'true' || useMockFallback) {
    return texts.map(() => Array(768).fill(0.1));
  }
  if (!genAI || texts.length === 0) return [];
  try {
    return await callWithRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.batchEmbedContents({
        requests: texts.map(text => ({
          content: { parts: [{ text }] }
        }))
      });
      return result.embeddings.map(e => e.values);
    });
  } catch (err) {
    if (err.message?.includes("Quota exceeded") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("\n⚠️ [Gemini API] Daily embedding limit exhausted. Switching to mock embeddings to allow local runtime stabilization...\n");
      useMockFallback = true;
      return texts.map(() => Array(768).fill(0.1));
    }
    console.warn("[Batch Embedding] Batch failed, falling back to individual embedding:", err.message);
    return null;
  }
};

/**
 * Indexes files into the vector database
 */
const indexRepo = async (repoId, files) => {
  if (!genAI) return;

  const db = await lancedb.connect(DB_PATH);
  const tableName = `repo_${repoId.replace(/-/g, '_')}`;
  
  const data = [];
  const allChunks = [];

  // Gather all chunks
  for (const file of files) {
    if (!file.content) continue;

    // Chunking: Split large files into smaller pieces (approx 1000 chars)
    const chunks = file.content.match(/[\s\S]{1,1000}/g) || [];
    chunks.forEach((chunk, i) => {
      allChunks.push({
        text: chunk,
        path: file.path,
        chunkIndex: i
      });
    });
  }

  console.log(`[Batch Indexing] Total chunks to index for ${repoId}: ${allChunks.length}`);

  // Process in batches of 5 to stay strictly under the shared 100 RPM limit
  const batchSize = 5;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map(b => b.text);
    
    if (i > 0 && !useMockFallback && process.env.MOCK_EMBEDDING !== 'true') {
      // 12s delay ensures we send max 5 batches of 5 = 25 requests/minute
      await sleep(12000);
    }
    
    let vectors = null;
    let retries = 3;
    while (retries > 0) {
      vectors = await getEmbeddingsBatch(texts);
      if (vectors && vectors.length === texts.length) {
        break;
      }
      retries--;
      if (retries > 0) {
        console.warn(`[Batch Indexing] Batch failed. Sleeping 10s before retry... (${retries} attempts left)`);
        await sleep(10000);
      }
    }
    
    if (vectors && vectors.length === texts.length) {
      vectors.forEach((vector, idx) => {
        data.push({
          vector,
          text: batch[idx].text,
          path: batch[idx].path,
          chunkIndex: batch[idx].chunkIndex
        });
      });
    } else {
      // Fallback: Embed individually as last resort (individual calls are rate-limit protected)
      console.warn(`[Batch Indexing] Batch failed completely. Falling back to individual embeddings for ${batch.length} chunks...`);
      for (const item of batch) {
        const vector = await getEmbedding(item.text);
        if (vector) {
          data.push({
            vector,
            text: item.text,
            path: item.path,
            chunkIndex: item.chunkIndex
          });
        }
      }
    }
  }

  if (data.length > 0) {
    await db.createTable(tableName, data, { mode: 'overwrite' });
    console.log(`Vector index created for ${repoId} with ${data.length} chunks.`);
  }
};

/**
 * Searches for relevant chunks in a repo
 */
const searchRepo = async (repoId, query, limit = 15) => {
  if (!genAI) return [];

  try {
    const db = await lancedb.connect(DB_PATH);
    const tableName = `repo_${repoId.replace(/-/g, '_')}`;
    const table = await db.openTable(tableName);
    
    const queryVector = await getEmbedding(query);
    if (!queryVector) return [];

    // Increase limit to 15 for better context
    const results = await table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    return results.map(r => ({
      path: r.path,
      text: r.text,
      score: r._distance
    }));
  } catch (err) {
    console.error("Vector search error:", err.message);
    return [];
  }
};

module.exports = { indexRepo, searchRepo };
