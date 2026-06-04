const express = require('express');
const router = express.Router();
const { generateResponse } = require('../utils/ai');
const { searchRepo } = require('../utils/vectorStore');
const { traverseGraph } = require('../utils/graphTraversal');
const GraphQueryService = require('../utils/graphQuery');
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
      // 1. INTENT CLASSIFICATION
      let intent = 'conceptual';
      let graphQueryType = null;
      let graphQueryTarget = null;
      
      const lowercasePrompt = prompt.toLowerCase();
      
      // Check for Graph Queries First
      if (lowercasePrompt.match(/who calls|callers of|where is (.*) called/)) {
        intent = 'graph_query'; graphQueryType = 'upstream';
      } else if (lowercasePrompt.match(/what routes use|routes reaching|routes hitting/)) {
        intent = 'graph_query'; graphQueryType = 'routes_reaching';
      } else if (lowercasePrompt.match(/what does .* call|callees of/)) {
        intent = 'graph_query'; graphQueryType = 'downstream';
      } else if (lowercasePrompt.match(/models touched by|dependencies of route/)) {
        intent = 'graph_query'; graphQueryType = 'route_dependencies';
      } else if (lowercasePrompt.match(/blast radius|if .* changes/)) {
        intent = 'graph_query'; graphQueryType = 'blast_radius';
      } else if (lowercasePrompt.includes('architecture') || lowercasePrompt.includes('summary') || lowercasePrompt.includes('overview') || lowercasePrompt.includes('folder') || lowercasePrompt.includes('tech stack')) {
        intent = 'architecture';
      } else if (lowercasePrompt.includes('flow') || lowercasePrompt.includes('execute') || lowercasePrompt.includes('how does') || lowercasePrompt.includes('route') || lowercasePrompt.includes('middleware')) {
        intent = 'execution';
      } else if (lowercasePrompt.includes('where is') || lowercasePrompt.includes('function') || lowercasePrompt.includes('class') || lowercasePrompt.includes('component')) {
        intent = 'symbolic';
      }

      console.log(`[Context Orchestrator] Classified Query Intent: ${intent.toUpperCase()}`);

      let globalContextParts = [];

      // Extract keywords for lookup
      const words = prompt.split(/\W+/).filter(w => w.length > 3);
      if (intent === 'graph_query') {
        // Try to guess the target symbol from the capitalized words or last words
        const possibleTargets = prompt.replace(/[?]/g, '').split(' ').filter(w => w.length > 3);
        graphQueryTarget = possibleTargets[possibleTargets.length - 1]; // naive target extraction
      }

      // A0. DETERMINISTIC GRAPH QUERY LAYER
      if (intent === 'graph_query' && graphQueryTarget) {
        console.log(`[Graph Query] Type: ${graphQueryType}, Target: ${graphQueryTarget}`);
        let graphResults = [];
        let queryDescription = '';

        if (graphQueryType === 'upstream') {
          graphResults = await GraphQueryService.whoCalls(repoId, graphQueryTarget);
          queryDescription = `Callers of ${graphQueryTarget}`;
        } else if (graphQueryType === 'downstream') {
          graphResults = await GraphQueryService.whatDoesCall(repoId, graphQueryTarget);
          queryDescription = `Callees of ${graphQueryTarget}`;
        } else if (graphQueryType === 'routes_reaching') {
          graphResults = await GraphQueryService.routesReaching(repoId, graphQueryTarget);
          queryDescription = `Routes that eventually call ${graphQueryTarget}`;
        } else if (graphQueryType === 'route_dependencies') {
          graphResults = await GraphQueryService.dependenciesTouchedBy(repoId, graphQueryTarget);
          queryDescription = `Deep dependencies and models touched by route ${graphQueryTarget}`;
        } else if (graphQueryType === 'blast_radius') {
          graphResults = await GraphQueryService.blastRadius(repoId, graphQueryTarget);
          queryDescription = `Blast radius if ${graphQueryTarget} changes`;
        }

        if (graphResults.length > 0) {
          const resultText = graphResults.map(r => `- ${r.name} (${r.type})`).join('\n');
          globalContextParts.push(`[DETERMINISTIC GRAPH QUERY RESULT: ${queryDescription}]\n${resultText}`);
        } else {
          globalContextParts.push(`[DETERMINISTIC GRAPH QUERY RESULT: ${queryDescription}]\nNo results found in the Knowledge Graph for exact symbol name '${graphQueryTarget}'.`);
        }
      }

      // A. STRUCTURAL LAYER (Always included for ARCHITECTURE or SUMMARY)
      if (intent === 'architecture' || lowercasePrompt.includes('architecture') || lowercasePrompt.includes('summary')) {
        const structuralFiles = await prisma.file.findMany({
          where: {
            repoId,
            OR: [
              { path: { contains: 'README.md' } },
              { path: { contains: 'package.json' } },
              { path: { contains: 'composer.json' } },
              { path: { contains: 'routes/' } }
            ]
          },
          take: 4
        });
        
        const structuralContext = structuralFiles
          .map(f => `[Structural File: ${f.path}]\n${f.content?.slice(0, 3000)}`)
          .join('\n---\n');
        if (structuralContext) globalContextParts.push(structuralContext);
      }

      // B. EXACT PATH LAYER (Prioritized match on files named after keywords)
      if (words.length > 0) {
        const keywordFiles = await prisma.file.findMany({
          where: {
            repoId,
            OR: words.map(w => ({ path: { contains: w } }))
          },
          take: 3
        });

        if (keywordFiles.length > 0) {
          const fileContext = keywordFiles
            .filter(f => f.content && (f.path.endsWith('.tsx') || f.path.endsWith('.jsx') || f.path.endsWith('.ts') || f.path.endsWith('.js') || f.path.endsWith('.php')))
            .map(f => `[Source File: ${f.path}]\n${f.content.slice(0, 5000)}`)
            .join('\n---\n');
          if (fileContext) globalContextParts.push(fileContext);
        }
      }

      // C. SYMBOLIC & CALL GRAPH LAYER (GRAPH EXPANSION)
      if (words.length > 0) {
        const symbolMatches = await prisma.symbol.findMany({
          where: {
            repoId,
            name: { in: words }
          },
          include: {
            file: true
          },
          take: 5
        });

        if (symbolMatches.length > 0) {
          let symbolicTextParts = [];
          for (const sym of symbolMatches) {
            let part = `[Symbol Definition: ${sym.name} (${sym.type}) in ${sym.file.path}]\n`;
            if (sym.file.content) {
              const lines = sym.file.content.split('\n');
              part += lines.slice(Math.max(0, sym.lineStart - 1), sym.lineEnd).join('\n');
            }

            // GRAPH EXPANSION (Trace Downstream and Upstream relationships)
            const relationships = await prisma.symbolRelationship.findMany({
              where: {
                OR: [
                  { callerId: sym.id },
                  { calleeId: sym.id }
                ]
              },
              include: {
                caller: { include: { file: true } },
                callee: { include: { file: true } }
              },
              take: 6
            });

            if (relationships.length > 0) {
              const calls = relationships
                .filter(r => r.callerId === sym.id && r.relationship === 'calls')
                .map(r => `${r.callee.name} (${r.callee.type} in ${r.callee.file.path})`);
              
              const calledBy = relationships
                .filter(r => r.calleeId === sym.id && r.relationship === 'calls')
                .map(r => `${r.caller.name} (${r.caller.type} in ${r.caller.file.path})`);

              if (calls.length > 0) part += `\n- This ${sym.type} calls: ${calls.join(', ')}`;
              if (calledBy.length > 0) part += `\n- This ${sym.type} is called by: ${calledBy.join(', ')}`;

              // For execution flows, grab the first line of the child implementations
              for (const rel of relationships.slice(0, 3)) {
                if (rel.callerId === sym.id && rel.callee.file.content) {
                  const childLines = rel.callee.file.content.split('\n');
                  const childSnippet = childLines.slice(Math.max(0, rel.callee.lineStart - 1), rel.callee.lineEnd).join('\n');
                  part += `\n\n[Called Symbol Implementation: ${rel.callee.name}]\n${childSnippet.slice(0, 1000)}`;
                }
              }
            }
            symbolicTextParts.push(part);
          }
          globalContextParts.push(symbolicTextParts.join('\n---\n'));
        }
      }

      // D. SEMANTIC LAYER (Fallback / Broad Context)
      if (globalContextParts.length === 0 || intent === 'conceptual') {
        const semanticResults = await searchRepo(repoId, prompt, 10);
        if (semanticResults.length > 0) {
          const resultsContext = semanticResults.map(r => `[Semantic Chunk: ${r.path}]\n${r.text}`).join('\n---\n');
          globalContextParts.push(resultsContext);
        }
      }

      // E. ROUTE FLOW INJECTION (If execution intent)
      if (intent === 'execution') {
        const routes = await prisma.symbol.findMany({
          where: { repoId, type: 'route' },
          include: { file: true },
          take: 4
        });

        if (routes.length > 0) {
          const routeContextParts = [];
          for (const route of routes) {
            const paths = await traverseGraph(repoId, route.id, 'down', 4);
            
            if (paths.length > 0) {
              let text = `[API Route: ${route.name} in ${route.file.path}]\nExecution Flow Traces:\n`;
              paths.forEach((p, idx) => {
                const traceStr = p.map(sym => `${sym.name} (${sym.type})`).join('  ->  ');
                text += `  Trace ${idx + 1}: ${traceStr}\n`;
              });
              routeContextParts.push(text);
            }
          }
          if (routeContextParts.length > 0) {
            globalContextParts.push(routeContextParts.join('\n---\n'));
          }
        }
      }

      // Compile orchestrated context
      context.globalContext = globalContextParts.join('\n\n=================================\n\n');
      context.intent = intent;
    }

    const answer = await generateResponse(prompt, context);
    
    // Extract file paths from context parts for the UI
    const usedFiles = [];
    if (context.globalContext) {
       const regex = /\[(?:Source File|Structural File|Symbol Definition|API Route): (.*?)\]/g;
       let match;
       while ((match = regex.exec(context.globalContext)) !== null) {
          // extract filename from path or name
          let f = match[1].split('(')[0].trim().split(' ').pop(); 
          if (!usedFiles.includes(f)) usedFiles.push(f);
       }
    }

    res.json({ 
      answer, 
      contextMeta: { 
        intent: context.intent || 'general', 
        files: usedFiles.slice(0, 5) 
      } 
    });
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

module.exports = router;
