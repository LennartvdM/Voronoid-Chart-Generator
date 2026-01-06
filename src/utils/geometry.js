/**
 * Geometry utilities for polygon calculations
 * @module utils/geometry
 */

/**
 * Calculate the area of a polygon using the Shoelace formula
 * @param {Array<[number, number]>} pts - Array of [x, y] coordinate pairs
 * @returns {number} The absolute area of the polygon
 * @see https://en.wikipedia.org/wiki/Shoelace_formula
 */
export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
}

/**
 * Calculate the centroid (center of mass) of a polygon
 * Uses the formula for centroid of a polygon with vertices
 * @param {Array<[number, number]>} pts - Array of [x, y] coordinate pairs
 * @returns {[number, number]} The [x, y] coordinates of the centroid
 */
export function polygonCentroid(pts) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const f = pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    cx += (pts[i][0] + pts[j][0]) * f;
    cy += (pts[i][1] + pts[j][1]) * f;
    a += f;
  }
  a /= 2;
  if (Math.abs(a) < 1e-10) {
    // Fallback to simple average for degenerate polygons
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length
    ];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

/**
 * Clip a polygon against a half-plane using the Sutherland-Hodgman algorithm
 * The half-plane is defined by a point (px, py) and normal vector (nx, ny)
 * Points on the positive side of the normal are kept
 *
 * @param {Array<[number, number]>} poly - Input polygon vertices
 * @param {number} px - X coordinate of a point on the clipping line
 * @param {number} py - Y coordinate of a point on the clipping line
 * @param {number} nx - X component of the inward normal vector
 * @param {number} ny - Y component of the inward normal vector
 * @returns {Array<[number, number]>} Clipped polygon vertices
 * @see https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm
 */
export function clipPolygon(poly, px, py, nx, ny) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];

    // Calculate signed distance from clipping line
    const curD = (cur[0] - px) * nx + (cur[1] - py) * ny;
    const nxtD = (nxt[0] - px) * nx + (nxt[1] - py) * ny;

    // Keep point if on positive side
    if (curD >= 0) out.push(cur);

    // Add intersection point if edge crosses the line
    if ((curD >= 0) !== (nxtD >= 0)) {
      const t = curD / (curD - nxtD);
      out.push([
        cur[0] + t * (nxt[0] - cur[0]),
        cur[1] + t * (nxt[1] - cur[1])
      ]);
    }
  }
  return out;
}

/**
 * Shrink a polygon inward by a specified amount
 * Creates gaps between adjacent cells in the Voronoi diagram
 *
 * @param {Array<[number, number]>|null} poly - Input polygon vertices
 * @param {number} amount - Distance to inset (in pixels)
 * @returns {Array<[number, number]>|null} Inset polygon or original if inset fails
 */
export function insetPolygon(poly, amount) {
  if (!poly || poly.length < 3 || amount <= 0) return poly;

  const n = poly.length;

  // Calculate signed area to determine winding direction
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
  }
  const wind = signedArea > 0 ? -1 : 1;

  // Calculate offset edges
  const edges = [];
  for (let i = 0; i < n; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % n];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy);

    if (len < 0.001) continue; // Skip degenerate edges

    // Calculate inward normal
    const nx = wind * dy / len;
    const ny = wind * -dx / len;

    edges.push({
      p1: [p1[0] + nx * amount, p1[1] + ny * amount],
      p2: [p2[0] + nx * amount, p2[1] + ny * amount]
    });
  }

  if (edges.length < 3) return poly;

  // Find intersection points of adjacent offset edges
  const result = [];
  for (let i = 0; i < edges.length; i++) {
    const e1 = edges[i];
    const e2 = edges[(i + 1) % edges.length];

    const d1x = e1.p2[0] - e1.p1[0];
    const d1y = e1.p2[1] - e1.p1[1];
    const d2x = e2.p2[0] - e2.p1[0];
    const d2y = e2.p2[1] - e2.p1[1];

    const denom = d1x * d2y - d1y * d2x;

    if (Math.abs(denom) < 0.0001) {
      // Parallel edges - use midpoint
      result.push([
        (e1.p2[0] + e2.p1[0]) / 2,
        (e1.p2[1] + e2.p1[1]) / 2
      ]);
    } else {
      // Calculate intersection
      const t = ((e2.p1[0] - e1.p1[0]) * d2y - (e2.p1[1] - e1.p1[1]) * d2x) / denom;
      result.push([
        e1.p1[0] + t * d1x,
        e1.p1[1] + t * d1y
      ]);
    }
  }

  // Validate result - check it has positive area
  let resultArea = 0;
  for (let i = 0; i < result.length; i++) {
    const j = (i + 1) % result.length;
    resultArea += result[i][0] * result[j][1] - result[j][0] * result[i][1];
  }

  if (Math.abs(resultArea) < 1 || result.length < 3) {
    return poly; // Inset collapsed the polygon
  }

  return result;
}

/**
 * Draw a polygon path with rounded corners
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array<[number, number]>} pts - Polygon vertices
 * @param {number} r - Target corner radius
 */
export function drawRoundedPath(ctx, pts, r) {
  if (!pts || pts.length < 3) return;

  const n = pts.length;
  ctx.beginPath();

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    // Calculate distances to adjacent vertices
    const d1 = Math.hypot(prev[0] - curr[0], prev[1] - curr[1]);
    const d2 = Math.hypot(next[0] - curr[0], next[1] - curr[1]);

    // Limit radius to avoid overlapping curves
    const maxR = Math.min(d1, d2) * 0.4;
    const radius = Math.min(r, maxR);

    if (radius < 1) {
      // Sharp corner for very small radii
      if (i === 0) ctx.moveTo(curr[0], curr[1]);
      else ctx.lineTo(curr[0], curr[1]);
    } else {
      // Calculate unit vectors toward adjacent vertices
      const v1x = (prev[0] - curr[0]) / d1;
      const v1y = (prev[1] - curr[1]) / d1;
      const v2x = (next[0] - curr[0]) / d2;
      const v2y = (next[1] - curr[1]) / d2;

      // Start point of the arc
      const start = [curr[0] + v1x * radius, curr[1] + v1y * radius];

      if (i === 0) ctx.moveTo(start[0], start[1]);
      else ctx.lineTo(start[0], start[1]);

      // Draw arc through the corner
      ctx.arcTo(
        curr[0], curr[1],
        curr[0] + v2x * radius, curr[1] + v2y * radius,
        radius
      );
    }
  }
  ctx.closePath();
}

/**
 * Test if a point is inside a polygon using ray casting
 *
 * @param {number} x - X coordinate to test
 * @param {number} y - Y coordinate to test
 * @param {Array<[number, number]>} poly - Polygon vertices
 * @returns {boolean} True if point is inside the polygon
 */
export function pointInPolygon(x, y, poly) {
  if (!poly || poly.length < 3) return false;

  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Calculate bounding box of a polygon
 *
 * @param {Array<[number, number]>} poly - Polygon vertices
 * @returns {{minX: number, maxX: number, minY: number, maxY: number, width: number, height: number}}
 */
export function polygonBounds(poly) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const p of poly) {
    minX = Math.min(minX, p[0]);
    maxX = Math.max(maxX, p[0]);
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }

  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
