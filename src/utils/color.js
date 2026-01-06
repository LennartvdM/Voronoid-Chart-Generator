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

/**
 * Calculate tier assignments for data items based on the selected method
 *
 * @param {Array<{n: number}>} data - Data items with numeric values
 * @param {string} method - Tier classification method (topN, percentile, percentage, equalCount)
 * @param {Object} config - Configuration for the method (thresholds, tiers, groups)
 * @returns {number[]} Array of tier indices (0 = largest tier, higher = smaller tiers)
 */
export function calculateTiers(data, method, config) {
  const total = data.reduce((sum, d) => sum + d.n, 0);
  const sortedIndices = data
    .map((d, i) => ({ index: i, value: d.n }))
    .sort((a, b) => b.value - a.value)
    .map((item, rank) => ({ ...item, rank }));

  // Create a lookup from original index to rank
  const rankByIndex = new Map();
  sortedIndices.forEach(item => rankByIndex.set(item.index, item.rank));

  const tiers = new Array(data.length).fill(0);

  switch (method) {
    case 'topN': {
      const tierBoundaries = config.tiers || [1, 3, 5, 10];
      data.forEach((_, i) => {
        const rank = rankByIndex.get(i);
        let tier = tierBoundaries.length; // Default to last tier
        for (let t = 0; t < tierBoundaries.length; t++) {
          if (rank < tierBoundaries[t]) {
            tier = t;
            break;
          }
        }
        tiers[i] = tier;
      });
      break;
    }

    case 'percentile': {
      const thresholds = config.thresholds || [90, 75, 50, 25];
      const sortedValues = data.map(d => d.n).sort((a, b) => b - a);
      data.forEach((d, i) => {
        // Calculate percentile for this item
        const belowCount = sortedValues.filter(v => v < d.n).length;
        const percentile = (belowCount / data.length) * 100;

        let tier = thresholds.length; // Default to last tier
        for (let t = 0; t < thresholds.length; t++) {
          if (percentile >= 100 - thresholds[t]) {
            tier = t;
            break;
          }
        }
        tiers[i] = tier;
      });
      break;
    }

    case 'percentage': {
      const thresholds = config.thresholds || [10, 5, 2, 1];
      data.forEach((d, i) => {
        const pct = (d.n / total) * 100;
        let tier = thresholds.length; // Default to last tier
        for (let t = 0; t < thresholds.length; t++) {
          if (pct >= thresholds[t]) {
            tier = t;
            break;
          }
        }
        tiers[i] = tier;
      });
      break;
    }

    case 'equalCount': {
      const groups = config.groups || 5;
      const itemsPerGroup = Math.ceil(data.length / groups);
      data.forEach((_, i) => {
        const rank = rankByIndex.get(i);
        tiers[i] = Math.min(Math.floor(rank / itemsPerGroup), groups - 1);
      });
      break;
    }

    default:
      // Return all zeros (same tier)
      break;
  }

  return tiers;
}

/**
 * Get the color for a given tier from a color scheme
 *
 * @param {string[]} schemeColors - Array of colors in the scheme
 * @param {number} tier - Tier index (0 = largest)
 * @param {number} totalTiers - Total number of tiers
 * @returns {string} Hex color for the tier
 */
export function getTierColor(schemeColors, tier, totalTiers) {
  if (!schemeColors || schemeColors.length === 0) {
    return null; // Use category color
  }

  // Map tier to color index proportionally
  const colorIndex = Math.min(
    Math.floor((tier / totalTiers) * schemeColors.length),
    schemeColors.length - 1
  );

  return schemeColors[colorIndex];
}

/**
 * Interpolate between two hex colors
 *
 * @param {string} color1 - Starting hex color
 * @param {string} color2 - Ending hex color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {string} Interpolated hex color
 */
export function interpolateColor(color1, color2, t) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

  return rgbToHex(r, g, b);
}

/**
 * Get smoothly interpolated color based on value position
 *
 * @param {string[]} schemeColors - Array of colors in the scheme
 * @param {number} value - The data value
 * @param {number} minValue - Minimum value in dataset
 * @param {number} maxValue - Maximum value in dataset
 * @returns {string|null} Interpolated hex color, or null for category color
 */
export function getInterpolatedSchemeColor(schemeColors, value, minValue, maxValue) {
  if (!schemeColors || schemeColors.length === 0) {
    return null; // Use category color
  }

  if (schemeColors.length === 1) {
    return schemeColors[0];
  }

  // Normalize value to 0-1 range (inverted so larger values = index 0)
  const range = maxValue - minValue;
  if (range === 0) return schemeColors[0];

  const normalized = 1 - (value - minValue) / range; // Invert so large values -> 0
  const scaledPosition = normalized * (schemeColors.length - 1);

  const lowerIndex = Math.floor(scaledPosition);
  const upperIndex = Math.min(lowerIndex + 1, schemeColors.length - 1);
  const t = scaledPosition - lowerIndex;

  return interpolateColor(schemeColors[lowerIndex], schemeColors[upperIndex], t);
}

/**
 * Apply a color scheme to cell data based on tier classification
 *
 * @param {Array} data - Original data array with n values
 * @param {Array} cellData - Cell data array with colors
 * @param {Object} colorScheme - Color scheme object with colors array
 * @param {string} tierMethod - Tier classification method
 * @param {Object} tierConfig - Tier configuration
 * @param {boolean} useSmoothing - Whether to use smooth color interpolation
 * @returns {Array} New cellData array with updated colors
 */
export function applyColorScheme(data, cellData, colorScheme, tierMethod, tierConfig, useSmoothing) {
  // If no scheme or scheme is 'none', return original
  if (!colorScheme || !colorScheme.colors || colorScheme.colors.length === 0) {
    return cellData;
  }

  const schemeColors = colorScheme.colors;

  if (useSmoothing) {
    // Use smooth interpolation based on value
    const values = data.map(d => d.n);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return cellData.map((cell, i) => {
      const color = getInterpolatedSchemeColor(schemeColors, data[i].n, minValue, maxValue);
      return {
        ...cell,
        color: color || cell.color,
        originalColor: cell.color, // Keep original for reference
        tier: null // Not using discrete tiers
      };
    });
  } else {
    // Use discrete tiers
    const tiers = calculateTiers(data, tierMethod, tierConfig);
    const maxTier = Math.max(...tiers);
    const totalTiers = maxTier + 1;

    return cellData.map((cell, i) => {
      const tier = tiers[i];
      const color = getTierColor(schemeColors, tier, totalTiers);
      return {
        ...cell,
        color: color || cell.color,
        originalColor: cell.color, // Keep original for reference
        tier
      };
    });
  }
}
