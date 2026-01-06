import React, { useEffect, useRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { pointInPolygon, polygonCentroid } from '../utils/geometry';
import { renderAllCells } from '../utils/canvas';
import { CATEGORIES } from '../constants';
import Tooltip from './Tooltip';

/**
 * Canvas display component for rendering the Voronoi diagram
 * Handles canvas rendering, mouse interactions, drag-and-drop, and tooltips
 */
export default function CanvasDisplay({
  cells,
  cellData,
  width,
  height,
  renderParams,
  onMoveSeed,
  getSeeds,
  onDragEnd,
  isReoptimizing
}) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const seedStartRef = useRef(null);
  const dragIndexRef = useRef(null); // Ref to track dragIndex for global listener

  // Render canvas when cells or params change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f8f6';
    ctx.fillRect(0, 0, width, height);

    renderAllCells(ctx, cells, cellData, width, height, renderParams, false, dragIndex);
  }, [cells, cellData, width, height, renderParams, dragIndex]);

  /**
   * Get canvas coordinates from mouse event
   */
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top
    };
  }, [width, height]);

  /**
   * Find which cell contains a point
   */
  const findCellAtPoint = useCallback((x, y) => {
    for (let i = 0; i < cells.length; i++) {
      if (cells[i] && pointInPolygon(x, y, cells[i])) {
        return i;
      }
    }
    return -1;
  }, [cells]);

  /**
   * Handle mouse down - start dragging if on a cell
   */
  const handleMouseDown = useCallback((e) => {
    if (!onMoveSeed || !getSeeds) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    const cellIndex = findCellAtPoint(coords.x, coords.y);
    if (cellIndex >= 0) {
      const seeds = getSeeds();
      if (seeds && seeds[cellIndex]) {
        setDragIndex(cellIndex);
        dragIndexRef.current = cellIndex; // Keep ref in sync
        setIsDragging(true);
        dragStartRef.current = { x: coords.x, y: coords.y };
        seedStartRef.current = [...seeds[cellIndex]];
        setTooltip(null);
        e.preventDefault();
      }
    }
  }, [getCanvasCoords, findCellAtPoint, onMoveSeed, getSeeds]);

  /**
   * Handle mouse move - update drag position or show tooltip
   */
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;

    const coords = getCanvasCoords(e);
    if (!coords) return;

    // If dragging, update the seed position
    if (isDragging && dragIndex !== null && onMoveSeed && dragStartRef.current && seedStartRef.current) {
      const dx = coords.x - dragStartRef.current.x;
      const dy = coords.y - dragStartRef.current.y;
      const newX = seedStartRef.current[0] + dx;
      const newY = seedStartRef.current[1] + dy;
      onMoveSeed(dragIndex, newX, newY);
      return;
    }

    // Otherwise, show tooltip for hovered cell
    const cellIndex = findCellAtPoint(coords.x, coords.y);
    if (cellIndex >= 0) {
      const d = cellData[cellIndex];
      setTooltip({
        x: coords.screenX,
        y: coords.screenY,
        label: d.label,
        pct: d.pct,
        cat: CATEGORIES[d.cat]?.label || d.cat
      });
    } else {
      setTooltip(null);
    }
  }, [cells, cellData, getCanvasCoords, findCellAtPoint, isDragging, dragIndex, onMoveSeed]);

  /**
   * Handle mouse up - end dragging and trigger reoptimization
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragIndex !== null) {
      const draggedCellIndex = dragIndex;
      setIsDragging(false);
      setDragIndex(null);
      dragStartRef.current = null;
      seedStartRef.current = null;
      // Trigger reoptimization after drag ends
      if (onDragEnd) {
        onDragEnd(draggedCellIndex);
      }
    }
  }, [isDragging, dragIndex, onDragEnd]);

  /**
   * Handle mouse leave - end dragging and hide tooltip
   */
  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    if (isDragging && dragIndex !== null) {
      const draggedCellIndex = dragIndex;
      setIsDragging(false);
      setDragIndex(null);
      dragStartRef.current = null;
      seedStartRef.current = null;
      // Trigger reoptimization after drag ends
      if (onDragEnd) {
        onDragEnd(draggedCellIndex);
      }
    }
  }, [isDragging, dragIndex, onDragEnd]);

  // Add global mouse up listener for drag end outside canvas
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        const draggedCellIndex = dragIndexRef.current;
        setIsDragging(false);
        setDragIndex(null);
        dragIndexRef.current = null;
        dragStartRef.current = null;
        seedStartRef.current = null;
        // Trigger reoptimization after drag ends
        if (onDragEnd && draggedCellIndex !== null) {
          onDragEnd(draggedCellIndex);
        }
      };
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging, onDragEnd]);

  // Determine cursor style based on state
  const getCursorStyle = () => {
    if (isDragging) return 'grabbing';
    if (onMoveSeed) return 'grab';
    return 'crosshair';
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ cursor: isReoptimizing ? 'wait' : getCursorStyle() }}
        onMouseDown={isReoptimizing ? undefined : handleMouseDown}
        onMouseMove={isReoptimizing ? undefined : handleMouseMove}
        onMouseUp={isReoptimizing ? undefined : handleMouseUp}
        onMouseLeave={isReoptimizing ? undefined : handleMouseLeave}
        aria-label="Voronoi diagram visualization. Click and drag cells to reposition them."
        role="img"
      />
      {isReoptimizing && (
        <div className="reoptimize-overlay">
          <div className="reoptimize-spinner" />
          <span className="reoptimize-text">Recalculating the others...</span>
        </div>
      )}
      {tooltip && !isDragging && !isReoptimizing && (
        <Tooltip
          x={tooltip.x}
          y={tooltip.y}
          label={tooltip.label}
          pct={tooltip.pct}
          cat={tooltip.cat}
        />
      )}
    </div>
  );
}

CanvasDisplay.propTypes = {
  cells: PropTypes.array.isRequired,
  cellData: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  renderParams: PropTypes.object.isRequired,
  onMoveSeed: PropTypes.func,
  getSeeds: PropTypes.func,
  onDragEnd: PropTypes.func,
  isReoptimizing: PropTypes.bool
};
