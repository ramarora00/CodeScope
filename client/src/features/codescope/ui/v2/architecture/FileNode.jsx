import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileCode } from 'lucide-react';

/**
 * FileNode Component
 * 
 * Renders standalone root files on the map.
 */
export default function FileNode({ data }) {
  const { name, isVisited, isActive } = data;

  return (
    <div
      className="rounded-lg border transition-all duration-300 flex items-center justify-between px-3"
      style={{
        background: 'var(--cs-panel)',
        borderColor: isActive ? 'var(--cs-accent)' : 'var(--cs-border)',
        boxShadow: isActive ? '0 0 12px rgba(191,200,216,0.1)' : 'var(--cs-shadow-panel)',
        width: '180px',
        height: '36px'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'var(--cs-border)', opacity: 0 }} />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isVisited && (
          <div 
            className="w-1.5 h-1.5 rounded-full shrink-0" 
            style={{ 
              background: '#3FB950', 
              boxShadow: '0 0 6px #3FB950' 
            }} 
          />
        )}
        {!isVisited && (
          <div className="text-[var(--cs-hint)] shrink-0">
            <FileCode size={12} />
          </div>
        )}
        <span 
          className="text-[11px] font-mono truncate"
          style={{
            color: isActive ? '#F4F4F4' : isVisited ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'
          }}
        >
          {name}
        </span>
      </div>

      <span className="text-[9px] text-[var(--cs-hint)] uppercase ml-2 opacity-50 shrink-0">
        {name.split('.').pop()}
      </span>

      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--cs-border)', opacity: 0 }} />
    </div>
  );
}
