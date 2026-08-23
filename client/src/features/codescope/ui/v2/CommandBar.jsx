import React, { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import UserAvatarDropdown from './shared/UserAvatarDropdown';
import CodeScopeInfo from './shared/CodeScopeInfo';

// ─── Out-of-context question guard ───────────────────────────────────────────────
// Layer 1: positive fast-pass — these patterns indicate a code/repo question.
// If ANY match, the question is accepted immediately (no further checks).
const REPO_SIGNALS = [
  /\b(function|class|method|module|component|service|hook|interface|type|api|route|endpoint|auth|login|token|database|query|fetch|import|export|dependency|package|build|deploy|config|env|test|spec|schema|model|controller|middleware|handler|pipeline|store|state|redux|context|zustand|firebase|supabase|prisma|sql|lancedb|vector|embed|graph|node|edge|file|folder|directory|repo|repository|codebase|architecture|pattern|flow|layer|logic|refactor|bug|error|exception|stack|trace|log)\b/i,
  // Starts with natural code-question verbs ('what' removed — repo questions with 'what' always carry a code keyword)
  /^(explain|where|how|why|show|find|list|trace|describe|summarize|identify|review|compare)\b/i,
  // Contains a file extension hint
  /\.(js|ts|jsx|tsx|py|go|java|rs|rb|cs|php|json|yaml|yml|toml|md|css|html|sql|sh|env)\b/i,
  // Contains a path-like segment
  /[/\\][a-z]/i,
];

// Layer 2: generic general-knowledge rejection patterns.
// Only applied if Layer 1 found NO signals.
const GENERAL_KNOWLEDGE_PATTERNS = [
  // Who/what is X — people, places, facts
  /^who (is|was|are|were) the /i,
  /^who (is|was) /i,
  /^what is (an? |the )?(iphone|android|mac|windows|linux|google|apple|microsoft|amazon|meta|twitter|tesla|bitcoin|ethereum|nft|ai|chatgpt|openai|gemini)\b/i,
  /^what is the (capital|population|currency|flag|president|prime minister|leader|ruler|king|queen|ceo|founder) of /i,
  /^(tell me|give me|list) (some )?(fun )?facts about /i,
  /^(what|which) (country|city|state|nation|continent|planet|star|ocean|sea|river|mountain|animal|plant|food|sport|game|song|movie|book|language) /i,
  /\b(president|prime minister|capital city|population of|currency of|national anthem|geography|history of|founded in|born in|died in|recipe|calories|weather|temperature|forecast|oldest civilization|ancient civilization)\b/i,
  // Targeted: 'tell me a joke/story/poem/...' (no 'facts about' required)
  /^tell me (a |an )?(joke|story|poem|riddle|random|something random|fun fact)\b/i,
];

function isOutOfContext(query) {
  if (!query || query.length < 3) return false;
  // Layer 1: has any repo/code signal → always accept
  if (REPO_SIGNALS.some(r => r.test(query))) return false;
  // Layer 2: matches a generic general-knowledge pattern → reject
  if (GENERAL_KNOWLEDGE_PATTERNS.some(r => r.test(query))) return true;
  // Default: accept (we don't want false positives)
  return false;
}

export default function CommandBar({ branch = 'main', onNewInvestigation, activeInvestigation, perspective }) {
  const repo = useWorkspaceStore(s => s.selectedRepo);
  const org = (repo?.name?.split('/')?.[0] ?? 'acme').replace(/-\d{10,}$/, '');
  const repoName = repo?.name?.split('/')?.pop()?.replace(/-\d{10,}$/, '') ?? 'Workspace';

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [queryError, setQueryError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || !onNewInvestigation) return;
    if (isOutOfContext(query.trim())) {
      setQueryError("That question is outside the scope of this repository. Try asking something about the codebase, architecture, files, dependencies, or implementation.");
      return;
    }
    setQueryError('');
    onNewInvestigation(query.trim());
    setQuery('');
    setIsSearching(false);
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
          <>
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
              border: `1px solid ${queryError ? 'rgba(255,130,100,0.4)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              fontFamily: 'var(--cs-sans)',
            }}
          >
            <Search size={16} style={{ color: queryError ? 'rgba(255,130,100,0.8)' : 'var(--cs-accent)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (queryError) setQueryError(''); }}
              placeholder="Investigate the architecture, find performance hotspots, or explain a flow..."
              autoFocus
              onBlur={() => setTimeout(() => { setIsSearching(false); setQueryError(''); }, 300)}
              className="flex-1 bg-transparent text-[13px] text-white outline-none border-none placeholder-white/40"
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', padding: '0 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 600
            }}>
              ↵ Enter
            </div>
          </form>
          {queryError && (
            <div style={{
              position: 'absolute',
              top: '54px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '640px',
              fontSize: '11px',
              color: 'rgba(255,130,100,0.9)',
              fontFamily: 'var(--cs-sans)',
              letterSpacing: '0.01em',
              textAlign: 'center',
              pointerEvents: 'none',
            }}>
              {queryError}
            </div>
          )}
          </>
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

          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 flex-shrink-0 justify-end" style={{ width: '150px' }}>
        <CodeScopeInfo page={perspective || 'workspace'} />
        {/* Avatar */}
        <UserAvatarDropdown />
      </div>
    </div>
  );
}
