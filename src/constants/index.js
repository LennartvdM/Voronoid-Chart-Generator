/**
 * Application constants for the Voronoid Chart Generator
 * @module constants
 */

/**
 * Medical category definitions with display labels and colors
 * @type {Object.<string, {label: string, color: string}>}
 */
export const CATEGORIES = {
  oncologie: { label: 'Oncologie', color: '#c44536' },
  degeneratief: { label: 'Ouderdom & degeneratief', color: '#7b5e7b' },
  spijsvertering: { label: 'Spijsvertering & organen', color: '#2d6a4f' },
  trauma: { label: 'Trauma & extern', color: '#e09f3e' },
  infectie: { label: 'Infectie & immuun', color: '#457b9d' },
  voortplanting: { label: 'Voortplanting & hormonaal', color: '#d4a373' },
  overig: { label: 'Overig', color: '#6c757d' }
};

/**
 * Color palette for text color overrides
 * First item is null (reset to default), followed by themed color options
 * @type {(string|null)[]}
 */
export const TEXT_COLORS = [
  null, // Reset to default
  '#c44536', '#a63c30', '#8b3328', // Reds
  '#7b5e7b', '#6b4f6b', '#5a3f5a', // Purples
  '#2d6a4f', '#245a42', '#1b4a35', // Greens
  '#e09f3e', '#c88a35', '#b0762c', // Oranges/Golds
  '#457b9d', '#3a6a8a', '#2f5977', // Blues
  '#d4a373', '#c49366', '#b48359', // Tans
  '#6c757d', '#5a636a', '#485057', // Grays
  '#8b4513', '#a0522d', '#cd853f', // Browns
];

/**
 * Default medical mortality dataset
 * @type {Array<{label: string, n: number, cat: string, displayLabel?: string, textColor?: string}>}
 */
export const DEFAULT_DATA = [
  { label: 'Kanker', n: 587, cat: 'oncologie' },
  { label: 'Ouderdom', n: 310, cat: 'degeneratief' },
  { label: 'Neurologisch', n: 163, cat: 'degeneratief' },
  { label: 'Hart', n: 122, cat: 'degeneratief' },
  { label: 'Maag-darm', n: 221, cat: 'spijsvertering' },
  { label: 'Lever', n: 24, cat: 'spijsvertering' },
  { label: 'Nier/Urine', n: 39, cat: 'spijsvertering' },
  { label: 'Incident', n: 177, cat: 'trauma' },
  { label: 'Gif', n: 20, cat: 'trauma' },
  { label: 'Inwendige bloeding', n: 17, cat: 'trauma', displayLabel: 'Inwendige\nbloeding', textColor: '#b07828' },
  { label: 'Besmetting', n: 13, cat: 'infectie' },
  { label: 'Immuun', n: 8, cat: 'infectie' },
  { label: 'Respiratoir', n: 28, cat: 'infectie' },
  { label: 'Baarmoeder', n: 8, cat: 'voortplanting' },
  { label: 'Endocrien', n: 27, cat: 'voortplanting' },
  { label: 'Motorisch', n: 50, cat: 'overig' },
  { label: 'Gedrag', n: 38, cat: 'overig' },
  { label: 'Hematologisch', n: 8, cat: 'overig' },
  { label: 'Oog', n: 5, cat: 'overig' },
  { label: 'Huid', n: 4, cat: 'overig' },
  { label: 'MO', n: 26, cat: 'overig' },
  { label: 'Overig', n: 8, cat: 'overig' },
];

// Canvas dimensions
export const LANDSCAPE_WIDTH = 1200;
export const LANDSCAPE_HEIGHT = 850;
export const PORTRAIT_WIDTH = 850;
export const PORTRAIT_HEIGHT = 1200;

/** Padding around the chart area */
export const PAD = 40;

/** Gap between cells (visual separation) */
export const GAP = 10;

/** Corner radius for rounded cell edges */
export const CORNER_RADIUS = 14;

/** Export scale multiplier for high-resolution PNG output */
export const EXPORT_SCALE = 3;

// Voronoi algorithm parameters

/** Maximum optimization iterations */
export const MAX_ITERATIONS = 350;

/** Target error threshold for convergence (0.5%) */
export const ERROR_THRESHOLD = 0.005;

/** Lloyd relaxation step toward centroid (30%) */
export const LLOYD_STEP_RATIO = 0.3;

/** Category clustering pull strength (8%) */
export const CATEGORY_CLUSTER_STRENGTH = 0.08;

// Size thresholds for label rendering tiers

/** Large cell threshold (>5% of total area) */
export const LARGE_CELL_THRESHOLD = 0.05;

/** Medium cell threshold (>2% of total area) */
export const MEDIUM_CELL_THRESHOLD = 0.02;

/** Small cell minimum threshold (>0.5% of total area) */
export const SMALL_CELL_THRESHOLD = 0.005;

/** Tiny cell corner radius adjustment threshold (<0.4% of total area) */
export const TINY_CELL_THRESHOLD = 0.004;

// Default control values

export const DEFAULT_INNER_STROKE_WIDTH = 6;
export const DEFAULT_INNER_STROKE_OPACITY = 1.0;
export const DEFAULT_OUTER_STROKE_WIDTH = 2;
export const DEFAULT_GRADIENT_SIZE = 0.3;
export const DEFAULT_GRADIENT_OPACITY = 0.5;
export const DEFAULT_GRADIENT_HUE_SHIFT = 0;
export const DEFAULT_GRADIENT_BLEND_MODE = 'soft-light';
export const DEFAULT_TEXT_BLEND_MODE = 'multiply';

/**
 * Color schemes for distinguishing cell sizes
 * Each scheme has a name and an array of colors from largest to smallest tier
 * @type {Object.<string, {name: string, colors: string[]}>}
 */
export const COLOR_SCHEMES = {
  none: {
    name: 'Category Colors',
    description: 'Use original category colors',
    colors: [] // Empty means use category colors
  },
  darkLight: {
    name: 'Dark → Light',
    description: 'Dark colors for large, light for small',
    colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#7952b3', '#a78bda', '#d4c4e8']
  },
  lightDark: {
    name: 'Light → Dark',
    description: 'Light colors for large, dark for small',
    colors: ['#e8f4f8', '#b8d4e3', '#7eb8d8', '#4a9cc7', '#2980b9', '#1a5276', '#0d3b66']
  },
  warmCool: {
    name: 'Warm → Cool',
    description: 'Warm reds/oranges to cool blues',
    colors: ['#c0392b', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#2c3e50']
  },
  coolWarm: {
    name: 'Cool → Warm',
    description: 'Cool blues to warm reds/oranges',
    colors: ['#2c3e50', '#3498db', '#1abc9c', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
  },
  saturatedMuted: {
    name: 'Vibrant → Muted',
    description: 'Saturated colors for large, muted for small',
    colors: ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#8d99ae', '#adb5bd', '#ced4da']
  },
  mutedSaturated: {
    name: 'Muted → Vibrant',
    description: 'Muted colors for large, saturated for small',
    colors: ['#ced4da', '#adb5bd', '#8d99ae', '#457b9d', '#2a9d8f', '#e9c46a', '#e76f51']
  },
  blueOrange: {
    name: 'Blue ↔ Orange',
    description: 'Diverging blue through neutral to orange',
    colors: ['#053061', '#2166ac', '#4393c3', '#92c5de', '#f4a582', '#d6604d', '#b2182b']
  },
  greenPurple: {
    name: 'Green ↔ Purple',
    description: 'Diverging green through neutral to purple',
    colors: ['#1b7837', '#5aae61', '#a6dba0', '#d9f0d3', '#c2a5cf', '#9970ab', '#762a83']
  },
  earth: {
    name: 'Earth Tones',
    description: 'Natural brown and green palette',
    colors: ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9', '#d4a373', '#bc6c25', '#606c38']
  },
  ocean: {
    name: 'Ocean Depths',
    description: 'Deep sea to shallow waters',
    colors: ['#03045e', '#023e8a', '#0077b6', '#0096c7', '#00b4d8', '#48cae4', '#90e0ef']
  },
  sunset: {
    name: 'Sunset',
    description: 'Dusk colors from deep purple to golden',
    colors: ['#2d0040', '#540b6e', '#7b2d8e', '#9d4edd', '#ff6d00', '#ff8500', '#ffa200']
  },
  forest: {
    name: 'Forest',
    description: 'Deep forest greens to light foliage',
    colors: ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7']
  },
  monochrome: {
    name: 'Monochrome',
    description: 'Grayscale from black to white',
    colors: ['#212529', '#343a40', '#495057', '#6c757d', '#adb5bd', '#ced4da', '#e9ecef']
  },
  highContrast: {
    name: 'High Contrast',
    description: 'Maximum visual distinction',
    colors: ['#000000', '#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9d4edd', '#ffffff']
  }
};

/**
 * Tier classification methods
 * @type {Object.<string, {name: string, description: string}>}
 */
export const TIER_METHODS = {
  topN: {
    name: 'Top N',
    description: 'Assign tiers to top N items by value'
  },
  percentile: {
    name: 'Percentile',
    description: 'Classify by percentile thresholds'
  },
  percentage: {
    name: 'Percentage',
    description: 'Classify by percentage of total'
  },
  equalCount: {
    name: 'Equal Groups',
    description: 'Divide into equal-sized groups'
  }
};

/**
 * Default tier boundaries for different methods
 */
export const DEFAULT_TIER_CONFIG = {
  topN: { tiers: [1, 3, 5, 10] }, // Top 1, top 3, top 5, top 10, rest
  percentile: { thresholds: [90, 75, 50, 25] }, // 90th, 75th, 50th, 25th percentile
  percentage: { thresholds: [10, 5, 2, 1] }, // >10%, >5%, >2%, >1%, rest
  equalCount: { groups: 5 } // Split into 5 equal groups
};
