import { useMemo } from 'react';
import dagre from 'dagre';

/**
 * useArchitectureLayout
 * 
 * Transforms a recursive folder/file tree into ReactFlow nodes and edges.
 * 
 * Design: Dagre lays out ONLY top-level items (root files + root directories).
 * Child files and subdirectories are rendered inline by FolderContainer.jsx 
 * via its data props — they are never added to the Dagre graph.
 * 
 * This avoids Dagre's compound graph (setParent) crash:
 * TypeError: Cannot set properties of undefined (setting 'rank')
 */
export function useArchitectureLayout({ fileTree = [], expandedFolders = {}, visitedFiles = new Set(), activeFile = null }) {
  return useMemo(() => {
    const nodes = [];
    const edges = [];

    if (!fileTree || fileTree.length === 0) {
      return { nodes, edges };
    }

    // Flat Dagre graph — no compound hierarchy
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
    g.setDefaultEdgeLabel(() => ({}));

    // Collect all nested files recursively for visit markers and file count
    const collectAllFiles = (items) => {
      const files = [];
      for (const item of items) {
        if (item.type === 'file') {
          files.push(item);
        } else if (item.type === 'directory' && item.children) {
          files.push(...collectAllFiles(item.children));
        }
      }
      return files;
    };

    // Process ONLY root-level items
    for (const item of fileTree) {
      const path = item.path;

      if (item.type === 'directory') {
        const isExpanded = !!expandedFolders[path];
        const directFiles = item.children?.filter(c => c.type === 'file') || [];
        const subfolders = item.children?.filter(c => c.type === 'directory') || [];
        const allFiles = collectAllFiles(item.children || []);

        // Height scales with visible content when expanded
        const expandedHeight = isExpanded
          ? Math.max(80, 48 + directFiles.length * 28 + subfolders.length * 32)
          : 56;

        g.setNode(path, {
          width: isExpanded ? 240 : 200,
          height: expandedHeight,
          label: item.name
        });

        nodes.push({
          id: path,
          type: 'folderContainer',
          data: {
            name: item.name,
            path,
            isExpanded,
            fileCount: allFiles.length,
            subfolders,
            childrenFiles: directFiles,
            visitedFiles,
            activeFile,
            expandedFolders
          },
          position: { x: 0, y: 0 }
        });
      } else {
        // Root-level standalone files
        g.setNode(path, {
          width: 180,
          height: 36,
          label: item.name
        });

        nodes.push({
          id: path,
          type: 'fileNode',
          data: {
            name: item.name,
            path,
            isVisited: visitedFiles.has(path),
            isActive: activeFile === path
          },
          position: { x: 0, y: 0 }
        });
      }
    }

    // Connect top-level directories with invisible structural edges
    const topLevelDirs = nodes.filter(n => n.type === 'folderContainer');
    for (let i = 0; i < topLevelDirs.length - 1; i++) {
      const source = topLevelDirs[i].id;
      const target = topLevelDirs[i + 1].id;
      g.setEdge(source, target);
      edges.push({
        id: `edge-${source}-${target}`,
        source,
        target,
        style: { stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }
      });
    }

    // Execute Dagre layout — no compound nodes, guaranteed stable
    try {
      dagre.layout(g);

      const layoutedNodes = nodes.map(node => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) return node;
        return {
          ...node,
          position: {
            x: dagreNode.x - dagreNode.width / 2,
            y: dagreNode.y - dagreNode.height / 2
          },
          style: node.type === 'folderContainer' && node.data.isExpanded ? {
            width: dagreNode.width,
            height: dagreNode.height
          } : undefined
        };
      });

      return { nodes: layoutedNodes, edges };
    } catch (e) {
      console.error('[useArchitectureLayout] Layout failed:', e);
      return { nodes, edges };
    }
  }, [fileTree, expandedFolders, visitedFiles, activeFile]);
}
