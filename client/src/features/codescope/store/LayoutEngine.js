import dagre from 'dagre';

export const LayoutEngine = {
  apply: (nodes, edges, engine = 'dagre') => {
    if (nodes.length === 0) return { nodes, edges };

    if (engine === 'dagre') {
      const g = new dagre.graphlib.Graph();
      g.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 60, ranksep: 100 });
      g.setDefaultEdgeLabel(() => ({}));

      nodes.forEach((n) => {
        // Approximate width and height based on label length
        const label = n.data?.label || '';
        const width = Math.max(150, label.length * 8 + 40);
        const height = 40;
        g.setNode(n.id, { width, height });
      });

      edges.forEach((e) => {
        g.setEdge(e.source, e.target);
      });

      dagre.layout(g);

      const layoutedNodes = nodes.map((n) => {
        const nodeWithPosition = g.node(n.id);
        return {
          ...n,
          targetPosition: 'left',
          sourcePosition: 'right',
          position: {
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
          },
        };
      });

      return { nodes: layoutedNodes, edges };
    }

    // Default fallback
    return { nodes, edges };
  }
};
