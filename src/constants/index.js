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
