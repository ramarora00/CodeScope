// Temporary script to verify persistence in‑memory adapter
import persistenceAdapter from './client/src/shared/lib/persistence/memoryAdapter.js';

const inv = { id: 'test1', title: 'Test Investigation' };
console.log('Saving:', persistenceAdapter.saveInvestigation(inv));
console.log('Load:', persistenceAdapter.loadInvestigation('test1'));
console.log('All:', persistenceAdapter.loadAllInvestigations());
console.log('Archive:', persistenceAdapter.archiveInvestigation('test1'));
console.log('Load after archive:', persistenceAdapter.loadInvestigation('test1'));
console.log('Delete:', persistenceAdapter.deleteInvestigation('test1'));
console.log('Load after delete:', persistenceAdapter.loadInvestigation('test1'));
console.log('All after delete:', persistenceAdapter.loadAllInvestigations());
