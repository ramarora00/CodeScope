import React from 'react';
import { Database, Folder, Shield, Zap } from 'lucide-react';

export default function RepositoryReadyState({ repo, repositoryContext, onNewInvestigation }) {
  
  // Use real stats if available, fallback to some counts
  const stats = repositoryContext.stats || {
    filesIndexed: 0,
    entryPoints: 0,
    services: 0
  };

  const handleSuggestionClick = (suggestion) => {
    if (onNewInvestigation) {
      onNewInvestigation(`Investigate the ${suggestion.toLowerCase()} of this repository`);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full items-center justify-center p-8 animate-fade-in" style={{ background: 'var(--cs-editor)' }}>
      <div className="flex flex-col max-w-lg w-full gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--cs-green)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={{ color: 'var(--cs-text)', fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Repository Understanding Complete
          </h2>
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <span style={{ color: 'var(--cs-faint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Repository
          </span>
          <span style={{ color: 'var(--cs-text)', fontSize: '15px', fontFamily: 'var(--cs-mono)' }}>
            {repo?.name || 'Unknown'}
          </span>
        </div>

        <div className="flex flex-col gap-3 p-5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--cs-hint)', fontSize: '13px' }}>Files Indexed</span>
            <span style={{ color: 'var(--cs-text)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--cs-mono)' }}>{stats.filesIndexed > 0 ? stats.filesIndexed : repo?.fileCount || '100+'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--cs-hint)', fontSize: '13px' }}>Entry Points Detected</span>
            <span style={{ color: 'var(--cs-text)', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--cs-mono)' }}>{repositoryContext.findings.length > 0 ? repositoryContext.findings.length : 'Multiple'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--cs-hint)', fontSize: '13px' }}>Framework</span>
            <span style={{ color: 'var(--cs-text)', fontSize: '13px', fontWeight: 500 }}>{repositoryContext.framework || 'Detected'}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'var(--cs-hint)', fontSize: '13px' }}>Knowledge Graph</span>
            <span style={{ color: 'var(--cs-green)', fontSize: '13px', fontWeight: 500 }}>Ready</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <span style={{ color: 'var(--cs-faint)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Suggested Investigations
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'Authentication Flow',
              'State Management',
              'API Layer',
              'Performance Hotspots',
              'Folder Structure'
            ].map(suggestion => (
              <button 
                key={suggestion}
                className="px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap"
                style={{ 
                  background: 'var(--cs-bg)', 
                  border: '1px solid var(--cs-border)',
                  color: 'var(--cs-hint)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'var(--cs-hover)';
                  e.currentTarget.style.color = 'var(--cs-text)';
                  e.currentTarget.style.borderColor = 'var(--cs-text)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'var(--cs-bg)';
                  e.currentTarget.style.color = 'var(--cs-hint)';
                  e.currentTarget.style.borderColor = 'var(--cs-border)';
                }}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <p className="mt-4" style={{ color: 'var(--cs-hint)', fontSize: '13px', fontStyle: 'italic' }}>
            Or use the command bar above to ask your own question.
          </p>
        </div>
      </div>
    </div>
  );
}
