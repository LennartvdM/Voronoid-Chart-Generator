/**
 * Color manipulation utilities
 * @module utils/color
 */

/**
 * Adjust the brightness of a hex color
 * Positive amount lightens, negative darkens
 *
 * @param {string} hex - Hex color string (e.g., '#c44536')
 * @param {number} amount - Brightness adjustment (-255 to 255)
 * @returns {string} Adjusted hex color
 */
export function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert hex color to RGB components
 *
 * @param {string} hex - Hex color string
 * @returns {{r: number, g: number, b: number}} RGB values (0-255)
 */
export function hexToRgb(hex) {
  const num = parseInt(hex.slice(1), 16);
  return {
    r: num >> 16,
    g: (num >> 8) & 0xff,
    b: num & 0xff
  };
}

/**
 * Convert RGB to hex color string
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  const toHex = x => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL color space
 *
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{h: number, s: number, l: number}} HSL values (h: 0-1, s: 0-1, l: 0-1)
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB color space
 *
 * @param {number} h - Hue (0-1)
 * @param {number} s - Saturation (0-1)
 * @param {number} l - Lightness (0-1)
 * @returns {{r: number, g: number, b: number}} RGB values (0-255)
 */
export function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Shift the hue of a hex color by a specified amount
 *
 * @param {string} hex - Hex color string
 * @param {number} hueShift - Degrees to shift (-180 to 180)
 * @returns {string} Adjusted hex color
 */
export function adjustHue(hex, hueShift) {
  if (hueShift === 0) return hex;

  const { r, g, b } = hexToRgb(hex);
  let { h, s, l } = rgbToHsl(r, g, b);

  // Shift hue and wrap around
  h = (h + hueShift / 360 + 1) % 1;

  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Generate a variation of a base color for visual distinction within a category
 *
 * @param {string} baseColor - Base hex color
 * @param {number} index - Index of the item within its category
 * @param {number} variationAmount - Maximum brightness variation (default: 20)
 * @returns {string} Varied hex color
 */
export function getCategoryColorVariation(baseColor, index, variationAmount = 20) {
  const variation = (index % 3 - 1) * variationAmount;
  return adjustColor(baseColor, variation);
}
