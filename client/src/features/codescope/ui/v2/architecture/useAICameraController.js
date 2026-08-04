import { useEffect, useRef } from 'react';
import { useReactFlow } from 'reactflow';

/**
 * useAICameraController
 * 
 * Automatically shifts the graph layout focus and camera positioning
 * based on subsystem-level transitions of active AI investigation.
 */
export function useAICameraController({ activeFile, fileTree = [], setExpandedFolders, allowAIPan = true }) {
  const { fitBounds, getNodes } = useReactFlow();
  const lastSubsystemRef = useRef(null);

  useEffect(() => {
    if (!activeFile || fileTree.length === 0) return;

    // Helper: Find parent folder/subsystem of the active file
    const findParentSubsystem = (nodesList, targetPath, parentPath = null) => {
      for (const item of nodesList) {
        if (item.path === targetPath) {
          return parentPath;
        }
        if (item.children) {
          const found = findParentSubsystem(item.children, targetPath, item.type === 'directory' ? item.path : parentPath);
          if (found) return found;
        }
      }
      return null;
    };

    const parentSubsystem = findParentSubsystem(fileTree, activeFile);

    if (parentSubsystem) {
      // Auto-expand folder when AI enters it
      setExpandedFolders(prev => ({
        ...prev,
        [parentSubsystem]: true
      }));

      // Only pan camera if parent subsystem has changed (threshold gate)
      if (lastSubsystemRef.current !== parentSubsystem) {
        lastSubsystemRef.current = parentSubsystem;

        // Yield to layout render loop
        setTimeout(() => {
          if (!allowAIPan) return;
          const flowNodes = getNodes();
          const targetNode = flowNodes.find(n => n.id === parentSubsystem);

          if (targetNode && targetNode.width && targetNode.height) {
            fitBounds(
              {
                x: targetNode.position.x - 40,
                y: targetNode.position.y - 40,
                width: targetNode.width + 80,
                height: targetNode.height + 80
              },
              { duration: 800 }
            );
          }
        }, 100);
      }
    }
  }, [activeFile, fileTree, fitBounds, getNodes, setExpandedFolders, allowAIPan]);
}
