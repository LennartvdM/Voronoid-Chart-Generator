import { useState, useCallback, useRef } from 'react';
import {
  initSeeds,
  optimizeWeights,
  lloydStep,
  getBounds,
  calculateTargets,
  calculateTotalArea,
  computePowerDiagram
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

  // Store seeds and weights for drag-and-drop functionality
  const seedsRef = useRef([]);
  const weightsRef = useRef([]);
  const boundsRef = useRef(null);

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

    // Store bounds for drag recalculation
    boundsRef.current = bounds;

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
        // Store final seeds and weights for drag-and-drop
        seedsRef.current = seeds;
        weightsRef.current = weights;

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

  /**
   * Move a cell's seed to a new position and recalculate the diagram
   * Used for drag-and-drop functionality
   *
   * @param {number} cellIndex - Index of the cell to move
   * @param {number} newX - New X coordinate
   * @param {number} newY - New Y coordinate
   */
  const moveSeed = useCallback((cellIndex, newX, newY) => {
    if (!seedsRef.current.length || !weightsRef.current.length || !boundsRef.current) {
      return;
    }

    // Clamp to bounds
    const bounds = boundsRef.current;
    const minX = bounds[0][0] + 20;
    const maxX = bounds[1][0] - 20;
    const minY = bounds[0][1] + 20;
    const maxY = bounds[2][1] - 20;

    const clampedX = Math.max(minX, Math.min(maxX, newX));
    const clampedY = Math.max(minY, Math.min(maxY, newY));

    // Update the seed position
    const newSeeds = [...seedsRef.current];
    newSeeds[cellIndex] = [clampedX, clampedY];
    seedsRef.current = newSeeds;

    // Recompute the power diagram with current weights
    const rawCells = computePowerDiagram(newSeeds, weightsRef.current, boundsRef.current);

    // Apply inset for gaps
    const finalCells = rawCells.map(c => c ? insetPolygon(c, GAP / 2) : null);
    setCells(finalCells);
  }, []);

  /**
   * Get current seed positions (for drag feedback)
   */
  const getSeeds = useCallback(() => seedsRef.current, []);

  /**
   * Re-optimize after a cell has been dragged to restore correct percentages
   * The dragged cell's position is locked while other cells adjust
   *
   * @param {number} lockedIndex - Index of the cell that was dragged (stays locked)
   */
  const reoptimizeAfterDrag = useCallback((lockedIndex) => {
    if (isGeneratingRef.current) return;
    if (!seedsRef.current.length || !weightsRef.current.length || !boundsRef.current) {
      return;
    }

    isGeneratingRef.current = true;
    setStatus('Reoptimizing after drag...');

    const targets = calculateTargets(data);
    const bounds = boundsRef.current;
    const totalArea = calculateTotalArea(width, height, PAD);

    let seeds = [...seedsRef.current];
    let weights = [...weightsRef.current];
    const lockedPosition = [...seeds[lockedIndex]]; // Save the locked position

    // Build category centers from current seed positions (for Lloyd relaxation)
    const catCenters = {};
    const catCounts = {};
    data.forEach((d, i) => {
      if (!catCenters[d.cat]) {
        catCenters[d.cat] = [0, 0];
        catCounts[d.cat] = 0;
      }
      catCenters[d.cat][0] += seeds[i][0];
      catCenters[d.cat][1] += seeds[i][1];
      catCounts[d.cat]++;
    });
    Object.keys(catCenters).forEach(cat => {
      catCenters[cat][0] /= catCounts[cat];
      catCenters[cat][1] /= catCounts[cat];
    });

    let iter = 0;
    let bestCells = null;
    let bestError = Infinity;
    const REOPT_ITERATIONS = 150; // Fewer iterations for reoptimization

    const step = () => {
      const result = optimizeWeights(seeds, weights, targets, bounds, totalArea);
      weights = result.weights;

      // Apply Lloyd relaxation every 4 iterations
      if (iter % 4 === 0) {
        seeds = lloydStep(seeds, result.cells, catCenters, data);
        // Restore the locked seed's position
        seeds[lockedIndex] = [...lockedPosition];
      }

      if (result.maxError < bestError) {
        bestError = result.maxError;
        bestCells = result.cells;
      }

      iter++;
      setStatus(`Reoptimizing... ${iter}/${REOPT_ITERATIONS} (error: ${(bestError * 100).toFixed(1)}%)`);

      if (iter < REOPT_ITERATIONS && bestError > ERROR_THRESHOLD) {
        requestAnimationFrame(step);
      } else {
        // Store final seeds and weights
        seedsRef.current = seeds;
        weightsRef.current = weights;

        // Apply inset to create gaps between cells
        const finalCells = bestCells.map(c => c ? insetPolygon(c, GAP / 2) : null);
        setCells(finalCells);

        setStatus(`Adjusted (${iter} iter, ${(bestError * 100).toFixed(2)}% max error)`);
        isGeneratingRef.current = false;
      }
    };

    requestAnimationFrame(step);
  }, [data, width, height]);

  return {
    status,
    cells,
    cellData,
    generate,
    moveSeed,
    getSeeds,
    reoptimizeAfterDrag
  };
}
