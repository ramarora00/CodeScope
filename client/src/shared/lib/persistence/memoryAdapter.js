// client/src/shared/lib/persistence/memoryAdapter.js
import { validatePersistenceAdapter } from './persistenceAdapter.js';

// Internal in-memory store
const store = new Map();

const memoryAdapter = {
  /** Save an investigation (must have id) */
  saveInvestigation(investigation) {
    if (!investigation || !investigation.id) {
      throw new Error('Investigation must have an id');
    }
    store.set(investigation.id, { ...investigation });
    return investigation;
  },

  /** Load a single investigation by id */
  loadInvestigation(id) {
    return store.get(id) || null;
  },

  /** Load all investigations */
  loadAllInvestigations() {
    return Array.from(store.values());
  },

  /** Delete an investigation by id */
  deleteInvestigation(id) {
    return store.delete(id);
  },

  /** Archive an investigation (adds archived flag) */
  archiveInvestigation(id) {
    const inv = store.get(id);
    if (!inv) return null;
    const archived = { ...inv, archived: true };
    store.set(id, archived);
    return archived;
  },
};

// Validate the contract implementation
validatePersistenceAdapter(memoryAdapter);

export default memoryAdapter;
