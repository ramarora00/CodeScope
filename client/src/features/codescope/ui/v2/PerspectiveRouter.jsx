import React from 'react';
import InvestigationPerspective from './InvestigationPerspective';
import ExplorerPerspective from './ExplorerPerspective';
import ArchitecturePerspective from './ArchitecturePerspective';

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
}
