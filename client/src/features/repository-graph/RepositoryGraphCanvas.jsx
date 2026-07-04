/**
 * RepositoryGraphCanvas
 * Composes the graph canvas components. No redesign – uses the original composition logic.
 *
 * @typedef {Object} RepositoryGraphCanvasProps
 * @property {Array<Object>} nodes - GraphNodeData objects.
 * @property {Array<Object>} edges - GraphEdgeData objects.
 * @property {string} [status='ready'] - Loading status.
 * @property {string|null} [selectedNodeId] - Controlled selected node ID.
 * @property {Function} [onSelectNode] - Callback when a node is selected.
 * @property {Function} [onHoverNode] - Callback when a node is hovered.
 * @property {string} [className] - Additional class names for the container.
 */
import React, { useEffect, useMemo, useState } from "react";
import { CanvasControls } from "./CanvasControls";
import { EmptyState, LoadingState } from "./EmptyState";
import { GraphBackground } from "./GraphBackground";
import { GraphLayer } from "./GraphLayer";
import { MiniMapPlaceholder } from "./MiniMapPlaceholder";
import { SelectionOverlay } from "./SelectionOverlay";
import { useGraphViewport } from "./useGraphViewport";

export function RepositoryGraphCanvas({
  nodes,
  edges,
  status = "ready",
  selectedNodeId: controlledSelectedId,
  onSelectNode,
  onHoverNode,
  className,
}) {
  const { viewport, handlers, zoomIn, zoomOut, reset } = useGraphViewport();
  const [internalSelectedId, setInternalSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const selectedId = controlledSelectedId ?? internalSelectedId;
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const selectNode = (id) => {
    setInternalSelectedId(id);
    onSelectNode?.(id);
  };

  const hoverNode = (id) => {
    setHoveredId(id);
    onHoverNode?.(id);
  };

  // Keyboard shortcuts for interaction
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") selectNode(null);
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isEmpty = status === "empty" || (status === "ready" && nodes.length === 0);
  const isLoading = status === "loading";

  return (
    <div
      className={`relative h-full w-full touch-none select-none overflow-hidden rounded-2xl ${
        className ?? ""
      }`}
      role="application"
      aria-label="Repository dependency graph canvas"
      aria-roledescription="pan and zoom graph"
      tabIndex={0}
      {...handlers}
    >
      <GraphBackground viewport={viewport} />

      {isLoading && <LoadingState />}
      {isLoading && isEmpty && <EmptyState />}

      {!isLoading && !isEmpty && (
        <>
          <GraphLayer
            nodes={nodes}
            edges={edges}
            viewport={viewport}
            selectedNodeId={selectedId}
            hoveredNodeId={hoveredId}
            onSelect={selectNode}
            onHover={hoverNode}
          />
          <SelectionOverlay node={selectedNode} onClose={() => selectNode(null)} />
          <MiniMapPlaceholder nodes={nodes} viewport={viewport} />
        </>
      )}

      <CanvasControls zoom={viewport.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
    </div>
  );
}
