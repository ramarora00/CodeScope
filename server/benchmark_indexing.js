const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const REPOS_DIR = path.join(__dirname, "../repos");

async function createRepo(name, url, localPath) {
  await prisma.repo.deleteMany({ where: { name } });
  return await prisma.repo.create({
    data: { name, url, localPath, status: "cloning", userId: "benchmark-script", indexingProgress: 0, totalChunks: 0, processedChunks: 0 }
  });
}

async function main() {
  const repoRouter = require("./routes/repo");
  const runBackgroundIndex = repoRouter.runBackgroundIndex;

  const runs = [
    { label: "Prtflio (Batch 50)", name: "bm-prtflio-50", url: "https://github.com/ramarora00/Prtflio", batchSize: 50 },
    { label: "Prtflio (Batch 25)", name: "bm-prtflio-25", url: "https://github.com/ramarora00/Prtflio", batchSize: 25 },
    { label: "Prtflio (Batch 20)", name: "bm-prtflio-20", url: "https://github.com/ramarora00/Prtflio", batchSize: 20 },
  ];

  for (const r of runs) {
    const localPath = path.join(REPOS_DIR, r.name);
    console.log("\n" + "=".repeat(65));
    console.log("BENCHMARK: " + r.label);
    console.log("=".repeat(65));
    if (fs.existsSync(localPath)) fs.rmSync(localPath, { recursive: true, force: true });
    
    const repo = await createRepo(r.name, r.url, localPath);
    const wallStart = Date.now();
    
    // Pass batchSize as 4th arg
    await runBackgroundIndex(repo.id, r.url, localPath, r.batchSize);
    
    console.log("[WALL CLOCK] " + r.label + " total: " + ((Date.now() - wallStart) / 1000).toFixed(2) + "s");
    
    await prisma.repo.deleteMany({ where: { name: r.name } });
    if (fs.existsSync(localPath)) fs.rmSync(localPath, { recursive: true, force: true });
  }

  await prisma.$disconnect();
  console.log("\nAll benchmarks complete.");
}

main().catch(err => { console.error("Benchmark error:", err.message); prisma.$disconnect(); process.exit(1); });
