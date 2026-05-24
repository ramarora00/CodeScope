import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, ShieldAlert, ChevronRight, Loader2, Info } from 'lucide-react';

const ImpactAnalysis = ({ repo, selectedFile }) => {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      fetchImpact();
    }
  }, [selectedFile]);

  const fetchImpact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repo.id}/impact?path=${encodeURIComponent(selectedFile.path)}`);
      const data = await res.json();
      setImpactData(data);
    } catch (err) {
      console.error('Failed to fetch impact analysis');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in">
        <ShieldAlert size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Select a file from the explorer to see the ripple effect of changes.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in">
        <Loader2 size={32} className="mb-4 animate-spin text-warning" />
        <p className="text-sm font-medium uppercase tracking-widest">Calculating Ripple Effects...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar pr-2">
      {/* Target Info */}
      <div className="glass p-6 rounded-3xl border-silver bg-warning/5 border-warning/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-warning/20 rounded-xl">
            <AlertTriangle className="text-warning" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient-silver">Impact Analysis</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Predictive Risk Assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="text-text-muted">Target:</span>
          <span className="font-mono text-xs bg-bg-surface px-2 py-1 rounded border border-border">{selectedFile.path}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dependant Files List */}
        <div className="glass p-6 rounded-3xl border-silver">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            Dependant Downstream
          </h4>
          <div className="space-y-3">
            {impactData?.dependants && impactData.dependants.length > 0 ? (
              impactData.dependants.map((path, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-bg-hover rounded-xl border border-border/50 group hover:border-accent/30 transition-all">
                  <ChevronRight size={14} className="text-text-muted group-hover:text-accent" />
                  <span className="text-xs font-medium text-text-primary truncate">{path}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 text-text-muted opacity-50">
                <Info size={24} className="mb-2" />
                <p className="text-[10px] uppercase font-bold">No direct dependants found</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Report */}
        <div className="glass p-6 rounded-3xl border-silver">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
            <Info size={14} className="text-success" />
            AI Risk Report
          </h4>
          <div className="prose prose-invert prose-xs max-w-none">
            <div className="text-[11px] leading-relaxed text-text-secondary whitespace-pre-wrap">
              {impactData?.analysis || "Awaiting intelligence processing..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactAnalysis;
