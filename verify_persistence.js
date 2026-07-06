import { persistenceAdapter as adapter } from './client/src/shared/lib/persistence/index.js';

console.log('--- Persistence Adapter Verification ---');

try {
  const inv = { id: 'test1', title: 'Demo' };
  console.log('Saving:', adapter.saveInvestigation(inv));
  
  console.log('Load:', adapter.loadInvestigation('test1'));
  
  console.log('Archived:', adapter.archiveInvestigation('test1'));
  
  console.log('Load after archive:', adapter.loadInvestigation('test1'));
  
  console.log('Delete:', adapter.deleteInvestigation('test1'));
  
  console.log('Load after delete:', adapter.loadInvestigation('test1'));
  
  console.log('All:', adapter.loadAllInvestigations());

  console.log('--- Verification Complete ---');
} catch (e) {
  console.error('Error during verification:', e);
}
