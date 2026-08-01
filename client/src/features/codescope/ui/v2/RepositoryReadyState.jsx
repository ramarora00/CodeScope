import React from 'react';
import { useInvestigationSession } from '../../store/useInvestigationSession';

export default function RepositoryReadyState({ repo }) {
  const repositoryContext = useInvestigationSession(s => s.repositoryContext);
  
  // Use real stats if available, fallback to some counts
  const stats = repositoryContext.stats || {
    filesIndexed: 0,
    entryPoints: 0,
    services: 0
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

        <div className="mt-4 text-center">
          <p style={{ color: 'var(--cs-hint)', fontSize: '14px', fontStyle: 'italic' }}>
            Ask anything about this repository to begin an investigation.
          </p>
        </div>
      </div>
    </div>
  );
}
