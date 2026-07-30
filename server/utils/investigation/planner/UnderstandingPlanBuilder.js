const { InvestigationPlan } = require('../domain/plan');

class UnderstandingPlanBuilder {
  /**
   * Generates a structural understanding plan based on repository snapshot.
   * @param {RepositorySnapshot} snapshot 
   * @returns {InvestigationPlan}
   */
  static build(snapshot) {
    const executionSteps = [];
    let framework = 'Unknown';
    let entryPoints = [];

    // Analyze files
    const allFiles = Array.from(snapshot.files.values());
    
    // Look for package.json
    const packageJson = allFiles.find(f => f.path.endsWith('package.json'));
    if (packageJson) {
      executionSteps.push({
        action: 'read',
        target: packageJson.path,
        reason: 'Analyzing project dependencies and scripts'
      });
      // Try to infer framework (simplified)
      // In a real app we'd fetch the file content, but for now we look at other files.
      if (allFiles.some(f => f.path.includes('next.config'))) framework = 'Next.js';
      else if (allFiles.some(f => f.path.includes('nest-cli'))) framework = 'NestJS';
      else if (allFiles.some(f => f.path.includes('express'))) framework = 'Express';
      else if (allFiles.some(f => f.path.includes('vite.config'))) framework = 'React/Vite';
    }

    // Identify entry points based on ranking or common names
    const rankedFiles = snapshot.getFilesByRanking();
    const commonEntries = ['index.js', 'main.ts', 'app.js', 'app.tsx', 'server.js', 'README.md', 'layout.tsx', 'page.tsx'];
    
    // Pick top 4 relevant files
    const targets = new Set();
    if (packageJson) targets.add(packageJson.path);

    // Add README if present
    const readme = allFiles.find(f => f.path.toLowerCase().endsWith('readme.md'));
    if (readme) {
      targets.add(readme.path);
      executionSteps.push({ action: 'read', target: readme.path, reason: 'Reading project documentation' });
    }

    // Add high-ranked code files or common entry points
    for (const file of rankedFiles) {
      if (targets.size >= 5) break;
      const name = file.path.split('/').pop();
      if (commonEntries.includes(name) && !targets.has(file.path)) {
        targets.add(file.path);
        executionSteps.push({ action: 'read', target: file.path, reason: `Analyzing entry point: ${name}` });
      }
    }

    // Fallback if not enough files
    for (const file of rankedFiles) {
      if (targets.size >= 5) break;
      if (!targets.has(file.path) && !file.path.includes('node_modules') && !file.path.endsWith('.json')) {
        targets.add(file.path);
        executionSteps.push({ action: 'read', target: file.path, reason: 'Scanning core repository component' });
      }
    }

    return new InvestigationPlan({
      mission: 'Repository Understanding',
      hypothesis: `Analyzed ${allFiles.length} files. Framework detected: ${framework}.`,
      confidence: 1.0,
      executionSteps: executionSteps
    });
  }
}

module.exports = { UnderstandingPlanBuilder };
