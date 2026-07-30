require('dotenv').config();
const { Planner } = require('./utils/investigation/planner/Planner');

async function run() {
  const planner = new Planner();
  const repoId = 'ai-developer-copilot'; // or any existing repo ID
  const mission = 'Explain how the investigation event router works in the frontend.';
  
  try {
    const plan = await planner.plan(repoId, mission, { maxSteps: 3 });
    console.log('\n✅ Plan Generation Successful!\n');
    console.log(JSON.stringify(plan, null, 2));
  } catch (err) {
    console.error('\n❌ Plan Generation Failed:', err.message);
    if (err.response) {
      console.error(err.response);
    }
  }
}

run();
