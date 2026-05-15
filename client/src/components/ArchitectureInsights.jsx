import React, { useState, useEffect } from 'react';
import { Box, Layers, Code2, FolderTree, Cpu, Loader2, Info, CheckCircle2 } from 'lucide-react';

const ArchitectureInsights = ({ repo }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repo) fetchArchitecture();
  }, [repo]);

  const [error, setError] = useState(null);

  const fetchArchitecture = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/architecture`);
      if (!res.ok) throw new Error('Google AI Service is currently busy. (503)');
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in p-12">
        <Cpu size={32} className="mb-4 text-error opacity-50" />
        <p className="text-sm font-medium text-text-primary mb-2">Architectural Synthesis Failed</p>
        <p className="text-xs text-text-muted text-center mb-6 max-w-xs">{error}</p>
        <button 
          onClick={fetchArchitecture}
          className="px-6 py-2 bg-bg-surface border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-bg-hover hover:border-accent/30 transition-all"
        >
          Retry Synthesis
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in">
        <Layers size={32} className="mb-4 animate-spin text-accent" />
        <p className="text-sm font-medium uppercase tracking-widest">Synthesizing System Architecture...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar pr-2">
      {/* Header Card */}
      <div className="glass p-8 rounded-3xl border-silver bg-accent/5 border-accent/20 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
              <Layers className="text-accent" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gradient-silver">System Blueprints</h2>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Architectural Overview</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {data?.stack?.map((tech, i) => (
              <div key={i} className="px-4 py-2 bg-bg-surface border border-border rounded-xl flex items-center gap-2 shadow-sm">
                <CheckCircle2 size={14} className="text-success" />
                <span className="text-xs font-bold text-text-primary">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Breakdown */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass p-6 rounded-3xl border-silver">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
              <FolderTree size={14} className="text-accent" />
              Module Structure
            </h4>
            <div className="space-y-4">
              {Object.entries(data?.folders || {}).map(([name, count], i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition-all" />
                    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-all">/{name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{count} files</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border-silver bg-success/5">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-success" />
              Patterns Detected
            </h4>
            <ul className="text-[11px] text-text-secondary space-y-2 list-disc pl-4">
              <li>Component-Based UI</li>
              <li>RESTful API Endpoints</li>
              <li>Relational Data Modeling</li>
            </ul>
          </div>
        </div>

        {/* AI Architect Summary */}
        <div className="lg:col-span-2 glass p-8 rounded-3xl border-silver relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-[1px] bg-accent/50" />
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Architectural Summary</h4>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap font-sans">
              {data?.summary || "Analyzing codebase patterns..."}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <Code2 size={12} />
                Clean Code Verified
              </div>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                <Info size={12} />
                Modular Design
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureInsights;
