import React from 'react';
import { useKnowledgeState } from '../model/useKnowledgeState';
import { ScopeSearch } from './ScopeSearch';
import { FocusPanel } from './FocusPanel';
import { RepositoryGraphCanvas } from '../../repository-graph/RepositoryGraphCanvas';

export function RepositoryKnowledge({ repoId }) {
  const { focus, updateFocus, clearFocus } = useKnowledgeState();

  // Mock nodes and edges for visual verification
  const mockNodes = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 200, y: 100 }, data: { label: 'Node 2' } }
  ];
  const mockEdges = [{ id: 'e1-2', source: '1', target: '2' }];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-background)]">
      {/* Scope Bar & Search (Top) */}
      <div className="absolute top-6 left-0 right-0 z-20 px-6">
        <ScopeSearch focus={focus} updateFocus={updateFocus} />
      </div>

      {/* Exploration Surface: The Graph Widget */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <RepositoryGraphCanvas 
          nodes={mockNodes} 
          edges={mockEdges} 
          status="ready" 
          onSelectNode={(id) => updateFocus({ id, name: id, type: 'symbol' })} 
        />
      </div>

      {/* Focus Panel (Right) */}
      <div className="z-30 pointer-events-none">
        <FocusPanel focus={focus} clearFocus={clearFocus} />
      </div>

      {/* Mode Rail (Left) - To be implemented as per IA, but for now we keep it minimal */}
      <div className="absolute left-6 top-24 bottom-6 w-16 bg-[var(--color-surface-sunken)]/50 backdrop-blur-md border border-[var(--color-border-subtle)] rounded-lg z-20 pointer-events-auto flex flex-col items-center py-4 gap-4 util-shadow-depth-1">
        {/* Mock Mode Rail Icons */}
        <div className="w-8 h-8 rounded bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center cursor-pointer" title="Search">
          S
        </div>
        <div className="w-8 h-8 rounded hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer" title="Graph">
          G
        </div>
        <div className="w-8 h-8 rounded hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer" title="Dependencies">
          D
        </div>
        <div className="w-8 h-8 rounded hover:bg-[var(--color-surface-raised)] text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer" title="Files">
          F
        </div>
      </div>
    </div>
  );
}
