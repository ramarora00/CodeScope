const express = require('express');
const router = express.Router();
const { generateResponse } = require('../utils/ai');
const { searchRepo } = require('../utils/vectorStore');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @route   POST /api/chat
// @desc    Ask a question about the codebase
router.post('/', async (req, res) => {
  const { prompt, repoId, filePath } = req.body;

  try {
    let context = {};

    if (repoId && filePath) {
      // Fetch file content and metadata from DB for context
      const file = await prisma.file.findUnique({
        where: {
          repoId_path: {
            repoId: repoId,
            path: filePath
          }
        }
      });

      if (file) {
        context = {
          fileName: filePath.split('/').pop(),
          language: file.language,
          content: file.content,
          metadata: file.metadata
        };
      }
    }

    // Global Semantic Context (RAG)
    if (repoId) {
      // If asking about architecture, force-include some structural hits
      const enhancedPrompt = prompt.toLowerCase().includes('architecture') 
        ? `${prompt} (focus on project structure and dependencies)`
        : prompt;

      const semanticResults = await searchRepo(repoId, enhancedPrompt);
      
      // Extract keywords for exact lookups
      const words = prompt.split(/\W+/).filter(w => w.length > 3);

      // FILE PATH LOOKUP: Find files named after keywords (e.g. Button -> Button.tsx)
      const keywordFiles = await prisma.file.findMany({
        where: {
          repoId,
          OR: words.map(w => ({ path: { contains: w } }))
        },
        take: 3
      });

      if (keywordFiles.length > 0) {
        const fileContext = keywordFiles
          .filter(f => f.content && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx') || f.path.endsWith('.ts') || f.path.endsWith('.js')))
          .map(f => `[Source File: ${f.path}]\n${f.content.slice(0, 5000)}`)
          .join('\n---\n');
        context.globalContext = (context.globalContext || '') + '\n' + fileContext;
      }

      // SYMBOLIC LOOKUP: Find exact symbols mentioned in the prompt
      const symbolicHits = await prisma.symbol.findMany({
        where: {
          repoId,
          name: { in: words },
        },
        include: {
          file: true,
          callees: { include: { callee: { include: { file: true } } } }
        },
        take: 5
      });

      if (symbolicHits.length > 0) {
        const symbolicContext = symbolicHits.map(s => {
          let text = `[Symbol Definition: ${s.name} (${s.type}) in ${s.file.path}]\n`;
          if (s.file.content) {
            const lines = s.file.content.split('\n');
            text += lines.slice(Math.max(0, s.lineStart - 1), s.lineEnd).join('\n');
          }
          if (s.callees.length > 0) {
            text += `\n[This ${s.type} calls: ${s.callees.map(c => c.callee.name).join(', ')}]`;
          }
          return text;
        }).join('\n---\n');
        context.globalContext = (context.globalContext || '') + '\n' + symbolicContext;
      }

      // Explicitly find structural files if asking about architecture/summary
      if (prompt.toLowerCase().includes('architecture') || prompt.toLowerCase().includes('summary')) {
        const structuralFiles = await prisma.file.findMany({
          where: {
            repoId,
            OR: [
              { path: { contains: 'README.md' } },
              { path: { contains: 'package.json' } },
              { path: { contains: 'composer.json' } }
            ]
          },
          take: 3
        });
        
        const structuralContext = structuralFiles.map(f => `[Structural File: ${f.path}]\n${f.content?.slice(0, 2000)}`).join('\n---\n');
        context.globalContext = (context.globalContext || '') + '\n' + structuralContext;
      }

      if (semanticResults.length > 0) {
        const resultsContext = semanticResults.map(r => `[File: ${r.path}]\n${r.text}`).join('\n---\n');
        context.globalContext = (context.globalContext || '') + '\n' + resultsContext;
      }
    }

    const answer = await generateResponse(prompt, context);
    res.json({ answer });
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

module.exports = router;
