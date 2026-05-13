import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Loader2, Share2, ZoomIn, Info, RefreshCw } from 'lucide-react';

// Dagre auto-layout: distributes nodes into a hierarchy automatically
const getAutoLayout = (nodes, edges) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    g.setNode(node.id, { width: 160, height: 40 });
  });
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const { x, y } = g.node(node.id);
    return { ...node, position: { x, y } };
  });
};

const DependencyGraph = ({ repoId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (repoId) fetchGraphData();
  }, [repoId]);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/repo/${repoId}/dependencies`);
      const data = await res.json();

      const styledNodes = (data.nodes || []).map(node => ({
        ...node,
        style: {
          background: 'rgba(17,17,17,0.9)',
          color: '#E5E5E5',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '10px',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: '600',
          width: 160,
          textAlign: 'center',
          boxShadow: '0 0 8px rgba(59,130,246,0.08)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      }));

      const styledEdges = (data.edges || []).map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
        style: { stroke: '#3B82F6', strokeWidth: 1.5, opacity: 0.6 }
      }));

      // Apply auto layout
      const layouted = styledEdges.length > 0 
        ? getAutoLayout(styledNodes, styledEdges) 
        : styledNodes.map((n, i) => ({
            ...n,
            position: {
              x: (i % 8) * 190 + 20,
              y: Math.floor(i / 8) * 80 + 20
            }
          }));

      setNodes(layouted);
      setEdges(styledEdges);
      setStats({ nodes: data.nodes?.length || 0, edges: data.edges?.length || 0 });
    } catch (err) {
      console.error('Graph load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted glass rounded-3xl border-silver animate-in fade-in">
        <Loader2 size={32} className="mb-4 animate-spin text-accent" />
        <p className="text-sm font-medium uppercase tracking-widest">Generating Dependency Map...</p>
      </div>
    );
  }

  return (
    <div className="h-full relative glass rounded-3xl border-silver overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#1a1a1a" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          style={{ background: '#0A0A0A', border: '1px solid #222' }}
          maskColor="rgba(0,0,0,0.7)"
          nodeColor={() => '#3B82F6'}
        />
        <Panel position="top-left">
          <div className="flex gap-2 p-2">
            <div className="px-3 py-1.5 bg-bg-main/90 border border-accent/30 rounded-full text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 shadow-glow-subtle">
              <Share2 size={10} /> {stats.nodes} Files
            </div>
            <div className={`px-3 py-1.5 bg-bg-main/90 border rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${stats.edges > 0 ? 'border-success/30 text-success' : 'border-border text-text-muted'}`}>
              <ZoomIn size={10} /> {stats.edges} Links
            </div>
            {stats.edges === 0 && (
              <div className="px-3 py-1.5 bg-warning/10 border border-warning/30 rounded-full text-[10px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
                <Info size={10} /> Re-index needed
              </div>
            )}
          </div>
        </Panel>
        <Panel position="top-right">
          <button
            onClick={fetchGraphData}
            className="p-2 bg-bg-main/90 border border-border rounded-lg text-text-muted hover:text-accent hover:border-accent/30 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </Panel>
      </ReactFlow>

      {stats.edges === 0 && stats.nodes > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl text-[11px] text-warning text-center max-w-sm">
          <strong>No connections detected.</strong> This repo uses a language our parser doesn't yet index (e.g., PHP). 
          Re-upload the repo to trigger a fresh parse with multi-language support.
        </div>
      )}
    </div>
  );
};

export default DependencyGraph;
