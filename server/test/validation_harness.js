const { performance } = require('perf_hooks');
const assert = require('assert');
const { DefaultStrategy } = require('../utils/investigation/planner/DefaultStrategy');
const { Classification } = require('../utils/investigation/planner/Classification');
const { PILOT_FIXTURES, FAILURE_FIXTURES } = require('./fixtures/pilot');

async function runValidationHarness() {
  console.log('=============================================');
  console.log(' P1.5 Validation Harness');
  console.log('=============================================');

  const allFixtures = [...PILOT_FIXTURES, ...FAILURE_FIXTURES];
  const metrics = [];
  const strategy = new DefaultStrategy();
  const budget = { maxFiles: 12, maxJumps: 25, maxDepth: 4 };

  let passCount = 0;
  let failCount = 0;

  for (const fixture of allFixtures) {
    console.log(`\nTesting fixture: [${fixture.name}]`);
    let result = null;
    let classificationTime = 0;
    let planningTime = 0;
    let error = null;

    try {
      // Metric: Classification Time
      const cStart = performance.now();
      const model = Classification.classify(fixture.snapshot);
      classificationTime = performance.now() - cStart;

      // Metric: Planning Time
      const pStart = performance.now();
      result = strategy.generatePlan(fixture.snapshot, model, null, budget);
      planningTime = performance.now() - pStart;

      // Validate Expected Outcomes
      assert.strictEqual(result.repositoryModel.type, fixture.expected.type, `Type mismatch`);
      assert.strictEqual(result.repositoryModel.framework, fixture.expected.framework, `Framework mismatch`);
      assert.strictEqual(result.repositoryModel.entryPointStrategy, fixture.expected.entryStrategy, `Entry strategy mismatch`);

      const layer5Activated = result.plan.length > 0 && result.plan[0].fallbackLevel === 5;
      assert.strictEqual(layer5Activated, fixture.expected.layer5Activated, `Layer 5 activation mismatch`);

      let actualRoot = null;
      if (result.dag.root) {
        actualRoot = result.dag.root.file.path;
      }
      if (fixture.expected.expectedRoot !== null) {
        assert.strictEqual(actualRoot, fixture.expected.expectedRoot, `Root file mismatch`);
      }

      // Assert Budget Adherence
      assert.ok(result.plan.length <= budget.maxFiles, `Plan length (${result.plan.length}) exceeded budget (${budget.maxFiles})`);

      // Assert Fallback Level
      const fallbackLevel = result.plan.length > 0 ? result.plan[0].fallbackLevel : null;
      if (fixture.expected.layer5Activated) {
        assert.strictEqual(fallbackLevel, 5, `Expected Layer 5 fallback but got ${fallbackLevel}`);
      } else if (result.plan.length > 0) {
        assert.notStrictEqual(fallbackLevel, 5, `Unexpected Layer 5 fallback activated`);
      }

      console.log(`✅ PASS`);
      passCount++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      error = err.message;
      failCount++;
    }

    // Collect Metrics
    metrics.push({
      fixture: fixture.name,
      classification_time_ms: classificationTime.toFixed(2),
      planning_time_ms: planningTime.toFixed(2),
      dag_nodes: result?.dag?.nodes?.size || 0,
      structured_root_score: result?.dag?.root?.score || 0,
      plan_steps: result?.plan?.length || 0,
      layer5_activated: result?.plan?.[0]?.fallbackLevel === 5,
      error
    });
  }

  console.log('\n=============================================');
  console.log(` Validation Complete: ${passCount} Passed, ${failCount} Failed`);
  console.log('=============================================');
  
  console.table(metrics.map(m => ({
    Fixture: m.fixture,
    'Classify (ms)': m.classification_time_ms,
    'Plan (ms)': m.planning_time_ms,
    'DAG Nodes': m.dag_nodes,
    'Root Score': m.structured_root_score,
    'Plan Steps': m.plan_steps,
    'Layer 5': m.layer5_activated,
    'Status': m.error ? 'FAIL' : 'PASS'
  })));

  if (failCount > 0) {
    process.exit(1);
  }
}

runValidationHarness();
