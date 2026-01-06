import { describe, it, expect } from 'vitest';
import {
  adjustColor,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  adjustHue,
  getCategoryColorVariation
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
