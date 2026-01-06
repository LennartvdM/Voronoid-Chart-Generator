/**
 * Voronoi/Power diagram generation and optimization algorithms
 * @module utils/voronoi
 */

import { polygonArea, polygonCentroid, clipPolygon } from './geometry';
import {
  CATEGORIES,
  PAD,
  LLOYD_STEP_RATIO,
  CATEGORY_CLUSTER_STRENGTH
} from '../constants';

/**
 * Compute a Power diagram (weighted Voronoi) for the given seeds and weights
 *
 * A power diagram is a generalization of Voronoi diagrams where each cell's
 * boundary is determined not just by distance, but by distance minus a weight.
 * This allows control over relative cell sizes.
 *
 * @param {Array<[number, number]>} seeds - Seed point coordinates [x, y]
 * @param {number[]} weights - Weight for each seed (larger = bigger cell)
 * @param {Array<[number, number]>} bounds - Bounding polygon vertices
 * @returns {Array<Array<[number, number]>|null>} Array of cell polygons (null for collapsed cells)
 */
export function computePowerDiagram(seeds, weights, bounds) {
  const cells = [];

  for (let i = 0; i < seeds.length; i++) {
    let cell = [...bounds];
    const si = seeds[i];
    const wi = weights[i];

    for (let j = 0; j < seeds.length; j++) {
      if (i === j) continue;

      const sj = seeds[j];
      const wj = weights[j];

      const dx = sj[0] - si[0];
      const dy = sj[1] - si[1];
      const dist = Math.hypot(dx, dy);

      if (dist < 0.001) continue; // Skip coincident points

      // Calculate the power bisector between sites i and j
      // The bisector is shifted based on the weight difference
      const midX = (si[0] + sj[0]) / 2 + (wi - wj) / (2 * dist * dist) * dx;
      const midY = (si[1] + sj[1]) / 2 + (wi - wj) / (2 * dist * dist) * dy;

      // Normal points toward seed i (away from j)
      const nx = -dx / dist;
      const ny = -dy / dist;

      cell = clipPolygon(cell, midX, midY, nx, ny);
      if (cell.length < 3) break;
    }

    cells.push(cell.length >= 3 ? cell : null);
  }

  return cells;
}

/**
 * Perform one iteration of weight optimization to match target areas
 *
 * Uses gradient descent to adjust weights so that cell areas approach
 * their target proportions.
 *
 * @param {Array<[number, number]>} seeds - Seed point coordinates
 * @param {number[]} weights - Current weights
 * @param {number[]} targets - Target area proportions (should sum to 1)
 * @param {Array<[number, number]>} bounds - Bounding polygon
 * @param {number} totalArea - Total area of the bounding polygon
 * @returns {{weights: number[], cells: Array, maxError: number}} Updated weights and error
 */
export function optimizeWeights(seeds, weights, targets, bounds, totalArea) {
  const cells = computePowerDiagram(seeds, weights, bounds);
  const newWeights = [...weights];

  let maxError = 0;

  for (let i = 0; i < seeds.length; i++) {
    if (!cells[i] || cells[i].length < 3) continue;

    const area = polygonArea(cells[i]);
    const target = targets[i] * totalArea;
    const error = (target - area) / totalArea;

    maxError = Math.max(maxError, Math.abs(error));

    // Adjust weight proportionally to error
    // Larger error = larger weight adjustment
    newWeights[i] += error * totalArea * 0.5;
  }

  return { weights: newWeights, cells, maxError };
}

/**
 * Perform one step of Lloyd's relaxation algorithm
 *
 * Moves each seed toward the centroid of its cell, which helps
 * create more regular, evenly-shaped cells. Also applies category
 * clustering to group related items together.
 *
 * @param {Array<[number, number]>} seeds - Current seed positions
 * @param {Array<Array<[number, number]>|null>} cells - Current cell polygons
 * @param {Object<string, [number, number]>} catCenters - Category center positions
 * @param {Array<{cat: string}>} data - Data items with category info
 * @returns {Array<[number, number]>} Updated seed positions
 * @see https://en.wikipedia.org/wiki/Lloyd%27s_algorithm
 */
export function lloydStep(seeds, cells, catCenters, data) {
  return seeds.map((s, i) => {
    if (!cells[i] || cells[i].length < 3) return s;

    const c = polygonCentroid(cells[i]);
    const cat = data[i].cat;
    const center = catCenters[cat];

    // Move toward cell centroid (creates more regular shapes)
    let nx = s[0] + (c[0] - s[0]) * LLOYD_STEP_RATIO;
    let ny = s[1] + (c[1] - s[1]) * LLOYD_STEP_RATIO;

    // Pull toward category center (groups similar items)
    nx += (center[0] - nx) * CATEGORY_CLUSTER_STRENGTH;
    ny += (center[1] - ny) * CATEGORY_CLUSTER_STRENGTH;

    return [nx, ny];
  });
}

/**
 * Initialize seed positions clustered by category
 *
 * Places seeds in a way that groups items by category, with larger
 * categories positioned toward the center for better visual hierarchy.
 *
 * @param {Array<{n: number, cat: string}>} data - Data items with values and categories
 * @param {number} w - Canvas width
 * @param {number} h - Canvas height
 * @param {number} pad - Padding from edges
 * @returns {{seeds: Array<[number, number]>, catCenters: Object<string, [number, number]>}}
 */
export function initSeeds(data, w, h, pad) {
  const catPositions = {};

  // Calculate total value per category
  const catTotals = {};
  data.forEach(d => {
    catTotals[d.cat] = (catTotals[d.cat] || 0) + d.n;
  });

  // Sort categories by total value (largest first)
  const sortedCats = Object.keys(CATEGORIES).sort(
    (a, b) => (catTotals[b] || 0) - (catTotals[a] || 0)
  );

  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.3;

  // Place larger categories near center, smaller toward edges
  // Uses golden angle for even distribution
  sortedCats.forEach((cat, i) => {
    const t = i / (sortedCats.length - 1 || 1);
    const radius = t * maxRadius;
    const angle = i * 2.4; // Golden angle approximation

    catPositions[cat] = [
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    ];
  });

  // Place seeds near their category center with random offset
  const seeds = data.map(d => {
    const center = catPositions[d.cat];
    const angle = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 60;

    return [
      Math.max(pad + 20, Math.min(w - pad - 20, center[0] + Math.cos(angle) * r)),
      Math.max(pad + 20, Math.min(h - pad - 20, center[1] + Math.sin(angle) * r))
    ];
  });

  return { seeds, catCenters: catPositions };
}

/**
 * Calculate the bounding polygon for the chart area
 *
 * @param {number} w - Canvas width
 * @param {number} h - Canvas height
 * @param {number} pad - Padding from edges
 * @returns {Array<[number, number]>} Rectangle vertices
 */
export function getBounds(w, h, pad) {
  return [
    [pad, pad],
    [w - pad, pad],
    [w - pad, h - pad],
    [pad, h - pad]
  ];
}

/**
 * Calculate target area proportions from data values
 *
 * @param {Array<{n: number}>} data - Data items with numeric values
 * @returns {number[]} Proportions that sum to 1
 */
export function calculateTargets(data) {
  const total = data.reduce((sum, d) => sum + d.n, 0);
  return data.map(d => d.n / total);
}

/**
 * Calculate total area of the chart region
 *
 * @param {number} w - Canvas width
 * @param {number} h - Canvas height
 * @param {number} pad - Padding from edges
 * @returns {number} Total drawable area in square pixels
 */
export function calculateTotalArea(w, h, pad) {
  return (w - 2 * pad) * (h - 2 * pad);
}
