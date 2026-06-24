import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldCheck, ShieldAlert, AlertTriangle,
  GitBranch, Network, Box, Layers, FileCode2,
  Route, Cpu, BarChart3, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';

const GradeColors = {
  A: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  B: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  C: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  D: 'text-red-400 border-red-400/30 bg-red-400/10',
};

const StatCard = ({ icon: Icon, label, value, sub, accent = false }) => (
  <div className={`glass p-5 rounded-2xl border-silver flex flex-col gap-2 ${accent ? 'bg-accent/5 border-accent/20' : ''}`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
      <Icon size={14} className={accent ? 'text-accent' : 'text-text-muted'} />
    </div>
    <span className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>{value ?? '—'}</span>
    {sub && <span className="text-[10px] text-text-muted">{sub}</span>}
  </div>
);

const ResolutionBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-text-secondary font-mono">{label}</span>
        <span className="text-[11px] font-bold text-text-primary">{count} <span className="text-text-muted font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const IntelligenceDashboard = ({ repo }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

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
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) return (
    <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver p-12">
      <XCircle size={32} className="mb-4 text-red-400 opacity-70" />
      <p className="text-sm font-medium text-text-primary mb-2">Stats Unavailable</p>
      <p className="text-xs text-center mb-6 max-w-xs">{error}</p>
      <button onClick={fetchStats} className="px-5 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-accent/30 transition-all">
        Retry
      </button>
    </div>
  );

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in">
      <Activity size={32} className="mb-4 animate-pulse text-accent" />
      <p className="text-sm font-medium uppercase tracking-widest">Computing Graph Intelligence...</p>
    </div>
  );

  const { summary, symbolsByType, languageBreakdown, graphQuality, resolutionBreakdown, domains } = stats;
  const grade = graphQuality?.healthGrade ?? '?';
  const totalEdges = summary.relationships;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar pr-2">

      {/* Header */}
      <div className="glass p-7 rounded-3xl border-silver bg-accent/5 border-accent/20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-accent/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-accent/10 rounded-2xl border border-accent/20">
                <Activity className="text-accent" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gradient-silver">Intelligence Dashboard</h2>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Graph Health & Observability</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Repository: <span className="text-text-primary font-medium">{stats.repoName}</span>
              {lastRefreshed && <span className="ml-3 text-text-muted">Last refreshed: {lastRefreshed}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-2xl border text-2xl font-bold ${GradeColors[grade] || GradeColors.D}`}>
              {grade}
            </div>
            <button
              onClick={fetchStats}
              className="p-2.5 border border-border rounded-xl hover:border-accent/40 hover:text-accent transition-all text-text-muted"
              title="Refresh stats"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Quick KPI strip */}
        <div className="grid grid-cols-5 gap-3 mt-6 pt-5 border-t border-border/40">
          {[
            { label: 'Files', val: summary.files },
            { label: 'Symbols', val: summary.symbols },
            { label: 'Edges', val: summary.relationships },
            { label: 'Routes', val: summary.routes },
            { label: 'Domains', val: summary.domains },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col gap-1 items-center">
              <span className="text-xl font-bold text-text-primary">{val}</span>
              <span className="text-[9px] text-text-muted uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Graph Quality + Resolution breakdown */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Avg Confidence */}
          <div className="glass p-6 rounded-3xl border-silver">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2">
              <ShieldCheck size={13} className="text-accent" />
              Graph Quality
            </h4>

            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-text-secondary">Avg Confidence</span>
              <span className="text-lg font-bold text-text-primary">
                {graphQuality?.averageConfidence != null ? graphQuality.averageConfidence.toFixed(3) : '—'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <ResolutionBar label="High (≥ 0.8)" count={graphQuality.highConfidenceEdges} total={totalEdges} color="bg-emerald-500" />
              <ResolutionBar label="Medium (0.4–0.8)" count={graphQuality.mediumConfidenceEdges} total={totalEdges} color="bg-amber-400" />
              <ResolutionBar label="Low (< 0.4)" count={graphQuality.lowConfidenceEdges} total={totalEdges} color="bg-red-500" />
            </div>

            {graphQuality.warning && (
              <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 items-start">
                <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-300/80">{graphQuality.warning}</p>
              </div>
            )}
          </div>

          {/* Resolution Method Breakdown */}
          <div className="glass p-6 rounded-3xl border-silver">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2">
              <GitBranch size={13} className="text-accent" />
              Resolution Methods
            </h4>
            <div className="flex flex-col gap-3">
              <ResolutionBar
                label="named_import"
                count={resolutionBreakdown.named_import || 0}
                total={totalEdges}
                color="bg-emerald-500"
              />
              <ResolutionBar
                label="local_scope"
                count={resolutionBreakdown.local_scope || 0}
                total={totalEdges}
                color="bg-blue-500"
              />
              <ResolutionBar
                label="global_name_match"
                count={resolutionBreakdown.global_name_match || 0}
                total={totalEdges}
                color="bg-red-500"
              />
              <ResolutionBar
                label="unknown"
                count={resolutionBreakdown.unknown || 0}
                total={totalEdges}
                color="bg-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Right column: Symbols, Languages, Domains, Call Site Coverage */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Call Site Coverage */}
          <div className="glass p-6 rounded-3xl border-silver">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2">
              <Network size={13} className="text-accent" />
              Call Site Coverage
            </h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-text-primary">{summary.callSites}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Total Calls</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-emerald-400">{summary.resolvedCallSites}</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Resolved</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-2xl font-bold ${summary.unresolvedCallSites > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {summary.unresolvedCallSites}
                </span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Unresolved</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-bg-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${summary.resolvedPercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted mt-2">{summary.resolvedPercentage}% of call sites mapped in the Knowledge Graph</p>
          </div>

          {/* Symbols by type + Languages */}
          <div className="grid grid-cols-2 gap-5">
            <div className="glass p-6 rounded-3xl border-silver">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <Box size={13} className="text-accent" />
                Symbols by Type
              </h4>
              <div className="flex flex-col gap-2.5">
                {Object.entries(symbolsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-[11px] text-text-secondary font-mono capitalize">{type}</span>
                    <span className="text-[11px] font-bold text-text-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-3xl border-silver">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileCode2 size={13} className="text-accent" />
                Languages
              </h4>
              <div className="flex flex-col gap-2.5">
                {Object.entries(languageBreakdown).map(([lang, count]) => (
                  <div key={lang} className="flex justify-between items-center">
                    <span className="text-[11px] text-text-secondary font-mono">.{lang}</span>
                    <span className="text-[11px] font-bold text-text-primary">{count} files</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Domains */}
          <div className="glass p-6 rounded-3xl border-silver">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers size={13} className="text-accent" />
              Detected Domains ({domains.length})
            </h4>
            <div className="flex flex-col gap-3">
              {domains.map((d, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-bg-surface border border-border hover:border-accent/30 transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-text-primary">{d.name} Domain</span>
                    {d.routes.slice(0, 2).map((r, ri) => (
                      <span key={ri} className="text-[9px] font-mono text-text-muted">{r}</span>
                    ))}
                    {d.routes.length > 2 && <span className="text-[9px] text-text-muted">+{d.routes.length - 2} more routes</span>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <span className="text-[9px] bg-bg-hover px-2 py-0.5 rounded-full border border-border text-text-muted">{d.routeCount} routes</span>
                    <span className="text-[9px] bg-bg-hover px-2 py-0.5 rounded-full border border-border text-text-muted">{d.fileCount} files</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
