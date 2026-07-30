const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { EventFactory } = require('../../utils/investigation/domain/events');
const { SSETransport } = require('../../utils/investigation/transport/SSETransport');

const app = express();
app.use(cors());
app.use(express.json());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get('/api/test/stress-investigation', async (req, res) => {
  const mode = req.query.mode || 'long'; // modes: 'long', 'huge_file', 'burst'

  const transport = new SSETransport(res);
  const sessionId = uuidv4();
  const repoId = 'stress-repo-1';
  
  let currentSequence = 1;
  const context = {
    sessionId,
    repoId,
    getCurrentSequence: () => currentSequence++, // Fake sequence
    currentFile: null,
    isCancelled: false
  };

  const factory = new EventFactory(context);

  req.on('close', () => {
    context.isCancelled = true;
  });

  transport.start(sessionId);
  transport.publish(factory.investigationStarted({ mode, note: 'Stress test initiated' }));

  if (mode === 'long') {
    // Generate ~1200 events
    for (let i = 0; i < 150; i++) {
      if (context.isCancelled) break;
      const file = `src/module_${i}.js`;
      transport.publish(factory.fileSelected(file, `Testing long sequence ${i}`, 0.99));
      await sleep(50);
      transport.publish(factory.fileReadStarted(file, `Reading ${file}`));
      await sleep(20);
      
      for (let p = 1; p <= 5; p++) {
        transport.publish(factory.fileReadProgress(file, p * 20, 100, null));
        await sleep(10);
      }
      transport.publish(factory.fileReadCompleted(file, 100));
      
      if (i % 10 === 0) {
        transport.publish(factory.evidenceAdded(`Discovered important fact at iteration ${i}`, { file }));
      }
    }
  } else if (mode === 'huge_file') {
    const file = `src/huge_monolithic_controller.js`;
    transport.publish(factory.fileSelected(file, `Testing huge file`, 0.8));
    await sleep(100);
    transport.publish(factory.fileReadStarted(file, `Reading massive file`));
    
    for (let p = 1; p <= 5000; p++) {
      if (context.isCancelled) break;
      transport.publish(factory.fileReadProgress(file, p, 5000, null));
      if (p % 100 === 0) await sleep(1); 
    }
    transport.publish(factory.fileReadCompleted(file, 5000));
  } else if (mode === 'burst') {
    for (let i = 0; i < 50; i++) {
      if (context.isCancelled) break;
      const from = `src/comp_${i}.js`;
      const to = `src/comp_${i + 1}.js`;
      
      transport.publish(factory.fileSelected(from, 'burst testing', 0.5));
      transport.publish(factory.symbolDiscovered(`Symbol${i}`, 'class', 0.9, { file: from }));
      transport.publish(factory.jumpStarted(from, to, 'burst jump', 'traversal'));
      await sleep(10);
      transport.publish(factory.jumpCompleted(to));
    }
  }

  if (!context.isCancelled) {
    transport.publish(factory.investigationCompleted({ conclusion: 'Stress test complete', status: 'success' }));
    transport.close();
  }
});

const PORT = process.env.STRESS_PORT || 5005;
app.listen(PORT, () => {
  console.log(`Stress Test Server running on port ${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  http://localhost:${PORT}/api/test/stress-investigation?mode=long`);
  console.log(`  http://localhost:${PORT}/api/test/stress-investigation?mode=huge_file`);
  console.log(`  http://localhost:${PORT}/api/test/stress-investigation?mode=burst`);
});
