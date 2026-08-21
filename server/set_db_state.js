const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setRepoState(repoId, status, progress, totalChunks = 100) {
  const processed = Math.round((progress / 100) * totalChunks);
  await prisma.repo.update({
    where: { id: repoId },
    data: {
      status,
      indexingProgress: progress,
      totalChunks,
      processedChunks: processed
    }
  });
  console.log(`Repo ${repoId} updated to ${status} - ${progress}%`);
}

async function main() {
  const [repoId, status, progress] = process.argv.slice(2);
  if (!repoId || !status || !progress) {
    console.error('Usage: node set_db_state.js <repoId> <status> <progress>');
    process.exit(1);
  }
  await setRepoState(repoId, status, parseInt(progress));
}

main().catch(console.error).finally(() => prisma.$disconnect());
