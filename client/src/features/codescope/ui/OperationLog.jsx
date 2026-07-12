import React from 'react';
import { Check, Circle } from 'lucide-react';

export default function OperationLog({ operations = [] }) {
  if (operations.length === 0) return null;

  return (
    <div className="w-full border border-white/5 rounded-lg bg-[#080A0F] overflow-hidden flex flex-col mb-4">
      {/* Title */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0A0E15] border-b border-white/5 select-none">
        <span className="text-[9px] font-bold text-[#5C657A] uppercase tracking-wider">Reasoning Pipeline</span>
      </div>

      {/* Steps List */}
      <div className="p-3 flex flex-col space-y-2.5">
        {operations.map((op, idx) => {
          const isDone = op.status === 'done';
          const isRunning = op.status === 'running';
          const isFailed = op.status === 'failed';
          
          return (
            <div key={op.id || idx} className="flex items-center gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-4 h-4 select-none">
                {isDone && (
                  <div className="text-[#7A8F7B]">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
                {isRunning && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                )}
                {isFailed && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B6B6B]" />
                )}
                {!isDone && !isRunning && !isFailed && (
                  <div className="w-1.5 h-1.5 rounded-full border border-[#5C657A] bg-transparent" />
                )}
              </div>
              
              <span className={`text-[11px] font-mono leading-none ${
                isDone ? 'text-[#8E97A8]' :
                isRunning ? 'text-[#D8DCE6] font-medium' :
                isFailed ? 'text-[#8B6B6B]' : 'text-[#5C657A]'
              }`}>
                {op.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
