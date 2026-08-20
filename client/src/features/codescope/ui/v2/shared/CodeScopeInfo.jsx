import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, ChevronRight, CheckCircle2, Clock, Code2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const INFO_CONTENT = {
  login: {
    title: 'CodeScope Authentication',
    description: 'CodeScope connects securely to your Firebase identity to provide private, isolated repository investigation spaces.',
    howToStart: [
      'Enter your email and password to sign in.',
      'If you don\'t have an account, click "Sign up".',
      'Or use Google Authentication for one-click access.'
    ],
    canDo: [
      'Securely authenticate into the platform',
      'Maintain private isolated workspaces',
      'Resume past repository investigations'
    ],
    status: [
      { label: 'Firebase Auth Integration', type: 'available' },
      { label: 'Role-based Access', type: 'development' }
    ]
  },
  repository: {
    title: 'Repository Management',
    description: 'Connect, index, and manage your source code repositories. CodeScope builds a deterministic Knowledge Graph from your codebase.',
    howToStart: [
      'Select an existing indexed repository to enter the workspace.',
      'Or upload/connect a new repository.',
      'Wait for the indexing pipeline to parse ASTs and build embeddings.'
    ],
    canDo: [
      'Upload local repositories',
      'Track indexing progress and vector sync',
      'Manage isolated workspaces'
    ],
    status: [
      { label: 'Repository Ingestion', type: 'available' },
      { label: 'AST Parsing & Vector Embeddings', type: 'available' },
      { label: 'GitHub Cloud Sync', type: 'coming_soon' }
    ]
  },
  workspace: {
    title: 'Workspace Explorer',
    description: 'Your primary interface for reading, investigating, and understanding the codebase structure.',
    howToStart: [
      'Use the File Explorer to browse the repository.',
      'Click on any file to read its contents in the Code Viewer.',
      'Review the Knowledge Panel for architectural insights.'
    ],
    canDo: [
      'Browse file trees and read source code',
      'Review AI-generated architectural summaries',
      'Launch deep investigations'
    ],
    status: [
      { label: 'Universal Code Viewer', type: 'available' },
      { label: 'Knowledge Panel', type: 'available' },
      { label: 'Multi-tab Navigation', type: 'development' }
    ]
  },
  investigation: {
    title: 'AI Investigation Mode',
    description: 'Ask deep architectural questions. CodeScope traces the Knowledge Graph and Vector store to reason about the codebase.',
    howToStart: [
      'Type a specific question about the system architecture.',
      'Watch the AI stream its reasoning and discovered symbols.',
      'Review the generated comprehensive report.'
    ],
    canDo: [
      'Trace reasoning across multiple files',
      'Understand evidence-driven context',
      'Perform impact analysis'
    ],
    status: [
      { label: 'Evidence-driven Reasoning', type: 'available' },
      { label: 'SSE Streaming Responses', type: 'available' },
      { label: 'Follow-up Chat Context', type: 'development' }
    ]
  },
  graph: {
    title: 'Interactive Code Graph',
    description: 'Visualize the deterministic relationships, call graphs, and dependencies across the repository.',
    howToStart: [
      'Review the visual mapping of the system.',
      'Trace upstream and downstream dependencies.',
      'Understand the blast radius of potential changes.'
    ],
    canDo: [
      'Visualize call graphs',
      'Trace route dependencies',
      'Identify critical failure points'
    ],
    status: [
      { label: 'Dependency Intelligence', type: 'development' },
      { label: 'Interactive Visualization', type: 'coming_soon' }
    ]
  }
};

const StatusBadge = ({ type }) => {
  switch (type) {
    case 'available':
      return (
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> Available
        </span>
      );
    case 'development':
      return (
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
          <Code2 className="w-3 h-3" /> In Development
        </span>
      );
    case 'coming_soon':
      return (
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Coming Soon
        </span>
      );
    default:
      return null;
  }
};

export default function CodeScopeInfo({ page = 'workspace', className }) {
  const [isOpen, setIsOpen] = useState(false);
  const data = INFO_CONTENT[page] || INFO_CONTENT.workspace;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "group flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200",
          "hover:bg-[#1C1C1C] hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]",
          "focus:outline-none focus:ring-1 focus:ring-zinc-600",
          className
        )}
        title="Product Information"
      >
        <Info className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div key="info-modal" className="fixed inset-0 flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 99999 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-2xl bg-[#0A0A0A] border border-zinc-800 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-shrink-0 p-6 border-b border-zinc-800/50 bg-gradient-to-b from-[#111] to-[#0A0A0A]">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-[10px] text-zinc-500 tracking-widest font-mono uppercase mb-2">CodeScope Product Brief</div>
                <h2 className="text-xl font-medium text-zinc-100">{data.title}</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-lg leading-relaxed">{data.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* How to start */}
                <section>
                  <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4">How to Start</h3>
                  <div className="space-y-3">
                    {data.howToStart.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono border border-zinc-700/50 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* What you can do */}
                <section>
                  <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4">What You Can Do</h3>
                  <ul className="space-y-2">
                    {data.canDo.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Feature Status */}
                <section className="bg-[#111] rounded-lg border border-zinc-800/50 p-5">
                  <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-4">Feature Status</h3>
                  <div className="space-y-3">
                    {data.status.map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-zinc-300">{stat.label}</span>
                        <StatusBadge type={stat.type} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Phase Info */}
                <section className="pt-2 border-t border-zinc-800/50">
                  <h3 className="text-[11px] font-medium text-blue-400 uppercase tracking-widest mb-3">Current Development: Phase 1</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    CodeScope is currently in Phase 1, focused on establishing the core repository intelligence, 
                    knowledge graph ingestion, and deterministic evidence-driven investigation pipeline.
                  </p>
                </section>

              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
