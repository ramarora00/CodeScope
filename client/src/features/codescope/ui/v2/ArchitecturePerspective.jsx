import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { API_BASE } from '../../../../config/api';
import KnowledgePanel from './KnowledgePanel';

import { useArchitectureLayout } from './architecture/useArchitectureLayout';
import { useAICameraController } from './architecture/useAICameraController';
import FolderContainer from './architecture/FolderContainer';
import FileNode from './architecture/FileNode';

const nodeTypes = {
  folderContainer: FolderContainer,
  fileNode: FileNode
};

// ArchitectureGraph: pure rendering sub-component — no store access.
// All user selection mutations are piped via onSelectFile callback.
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

function ArchitectureGraph({ fileTree, activeFile, visitedFiles, userSelectedFile, onSelectFile }) {
  const explorerState = useWorkspaceStore(s => s.explorerState);
  const setExplorerState = useWorkspaceStore(s => s.setExplorerState);
  const expandedFolders = explorerState.expandedFolders;
  const setExpandedFolders = (updater) => {
    setExplorerState(prev => ({
      ...prev,
      expandedFolders: typeof updater === 'function' ? updater(prev.expandedFolders) : updater
    }));
  };

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
import { useWorkspaceStore } from '../../../store/useWorkspaceStore';

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
      {/* Map Canvas */}
      <div className="flex-1 min-h-0 bg-[var(--cs-bg)] animate-fade-in relative rounded-xl border border-[var(--cs-border)] overflow-hidden">
        <ReactFlowProvider>
          <ArchitectureGraph 
            fileTree={fileTree} 
            activeFile={activeFile} 
            visitedFiles={visitedFiles}
            userSelectedFile={userSelectedFile}
            onSelectFile={onSelectFile}
          />
        </ReactFlowProvider>
        
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

      {/* Contextual Intelligence Sidebar */}
      <div 
        className="flex-shrink-0 bg-[var(--cs-panel)] rounded-xl border border-[var(--cs-border)] overflow-hidden shadow-[var(--cs-shadow-panel)] animate-settle"
        style={{ animationDelay: '180ms' }}
      >
        <KnowledgePanel
          repo={repo}
          findings={presentation?.findings || []}
          relatedSymbols={presentation?.relatedSymbols || []}
          onNewInvestigation={undefined}
          selectedFile={userSelectedFile}
          selectedTimelineEventId={presentation?.selectedTimelineEventId}
          onReturnToPresent={presentation?.onReturnToPresent}
        />
      </div>
    </div>
  );
}
