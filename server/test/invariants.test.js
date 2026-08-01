const assert = require('assert');
const { Classification } = require('../utils/investigation/planner/Classification');
const { DefaultStrategy } = require('../utils/investigation/planner/DefaultStrategy');

function runTests() {
  console.log('Running Architectural Invariant Tests...');

  // Invariant 1: RepositoryModel Immutability
  try {
    const snap = {
      repoId: 'test',
      files: new Map([['f1', { id: 'f1', path: 'package.json', content: '{}' }]]),
      symbols: new Map(), relationships: [], routes: []
    };
    const model = Classification.classify(snap);
    
    assert.strictEqual(Object.isFrozen(model), true, 'RepositoryModel should be frozen');
    
    // Attempting to mutate should throw in strict mode, or silently fail. 
    // Since we're in a normal script, we just check isFrozen.
    console.log('✅ Invariant 1 Passed: RepositoryModel is immutable.');
  } catch (err) {
    console.error('❌ Invariant 1 Failed:', err.message);
    process.exit(1);
  }

  // Invariant 2: Layer 5 Semantics (Unstructured repo triggers fallback)
  try {
    const unstructuredSnap = {
      repoId: 'test',
      files: new Map([
        ['f1', { id: 'f1', path: 'README.md', content: 'Docs only' }],
        ['f2', { id: 'f2', path: 'LICENSE', content: 'MIT' }],
      ]), 
      symbols: new Map(), relationships: [], routes: []
    };

    const strategy = new DefaultStrategy();
    const budget = { maxFiles: 12, maxJumps: 25, maxDepth: 4 };
    const result = strategy.generatePlan(unstructuredSnap, null, null, budget);

    assert.ok(result.plan.length > 0, 'Plan should not be empty');
    assert.strictEqual(result.plan[0].fallbackLevel, 5, 'Should trigger Layer 5 fallback');
    
    console.log('✅ Invariant 2 Passed: Layer 5 triggers on unstructured repository.');
  } catch (err) {
    console.error('❌ Invariant 2 Failed:', err.message);
    process.exit(1);
  }

  console.log('All invariant tests passed.');
}

runTests();
