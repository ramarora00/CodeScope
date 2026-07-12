const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const repos = await prisma.repo.findMany();
    console.log('--- REPOSITORIES IN DATABASE ---');
    console.log(JSON.stringify(repos, null, 2));
  } catch (err) {
    console.error('Error fetching repos:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}
run();
