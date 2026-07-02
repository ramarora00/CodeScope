import React from 'react';
import { Search, Command } from 'lucide-react';

const TopBar = ({ selectedRepo }) => {
  return (
    <div className="w-full h-full flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs">
        <span className="text-text-muted">Repository</span>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-medium tracking-wide">
          {selectedRepo ? selectedRepo.name : 'No Project Selected'}
        </span>
      </div>

      <div className="flex-1 max-w-xl mx-8">
        <div className="relative flex items-center w-full">
          <div className="absolute left-3 flex items-center justify-center text-text-muted">
            <Search size={14} />
          </div>
          <input 
            type="text" 
            placeholder="Search anything... Jump to Symbol, Route, Domain, or File" 
            className="w-full bg-bg-surface border border-border rounded-lg py-1.5 pl-9 pr-24 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-muted transition-colors"
          />
          <div className="absolute right-2 flex items-center gap-1 opacity-50">
            <span className="flex items-center justify-center bg-bg-hover border border-border rounded px-1.5 py-0.5 text-[9px] font-mono">
              <Command size={10} className="mr-0.5" /> K
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 py-1 bg-bg-surface border border-border rounded-md">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Live</span>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
