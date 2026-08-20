import React, { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import UserAvatarDropdown from './shared/UserAvatarDropdown';

export default function CommandBar({ branch = 'main', onNewInvestigation, activeInvestigation }) {
  const repo = useWorkspaceStore(s => s.selectedRepo);
  const org = (repo?.name?.split('/')?.[0] ?? 'acme').replace(/-\d{10,}$/, '');
  const repoName = repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') ?? 'Workspace';

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onNewInvestigation) {
      onNewInvestigation(query.trim());
      setQuery('');
      setIsSearching(false);
    }
  };

  const activeQuery = activeInvestigation?.query || activeInvestigation?.title;

  return (
    <div
      className="flex-shrink-0 flex items-center justify-between select-none w-full"
      style={{
        height: '48px',
        background: 'transparent',
        paddingLeft: '24px',
        paddingRight: '16px',
      }}
    >
      {/* Left side: Logo & Breadcrumb merged */}
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{ minWidth: '0' }}
      >
        <span
          style={{
            fontFamily: 'var(--cs-sans)',
            fontWeight: 500,
            fontSize: '13px',
            color: 'var(--cs-text)',
            letterSpacing: '-0.02em',
          }}
        >
          CodeScope
        </span>
        <span style={{ color: 'var(--cs-hint)', margin: '0 4px' }}>/</span>
        <span style={{ color: 'var(--cs-muted)', fontSize: '12px', fontWeight: 500 }}>
          {repoName}
        </span>
        <span style={{ color: 'var(--cs-hint)', margin: '0 4px' }}>/</span>
        <span style={{ color: 'var(--cs-text)', fontSize: '12px', fontWeight: 500 }}>
          {branch}
        </span>
      </div>

      {/* Center search — switches between button and form */}
      <div className="flex-1 flex justify-center">
        {isSearching ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-4 flex-shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all duration-300"
            style={{
              height: '46px',
              width: '640px',
              paddingLeft: '24px',
              paddingRight: '12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              fontFamily: 'var(--cs-sans)',
            }}
          >
            <Search size={16} style={{ color: 'var(--cs-accent)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Investigate the architecture, find performance hotspots, or explain a flow..."
              autoFocus
              onBlur={() => setTimeout(() => setIsSearching(false), 300)}
              className="flex-1 bg-transparent text-[13px] text-white outline-none border-none placeholder-white/40"
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', padding: '0 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 600
            }}>
              ↵ Enter
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsSearching(true)}
            className={`flex items-center gap-4 flex-shrink-0 transition-all duration-[220ms] ${activeInvestigation?.status === 'running' ? 'animate-pulse-subtle' : ''}`}
            style={{
              height: '46px',
              width: '640px',
              paddingLeft: '24px',
              paddingRight: '12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: activeQuery ? 'var(--cs-text)' : 'rgba(255,255,255,0.4)',
              fontSize: '13px',
              cursor: 'text',
              fontFamily: 'var(--cs-sans)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = activeQuery ? 'var(--cs-text)' : 'rgba(255,255,255,0.6)';
              if (activeInvestigation?.status !== 'running') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = activeQuery ? 'var(--cs-text)' : 'rgba(255,255,255,0.4)';
              if (activeInvestigation?.status !== 'running') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }
            }}
          >
            <Search size={16} style={{ color: activeQuery ? 'var(--cs-faint)' : 'rgba(255,255,255,0.4)' }} />
            <span className="flex-1 text-left truncate" style={{ letterSpacing: '0.005em' }}>
              {activeQuery 
                ? (activeQuery === 'Repository Understanding' ? 'Exploring repository...' : activeQuery) 
                : 'Investigate this repository...'}
            </span>
            {!activeQuery && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', padding: '0 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, fontFamily: 'var(--font-ui)'
              }}>
                ⌘K
              </div>
            )}
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 flex-shrink-0 justify-end" style={{ width: '150px' }}>
        {/* Avatar */}
        <UserAvatarDropdown />
      </div>
    </div>
  );
}
