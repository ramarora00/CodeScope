import dagre from 'dagre';

const g = new dagre.graphlib.Graph({ compound: true });
g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
g.setDefaultEdgeLabel(() => ({}));

g.setNode('parent', { width: 100, height: 100 });
g.setNode('child', { width: 50, height: 50 });
g.setParent('child', 'parent');

try {
  console.log('Running simple parent-child dagre.layout...');
  dagre.layout(g);
  console.log('Success!');
} catch (e) {
  console.error('Crash detected:', e.stack);
}
