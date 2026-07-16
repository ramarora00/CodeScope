import { ChevronRight, Search, Share } from 'lucide-react';

export default function CommandBar({ repo, branch = 'main', onSearch }) {
  const org = repo?.name?.split('/')?.[0] ?? 'acme';
  const repoName = repo?.name?.split('/')?.[1] ?? 'payments-service';

  return (
    <div
      className="flex-shrink-0 flex items-center px-4 gap-4 select-none"
      style={{
        height: '48px',
        background: 'var(--cs-bg)',
      }}
    >
      {/* Logo */}
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
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span style={{ color: 'var(--cs-faint)', fontSize: '12px', fontWeight: 500 }}>
          {org}
        </span>
        <ChevronRight size={12} style={{ color: 'var(--cs-hint)' }} />
        <span style={{ color: 'var(--cs-muted)', fontSize: '12px', fontWeight: 500 }}>
          {repoName}
        </span>
        <ChevronRight size={12} style={{ color: 'var(--cs-hint)' }} />
        <span style={{ color: 'var(--cs-text)', fontSize: '12px', fontWeight: 500 }}>
          {branch}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Center search — pill-shaped with search icon and ⌘ K */}
      <button
        onClick={onSearch}
        className="flex items-center gap-2 flex-shrink-0 transition-all duration-[220ms]"
        style={{
          height: '40px',
          width: '460px',
          paddingLeft: '14px',
          paddingRight: '6px',
          borderRadius: '12px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '12px',
          cursor: 'text',
          fontFamily: 'var(--cs-sans)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Search size={14} style={{ color: 'var(--cs-hint)' }} />
        <span className="flex-1 text-left" style={{ letterSpacing: '0.005em' }}>
          Ask anything about this repository...
        </span>
        <kbd
          style={{
            fontFamily: 'var(--cs-sans)',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'transparent',
            color: 'rgba(255,255,255,0.25)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
          <span style={{ color: 'var(--cs-hint)', fontSize: '11px', fontWeight: 500 }}>
            Live
          </span>
        </div>

        {/* Sourcegraph MCP badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md opacity-40"
          style={{
            background: 'transparent',
          }}
        >
          <span style={{ color: 'var(--cs-accent)', fontSize: '10px' }}>✦</span>
          <span style={{ color: 'var(--cs-hint)', fontSize: '10px', fontWeight: 500 }}>
            Sourcegraph MCP
          </span>
        </div>

        {/* Avatar */}
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--cs-panel-raised)',
            border: '1px solid var(--cs-border-strong)',
            fontFamily: 'var(--cs-sans)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--cs-text)',
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
