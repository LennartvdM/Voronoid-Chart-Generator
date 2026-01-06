/**
 * Canvas rendering utilities for Voronoi cells
 * @module utils/canvas
 */

import { polygonArea, polygonCentroid, polygonBounds, drawRoundedPath } from './geometry';
import { adjustHue } from './color';
import {
  CORNER_RADIUS,
  PAD,
  LARGE_CELL_THRESHOLD,
  MEDIUM_CELL_THRESHOLD,
  SMALL_CELL_THRESHOLD,
  TINY_CELL_THRESHOLD
} from '../constants';

/**
 * Rendering parameters for cell drawing
 * @typedef {Object} RenderParams
 * @property {number} innerStrokeWidth
 * @property {number} innerStrokeOpacity
 * @property {number} outerStrokeWidth
 * @property {boolean} gradientEnabled
 * @property {number} gradientSize
 * @property {number} gradientOpacity
 * @property {number} gradientHueShift
 * @property {string} gradientBlendMode
 * @property {string} textBlendMode
 * @property {Object} labelOverrides
 * @property {Function} getLabelSettings
 */

/**
 * Get adjusted corner radius based on cell size
 *
 * @param {number} relSize - Relative cell size (0-1)
 * @returns {number} Adjusted corner radius
 */
function getAdjustedRadius(relSize) {
  if (relSize < TINY_CELL_THRESHOLD) return Math.min(CORNER_RADIUS, 6);
  if (relSize < 0.01) return Math.min(CORNER_RADIUS, 10);
  return CORNER_RADIUS;
}

/**
 * Render a single Voronoi cell with all effects
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<[number, number]>} cell - Cell polygon vertices
 * @param {Object} cellData - Cell data (color, pct, label, etc.)
 * @param {number} index - Cell index
 * @param {number} totalArea - Total chart area
 * @param {RenderParams} params - Rendering parameters
 * @param {boolean} isExport - Whether rendering for export (transparent background)
 */
export function renderCell(ctx, cell, cellData, index, totalArea, params, isExport = false) {
  if (!cell || cell.length < 3) return;

  const d = cellData;
  const area = polygonArea(cell);
  const relSize = area / totalArea;
  const centroid = polygonCentroid(cell);
  const adjustedRadius = getAdjustedRadius(relSize);
  const bounds = polygonBounds(cell);

  // Fill with base color
  ctx.save();
  drawRoundedPath(ctx, cell, adjustedRadius);
  ctx.fillStyle = d.color;
  ctx.fill();
  ctx.restore();

  // Inner gradient effect
  if (params.gradientEnabled && params.gradientOpacity > 0) {
    ctx.save();
    drawRoundedPath(ctx, cell, adjustedRadius);
    ctx.clip();

    const gradientRadius = Math.max(bounds.width, bounds.height) * (1 - params.gradientSize * 0.5);
    const gradient = ctx.createRadialGradient(
      centroid[0], centroid[1], gradientRadius * 0.2,
      centroid[0], centroid[1], gradientRadius
    );
    const gradientColor = adjustHue(d.color, params.gradientHueShift);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, gradientColor);

    ctx.globalCompositeOperation = params.gradientBlendMode;
    ctx.globalAlpha = params.gradientOpacity;
    ctx.fillStyle = gradient;
    ctx.fillRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Inner stroke with multiply blend
  if (params.innerStrokeWidth > 0 && params.innerStrokeOpacity > 0) {
    ctx.save();
    drawRoundedPath(ctx, cell, adjustedRadius);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = params.innerStrokeOpacity;
    drawRoundedPath(ctx, cell, adjustedRadius);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = params.innerStrokeWidth;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  // Outer stroke (skip for transparent export)
  if (params.outerStrokeWidth > 0 && !isExport) {
    ctx.save();
    drawRoundedPath(ctx, cell, adjustedRadius);
    ctx.strokeStyle = '#f8f8f6';
    ctx.lineWidth = params.outerStrokeWidth;
    ctx.stroke();
    ctx.restore();
  }

  // Render labels
  renderCellLabel(ctx, cell, d, index, relSize, centroid, bounds.width, params);
}

/**
 * Render cell label text
 */
function renderCellLabel(ctx, cell, d, index, relSize, centroid, cellWidth, params) {
  ctx.globalCompositeOperation = params.textBlendMode;
  ctx.textAlign = 'center';

  // Get label settings
  const labelSettings = params.getLabelSettings(index);
  const labelText = labelSettings.label;
  const visibility = labelSettings.visibility;
  const customTextColor = labelSettings.textColor;

  ctx.fillStyle = customTextColor || d.textColor || d.color;

  // Skip if hidden
  if (visibility === 'hidden') {
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  const labelLines = labelText.split('\n');
  const shouldForce = visibility === 'force';

  // Tier 1: Large cells (>5%) or forced
  if (relSize > LARGE_CELL_THRESHOLD || shouldForce) {
    renderTier1Label(ctx, labelLines, d.pct, centroid, relSize, shouldForce);
  }
  // Tier 2: Medium cells (2-5%)
  else if (relSize > MEDIUM_CELL_THRESHOLD) {
    renderTier2Label(ctx, labelLines, d.pct, centroid);
  }
  // Tier 3: Small cells (<2%)
  else if (relSize > SMALL_CELL_THRESHOLD) {
    renderTier3Label(ctx, labelLines, labelText, d.pct, centroid, cellWidth);
  }

  ctx.globalCompositeOperation = 'source-over';
}

function renderTier1Label(ctx, labelLines, pct, centroid, relSize, shouldForce) {
  const fontSize = shouldForce && relSize <= 0.02 ? 11 : (relSize > 0.05 ? 26 : 13);
  const lineHeight = shouldForce && relSize <= 0.02 ? 13 : (relSize > 0.05 ? 30 : 15);
  const pctSize = shouldForce && relSize <= 0.02 ? 9 : (relSize > 0.05 ? 18 : 10);

  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  if (labelLines.length > 1) {
    const totalHeight = labelLines.length * lineHeight;
    labelLines.forEach((line, idx) => {
      const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - (pctSize * 0.5);
      ctx.fillText(line, centroid[0], y);
    });
    ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
    ctx.fillText(`${pct}%`, centroid[0], centroid[1] + totalHeight / 2);
  } else {
    ctx.fillText(labelLines[0], centroid[0], centroid[1]);
    ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(`${pct}%`, centroid[0], centroid[1] + fontSize * 0.6);
  }
}

function renderTier2Label(ctx, labelLines, pct, centroid) {
  ctx.font = `600 13px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';

  if (labelLines.length > 1) {
    const lineHeight = 15;
    const totalHeight = labelLines.length * lineHeight;
    labelLines.forEach((line, idx) => {
      const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - 6;
      ctx.fillText(line, centroid[0], y);
    });
    ctx.font = `400 10px system-ui, sans-serif`;
    ctx.fillText(`${pct}%`, centroid[0], centroid[1] + totalHeight / 2 + 2);
  } else {
    ctx.fillText(labelLines[0], centroid[0], centroid[1]);
    ctx.font = `400 10px system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(`${pct}%`, centroid[0], centroid[1] + 9);
  }
}

function renderTier3Label(ctx, labelLines, labelText, pct, centroid, cellWidth) {
  ctx.font = `500 11px system-ui, sans-serif`;

  if (labelLines.length > 1) {
    const lineHeight = 12;
    const totalHeight = labelLines.length * lineHeight;
    const pctOffset = 4;
    ctx.textBaseline = 'middle';
    labelLines.forEach((line, idx) => {
      const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - pctOffset;
      ctx.fillText(line, centroid[0], y);
    });
    ctx.font = `400 9px system-ui, sans-serif`;
    ctx.fillText(`${pct}%`, centroid[0], centroid[1] + totalHeight / 2 + pctOffset);
  } else {
    const labelWidth = ctx.measureText(labelText).width;

    if (labelWidth < cellWidth - 8) {
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, centroid[0], centroid[1] - 4);
      ctx.font = `400 9px system-ui, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(`${pct}%`, centroid[0], centroid[1] + 6);
    } else {
      ctx.font = `500 9px system-ui, sans-serif`;
      const smallLabelWidth = ctx.measureText(labelText).width;
      if (smallLabelWidth < cellWidth - 4) {
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, centroid[0], centroid[1]);
      } else {
        ctx.textBaseline = 'middle';
        let truncated = labelText;
        while (truncated.length > 1 && ctx.measureText(truncated + '…').width >= cellWidth - 4) {
          truncated = truncated.slice(0, -1);
        }
        if (truncated.length > 1) {
          ctx.fillText(truncated + '…', centroid[0], centroid[1]);
        }
      }
    }
  }
}

/**
 * Render all cells to a canvas
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} cells - Cell polygons
 * @param {Array} cellData - Cell data array
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {RenderParams} params - Rendering parameters
 * @param {boolean} isExport - Whether rendering for export
 */
export function renderAllCells(ctx, cells, cellData, width, height, params, isExport = false) {
  const totalArea = (width - 2 * PAD) * (height - 2 * PAD);

  cells.forEach((cell, i) => {
    if (cell && cellData[i]) {
      renderCell(ctx, cell, cellData[i], i, totalArea, params, isExport);
    }
  });
}

/**
 * Generate SVG markup for all cells
 *
 * @param {Array} cells - Cell polygons
 * @param {Array} cellData - Cell data array
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {RenderParams} params - Rendering parameters
 * @returns {string} SVG markup string
 */
export function generateSVG(cells, cellData, width, height, params) {
  const totalArea = (width - 2 * PAD) * (height - 2 * PAD);

  let paths = '';

  cells.forEach((cell, i) => {
    if (!cell || cell.length < 3 || !cellData[i]) return;

    const d = cellData[i];
    const area = polygonArea(cell);
    const relSize = area / totalArea;
    const centroid = polygonCentroid(cell);

    // Create path data
    const pathData = cell.map((p, j) => `${j === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ' Z';

    // Get label settings
    const labelSettings = params.getLabelSettings(i);
    const visibility = labelSettings.visibility;

    // Cell fill
    paths += `  <path d="${pathData}" fill="${d.color}" />\n`;

    // Label (if visible and large enough)
    if (visibility !== 'hidden' && (relSize > SMALL_CELL_THRESHOLD || visibility === 'force')) {
      const fontSize = relSize > LARGE_CELL_THRESHOLD ? 26 : (relSize > MEDIUM_CELL_THRESHOLD ? 13 : 11);
      const textColor = labelSettings.textColor || d.textColor || d.color;
      const labelText = labelSettings.label.replace('\n', ' ');

      paths += `  <text x="${centroid[0].toFixed(2)}" y="${centroid[1].toFixed(2)}" `;
      paths += `font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="600" `;
      paths += `fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${labelText}</text>\n`;

      paths += `  <text x="${centroid[0].toFixed(2)}" y="${(centroid[1] + fontSize * 0.8).toFixed(2)}" `;
      paths += `font-family="system-ui, sans-serif" font-size="${Math.round(fontSize * 0.7)}" font-weight="400" `;
      paths += `fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${d.pct}%</text>\n`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${paths}</svg>`;
}
