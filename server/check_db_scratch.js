const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const repos = await prisma.repo.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log("=== REPOS IN DATABASE ===");
  repos.forEach(r => {
    console.log(`ID: ${r.id} | Name: ${r.name} | Status: ${r.status} | URL: ${r.url} | LocalPath: ${r.localPath}`);
  });
  
  const filesCount = await prisma.file.count();
  console.log(`\nTotal Files in DB: ${filesCount}`);
  
  const symbolsCount = await prisma.symbol.count();
  console.log(`Total Symbols in DB: ${symbolsCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
