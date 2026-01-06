import { describe, it, expect } from 'vitest';
import {
  adjustColor,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  adjustHue,
  getCategoryColorVariation,
  calculateTiers,
  getTierColor,
  interpolateColor,
  getInterpolatedSchemeColor,
  applyColorScheme
} from './color';

describe('hexToRgb', () => {
  it('converts black', () => {
    const rgb = hexToRgb('#000000');
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('converts white', () => {
    const rgb = hexToRgb('#ffffff');
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it('converts red', () => {
    const rgb = hexToRgb('#ff0000');
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('converts a specific color', () => {
    const rgb = hexToRgb('#c44536');
    expect(rgb.r).toBe(196);
    expect(rgb.g).toBe(69);
    expect(rgb.b).toBe(54);
  });
});

describe('rgbToHex', () => {
  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
  });

  it('clamps values outside 0-255', () => {
    expect(rgbToHex(300, -50, 128)).toBe('#ff0080');
  });

  it('rounds fractional values', () => {
    expect(rgbToHex(127.6, 0, 0)).toBe('#800000');
  });
});

describe('rgbToHsl and hslToRgb', () => {
  it('converts red correctly', () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl.h).toBeCloseTo(0);
    expect(hsl.s).toBeCloseTo(1);
    expect(hsl.l).toBeCloseTo(0.5);

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(0);
  });

  it('converts green correctly', () => {
    const hsl = rgbToHsl(0, 255, 0);
    expect(hsl.h).toBeCloseTo(1/3);
    expect(hsl.s).toBeCloseTo(1);
    expect(hsl.l).toBeCloseTo(0.5);

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(0);
  });

  it('converts blue correctly', () => {
    const hsl = rgbToHsl(0, 0, 255);
    expect(hsl.h).toBeCloseTo(2/3);
    expect(hsl.s).toBeCloseTo(1);
    expect(hsl.l).toBeCloseTo(0.5);

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(0);
    expect(rgb.b).toBe(255);
  });

  it('handles grayscale (no saturation)', () => {
    const gray = rgbToHsl(128, 128, 128);
    expect(gray.s).toBe(0);

    const rgb = hslToRgb(0, 0, 0.5);
    expect(rgb.r).toBe(128);
    expect(rgb.g).toBe(128);
    expect(rgb.b).toBe(128);
  });

  it('roundtrips correctly for arbitrary colors', () => {
    const original = { r: 196, g: 69, b: 54 };
    const hsl = rgbToHsl(original.r, original.g, original.b);
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    expect(rgb.r).toBe(original.r);
    expect(rgb.g).toBe(original.g);
    expect(rgb.b).toBe(original.b);
  });
});

describe('adjustColor', () => {
  it('lightens a color', () => {
    const lighter = adjustColor('#808080', 50);
    expect(lighter).toBe('#b2b2b2');
  });

  it('darkens a color', () => {
    const darker = adjustColor('#808080', -50);
    expect(darker).toBe('#4e4e4e');
  });

  it('clamps at white', () => {
    const result = adjustColor('#ffffff', 100);
    expect(result).toBe('#ffffff');
  });

  it('clamps at black', () => {
    const result = adjustColor('#000000', -100);
    expect(result).toBe('#000000');
  });
});

describe('adjustHue', () => {
  it('returns same color for 0 shift', () => {
    const color = '#c44536';
    expect(adjustHue(color, 0)).toBe(color);
  });

  it('shifts hue by 180 degrees', () => {
    // Red hue shifted 180 should be cyan-ish
    const shifted = adjustHue('#ff0000', 180);
    const rgb = hexToRgb(shifted);
    expect(rgb.r).toBe(0);
    expect(rgb.g).toBe(255);
    expect(rgb.b).toBe(255);
  });

  it('wraps around at 360 degrees', () => {
    const color = '#ff0000';
    const shifted360 = adjustHue(color, 360);
    expect(shifted360).toBe(color);
  });

  it('handles negative shifts', () => {
    const color = '#ff0000';
    const shiftedNeg = adjustHue(color, -60);
    const shiftedPos = adjustHue(color, 300);
    expect(shiftedNeg).toBe(shiftedPos);
  });
});

describe('getCategoryColorVariation', () => {
  it('returns different colors for different indices', () => {
    const base = '#c44536';
    const v0 = getCategoryColorVariation(base, 0);
    const v1 = getCategoryColorVariation(base, 1);
    const v2 = getCategoryColorVariation(base, 2);

    // They should all be slightly different
    expect(v0).not.toBe(v1);
    expect(v1).not.toBe(v2);
    expect(v0).not.toBe(v2);
  });

  it('cycles every 3 indices', () => {
    const base = '#808080';
    const v0 = getCategoryColorVariation(base, 0);
    const v3 = getCategoryColorVariation(base, 3);
    const v6 = getCategoryColorVariation(base, 6);

    expect(v0).toBe(v3);
    expect(v0).toBe(v6);
  });

  it('respects variationAmount parameter', () => {
    const base = '#808080';
    const smallVar = getCategoryColorVariation(base, 0, 10);
    const largeVar = getCategoryColorVariation(base, 0, 50);

    // Larger variation should produce more different colors
    const smallRgb = hexToRgb(smallVar);
    const largeRgb = hexToRgb(largeVar);

    // Index 0 gives -1 * amount, so both should be darker than base
    expect(smallRgb.r).toBe(118); // 128 - 10
    expect(largeRgb.r).toBe(78);  // 128 - 50
  });
});

describe('calculateTiers', () => {
  const testData = [
    { n: 100 },
    { n: 50 },
    { n: 25 },
    { n: 10 },
    { n: 5 }
  ];

  it('calculates topN tiers correctly', () => {
    const tiers = calculateTiers(testData, 'topN', { tiers: [1, 2, 4] });
    expect(tiers[0]).toBe(0); // Rank 0 (largest) -> tier 0
    expect(tiers[1]).toBe(1); // Rank 1 -> tier 1
    expect(tiers[2]).toBe(2); // Rank 2 -> tier 2
    expect(tiers[3]).toBe(2); // Rank 3 -> tier 2
    expect(tiers[4]).toBe(3); // Rank 4 -> tier 3 (fallback)
  });

  it('calculates percentage tiers correctly', () => {
    // Total = 190
    // 100/190 = 52.6%, 50/190 = 26.3%, 25/190 = 13.2%, 10/190 = 5.3%, 5/190 = 2.6%
    const tiers = calculateTiers(testData, 'percentage', { thresholds: [50, 25, 10, 5] });
    expect(tiers[0]).toBe(0); // 52.6% >= 50% -> tier 0
    expect(tiers[1]).toBe(1); // 26.3% >= 25% -> tier 1
    expect(tiers[2]).toBe(2); // 13.2% >= 10% -> tier 2
    expect(tiers[3]).toBe(3); // 5.3% >= 5% -> tier 3
    expect(tiers[4]).toBe(4); // 2.6% < 5% -> tier 4 (fallback)
  });

  it('calculates equalCount tiers correctly', () => {
    const tiers = calculateTiers(testData, 'equalCount', { groups: 3 });
    // 5 items, 3 groups -> 2 items per group
    expect(tiers[0]).toBe(0); // Rank 0 -> group 0
    expect(tiers[1]).toBe(0); // Rank 1 -> group 0
    expect(tiers[2]).toBe(1); // Rank 2 -> group 1
    expect(tiers[3]).toBe(1); // Rank 3 -> group 1
    expect(tiers[4]).toBe(2); // Rank 4 -> group 2
  });

  it('returns all zeros for unknown method', () => {
    const tiers = calculateTiers(testData, 'unknown', {});
    expect(tiers.every(t => t === 0)).toBe(true);
  });
});

describe('getTierColor', () => {
  const colors = ['#ff0000', '#00ff00', '#0000ff'];

  it('returns null for empty scheme', () => {
    expect(getTierColor([], 0, 3)).toBeNull();
    expect(getTierColor(null, 0, 3)).toBeNull();
  });

  it('maps tier 0 to first color', () => {
    expect(getTierColor(colors, 0, 3)).toBe('#ff0000');
  });

  it('maps last tier to last color', () => {
    expect(getTierColor(colors, 2, 3)).toBe('#0000ff');
  });

  it('maps intermediate tiers correctly', () => {
    expect(getTierColor(colors, 1, 3)).toBe('#00ff00');
  });
});

describe('interpolateColor', () => {
  it('returns first color at t=0', () => {
    expect(interpolateColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  it('returns second color at t=1', () => {
    expect(interpolateColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });

  it('returns midpoint at t=0.5', () => {
    const mid = interpolateColor('#ff0000', '#0000ff', 0.5);
    const rgb = hexToRgb(mid);
    expect(rgb.r).toBe(128);
    expect(rgb.b).toBe(128);
  });
});

describe('getInterpolatedSchemeColor', () => {
  const colors = ['#ff0000', '#00ff00', '#0000ff'];

  it('returns null for empty scheme', () => {
    expect(getInterpolatedSchemeColor([], 50, 0, 100)).toBeNull();
  });

  it('returns first color for max value', () => {
    expect(getInterpolatedSchemeColor(colors, 100, 0, 100)).toBe('#ff0000');
  });

  it('returns last color for min value', () => {
    expect(getInterpolatedSchemeColor(colors, 0, 0, 100)).toBe('#0000ff');
  });

  it('handles single color scheme', () => {
    expect(getInterpolatedSchemeColor(['#ff0000'], 50, 0, 100)).toBe('#ff0000');
  });

  it('handles zero range', () => {
    expect(getInterpolatedSchemeColor(colors, 50, 50, 50)).toBe('#ff0000');
  });
});

describe('applyColorScheme', () => {
  const testData = [
    { n: 100, cat: 'a' },
    { n: 50, cat: 'b' },
    { n: 10, cat: 'c' }
  ];
  const testCellData = [
    { color: '#aaaaaa', label: 'A' },
    { color: '#bbbbbb', label: 'B' },
    { color: '#cccccc', label: 'C' }
  ];
  const testScheme = { colors: ['#ff0000', '#00ff00', '#0000ff'] };

  it('returns original data when scheme is none', () => {
    const result = applyColorScheme(testData, testCellData, { colors: [] }, 'topN', { tiers: [1] }, false);
    expect(result).toBe(testCellData);
  });

  it('applies discrete tiers correctly', () => {
    const result = applyColorScheme(testData, testCellData, testScheme, 'topN', { tiers: [1, 2] }, false);
    expect(result[0].color).toBe('#ff0000'); // Tier 0
    expect(result[0].tier).toBe(0);
    expect(result[0].originalColor).toBe('#aaaaaa');
  });

  it('applies smooth interpolation correctly', () => {
    const result = applyColorScheme(testData, testCellData, testScheme, 'topN', {}, true);
    expect(result[0].color).toBe('#ff0000'); // Max value -> first color
    expect(result[0].tier).toBeNull();
  });

  it('preserves original properties', () => {
    const result = applyColorScheme(testData, testCellData, testScheme, 'topN', { tiers: [1] }, false);
    expect(result[0].label).toBe('A');
    expect(result[1].label).toBe('B');
  });
});
