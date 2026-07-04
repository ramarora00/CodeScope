/**
 * useGraphViewport
 * Pan/zoom hook for the repository graph canvas.
 * Converted to JavaScript with JSDoc instead of TypeScript.
 *
 * @typedef {Object} Viewport
 * @property {number} x
 * @property {number} y
 * @property {number} zoom
 */
import { useCallback, useRef, useState } from "react";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

/**
 * @param {Viewport} [initial={ x: 0, y: 0, zoom: 1 }]
 * @returns {{ viewport: Viewport, handlers: object, zoomIn: function, zoomOut: function, reset: function, panBy: function }}
 */
export function useGraphViewport(initial = { x: 0, y: 0, zoom: 1 }) {
  const [viewport, setViewport] = useState(initial);
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 1) return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.target.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setViewport((v) => {
      const next = clampZoom(v.zoom - e.deltaY * 0.001);
      const scaleDelta = next / v.zoom;
      return {
        zoom: next,
        x: e.clientX - (e.clientX - v.x) * scaleDelta,
        y: e.clientY - (e.clientY - v.y) * scaleDelta,
      };
    });
  }, []);

  const zoomBy = useCallback((delta) => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom + delta) }));
  }, []);

  const reset = useCallback(() => setViewport(initial), [initial]);

  const panBy = useCallback((dx, dy) => {
    setViewport((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, []);

  return {
    viewport,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onWheel },
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(-ZOOM_STEP),
    reset,
    panBy,
  };
}
