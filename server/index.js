const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log(`[INIT] Loading .env from: ${path.join(__dirname, '.env')}`);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupStuckRepos() {
  try {
    const res = await prisma.repo.updateMany({
      where: {
        status: { in: ['cloning', 'indexing', 'mapping', 'syncing'] }
      },
      data: { status: 'error' }
    });
    if (res.count > 0) {
      console.log(`[INIT] Cleaned up ${res.count} stuck repository indexing task(s).`);
    }
  } catch (err) {
    console.error(`[INIT] Startup database cleanup failed:`, err.message);
  }
}
cleanupStuckRepos();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: confirm API key is loaded
console.log(`[ENV] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING – add it to server/.env'}`);

app.use(cors());
app.use(express.json());

// Routes
const repoRouter = require('./routes/repo');
const chatRouter = require('./routes/chat');
const investigateRouter = require('./routes/investigate');
app.use('/api/repo', repoRouter);
app.use('/api/repo', investigateRouter);
app.use('/api/chat', chatRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running smoothly 🚀' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});