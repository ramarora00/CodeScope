import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkspaceStore } from '../../store/useWorkspaceStore';
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

function ArchitectureGraph({ fileTree, activeFile, visitedFiles }) {
  // Read and persist expand/collapse states across perspective mounts in local storage
  const [expandedFolders, setExpandedFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('codescope_map_expanded');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('codescope_map_expanded', JSON.stringify(expandedFolders));
  }, [expandedFolders]);

  // Compute container layout
  const { nodes, edges } = useArchitectureLayout({
    fileTree,
    expandedFolders,
    visitedFiles,
    activeFile
  });

  // Track parent changes for AI camera centering
  useAICameraController({
    activeFile,
    fileTree,
    setExpandedFolders
  });

  // Folder toggling node clicks
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'folderContainer') {
      setExpandedFolders(prev => ({
        ...prev,
        [node.id]: !prev[node.id]
      }));
      useWorkspaceStore.getState().setSelectedFile({
        name: node.data.name,
        path: node.id,
        type: 'directory',
        fileCount: node.data.fileCount,
        childrenFiles: node.data.childrenFiles
      });
    } else if (node.type === 'fileNode') {
      useWorkspaceStore.getState().setSelectedFile({
        name: node.data.name,
        path: node.id,
        type: 'file'
      });
    }
  }, []);

  // Opacity fading rule: non-focused subsystems fade to 15%
  // Focused if it's the active AI file, OR if the user has explicitly selected it (Semantic Zoom)
  const processedNodes = useMemo(() => {
    const userSelectedFolder = useWorkspaceStore.getState().selectedFile?.type === 'directory' 
      ? useWorkspaceStore.getState().selectedFile.path 
      : null;
      
    // If nothing is actively selected or being read by AI, everything is fully visible
    if (!activeFile && !userSelectedFolder) return nodes;

    // Determine current parent container for AI focus
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
      // A node is focused if it IS the active parent directory (AI), the active file (AI), 
      // or the user specifically clicked this folder to semantically zoom in.
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
  }, [nodes, activeFile, fileTree, useWorkspaceStore.getState().selectedFile]);

  return (
    <div className="w-full h-full relative" style={{ background: 'var(--cs-bg)' }}>
      <ReactFlow
        nodes={processedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
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

export default function ArchitecturePerspective({ presentation }) {
  const repo = useWorkspaceStore(s => s.selectedRepo);
  const selectedFile = useWorkspaceStore(s => s.selectedFile);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derive active focus path and visited footprints
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

  useEffect(() => {
    if (!repo?.id) return;
    setLoading(true);
    fetch(`${API_BASE}/api/repo/${repo.id}/files`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFileTree(data);
      })
      .catch(err => console.error('[ArchitectureMap] Failed to load files:', err))
      .finally(() => setLoading(false));
  }, [repo?.id]);

  if (loading) {
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
          />
        </ReactFlowProvider>
        
        {/* Rootless metadata indicator */}
        <div className="absolute top-4 left-4 z-10 select-none pointer-events-none">
          <span className="text-[9px] font-mono font-bold tracking-[0.15em] uppercase text-[var(--cs-hint)] bg-[var(--cs-panel)] px-2 py-1 rounded border border-[var(--cs-border)] shadow-sm">
            {repo?.name || 'Workspace'} / Map
          </span>
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
          onNewInvestigation={undefined} // Map has no new-investigation triggers
          selectedFile={selectedFile}
        />
      </div>
    </div>
  );
}
