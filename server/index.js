const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log(`[INIT] Loading .env from: ${path.join(__dirname, '.env')}`);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resumeStuckRepos() {
  try {
    const stuckRepos = await prisma.repo.findMany({
      where: {
        status: { in: ['cloning', 'indexing', 'mapping', 'syncing'] }
      }
    });
    
    if (stuckRepos.length > 0) {
      console.log(`[INIT] Found ${stuckRepos.length} interrupted repository indexing task(s). Resuming...`);
      // repoRouter.runBackgroundIndex is not yet imported at this top level, we can require it dynamically
      const repoRouter = require('./routes/repo');
      for (const repo of stuckRepos) {
        repoRouter.runBackgroundIndex(repo.id, repo.url || `local://${repo.name}`, repo.localPath);
      }
    }
  } catch (err) {
    console.error(`[INIT] Startup repo resumption failed:`, err.message);
  }
}
resumeStuckRepos();

const app = express();
const PORT = process.env.PORT || 5000;

// Debug: confirm API key is loaded
console.log(`[ENV] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ MISSING – add it to server/.env'}`);

const { verifyToken } = require('./middleware/auth');

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'http://localhost:5173')
    : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const repoRouter = require('./routes/repo');
const chatRouter = require('./routes/chat');
const investigateRouter = require('./routes/investigate');

// Apply authentication middleware to API routes
app.use('/api/repo', verifyToken, repoRouter);
app.use('/api/repo', verifyToken, investigateRouter);
app.use('/api/chat', verifyToken, chatRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running smoothly 🚀' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});