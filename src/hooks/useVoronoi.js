import { useState, useCallback, useRef } from 'react';
import {
  initSeeds,
  optimizeWeights,
  lloydStep,
  getBounds,
  calculateTargets,
  calculateTotalArea
} from '../utils/voronoi';
import { insetPolygon } from '../utils/geometry';
import { adjustColor } from '../utils/color';
import {
  CATEGORIES,
  PAD,
  GAP,
  MAX_ITERATIONS,
  ERROR_THRESHOLD
} from '../constants';

/**
 * Custom hook for Voronoi diagram generation and optimization
 *
 * @param {Array<{label: string, n: number, cat: string}>} data - Dataset to visualize
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Voronoi state and control functions
 */
export function useVoronoi(data, width, height) {
  const [status, setStatus] = useState('Initializing...');
  const [cells, setCells] = useState([]);
  const [cellData, setCellData] = useState([]);
  const isGeneratingRef = useRef(false);

  /**
   * Generate/regenerate the Voronoi diagram
   */
  const generate = useCallback(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setStatus('Generating...');

    const total = data.reduce((s, d) => s + d.n, 0);
    const targets = calculateTargets(data);
    const bounds = getBounds(width, height, PAD);
    const totalArea = calculateTotalArea(width, height, PAD);

    let { seeds, catCenters } = initSeeds(data, width, height, PAD);
    let weights = data.map(() => 0);

    let iter = 0;
    let bestCells = null;
    let bestError = Infinity;

    const step = () => {
      const result = optimizeWeights(seeds, weights, targets, bounds, totalArea);
      weights = result.weights;

      // Apply Lloyd relaxation every 4 iterations
      if (iter % 4 === 0) {
        seeds = lloydStep(seeds, result.cells, catCenters, data);
      }

      if (result.maxError < bestError) {
        bestError = result.maxError;
        bestCells = result.cells;
      }

      iter++;
      setStatus(`Optimizing... ${iter}/${MAX_ITERATIONS} (error: ${(bestError * 100).toFixed(1)}%)`);

      if (iter < MAX_ITERATIONS && bestError > ERROR_THRESHOLD) {
        requestAnimationFrame(step);
      } else {
        // Apply inset to create gaps between cells
        const finalCells = bestCells.map(c => c ? insetPolygon(c, GAP / 2) : null);
        setCells(finalCells);

        // Prepare cell data with colors and percentages
        const catCounts = {};
        setCellData(data.map((d, i) => {
          catCounts[d.cat] = (catCounts[d.cat] || 0);
          const baseColor = CATEGORIES[d.cat].color;
          const variation = (catCounts[d.cat] % 3 - 1) * 20;
          catCounts[d.cat]++;

          return {
            ...d,
            pct: ((d.n / total) * 100).toFixed(d.n / total >= 0.01 ? 0 : 1),
            color: adjustColor(baseColor, variation),
            textColor: d.textColor || null
          };
        }));

        setStatus(`Done (${iter} iterations, ${(bestError * 100).toFixed(2)}% max error)`);
        isGeneratingRef.current = false;
      }
    };

    requestAnimationFrame(step);
  }, [data, width, height]);

  return {
    status,
    cells,
    cellData,
    generate
  };
}
