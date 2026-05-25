/**
 * Worker Thread: AST Parser
 * 
 * This runs in a separate thread from the main Express server.
 * It receives file content + filename, runs Babel AST parsing,
 * and returns the extracted metadata back to the main thread.
 * 
 * This prevents CPU-intensive parsing from blocking HTTP requests.
 */
const { parentPort, workerData } = require('worker_threads');
const { parseCode } = require('./parser');

const { files } = workerData;
const results = [];

for (const file of files) {
  try {
    const parsed = parseCode(file.content, file.filename);
    results.push({
      path: file.path,
      content: file.content,
      language: file.language,
      filename: file.filename,
      metadata: parsed ? JSON.stringify(parsed) : null
    });
  } catch (err) {
    results.push({
      path: file.path,
      content: file.content,
      language: file.language,
      filename: file.filename,
      metadata: null
    });
  }
}

parentPort.postMessage(results);
