import dagre from 'dagre';

self.onmessage = function(e) {
  const { nodes, edges, engine } = e.data;

  if (nodes.length === 0) {
    self.postMessage({ nodes, edges });
    return;
  }

  if (engine === 'dagre') {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 60, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((n) => {
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

    self.postMessage({ nodes: layoutedNodes, edges });
  } else {
    self.postMessage({ nodes, edges });
  }
};
