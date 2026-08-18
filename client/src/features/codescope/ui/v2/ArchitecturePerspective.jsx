import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../../../../config/api';
import KnowledgePanel from './KnowledgePanel';

import { useArchitectureLayout } from './architecture/useArchitectureLayout';
import { useAICameraController } from './architecture/useAICameraController';
import FolderContainer from './architecture/FolderContainer';
import FileNode from './architecture/FileNode';

// Node types will be memoized inside the component

// ArchitectureGraph: pure rendering sub-component — no store access.
// All user selection mutations are piped via onSelectFile callback.
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

function ArchitectureGraph({ fileTree, activeFile, visitedFiles, userSelectedFile, onSelectFile }) {
  const nodeTypes = useMemo(() => ({
    folderContainer: FolderContainer,
    fileNode: FileNode
  }), []);

  const explorerState = useWorkspaceStore(s => s.explorerState);
  const setExplorerState = useWorkspaceStore(s => s.setExplorerState);
  const expandedFolders = explorerState.expandedFolders;
  const setExpandedFolders = useCallback((updater) => {
    setExplorerState((prev) => {
      const nextFolders = typeof updater === "function" ? updater(prev.expandedFolders) : updater;
      if (nextFolders === prev.expandedFolders) return prev;
      return {
        ...prev,
        expandedFolders: nextFolders
      };
    });
  }, [setExplorerState]);

  const { nodes, edges } = useArchitectureLayout({
    fileTree,
    expandedFolders,
    visitedFiles,
    activeFile
  });

  const userCamera = useWorkspaceStore(s => s.userCamera);

  useAICameraController({
    activeFile,
    fileTree,
    setExpandedFolders,
    allowAIPan: !userCamera
  });

  // Folder/file node clicks → write ONLY to userSelectedFile, never AI session
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'folderContainer') {
      setExpandedFolders(prev => ({
        ...prev,
        [node.id]: !prev[node.id]
      }));
      onSelectFile({
        name: node.data.name,
        path: node.id,
        type: 'directory',
        fileCount: node.data.fileCount,
        childrenFiles: node.data.childrenFiles
      });
    } else if (node.type === 'fileNode') {
      onSelectFile({
        name: node.data.name,
        path: node.id,
        type: 'file'
      });
    }
  }, [onSelectFile]);

  // Opacity fading rule: non-focused subsystems fade to 15%
  const userSelectedFolder = userSelectedFile?.type === 'directory' ? userSelectedFile.path : null;

  const processedNodes = useMemo(() => {
    if (!activeFile && !userSelectedFolder) return nodes;

    const findParentPath = (tree, target, currentParent = null) => {
      if (!target) return null;
      for (const item of tree) {
        if (item.path === target) return currentParent;
        if (item.children) {
          const res = findParentPath(item.children, target, item.type === 'directory' ? item.path : currentParent);
          if (res) return res;
        }
      }
      return null;
    };
    const activeParent = findParentPath(fileTree, activeFile);

    return nodes.map(node => {
      const isAiFocused = node.id === activeParent || node.id === activeFile;
      const isUserFocused = node.id === userSelectedFolder;
      const isFocused = (activeFile && isAiFocused) || (!activeFile && isUserFocused);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isFocused ? 1.0 : 0.15,
          transition: 'opacity 500ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }
      };
    });
  }, [nodes, activeFile, fileTree, userSelectedFolder]);

  const architectureState = useWorkspaceStore(s => s.architectureState);
  const setArchitectureState = useWorkspaceStore(s => s.setArchitectureState);
  const setUserCamera = useWorkspaceStore(s => s.setUserCamera);

  const onMoveEnd = useCallback((event, viewport) => {
    setArchitectureState({ camera: viewport });
    // Any manual pan/zoom claims the camera for the user
    if (event) {
      setUserCamera(viewport);
    }
  }, [setArchitectureState, setUserCamera]);

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--cs-bg)' }}>
      <ReactFlow
        nodes={processedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onMoveEnd={onMoveEnd}
        defaultViewport={architectureState.camera}
        minZoom={0.05}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        className="codescope-map"
      >
        <Background color="rgba(255,255,255,0.015)" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

// ArchitecturePerspective: receives all state via presentation prop — no Zustand reads except for Graph Data.

function CodeGraphComingSoon() {
  const [phase, setPhase] = useState(0);
  const phases = [
    "PARSING FILES",
    "MAPPING DEPENDENCIES",
    "BUILDING RELATIONSHIPS",
    "PREPARING GRAPH"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [phases.length]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--cs-bg)] overflow-hidden">
      {/* Background Visual (Technical grid) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />
      
      {/* Decorative structural lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.25] pointer-events-none">
        <svg width="400" height="300" viewBox="0 0 400 300" fill="none">
          <path d="M200 50 L200 120" stroke="#F2F4F7" strokeWidth="1" strokeDasharray="4 4" />
          <path d="M200 120 L100 200" stroke="#F2F4F7" strokeWidth="1" />
          <path d="M200 120 L300 200" stroke="#F2F4F7" strokeWidth="1" />
          <circle cx="200" cy="50" r="4" fill="#0B0D10" stroke="#F2F4F7" strokeWidth="1.5" />
          <circle cx="200" cy="120" r="6" fill="#0B0D10" stroke="#F2F4F7" strokeWidth="1.5" />
          <circle cx="100" cy="200" r="4" fill="#0B0D10" stroke="#F2F4F7" strokeWidth="1.5" />
          <circle cx="300" cy="200" r="4" fill="#0B0D10" stroke="#F2F4F7" strokeWidth="1.5" />
          {/* Signal Pulses */}
          <motion.circle 
            cx="200" cy="50" r="2.5" fill="#6EA8E8"
            animate={{ cy: [50, 120], opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle 
            cx="200" cy="120" r="2.5" fill="#6EA8E8"
            animate={{ cx: [200, 300], cy: [120, 200], opacity: [0, 1, 0] }}
            transition={{ duration: 3, delay: 1, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      </div>

      <div className="z-10 flex flex-col items-center">
        <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#59616C] mb-2">CODE GRAPH</div>
        <div className="text-[20px] font-ui font-semibold text-[#F2F4F7] mb-3">Coming Soon</div>
        <div className="text-[13px] font-ui text-[#9AA3AF] mb-12 max-w-[320px] text-center">
          CodeScope is building the dependency intelligence layer for this repository.
        </div>

        <div className="flex flex-col gap-3 font-mono text-[11px] tracking-[0.05em]">
          {phases.map((text, idx) => {
            const isCompleted = idx < phase;
            const isActive = idx === phase;
            return (
              <div key={text} className={`flex items-center gap-3 transition-opacity duration-500 ${isActive || isCompleted ? 'opacity-100' : 'opacity-[0.35]'}`}>
                <div className="w-4 flex justify-center">
                  {isCompleted ? (
                    <span style={{ color: '#3FB879' }}>✓</span> // Restrained green
                  ) : isActive ? (
                    <motion.div 
                      className="w-1.5 h-1.5 rounded-full bg-[#6EA8E8]" 
                      animate={{ opacity: [1, 0.3, 1] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    /> // Subtle cold blue pulse
                  ) : (
                    <span style={{ color: '#59616C' }}>○</span>
                  )}
                </div>
                <span style={{ color: isActive ? '#F2F4F7' : '#9AA3AF' }}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ArchitecturePerspective({ presentation }) {
  const fileTree = useWorkspaceStore(s => s.fileTree);

  const repo = presentation?.selectedRepo;
  const userSelectedFile = presentation?.userSelectedFile;
  const onSelectFile = presentation?.onSelectFile;

  const activeFile = presentation?.attention?.file || null;
  const visitedFiles = useMemo(() => {
    const set = new Set();
    if (presentation?.tabs) {
      presentation.tabs.forEach(t => {
        if (t.path) set.add(t.path);
      });
    }
    return set;
  }, [presentation?.tabs]);

  if (!fileTree || fileTree.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--cs-bg)]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--cs-accent)] border-t-transparent animate-spin mb-4" />
        <div className="text-[11px] font-mono text-[var(--cs-hint)] uppercase tracking-wider">Mapping Workspace...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 bg-[var(--cs-bg)] gap-[2px]">
      {/* Map Canvas (takes over center space) */}
      <div className="flex-1 min-h-0 bg-[var(--cs-bg)] relative rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)]">
        {/* DO NOT RENDER ReactFlow FOR NOW. ARCHITECTURE PRESERVED FOR FUTURE. */}
        {/* <ReactFlowProvider>
          <ArchitectureGraph 
            fileTree={fileTree} 
            activeFile={activeFile} 
            visitedFiles={visitedFiles}
            userSelectedFile={userSelectedFile}
            onSelectFile={onSelectFile}
          />
        </ReactFlowProvider> */}
        <CodeGraphComingSoon />
        
        <div className="absolute top-4 left-4 z-10 select-none pointer-events-none flex flex-col gap-2 items-start">
          <span className="text-[9px] font-mono font-bold tracking-[0.15em] uppercase text-[var(--cs-hint)] bg-[var(--cs-panel)] px-2 py-1 rounded border border-[var(--cs-border)] shadow-sm">
            {repo?.name || 'Workspace'} / Map
          </span>
          {presentation?.userCamera && (
            <button 
              onClick={presentation.onReturnToAI}
              className="pointer-events-auto bg-[var(--cs-editor)] hover:bg-[var(--cs-panel)] text-[var(--cs-accent)] text-[10px] font-mono px-3 py-1 rounded border border-[var(--cs-border)] shadow-sm transition-colors"
            >
              Resume AI Camera Focus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
