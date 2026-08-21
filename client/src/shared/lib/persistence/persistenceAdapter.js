export const requiredMethods = [
  'saveInvestigation',
  'loadInvestigation',
  'loadAllInvestigations',
  'deleteInvestigation',
  'archiveInvestigation',
];

/** Validate that an object conforms to the persistence contract. */
export function validatePersistenceAdapter(adapter) {
  requiredMethods.forEach((method) => {
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Persistence adapter must implement function: ${method}`);
    }
  });
}

// Export a placeholder for documentation / typing purposes.
export const persistenceAdapter = {};
