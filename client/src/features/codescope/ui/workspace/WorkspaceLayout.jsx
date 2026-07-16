import React from 'react';

export default function WorkspaceLayout({ 
  commandBar, 
  dock, 
  sidebar, 
  main, 
  knowledge 
}) {
  return (
    <div className="w-full h-screen bg-[#0a0a0b] flex flex-col overflow-hidden text-[#c7c7ce] font-sans antialiased">
      {/* Top Command Bar */}
      <div className="w-full flex-shrink-0">
        {commandBar}
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-row overflow-hidden min-h-0">
        {/* Left Dock Rail */}
        <div className="h-full flex-shrink-0">
          {dock}
        </div>

        {/* Workspace Panes Frame */}
        <div className="flex-1 flex flex-row overflow-hidden min-w-0 h-full">
          {/* Activity Sidebar (Explorer tree / sessions list) */}
          {sidebar}

          {/* Core Code Viewer tab region */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {main}
          </div>

          {/* Right Knowledge Panel */}
          {knowledge}
        </div>
      </div>
    </div>
  );
}
