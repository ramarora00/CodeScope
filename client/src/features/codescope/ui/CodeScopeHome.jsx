import React from 'react';
import Workspace from './Workspace';

export default function CodeScopeHome({ repo, activeInvestigation, onNewInvestigation, onSelectFile }) {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#0A0E15]">
      <Workspace 
        repo={repo} 
        activeInvestigation={activeInvestigation} 
        onNewInvestigation={onNewInvestigation}
        onSelectFile={onSelectFile}
      />
    </div>
  );
}
