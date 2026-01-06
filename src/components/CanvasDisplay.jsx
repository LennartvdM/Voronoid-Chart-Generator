import React, { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { pointInPolygon } from '../utils/geometry';
import { renderAllCells } from '../utils/canvas';
import { CATEGORIES } from '../constants';
import Tooltip from './Tooltip';

/**
 * Canvas display component for rendering the Voronoi diagram
 * Handles canvas rendering, mouse interactions, and tooltips
 */
export default function CanvasDisplay({
  cells,
  cellData,
  width,
  height,
  renderParams
}) {
  const canvasRef = useRef(null);
  const [tooltip, setTooltip] = React.useState(null);

  // Render canvas when cells or params change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f8f6';
    ctx.fillRect(0, 0, width, height);

    renderAllCells(ctx, cells, cellData, width, height, renderParams, false);
  }, [cells, cellData, width, height, renderParams]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] && pointInPolygon(x, y, cells[i])) {
        const d = cellData[i];
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          label: d.label,
          pct: d.pct,
          cat: CATEGORIES[d.cat]?.label || d.cat
        });
        return;
      }
    }
    setTooltip(null);
  }, [cells, cellData, width, height]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="Voronoi diagram visualization"
        role="img"
      />
      {tooltip && (
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
  renderParams: PropTypes.object.isRequired
};
