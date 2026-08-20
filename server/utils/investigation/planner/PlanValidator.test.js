const { PlanValidator } = require("./PlanValidator");

function runTests() {
  const validator = new PlanValidator();
  let passedCount = 0;
  let failedCount = 0;

  function assertValid(name, json) {
    try {
      validator.validate(json);
      console.log(`[PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`[FAIL] ${name} - Unexpected error: ${err.message}`);
      failedCount++;
    }
  }

  function assertInvalid(name, json) {
    try {
      validator.validate(json);
      console.error(`[FAIL] ${name} - Expected validation to fail, but it passed.`);
      failedCount++;
    } catch (err) {
      console.log(`[PASS] ${name} (Correctly failed: ${err.message})`);
      passedCount++;
    }
  }

  const baseValidPlan = { mission: "test mission", hypothesis: "test hypothesis", confidence: 0.8 };
  console.log("--- Running PlanValidator Tests ---");

  assertValid("Resolved with empty steps", JSON.stringify({ ...baseValidPlan, isResolved: true, executionSteps: [] }));
  assertValid("Unresolved with valid steps", JSON.stringify({ ...baseValidPlan, isResolved: false, executionSteps: [{ action: "read", target: "test.js", reason: "To check test.js" }] }));
  assertInvalid("Unresolved with empty steps (boolean false)", JSON.stringify({ ...baseValidPlan, isResolved: false, executionSteps: [] }));
  assertInvalid("Unresolved with empty steps (string false)", JSON.stringify({ ...baseValidPlan, isResolved: "false", executionSteps: [] }));
  assertInvalid("Unresolved with empty steps (undefined)", JSON.stringify({ ...baseValidPlan, executionSteps: [] }));
  assertInvalid("Malformed - isResolved not boolean", JSON.stringify({ ...baseValidPlan, isResolved: "true", executionSteps: [] }));

  console.log(`\nTests Complete: ${passedCount} Passed, ${failedCount} Failed.`);
  if (failedCount > 0) process.exit(1);
}

runTests();
