const lancedb = require("@lancedb/lancedb");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/vectors");
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Gets embeddings for a text string using Gemini
 */
const getEmbedding = async (text) => {
  if (!genAI) return null;
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

/**
 * Indexes files into the vector database
 */
const indexRepo = async (repoId, files) => {
  if (!genAI) return;

  const db = await lancedb.connect(DB_PATH);
  const tableName = `repo_${repoId.replace(/-/g, '_')}`;
  
  const data = [];

  for (const file of files) {
    if (!file.content) continue;

    // Chunking: Split large files into smaller pieces (approx 1000 chars)
    const chunks = file.content.match(/[\s\S]{1,1000}/g) || [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = await getEmbedding(chunk);
      
      if (vector) {
        data.push({
          vector,
          text: chunk,
          path: file.path,
          chunkIndex: i
        });
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
