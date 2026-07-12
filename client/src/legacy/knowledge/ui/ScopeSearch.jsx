import React, { useState } from 'react';
import { GlassPanel } from '../../../shared/ui/GlassPanel';
import { QueryInput } from '../../../shared/ui/QueryInput';

export function ScopeSearch({ focus, updateFocus }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      // In a real app, this would search and find a node/symbol ID.
      // For now, we simulate finding a symbol and updating focus.
      updateFocus({
        id: `node-${Date.now()}`,
        name: query,
        type: 'symbol',
        repository: 'ai-developer-copilot'
      });
      setQuery('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto pointer-events-auto">
      <GlassPanel elevation={2} radius="lg" className="p-2 flex items-center gap-4">
        <div className="text-[var(--color-text-muted)] text-sm font-medium px-3 border-r border-[var(--color-border-subtle)]">
          Repository ▾
        </div>
        <div className="text-[var(--color-text-muted)] text-sm font-medium px-3 border-r border-[var(--color-border-subtle)]">
          Branch ▾
        </div>
        <form onSubmit={handleSearch} className="flex-1">
          <input
            type="text"
            placeholder="Search for a symbol, file, or domain..."
            className="w-full bg-transparent border-none text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none text-sm px-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </GlassPanel>
    </div>
  );
}
