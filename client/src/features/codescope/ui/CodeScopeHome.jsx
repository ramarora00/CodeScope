import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldCheck, Route, FileCode2, GitBranch,
  PlayCircle, Clock, BookOpen, Layers, ArrowRight, Sparkles, Hash
} from 'lucide-react';

const CodeScopeHome = ({ repo }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (repo) fetchStats();
  }, [repo]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/stats`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-bg-surface">
        <Activity size={20} className="text-text-muted animate-pulse" />
        <p className="text-[11px] text-text-muted uppercase tracking-widest font-mono">Assessing Repository Health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-bg-surface">
        <p className="text-xs text-error">Failed to load repository state: {error}</p>
        <button onClick={fetchStats} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary text-xs">Retry</button>
      </div>
    );
  }

  const { summary, graphQuality } = stats;
  const healthGrade = graphQuality?.healthGrade ?? 'B';

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-[#05070B] text-text-primary p-8">
      
      {/* Header & Primary CTA */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Indexed & Ready</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#D8DCE6]">{repo.name?.replace(/repo-?/i, '') || 'Repository'}</h1>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#D8DCE6] text-[#05070B] rounded-lg font-medium text-sm hover:bg-white transition-colors shadow-sm">
          <Sparkles size={16} />
          New Analysis
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 pb-12">
        
        {/* Left Column (Main Info) */}
        <div className="col-span-8 flex flex-col gap-6">
          
          {/* Repository Health */}
          <section className="p-6 border border-border rounded-xl bg-bg-elevated/30">
            <header className="mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="text-text-secondary" />
                Repository Health
              </h2>
              <p className="text-[11px] text-text-muted mt-1">Is this repository ready for analysis?</p>
            </header>
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-5xl font-black text-text-primary">{healthGrade}</span>
                <span className="text-[10px] font-mono text-text-muted mt-1 uppercase tracking-widest">Health Grade</span>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex-1">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-text-secondary">Call Site Resolution</span>
                  <span className="font-mono text-text-primary">{summary.resolvedPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-bg-hover rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${summary.resolvedPercentage}%` }} />
                </div>
                <p className="text-[10px] text-text-muted mt-2">
                  High confidence in execution flow tracing. Minimal isolated subgraphs.
                </p>
              </div>
            </div>
          </section>

          {/* Knowledge Snapshot */}
          <section className="p-6 border border-border rounded-xl bg-bg-elevated/30">
            <header className="mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Layers size={16} className="text-text-secondary" />
                Knowledge Snapshot
              </h2>
              <p className="text-[11px] text-text-muted mt-1">Understand the repository at a glance.</p>
            </header>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 border border-border rounded-lg bg-bg-surface/50">
                <div className="text-2xl font-bold mb-1">{summary.files}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"><FileCode2 size={10}/> Files</div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-bg-surface/50">
                <div className="text-2xl font-bold mb-1">{summary.symbols}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Hash size={10}/> Symbols</div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-bg-surface/50">
                <div className="text-2xl font-bold mb-1">{summary.relationships}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"><GitBranch size={10}/> Edges</div>
              </div>
              <div className="p-4 border border-border rounded-lg bg-bg-surface/50">
                <div className="text-2xl font-bold mb-1">{summary.routes}</div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-1.5"><Route size={10}/> Routes</div>
              </div>
            </div>
          </section>

          {/* Recent Analysis */}
          <section className="p-6 border border-border rounded-xl bg-bg-elevated/30">
            <header className="mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock size={16} className="text-text-secondary" />
                Recent Analysis
              </h2>
              <p className="text-[11px] text-text-muted mt-1">Resume engineering work.</p>
            </header>
            <div className="flex flex-col gap-2">
              <div className="group p-3 border border-border rounded-lg bg-bg-surface/50 hover:border-text-secondary transition-colors cursor-pointer flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">How does the login request reach the database?</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted">2 hrs ago</span>
              </div>
              <div className="group p-3 border border-border rounded-lg bg-bg-surface/50 hover:border-text-secondary transition-colors cursor-pointer flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Where are API rate limits configured?</span>
                </div>
                <span className="text-[10px] font-mono text-text-muted">1 day ago</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Side Actions) */}
        <div className="col-span-4 flex flex-col gap-6">
          
          {/* Quick Actions */}
          <section className="p-6 border border-border rounded-xl bg-bg-elevated/30">
            <header className="mb-4">
              <h2 className="text-sm font-semibold">Quick Actions</h2>
              <p className="text-[11px] text-text-muted mt-1">Start high-value workflows immediately.</p>
            </header>
            <div className="flex flex-col gap-2">
              <button className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-bg-hover transition-colors text-left group">
                <div className="flex items-center gap-3 text-sm text-text-secondary group-hover:text-text-primary">
                  <BookOpen size={14} />
                  Browse Repository
                </div>
                <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-bg-hover transition-colors text-left group">
                <div className="flex items-center gap-3 text-sm text-text-secondary group-hover:text-text-primary">
                  <GitBranch size={14} />
                  Open Knowledge
                </div>
                <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-bg-hover transition-colors text-left group">
                <div className="flex items-center gap-3 text-sm text-text-secondary group-hover:text-text-primary">
                  <PlayCircle size={14} />
                  Recent Threads
                </div>
                <ArrowRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </section>

          {/* Activity */}
          <section className="p-6 border border-border rounded-xl bg-bg-elevated/30 flex-1">
            <header className="mb-4">
              <h2 className="text-sm font-semibold">Activity</h2>
              <p className="text-[11px] text-text-muted mt-1">Show repository evolution.</p>
            </header>
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <Activity size={24} className="text-border mb-3" />
              <p className="text-xs text-text-muted max-w-[200px]">Repository activity and evolution timeline will appear here.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CodeScopeHome;
