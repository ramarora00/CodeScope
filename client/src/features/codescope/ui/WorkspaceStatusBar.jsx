import React from 'react';
import { useInvestigationSession } from '../store/useInvestigationSession';
import { Target, Activity, CheckCircle, Clock } from 'lucide-react';

export function WorkspaceStatusBar() {
  const { focusContext, metadata } = useInvestigationSession();
  
  if (!focusContext || focusContext.status === 'repository') {
    return (
      <div className="h-8 border-b border-white/5 bg-[#080A0F] flex items-center px-4 justify-between select-none shrink-0 z-10 text-[10px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#8E97A8]">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>Repository: {metadata?.repoId || 'ai-developer-copilot'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#5C657A]">
            <span>Mode: Repository</span>
          </div>
        </div>
      </div>
    );
  }

  const { mission, status, currentStep, confidence } = focusContext;

  return (
    <div className="h-8 border-b border-[#3B82F6]/20 bg-[#0A0D12] flex items-center px-4 justify-between select-none shrink-0 z-10 text-[10px]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-[#D8DCE6] font-medium">
          <Target size={12} className="text-[#3B82F6]" />
          <span className="truncate max-w-[300px]">Mission: {mission}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-[#3B82F6]">
          {status === 'review' ? (
            <CheckCircle size={12} />
          ) : (
            <Activity size={12} className="animate-pulse" />
          )}
          <span className="uppercase tracking-wider font-bold">
            {status === 'planning' ? 'Planning' : status === 'investigating' ? 'Investigating' : 'Complete'}
          </span>
        </div>

        {currentStep && (
          <div className="flex items-center gap-1.5 text-[#8E97A8]">
            <span className="truncate max-w-[250px] font-mono">Step: {currentStep}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {confidence !== null && (
          <div className="flex items-center gap-1.5 text-[#8E97A8]">
            <span>Confidence: {(confidence * 100).toFixed(0)}%</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[#5C657A]">
          <Clock size={12} />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}
