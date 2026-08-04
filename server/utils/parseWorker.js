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

const fs = require('fs');
const path = require('path');

const { files, repoPath } = workerData;
const results = [];

for (const file of files) {
  try {
    const fullPath = path.join(repoPath, file.path);
    const content = fs.readFileSync(fullPath, 'utf8');
    const parsed = parseCode(content, file.filename);
    results.push({
      path: file.path,
      language: file.language,
      filename: file.filename,
      content, // Need to pass content back for the DB
      metadata: parsed ? JSON.stringify(parsed) : null
    });
  } catch (err) {
    results.push({
      path: file.path,
      language: file.language,
      filename: file.filename,
      content: null,
      metadata: null
    });
  }
}

parentPort.postMessage(results);
