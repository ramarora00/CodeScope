const express = require('express');
const router = express.Router();
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REPOS_DIR = path.join(__dirname, '../../repos');

// Ensure repos directory exists
if (!fs.existsSync(REPOS_DIR)) {
  fs.mkdirSync(REPOS_DIR, { recursive: true });
}

// @route   POST /api/repo/upload
// @desc    Clone a GitHub repository
router.post('/upload', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    // Extract repo name from URL
    const repoName = repoUrl.split('/').pop().replace('.git', '') + '-' + Date.now();
    const localPath = path.join(REPOS_DIR, repoName);

    console.log(`Cloning ${repoUrl} to ${localPath}...`);

    // Clone the repo
    await simpleGit().clone(repoUrl, localPath);

    // Save to DB
    const repo = await prisma.repo.create({
      data: {
        name: repoName,
        url: repoUrl,
        localPath: localPath,
      },
    });

    res.json({ message: 'Repository cloned successfully', repo });
  } catch (error) {
    console.error('Clone Error:', error);
    res.status(500).json({ error: 'Failed to clone repository', details: error.message });
  }
});

// @route   GET /api/repo
// @desc    Get all repos
router.get('/', async (req, res) => {
  try {
    const repos = await prisma.repo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(repos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// @route   GET /api/repo/:id/files
// @desc    Get file tree for a repo
router.get('/:id/files', async (req, res) => {
  try {
    const repo = await prisma.repo.findUnique({
      where: { id: req.params.id },
    });

    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const getFileTree = (dirPath, relativePath = '') => {
      const files = fs.readdirSync(dirPath);
      let tree = [];

      files.forEach((file) => {
        if (file === '.git' || file === 'node_modules') return;

        const fullPath = path.join(dirPath, file);
        const relPath = path.join(relativePath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          tree.push({
            name: file,
            path: relPath,
            type: 'directory',
            children: getFileTree(fullPath, relPath),
          });
        } else {
          tree.push({
            name: file,
            path: relPath,
            type: 'file',
          });
        }
      });

      return tree;
    };

    const tree = getFileTree(repo.localPath);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file tree' });
  }
});

// @route   GET /api/repo/:id/file/content
// @desc    Get content of a file
router.get('/:id/file/content', async (req, res) => {
  const { filePath } = req.query;
  try {
    const repo = await prisma.repo.findUnique({
      where: { id: req.params.id },
    });

    if (!repo) return res.status(404).json({ error: 'Repo not found' });

    const fullPath = path.join(repo.localPath, filePath);
    
    // Safety check: ensure file is within repo dir
    if (!fullPath.startsWith(repo.localPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

module.exports = router;
