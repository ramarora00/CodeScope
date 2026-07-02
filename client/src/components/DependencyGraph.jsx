import React, { useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Loader2, GitBranch, Layers, PlayCircle, Network, RefreshCw } from 'lucide-react';

/* ─── Auto-layout ─── */
const autoLayout = (nodes, edges, dir = 'TB') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: dir, ranksep: 80, nodesep: 40 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: 180, height: 44 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const { x, y } = g.node(n.id);
    return { ...n, position: { x, y } };
  });
};

/* ─── Custom node types ─── */
const NODE_STYLES = {
  file:       { bg: '#10141C', border: '#283245', text: '#8E97A8', label: 'FILE' },
  route:      { bg: '#0F1C14', border: '#285228', text: '#7A8F7B', label: 'ROUTE' },
  middleware: { bg: '#1C150F', border: '#524528', text: '#8F847A', label: 'MIDDLEWARE' },
  controller: { bg: '#0F1420', border: '#284052', text: '#7A8A9F', label: 'CONTROLLER' },
  service:    { bg: '#140F1C', border: '#40285A', text: '#9A8AAF', label: 'SERVICE' },
  model:      { bg: '#1C0F0F', border: '#4A2828', text: '#AF8A8A', label: 'MODEL' },
  database:   { bg: '#0F0F14', border: '#282840', text: '#8A8AAF', label: 'DATABASE' },
  symbol:     { bg: '#10141C', border: '#283245', text: '#8E97A8', label: 'SYMBOL' },
};

const ObsNode = ({ data }) => {
  const s = NODE_STYLES[data.type] || NODE_STYLES.file;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: '8px 12px',
      fontFamily: 'Inter, sans-serif', minWidth: 140,
      boxShadow: `0 0 12px rgba(0,0,0,0.6)`,
    }}>
      <Handle type="target" position={Position.Left} style={{ background: s.border, width: 6, height: 6, border: 'none' }} />
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: s.text, marginBottom: 2, textTransform: 'uppercase' }}>
        {s.label}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#D8DCE6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: s.border, width: 6, height: 6, border: 'none' }} />
    </div>
  );
};

const nodeTypes = { obs: ObsNode };

/* ─── Graph component ─── */
const KnowledgeGraph = ({ repoId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [graphMode, setGraphMode] = useState('import');
  const [stats, setStats] = useState({ nodes: 0, edges: 0 });

  useEffect(() => { if (repoId) fetchGraph(); }, [repoId, graphMode]);

  const fetchGraph = async () => {
    setLoading(true);
    try {
      const endpoint = graphMode === 'import'
        ? `http://localhost:5000/api/repo/${repoId}/dependencies`
        : `http://localhost:5000/api/repo/${repoId}/symbols/graph`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();

      const raw = data.nodes?.map(n => ({
        id: n.id,
        type: 'obs',
        data: {
          label: n.data?.label || n.data?.name || n.id,
          type: graphMode === 'import'
            ? 'file'
            : (n.data?.type || n.data?.symbolType || 'symbol'),
        },
        position: { x: 0, y: 0 },
      })) || [];

      const rawEdges = data.edges?.map(e => ({
        id: e.id || `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#283245', width: 14, height: 14 },
        style: { stroke: '#1C2331', strokeWidth: 1.5 },
        animated: false,
      })) || [];

      let positioned;
      try { positioned = autoLayout(raw, rawEdges); }
      catch { positioned = raw; }

      setNodes(positioned);
      setEdges(rawEdges);
      setStats({ nodes: positioned.length, edges: rawEdges.length });
    } catch (e) {
      console.error('Graph fetch error:', e);
      // Fallback: show empty
      setNodes([]);
      setEdges([]);
    } finally { setLoading(false); }
  };

  /* Build an execution trace from available nodes for visual demo */
  const buildExecutionTrace = () => {
    const routeNodes = nodes.filter(n => n.data.type === 'route');
    if (routeNodes.length === 0) return;
    // Just highlight the path in order
  };

  const MODES = [
    { id: 'import', label: 'Import Graph', icon: GitBranch, desc: 'File dependency map' },
    { id: 'symbol', label: 'Knowledge Graph', icon: Network, desc: 'Symbol relationships' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0E15' }}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0" style={{ background: '#080A0F' }}>
        <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-lg p-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setGraphMode(m.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                graphMode === m.id
                  ? 'bg-bg-elevated text-text-primary border border-border'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <m.icon size={11} />
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span>{stats.nodes} nodes</span>
            <span className="w-px h-3 bg-border" />
            <span>{stats.edges} edges</span>
          </div>
          <button onClick={fetchGraph} className="p-1.5 border border-border rounded-md text-text-muted hover:text-text-primary transition-colors">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-surface border border-border flex items-center justify-center">
              <Loader2 size={16} className="text-text-muted animate-spin" />
            </div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Mapping Graph...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ animated: false }}
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0A0E15' }}
          >
            <Background color="#1C2331" gap={28} size={1} />
            <Controls
              style={{
                background: '#10141C',
                border: '1px solid #1C2331',
                borderRadius: 8,
              }}
            />
          </ReactFlow>
        )}
      </div>

      {/* Mode description bar */}
      <div className="px-5 py-2.5 border-t border-border flex-shrink-0 flex items-center gap-3" style={{ background: '#080A0F' }}>
        {(() => {
          const m = MODES.find(x => x.id === graphMode);
          return m ? (
            <>
              <m.icon size={11} className="text-text-muted" />
              <span className="text-[9px] text-text-muted">{m.desc}</span>
            </>
          ) : null;
        })()}
        {graphMode === 'symbol' && (
          <span className="text-[9px] text-text-muted ml-auto">Showing symbol-to-symbol dependencies • Hover nodes to inspect</span>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
