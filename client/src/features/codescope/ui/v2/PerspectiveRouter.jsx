import React from 'react';
import InvestigationPerspective from './InvestigationPerspective';
import ExplorerPerspective from './ExplorerPerspective';
import ArchitecturePerspective from './ArchitecturePerspective';

import { motion, AnimatePresence } from 'framer-motion';

export default function PerspectiveRouter({
  perspective,
  bootPhase,
  activeInvestigation,
  isUnderstandingMode,
  presentation,
  handleSelectTab,
  handleCloseTab,
  memoryFiles,
  startedAt,
  onNewInvestigation,
}) {
  const getPerspective = () => {
    switch (perspective) {
      case 'files':
        return <ExplorerPerspective onNewInvestigation={onNewInvestigation} />;
      case 'branch':
        return <ArchitecturePerspective presentation={presentation} />;
      case 'investigation':
      default:
        return (
          <InvestigationPerspective
            bootPhase={bootPhase}
            activeInvestigation={activeInvestigation}
            isUnderstandingMode={isUnderstandingMode}
            presentation={presentation}
            handleSelectTab={handleSelectTab}
            handleCloseTab={handleCloseTab}
            memoryFiles={memoryFiles}
            startedAt={startedAt}
            onNewInvestigation={onNewInvestigation}
          />
        );
    }
  };

  return (
    <div className="flex-1 min-h-0 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={perspective}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full flex flex-col absolute inset-0"
        >
          {getPerspective()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
