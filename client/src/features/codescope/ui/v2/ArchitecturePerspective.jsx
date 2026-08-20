import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, LayoutGrid, Network, Box, Sparkles } from 'lucide-react';

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
    { title: "PARSING FILES", desc: "Scanning and indexing source structure", icon: FileText },
    { title: "MAPPING DEPENDENCIES", desc: "Identifying modules and external references", icon: LayoutGrid },
    { title: "BUILDING RELATIONSHIPS", desc: "Analyzing connections and hierarchies", icon: Network },
    { title: "PREPARING GRAPH", desc: "Generating the visualization experience", icon: Box }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [phases.length]);

  // Static starfield with sparse twinkling
  const starfield = useMemo(() => {
    return Array.from({ length: 70 }).map((_, i) => {
      const isTwinkler = Math.random() > 0.85;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 1.5 + 0.5}px`,
            height: `${Math.random() * 1.5 + 0.5}px`,
            background: 'white',
            opacity: Math.random() * 0.2 + 0.05,
          }}
          animate={isTwinkler ? { opacity: [0.1, 0.4, 0.1] } : undefined}
          transition={isTwinkler ? { duration: Math.random() * 3 + 3, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
      );
    });
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #0B0D10 0%, #030405 100%)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale'
      }}>

      {/* ── Starfield Background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {starfield}
      </div>

      {/* ── Left Constellation (Files/Modules) ── */}
      <div className="absolute left-0 top-0 bottom-0 w-[35%] pointer-events-none opacity-60 mix-blend-screen hidden md:block">
        <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMinYMid slice">
          <defs>
            <filter id="glow-blue-left" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path d="M100 250 L180 300 L120 450 L150 550" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M180 300 L250 420 L120 450" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <path d="M100 250 L80 400 L120 450" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          <rect x="97" y="247" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="115" y="253" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">App.jsx</text>

          <rect x="177" y="297" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="195" y="303" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">AuthService.js</text>

          <rect x="77" y="397" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="95" y="403" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">Login.jsx</text>

          <rect x="117" y="447" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="135" y="453" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">User.js</text>

          <rect x="147" y="547" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="165" y="553" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-mono)">Utils.js</text>

          <circle cx="250" cy="420" r="2.5" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>

      {/* ── Right Constellation (Architecture) ── */}
      <div className="absolute right-0 top-0 bottom-0 w-[35%] pointer-events-none opacity-60 mix-blend-screen hidden md:block">
        <svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMaxYMid slice">
          <path d="M280 250 L350 350 L250 450 L320 550" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M280 250 L180 320 L250 450" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <path d="M350 350 L250 450 L220 580" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          <rect x="277" y="247" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="295" y="253" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-ui)">API Layer</text>

          <rect x="347" y="347" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="365" y="353" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-ui)">Controllers</text>

          <rect x="247" y="447" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="265" y="453" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-ui)">Services</text>

          <rect x="317" y="547" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="335" y="553" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-ui)">Database</text>

          <rect x="217" y="577" width="6" height="6" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <text x="235" y="583" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="var(--font-ui)">Models</text>

          <circle cx="180" cy="320" r="2.5" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>

      {/* ── Main Content ── */}
      <div className="z-10 flex flex-col items-center w-full max-w-[800px] mt-[-40px]">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-[70px] mt-[80px]">
          {/* Serif font restricted to this single element as requested */}
          <div className="text-[44px] font-normal text-[#F2F4F7] mb-[18px] tracking-tight leading-none"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Coming Soon
          </div>
          <div className="w-[40px] h-[1px] bg-[rgba(255,255,255,0.1)] mb-[18px]" />
          <div className="text-[14.5px] text-[rgba(255,255,255,0.55)] text-center max-w-[360px] leading-[1.6] font-light">
            CodeScope is constructing the dependency intelligence layer for this repository.
          </div>
        </div>



        {/* Horizontal Pipeline */}
        <div className="relative flex items-start justify-between w-full px-8 mb-[70px]">
          {/* Background Connector Line */}
          <div className="absolute top-[24px] left-[12%] right-[12%] h-[1px] bg-[rgba(255,255,255,0.06)] -z-10 border-b border-dashed border-[rgba(255,255,255,0.04)]" />

          {/* Traveling Signal Dot */}
          <motion.div
            className="absolute top-[22.5px] w-[4px] h-[4px] rounded-full bg-[#6EA8E8] shadow-[0_0_8px_#6EA8E8] -z-10"
            animate={{ left: ['12%', '88%'] }}
            transition={{ duration: 7, ease: "linear", repeat: Infinity }}
          />

          {phases.map((item, idx) => {
            const isActive = idx === phase;
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex flex-col items-center flex-1 max-w-[160px] relative transition-opacity duration-700">
                {/* Icon Circle */}
                <div
                  className="w-[48px] h-[48px] rounded-full flex items-center justify-center mb-5 bg-[var(--cs-bg)] transition-all duration-500"
                  style={{
                    border: isActive ? '1px solid rgba(110,168,232,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: isActive ? '0 0 20px rgba(110,168,232,0.15), inset 0 0 10px rgba(110,168,232,0.1)' : 'none',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.25)'
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                </div>

                {/* Text Block */}
                <div className="flex flex-col items-center text-center">
                  <span
                    className="text-[10px] font-mono font-bold tracking-[0.08em] uppercase transition-colors duration-500 mb-2"
                    style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  >
                    {item.title}
                  </span>
                  <span
                    className="text-[12px] leading-[1.5] font-light transition-colors duration-500 max-w-[140px]"
                    style={{ color: isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                  >
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Info Card */}
        <div className="flex items-center gap-4 px-6 py-4 rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.015)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-md">
          <div className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.4)]">
            <Sparkles size={14} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-ui text-[#F2F4F7] font-medium mb-0.5">
              Building something meaningful takes time.
            </span>
            <span className="text-[12px] font-ui text-[rgba(255,255,255,0.4)] font-light">
              We're crafting the foundation for deep code understanding.
            </span>
          </div>
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
