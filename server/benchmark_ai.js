/**
 * benchmark_ai.js — AI Investigation Latency Benchmark
 * Run from: server/   ->  node benchmark_ai.js
 * Uses Prtflio-1787209057578 (111 chunks, ready, has understandingHash)
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const REPO_ID = "6851b70f-efa5-4bbc-8df0-d53603e3485c"; // Prtflio-1787209057578

const questions = [
  { label: "A - Simple",        mission: "What framework is this project using?" },
  { label: "B - Architecture",  mission: "Explain how authentication works in this repository." },
  { label: "C - Relationship",  mission: "What happens when a user uploads a repository? Trace the flow." },
  { label: "D - Deep",          mission: "Trace the complete request flow from the frontend repository input through backend indexing and explain how the data reaches the database." },
];

async function main() {
  const { Planner } = require("./utils/investigation/planner/Planner");
  
  for (const q of questions) {
    console.log("\n" + "=".repeat(65));
    console.log("AI BENCHMARK: " + q.label);
    console.log("Mission: " + q.mission);
    console.log("=".repeat(65));

    const sessionStart = Date.now();
    try {
      const planner = new Planner();
      const { plan } = await planner.plan(REPO_ID, q.mission, { maxSteps: 5 });
      const totalMs = Date.now() - sessionStart;
      console.log("[BENCHMARK_AI] Steps planned: " + plan.executionSteps.length);
      console.log("[BENCHMARK_AI] Wall-clock total for \"" + q.label + "\": " + (totalMs / 1000).toFixed(2) + "s");
    } catch (err) {
      console.error("[BENCHMARK_AI] FAILED for " + q.label + ": " + err.message);
    }
  }

  console.log("\nAll AI benchmarks complete.");
  process.exit(0);
}

main().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
