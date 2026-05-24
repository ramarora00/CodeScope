import React, { useEffect, useState } from 'react';
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
import { Loader2, ZoomIn, Info, RefreshCw, Layers, GitBranch } from 'lucide-react';

// Dagre auto-layout: distributes nodes into a hierarchy automatically
const getAutoLayout = (nodes, edges) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    g.setNode(node.id, { width: 200, height: 45 });
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
  const [graphMode, setGraphMode] = useState('file'); // 'file' or 'symbol'
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => {
    if (repoId) fetchGraphData();
  }, [repoId, graphMode]);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const endpoint = graphMode === 'file' 
        ? `http://localhost:5000/api/repo/${repoId}/dependencies`
        : `http://localhost:5000/api/repo/${repoId}/symbols/graph`;

      const res = await fetch(endpoint);
      const data = await res.json();

      const styledNodes = (data.nodes || []).map(node => {
        // Determine styling based on type
        let border = '1px solid #333';
        let bg = 'rgba(17, 17, 17, 0.9)';
        let shadow = '0 0 8px rgba(59, 130, 246, 0.08)';
        let labelColor = '#E5E5E5';

        if (graphMode === 'symbol') {
          const type = node.data.type;
          if (type === 'route') {
            border = '1.5px solid #EC4899';
            bg = 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(109,40,217,0.15) 100%)';
            shadow = '0 0 12px rgba(236, 72, 153, 0.25)';
            labelColor = '#F472B6';
          } else if (type === 'function') {
            border = '1px solid #06B6D4';
            bg = 'rgba(6, 182, 212, 0.05)';
            shadow = '0 0 8px rgba(6, 182, 212, 0.12)';
            labelColor = '#22D3EE';
          } else if (type === 'class') {
            border = '1px solid #EAB308';
            bg = 'rgba(234, 179, 8, 0.05)';
            shadow = '0 0 8px rgba(234, 179, 8, 0.12)';
            labelColor = '#FACC15';
          }
        }

        return {
          ...node,
          style: {
            background: bg,
            color: labelColor,
            border: border,
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: '600',
            width: 200,
            textAlign: 'center',
            boxShadow: shadow,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }
        };
      });

      const edgeColor = graphMode === 'file' ? '#3B82F6' : '#EC4899';

      const styledEdges = (data.edges || []).map(edge => ({
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: { stroke: edgeColor, strokeWidth: 1.5, opacity: 0.7 }
      }));

      // Apply auto layout
      const layouted = styledEdges.length > 0 
        ? getAutoLayout(styledNodes, styledEdges) 
        : styledNodes.map((n, i) => ({
            ...n,
            position: {
              x: (i % 8) * 230 + 20,
              y: Math.floor(i / 8) * 90 + 20
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
        <p className="text-sm font-medium uppercase tracking-widest">Generating {graphMode === 'file' ? 'Module' : 'Execution'} Map...</p>
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
        minZoom={0.05}
        maxZoom={2}
      >
        <Background color="#111" gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          style={{ background: '#0A0A0A', border: '1px solid #222' }}
          maskColor="rgba(0,0,0,0.7)"
          nodeColor={(n) => {
            if (graphMode === 'symbol') {
              if (n.data.type === 'route') return '#EC4899';
              if (n.data.type === 'function') return '#06B6D4';
              return '#EAB308';
            }
            return '#3B82F6';
          }}
        />
        <Panel position="top-left">
          <div className="flex gap-2 p-2">
            <div className={`px-3 py-1.5 bg-bg-main/90 border rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${graphMode === 'file' ? 'border-accent/40 text-accent shadow-glow-subtle' : 'border-pink-500/40 text-pink-500 shadow-glow-subtle'}`}>
              <GitBranch size={10} /> {stats.nodes} {graphMode === 'file' ? 'Files' : 'Symbols'}
            </div>
            <div className={`px-3 py-1.5 bg-bg-main/90 border rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${stats.edges > 0 ? (graphMode === 'file' ? 'border-success/30 text-success' : 'border-pink-500/30 text-pink-500') : 'border-border text-text-muted'}`}>
              <ZoomIn size={10} /> {stats.edges} Links
            </div>
          </div>
        </Panel>

        <Panel position="top-center">
          <div className="flex bg-bg-main/90 border border-border p-1 rounded-xl shadow-glow-subtle gap-1">
            <button
              onClick={() => setGraphMode('file')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${graphMode === 'file' ? 'bg-accent/20 text-accent border border-accent/20' : 'text-text-muted hover:text-text-main'}`}
            >
              <Layers size={10} /> Module Graph (File)
            </button>
            <button
              onClick={() => setGraphMode('symbol')}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${graphMode === 'symbol' ? 'bg-pink-500/20 text-pink-500 border border-pink-500/20' : 'text-text-muted hover:text-text-main'}`}
            >
              <GitBranch size={10} /> Execution Graph (Call)
            </button>
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
          <strong>No connections detected.</strong> Re-upload the repository to map all global symbols and build your execution Call Graph!
        </div>
      )}
    </div>
  );
};

export default DependencyGraph;
