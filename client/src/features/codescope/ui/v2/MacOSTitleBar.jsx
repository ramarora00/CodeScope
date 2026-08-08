import React from 'react';
import { ChevronRight, Share2 } from 'lucide-react';

export default function MacOSTitleBar({ repo, branch = 'main', onSearch }) {
  const org = repo?.name?.split('/')?.[0] ?? 'acme';
  const rawRepoName = repo?.name?.split('/')?.[1] ?? 'payments-service';
  const repoName = rawRepoName.replace(/-\d{10,}$/, '');

  return (
    <div
      className="flex-shrink-0 flex items-center px-4 gap-3 select-none"
      style={{
        height: '44px',
        background: 'var(--cs-bg)',
        borderBottom: '1px solid var(--cs-border)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Traffic lights */}
      <div
        className="flex items-center gap-[6px] flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag', opacity: 0.7 }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--macos-close)' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--macos-minimize)' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: 'var(--macos-zoom)' }} />
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' }}>
        <span style={{ color: 'var(--cs-faint)' }}>{org}</span>
        <ChevronRight size={10} style={{ color: 'var(--cs-hint)' }} />
        <span style={{ color: 'var(--cs-muted)' }}>{repoName}</span>
        <ChevronRight size={10} style={{ color: 'var(--cs-hint)' }} />
        <span style={{ color: 'var(--cs-text)', fontWeight: 500 }}>{branch}</span>
      </div>

      {/* Center search */}
      <div className="flex-1 flex justify-center" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={onSearch}
          className="flex items-center gap-2 h-[26px] px-3 rounded transition-all duration-200"
          style={{
            width: '300px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.05)',
            color: 'var(--cs-hint)',
            fontSize: '11px',
            cursor: 'text',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.color = 'var(--cs-faint)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = 'var(--cs-hint)';
          }}
        >
          <span className="flex-1 text-left" style={{ fontFamily: 'var(--cs-sans)', letterSpacing: '0.01em' }}>
            Ask anything about your codebase...
          </span>
          <kbd
            className="text-[9px] px-1 rounded flex-shrink-0"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--cs-hint)',
              fontFamily: 'var(--cs-sans)',
              opacity: 0.6,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right status */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-[6px] h-[6px] rounded-full animate-pulse-dot"
            style={{ background: 'var(--cs-green)' }}
          />
          <span style={{ color: 'var(--cs-muted)', fontSize: '11px' }}>Live</span>
        </div>

        {/* Share */}
        <button
          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--cs-faint)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--cs-muted)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--cs-faint)'}
        >
          <Share2 size={13} />
        </button>

        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--cs-accent-bg)',
            border: '1px solid var(--cs-accent-border)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--cs-accent)',
            fontFamily: 'var(--cs-sans)',
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
