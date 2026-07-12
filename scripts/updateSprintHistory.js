// scripts/updateSprintHistory.js
// Usage: node scripts/updateSprintHistory.js <sprint-number> "<commit-message>" "<summary>"
// This script appends a formatted entry to docs/06_Engineering/SprintHistory.md.
// It does NOT commit the change; you must run `git add`/`git commit` manually.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [ , , sprintNumber, commitMsg, summary ] = process.argv;
if (!sprintNumber || !commitMsg || !summary) {
  console.error('Usage: node scripts/updateSprintHistory.js <sprint-number> "<commit-message>" "<summary>"');
  process.exit(1);
}

const filePath = path.resolve(__dirname, '..', 'docs', '06_Engineering', 'SprintHistory.md');
const now = new Date().toISOString();

const entry = `## Sprint ${sprintNumber} — ${summary.split('\n')[0] || ''}\n\n**Commit**\n${commitMsg}\n\n**Status**\n✅ Completed\n\n**Summary**\n${summary}\n\n*Recorded on ${now}*\n\n`;

fs.appendFileSync(filePath, entry, { encoding: 'utf8' });
console.log(`✅ Sprint ${sprintNumber} entry appended to ${filePath}`);
