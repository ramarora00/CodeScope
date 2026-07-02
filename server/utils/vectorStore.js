const lancedb = require("@lancedb/lancedb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/vectors");
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Gets embeddings for a text string using Gemini
 */
const getEmbedding = async (text) => {
  if (process.env.NODE_ENV === 'test') return Array(768).fill(0.1);
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

/**
 * Gets embeddings for a batch of text strings using Gemini
 */
const getEmbeddingsBatch = async (texts) => {
  if (process.env.NODE_ENV === 'test') return texts.map(() => Array(768).fill(0.1));
  if (!genAI || texts.length === 0) return [];
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContents({
      requests: texts.map(text => ({
        content: { parts: [{ text }] }
      }))
    });
    return result.embeddings.map(e => e.values);
  } catch (err) {
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

  // Process in batches of 50
  const batchSize = 50;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map(b => b.text);
    
    const vectors = await getEmbeddingsBatch(texts);
    
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
      // Fallback: Embed individually
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
