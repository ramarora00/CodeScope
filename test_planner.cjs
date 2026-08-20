require('dotenv').config();
const { Planner } = require('./server/utils/investigation/planner/Planner');
const { ContextBuilder } = require('./server/utils/investigation/planner/ContextBuilder');

class MockContextBuilder extends ContextBuilder {
  constructor(mockContextStr) {
    super();
    this.mockContextStr = mockContextStr;
  }
  async buildContext(repoId, mission, options) {
    return this.mockContextStr;
  }
}

async function runTests() {
  console.log("=== TEST A: IMMEDIATE RESOLUTION ===");
  const plannerA = new Planner();
  plannerA.contextBuilder = new MockContextBuilder(
    "FILE PATH: src/auth.js\nSNIPPET:\nfunction initializeAuth() { return true; }\n\n"
  );
  try {
    const resA = await plannerA.plan('repo-1', 'Where is authentication initialized?', { maxSteps: 5 });
    console.log(JSON.stringify(resA.plan, null, 2));
  } catch (e) { console.error(e); }

  console.log("\n=== TEST B: MULTI-STEP ===");
  const plannerB = new Planner();
  plannerB.contextBuilder = new MockContextBuilder(
    "FILE PATH: src/index.js\nSNIPPET:\nimport { startSystem } from './core';\n\n"
  );
  try {
    const resB = await plannerB.plan('repo-1', 'Trace the entire initialization sequence to the database.', { maxSteps: 5 });
    console.log(JSON.stringify(resB.plan, null, 2));
  } catch (e) { console.error(e); }

  console.log("\n=== TEST C: INSUFFICIENT CONTEXT ===");
  const plannerC = new Planner();
  plannerC.contextBuilder = new MockContextBuilder(
    "FILE PATH: src/utils.js\nSNIPPET:\nfunction add(a, b) { return a + b; }\n\n"
  );
  try {
    const resC = await plannerC.plan('repo-1', 'What is the speed of light in a vacuum?', { maxSteps: 5 });
    console.log(JSON.stringify(resC.plan, null, 2));
  } catch (e) { console.error(e); }
}

runTests();
