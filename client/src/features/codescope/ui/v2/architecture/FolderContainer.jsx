import React from 'react';
import { Handle, Position } from 'reactflow';
import { Folder, FolderOpen, FolderClosed } from 'lucide-react';

/**
 * FolderContainer Node Component
 * 
 * Renders collapsed folder headers or expanded Linear-style project card containers.
 * When expanded, both direct files AND subdirectory summaries are rendered inline
 * as HTML elements — they are NOT separate ReactFlow nodes.
 */
export default function FolderContainer({ data }) {
  const { 
    name, isExpanded, fileCount, 
    childrenFiles = [], subfolders = [],
    visitedFiles = new Set(), activeFile 
  } = data;

  const entryPointsCount = childrenFiles.filter(f => 
    f.name.includes('route') || f.name.includes('controller') || f.name.includes('api')
  ).length;

  return (
    <div
      className="rounded-xl border transition-all duration-300 flex flex-col overflow-hidden"
      style={{
        background: 'var(--cs-panel)',
        borderColor: 'var(--cs-border)',
        boxShadow: 'var(--cs-shadow-panel)',
        width: isExpanded ? '240px' : '200px',
        minHeight: isExpanded ? 'auto' : '56px'
      }}
    >
      {/* ReactFlow handles for flow edge connectivity */}
      <Handle type="target" position={Position.Top} style={{ background: 'var(--cs-border)', opacity: 0 }} />

      {/* Folder Header */}
      <div 
        className="flex items-center gap-3 px-4 py-3 select-none cursor-pointer"
        style={{
          borderBottom: isExpanded ? '1px solid var(--cs-border)' : 'none',
          background: isExpanded ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
        }}
      >
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ 
            background: isExpanded ? 'rgba(191,200,216,0.08)' : 'rgba(191,200,216,0.03)', 
            color: isExpanded ? '#F4F4F4' : 'rgba(255,255,255,0.4)' 
          }}
        >
          {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[var(--cs-text)] truncate">{name}</div>
          <div className="text-[9px] text-[var(--cs-hint)] uppercase tracking-wider mt-0.5">
            {fileCount} files {entryPointsCount > 0 && `· ${entryPointsCount} entries`}
          </div>
        </div>
      </div>

      {/* Expanded Content: Subdirectories + Files */}
      {isExpanded && (
        <div className="flex flex-col py-2 px-1 max-h-[300px] overflow-y-auto custom-scrollbar bg-[#09090B]/30">
          
          {/* Inline subdirectory summaries */}
          {subfolders.map((folder, idx) => {
            const subFileCount = folder.children?.filter(c => c.type === 'file').length || 0;
            return (
              <div
                key={`sub-${folder.path}-${idx}`}
                className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-[11px] select-none"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <FolderClosed size={11} style={{ opacity: 0.5, flexShrink: 0 }} />
                <span className="truncate font-medium">{folder.name}</span>
                <span className="text-[9px] text-[var(--cs-hint)] ml-auto opacity-40 shrink-0">
                  {subFileCount}
                </span>
              </div>
            );
          })}

          {/* Separator between subdirectories and files */}
          {subfolders.length > 0 && childrenFiles.length > 0 && (
            <div className="mx-3 my-1 border-t border-[var(--cs-border)]" style={{ opacity: 0.3 }} />
          )}

          {/* Inline file list */}
          {childrenFiles.map((file, idx) => {
            const isVisited = visitedFiles.has(file.path);
            const isActive = activeFile === file.path;

            return (
              <div
                key={`${file.path}-${idx}`}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg text-[11px] font-mono select-none"
                style={{
                  color: isActive ? '#F4F4F4' : isVisited ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
                  background: isActive ? 'rgba(191,200,216,0.08)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Visited footprint green dot */}
                  {isVisited && (
                    <div 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ 
                        background: '#3FB950', 
                        boxShadow: '0 0 6px #3FB950',
                        opacity: isActive ? 1.0 : 0.65 
                      }} 
                    />
                  )}
                  {!isVisited && <div className="w-1.5 h-1.5 shrink-0" />}
                  <span className="truncate">{file.name}</span>
                </div>
                
                {/* Compact extension tag */}
                <span className="text-[9px] text-[var(--cs-hint)] uppercase ml-2 opacity-50 shrink-0">
                  {file.name.split('.').pop()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--cs-border)', opacity: 0 }} />
    </div>
  );
}
