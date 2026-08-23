import React from 'react';

export default function RepositoryReadyState({ repo, repositoryContext, onNewInvestigation, onBack, fileCount, filesLoading }) {
  
  const handleSuggestionClick = (suggestion) => {
    if (onNewInvestigation) {
      onNewInvestigation(`Investigate the ${suggestion.toLowerCase()} of this repository`);
    }
  };

  const displayName = repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') || 'Workspace';
  const frameworkText = repositoryContext?.framework || 'React/Vite';

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center p-8 animate-fade-in" style={{ background: 'var(--cs-editor)' }}>
      <div className="flex flex-col max-w-sm w-full gap-8 text-center items-center">
        
        {/* Editorial Success Mark */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center animate-settle"
          style={{ 
            background: 'rgba(34, 197, 94, 0.08)', 
            color: 'var(--cs-green)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        {/* Editorial Text Structure */}
        <div className="flex flex-col gap-2 items-center">
          <span 
            style={{ 
              color: 'var(--cs-green)', 
              fontSize: '13px', 
              fontWeight: 500,
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.02em'
            }}
          >
            Repository mapped
          </span>
          <h2 
            style={{ 
              color: 'var(--cs-text)', 
              fontSize: '24px', 
              fontWeight: 600, 
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-ui)' 
            }}
          >
            {displayName}
          </h2>
          <span 
            style={{ 
              color: 'var(--cs-muted)', 
              fontSize: '12px', 
              fontFamily: 'var(--font-mono)',
              opacity: 0.8
            }}
          >
            {filesLoading ? '—' : `${fileCount} files`} · {frameworkText}
          </span>
          <span 
            style={{ 
              color: 'var(--cs-faint)', 
              fontSize: '12px', 
              fontFamily: 'var(--font-ui)',
              fontStyle: 'italic',
              marginTop: '4px'
            }}
          >
            Structural model ready
          </span>
        </div>

        {/* Quiet Vertical suggested directions list */}
        <div className="w-full flex flex-col gap-4 mt-4 text-left border-t border-white/5 pt-6">
          <span 
            style={{ 
              color: 'var(--cs-text)',
              opacity: 0.6,
              fontSize: '12px', 
              fontWeight: 600,
              fontFamily: 'var(--font-ui)'
            }}
          >
            Suggested directions
          </span>
          <div className="flex flex-col gap-2.5">
            {[
              'Authentication Flow',
              'State Management',
              'API Layer',
              'Performance Hotspots',
              'Folder Structure'
            ].map(suggestion => (
              <button 
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group flex items-center gap-2 text-[13px] bg-transparent border-none text-left p-0 cursor-pointer transition-all duration-[220ms] outline-none"
                style={{ 
                  color: 'var(--cs-muted)',
                  fontFamily: 'var(--font-ui)',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = 'var(--cs-text)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = 'var(--cs-muted)';
                  e.currentTarget.style.transform = 'translateX(0px)';
                }}
              >
                <span className="text-[var(--cs-accent)] opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                <span className="border-b border-transparent group-hover:border-white/20 transition-all pb-0.5">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analyze another repository */}
        {onBack && (
          <div className="w-full border-t border-white/5 pt-5 mt-2 flex justify-center">
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--cs-faint)',
                fontFamily: 'var(--font-ui)',
                letterSpacing: '0.01em',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'color 200ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--cs-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--cs-faint)'; }}
            >
              ← Analyze another repository
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
