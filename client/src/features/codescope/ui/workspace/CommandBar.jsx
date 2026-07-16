import React, { useState } from 'react';
import { Database, Sparkles, ChevronDown, Check, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';

export default function CommandBar({
  repo,
  repos = [],
  onSelectRepo,
  onConnectNew,
  onNewAnalysis,
  activeAnalysis,
  runtimeStatus = 'idle'
}) {
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim() && onNewAnalysis) {
      onNewAnalysis(searchVal.trim());
      setSearchVal('');
    }
  };

  return (
    <header className="h-[38px] border-b border-white/5 bg-[#0a0a0b] px-3 flex items-center justify-between select-none relative z-40 text-[#c7c7ce] font-sans">

      {/* ── LEFT ZONE: Repository & Branch ── */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowRepoSelector(!showRepoSelector)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.04] text-[11px] font-mono text-[#e9e9ea] transition-all"
          >
            <Database size={11} className="text-[#8e97a8]" />
            <span>{repo ? repo.name.replace(/repo-?/i, '') : 'select-repo'}</span>
            <ChevronDown size={10} className="text-[#5f5f63]" />
          </button>

          {showRepoSelector && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRepoSelector(false)} />
              <div className="absolute left-0 top-7 w-56 bg-[#141416] border border-white/5 rounded-md p-1 shadow-2xl z-50 text-left">
                <div className="text-[9px] font-bold text-[#5f5f63] uppercase px-2 py-1 border-b border-white/5 mb-1 flex justify-between items-center">
                  <span>Switch Repository</span>
                  <button
                    onClick={() => { setShowRepoSelector(false); onConnectNew(); }}
                    className="hover:text-[#e9e9ea] text-[#5f5f63] flex items-center gap-1 text-[8px]"
                  >
                    <span>+ Connect</span>
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col">
                  {repos.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onSelectRepo(r);
                        setShowRepoSelector(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-[11.5px] font-mono flex items-center justify-between hover:bg-white/[0.04] transition-colors ${
                        repo?.id === r.id ? 'text-[#8b8dee]' : 'text-[#c7c7ce]'
                      }`}
                    >
                      <span className="truncate">{r.name.replace(/repo-?/i, '')}</span>
                      {repo?.id === r.id && <Check size={11} className="text-[#8b8dee] flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <span className="text-[#3a3a3e] text-[11px]">/</span>
        <span className="text-[11px] text-[#7a7a7f] font-mono">main</span>
      </div>

      {/* ── CENTER ZONE: Query Input ── */}
      <div className="flex-1 max-w-[440px] mx-auto flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full relative">
          <div className="flex items-center gap-1.5 bg-[#141416] border border-white/[0.08] rounded-md px-2.5 py-1 w-full hover:border-white/[0.14] focus-within:border-[#8b8dee]/50 transition-all">
            <Sparkles size={11} className="text-[#8b8dee] flex-shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={
                runtimeStatus === 'reading'
                  ? 'Reasoning in progress…'
                  : 'Ask anything about this codebase…'
              }
              disabled={runtimeStatus === 'reading'}
              className="w-full bg-transparent text-[11px] text-[#e9e9ea] placeholder-[#5f5f63] outline-none border-none font-sans py-0 disabled:opacity-50"
            />
          </div>
        </form>
      </div>

      {/* ── RIGHT ZONE: Runtime Status + Connection ── */}
      <div className="flex items-center gap-3 text-[11px]">

        {/* Runtime status indicator */}
        {runtimeStatus === 'reading' && (
          <div className="flex items-center gap-1.5 text-[#8b8dee]">
            <Loader2 size={11} className="animate-spin" />
            <span className="font-sans text-[10.5px] tracking-wide">Reasoning…</span>
          </div>
        )}
        {runtimeStatus === 'resolved' && (
          <div className="flex items-center gap-1.5 text-[#5aa876]">
            <CheckCircle2 size={11} />
            <span className="font-sans text-[10.5px] tracking-wide">Analysis complete</span>
          </div>
        )}
        {runtimeStatus === 'idle' && repo && (
          <div className="flex items-center gap-1.5 text-[#5aa876]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5aa876] animate-pulse" />
            <span className="font-sans text-[10.5px]">Indexed</span>
          </div>
        )}

        <button
          onClick={onConnectNew}
          className="p-1 hover:bg-white/[0.04] rounded text-[#5f5f63] hover:text-[#c7c7ce] transition-colors"
          title="Disconnect Repo"
        >
          <ExternalLink size={12} />
        </button>
      </div>

    </header>
  );
}
