const lancedb = require("@lancedb/lancedb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const rebuildLocks = new Map();

const DB_PATH = process.env.VECTOR_DB_PATH || path.join(__dirname, "../data/vectors");
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a function with retries and exponential backoff on 429 errors.
 */
const callWithRetry = async (fn, retries = 8, delay = 3000, benchmarkCtx = null) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = (err.message?.includes("429") || err.status === 429) ||
        err.message?.includes("Quota exceeded") ||
        err.message?.includes("RESOURCE_EXHAUSTED");
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
          if (benchmarkCtx) { benchmarkCtx.networkRetries = (benchmarkCtx.networkRetries || 0) + 1; }
        } else {
          waitTime = Math.max(delay * Math.pow(2, i) + Math.random() * 1000, 65000); // wait at least 65s to clear the sliding window
          if (benchmarkCtx) { benchmarkCtx.quota429s = (benchmarkCtx.quota429s || 0) + 1; benchmarkCtx.totalRetryWaitMs = (benchmarkCtx.totalRetryWaitMs || 0) + waitTime; }
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

// Mock mode must be explicitly enabled
const isMockEnabled = () => process.env.EMBEDDING_PROVIDER === 'mock' || process.env.MOCK_EMBEDDING === 'true' || process.env.NODE_ENV === 'test';

/**
 * Gets embeddings for a text string using Gemini
 */
const getEmbedding = async (text) => {
  if (isMockEnabled()) {
    return Array(768).fill(0.1);
  }
  if (!genAI) return null;
  return await callWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  });
};

/**
 * Gets embeddings for a batch of text strings using Gemini
 */
const getEmbeddingsBatch = async (texts, benchmarkCtx = null) => {
  if (isMockEnabled()) {
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
    }, 8, 3000, benchmarkCtx);
  } catch (err) {
    console.warn("[Batch Embedding] Batch failed after max retries:", err.message);
    return null; // Will trigger individual fallback in indexRepo
  }
};

/**
 * Indexes files into the vector database
 */
const crypto = require('crypto');

const indexRepo = async (repoId, files, onProgress = null, startChunk = 0, batchSize = 50) => {
  if (!genAI && !isMockEnabled()) return;

  const db = await lancedb.connect(DB_PATH);
  const tableName = `repo_${repoId.replace(/-/g, '_')}`;

  const allChunks = [];
  for (const file of files) {
    if (!file.content) continue;
    const chunks = file.content.match(/[\s\S]{1,1000}/g) || [];
    chunks.forEach((chunk, i) => {
      const idStr = `${repoId}-${file.path}-${i}`;
      const chunkId = crypto.createHash('sha256').update(idStr).digest('hex').substring(0, 16);
      allChunks.push({
        id: chunkId,
        text: chunk,
        path: file.path,
        chunkIndex: i
      });
    });
  }

  const totalChunks = allChunks.length;
  if (onProgress && startChunk === 0) {
    await onProgress(0, totalChunks);
  }

  if (startChunk >= totalChunks) {
    console.log(`[Batch Indexing] Already completed indexing for ${repoId}`);
    return;
  }

  console.log(`[Batch Indexing] Indexing ${totalChunks} chunks for ${repoId} (Resuming from ${startChunk})`);

  let table;
  let tableCreated = false;
  try {
    if (startChunk === 0) {
      await db.dropTable(tableName).catch(() => {});
    } else {
      table = await db.openTable(tableName);
      tableCreated = true;
    }
  } catch (e) {
    // table doesn't exist
  }
  const totalBatches = Math.ceil((allChunks.length - startChunk) / batchSize);
  let batchNumber = 0;
  // ── BENCHMARK counters ────────────────────────────────────────────────────
  const bm = { quota429s: 0, networkRetries: 0, totalRetryWaitMs: 0, apiRequests: 0, fallbackBatches: 0 };
  // ─────────────────────────────────────────────────────────────────────────

  for (let i = startChunk; i < allChunks.length; i += batchSize) {
    batchNumber++;
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map(b => b.text);
    const chunkFrom = i + 1;
    const chunkTo = Math.min(i + batchSize, totalChunks);

    console.log(`[PASS 3] Batch ${batchNumber}/${totalBatches} | Chunks: ${chunkFrom}–${chunkTo} | Requesting Gemini embeddings...`);
    const batchStart = Date.now();
    bm.apiRequests++;

    let vectors = await getEmbeddingsBatch(texts, bm);
    const batchMs = Date.now() - batchStart;

    const dataToInsert = [];
    if (vectors && vectors.length === texts.length) {
      console.log(`[PASS 3] Batch ${batchNumber}/${totalBatches} | ✅ Response received in ${(batchMs / 1000).toFixed(2)}s | ${texts.length} embeddings stored`);
      vectors.forEach((vector, idx) => {
        dataToInsert.push({ ...batch[idx], vector });
      });
    } else {
      console.warn(`[PASS 3] Batch ${batchNumber}/${totalBatches} | ⚠ Batch failed — falling back to individual embeddings for ${batch.length} chunks...`);
      bm.fallbackBatches++;
      for (const item of batch) {
        const vector = await getEmbedding(item.text);
        if (vector) dataToInsert.push({ ...item, vector });
      }
    }

    if (dataToInsert.length > 0) {
      if (!tableCreated) {
        table = await db.createTable(tableName, dataToInsert);
        tableCreated = true;
      } else {
        await table.add(dataToInsert);
      }
    }
    
    if (onProgress) {
      await onProgress(Math.min(i + batchSize, totalChunks), totalChunks);
    }
  }

  // ── PASS 3 BENCHMARK SUMMARY ──────────────────────────────────────────────
  console.log(`[PASS 3] ✅ Complete | Repo: ${repoId}`);
  console.log(`[PASS 3] Total chunks: ${totalChunks} | Batches: ${totalBatches} | API requests: ${bm.apiRequests}`);
  console.log(`[PASS 3] 429/quota retries: ${bm.quota429s} | Network retries: ${bm.networkRetries} | Fallback batches: ${bm.fallbackBatches}`);
  if (bm.totalRetryWaitMs > 0) console.log(`[PASS 3] Total quota wait time: ${(bm.totalRetryWaitMs / 1000).toFixed(1)}s`);
  // ─────────────────────────────────────────────────────────────────────────
};

/**
 * Background recovery: Rebuilds LanceDB vectors from PostgreSQL file content
 */
const triggerVectorRebuild = async (repoId) => {
  if (rebuildLocks.has(repoId)) return;
  
  const rebuildPromise = (async () => {
    try {
      console.log(`[Resilience] Triggering background vector rebuild for missing LanceDB table: ${repoId}`);
      const allFiles = await prisma.file.findMany({
        where: { repoId },
        select: { path: true, content: true }
      });
      await indexRepo(repoId, allFiles);
      console.log(`[Resilience] ✅ Vector rebuild complete for ${repoId}`);
    } catch (err) {
      console.error(`[Resilience] ❌ Vector rebuild failed for ${repoId}:`, err);
    } finally {
      rebuildLocks.delete(repoId);
    }
  })();
  
  rebuildLocks.set(repoId, rebuildPromise);
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
    const isMissingTable = err.message && (
      err.message.toLowerCase().includes("not found") ||
      err.message.toLowerCase().includes("does not exist") ||
      err.message.toLowerCase().includes("no such file") ||
      err.message.toLowerCase().includes("failed to open table")
    );

    if (isMissingTable) {
      console.warn(`[LanceDB] Table missing for ${repoId}. Initiating background recovery...`);
      triggerVectorRebuild(repoId); // Fire and forget background recovery
      return []; // Return empty semantic context immediately so request doesn't hang
    }

    console.error("Vector search error:", err.message);
    return [];
  }
};

module.exports = { indexRepo, searchRepo };
