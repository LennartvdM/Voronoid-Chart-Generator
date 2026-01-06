import { describe, it, expect } from 'vitest';
import {
  polygonArea,
  polygonCentroid,
  clipPolygon,
  insetPolygon,
  pointInPolygon,
  polygonBounds
} from './geometry';

describe('polygonArea', () => {
  it('calculates area of a unit square', () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    expect(polygonArea(square)).toBe(1);
  });

  it('calculates area of a 2x3 rectangle', () => {
    const rect = [[0, 0], [2, 0], [2, 3], [0, 3]];
    expect(polygonArea(rect)).toBe(6);
  });

  it('calculates area of a right triangle', () => {
    const triangle = [[0, 0], [4, 0], [0, 3]];
    expect(polygonArea(triangle)).toBe(6);
  });

  it('returns same area regardless of winding direction', () => {
    const cwSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const ccwSquare = [[0, 0], [0, 1], [1, 1], [1, 0]];
    expect(polygonArea(cwSquare)).toBe(polygonArea(ccwSquare));
  });

  it('handles degenerate polygon (line)', () => {
    const line = [[0, 0], [1, 0], [2, 0]];
    expect(polygonArea(line)).toBe(0);
  });
});

describe('polygonCentroid', () => {
  it('calculates centroid of a unit square', () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const [cx, cy] = polygonCentroid(square);
    expect(cx).toBeCloseTo(0.5);
    expect(cy).toBeCloseTo(0.5);
  });

  it('calculates centroid of a rectangle', () => {
    const rect = [[0, 0], [4, 0], [4, 2], [0, 2]];
    const [cx, cy] = polygonCentroid(rect);
    expect(cx).toBeCloseTo(2);
    expect(cy).toBeCloseTo(1);
  });

  it('calculates centroid of an equilateral triangle', () => {
    // Triangle with base 2 and height sqrt(3)
    const triangle = [[0, 0], [2, 0], [1, Math.sqrt(3)]];
    const [cx, cy] = polygonCentroid(triangle);
    expect(cx).toBeCloseTo(1);
    expect(cy).toBeCloseTo(Math.sqrt(3) / 3);
  });

  it('handles degenerate polygon with fallback to average', () => {
    // Very thin polygon that would have near-zero area
    const thin = [[0, 0], [1, 0], [1, 0.0000001]];
    const [cx, cy] = polygonCentroid(thin);
    expect(isFinite(cx)).toBe(true);
    expect(isFinite(cy)).toBe(true);
  });
});

describe('clipPolygon', () => {
  it('clips a square against a vertical line', () => {
    const square = [[0, 0], [2, 0], [2, 2], [0, 2]];
    // Clip keeping x >= 1 (line at x=1, normal pointing right)
    const clipped = clipPolygon(square, 1, 0, 1, 0);
    expect(clipped.length).toBe(4);
    expect(polygonArea(clipped)).toBeCloseTo(2); // Half the square
  });

  it('clips a square against a horizontal line', () => {
    const square = [[0, 0], [2, 0], [2, 2], [0, 2]];
    // Clip keeping y >= 1 (line at y=1, normal pointing up)
    const clipped = clipPolygon(square, 0, 1, 0, 1);
    expect(clipped.length).toBe(4);
    expect(polygonArea(clipped)).toBeCloseTo(2);
  });

  it('returns empty array when polygon is entirely outside', () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    // Clip keeping x >= 5
    const clipped = clipPolygon(square, 5, 0, 1, 0);
    expect(clipped.length).toBe(0);
  });

  it('returns same polygon when entirely inside', () => {
    const square = [[2, 2], [3, 2], [3, 3], [2, 3]];
    // Clip keeping x >= 1
    const clipped = clipPolygon(square, 1, 0, 1, 0);
    expect(clipped.length).toBe(4);
    expect(polygonArea(clipped)).toBeCloseTo(1);
  });
});

describe('insetPolygon', () => {
  it('returns original polygon if amount is 0', () => {
    const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const result = insetPolygon(square, 0);
    expect(result).toBe(square);
  });

  it('returns original polygon for null input', () => {
    expect(insetPolygon(null, 5)).toBe(null);
  });

  it('returns original for degenerate polygon', () => {
    const line = [[0, 0], [1, 0]];
    expect(insetPolygon(line, 1)).toBe(line);
  });

  it('creates smaller polygon when insetting', () => {
    const square = [[0, 0], [20, 0], [20, 20], [0, 20]];
    const inset = insetPolygon(square, 2);
    expect(inset).not.toBe(square);
    expect(polygonArea(inset)).toBeLessThan(polygonArea(square));
  });

  it('handles extreme inset amounts', () => {
    const small = [[0, 0], [2, 0], [2, 2], [0, 2]];
    const result = insetPolygon(small, 10);
    // Extreme inset may produce inverted or different polygon
    // Just verify it returns a valid result without crashing
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('pointInPolygon', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];

  it('returns true for point inside', () => {
    expect(pointInPolygon(5, 5, square)).toBe(true);
  });

  it('returns true for point near center', () => {
    expect(pointInPolygon(1, 1, square)).toBe(true);
  });

  it('returns false for point outside', () => {
    expect(pointInPolygon(15, 5, square)).toBe(false);
    expect(pointInPolygon(-5, 5, square)).toBe(false);
    expect(pointInPolygon(5, 15, square)).toBe(false);
    expect(pointInPolygon(5, -5, square)).toBe(false);
  });

  it('returns false for null polygon', () => {
    expect(pointInPolygon(5, 5, null)).toBe(false);
  });

  it('returns false for degenerate polygon', () => {
    expect(pointInPolygon(5, 5, [[0, 0], [1, 0]])).toBe(false);
  });

  it('works with complex polygon', () => {
    // L-shaped polygon
    const lShape = [[0, 0], [10, 0], [10, 5], [5, 5], [5, 10], [0, 10]];
    expect(pointInPolygon(2, 2, lShape)).toBe(true);  // Bottom left
    expect(pointInPolygon(2, 8, lShape)).toBe(true);  // Top left arm
    expect(pointInPolygon(8, 2, lShape)).toBe(true);  // Bottom right arm
    expect(pointInPolygon(8, 8, lShape)).toBe(false); // Outside (top right)
  });
});

describe('polygonBounds', () => {
  it('calculates bounds of a square', () => {
    const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const bounds = polygonBounds(square);
    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(10);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxY).toBe(10);
    expect(bounds.width).toBe(10);
    expect(bounds.height).toBe(10);
  });

  it('calculates bounds of offset polygon', () => {
    const rect = [[5, 3], [15, 3], [15, 8], [5, 8]];
    const bounds = polygonBounds(rect);
    expect(bounds.minX).toBe(5);
    expect(bounds.maxX).toBe(15);
    expect(bounds.minY).toBe(3);
    expect(bounds.maxY).toBe(8);
    expect(bounds.width).toBe(10);
    expect(bounds.height).toBe(5);
  });

  it('handles single point', () => {
    const point = [[5, 5]];
    const bounds = polygonBounds(point);
    expect(bounds.width).toBe(0);
    expect(bounds.height).toBe(0);
  });
});
