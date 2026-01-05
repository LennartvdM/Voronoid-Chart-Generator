import React, { useEffect, useRef, useState, useCallback } from 'react';

const CATEGORIES = {
  oncologie: { label: 'Oncologie', color: '#c44536' },
  degeneratief: { label: 'Ouderdom & degeneratief', color: '#7b5e7b' },
  spijsvertering: { label: 'Spijsvertering & organen', color: '#2d6a4f' },
  trauma: { label: 'Trauma & extern', color: '#e09f3e' },
  infectie: { label: 'Infectie & immuun', color: '#457b9d' },
  voortplanting: { label: 'Voortplanting & hormonaal', color: '#d4a373' },
  overig: { label: 'Overig', color: '#6c757d' }
};

const DATA = [
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

const W = 1200, H = 850;
const PAD = 40;
const GAP = 10;
const CORNER_RADIUS = 14;

function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
}

function polygonCentroid(pts) {
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
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

function clipPolygon(poly, px, py, nx, ny) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i], nxt = poly[(i + 1) % poly.length];
    const curD = (cur[0] - px) * nx + (cur[1] - py) * ny;
    const nxtD = (nxt[0] - px) * nx + (nxt[1] - py) * ny;
    if (curD >= 0) out.push(cur);
    if ((curD >= 0) !== (nxtD >= 0)) {
      const t = curD / (curD - nxtD);
      out.push([cur[0] + t * (nxt[0] - cur[0]), cur[1] + t * (nxt[1] - cur[1])]);
    }
  }
  return out;
}

function insetPolygon(poly, amount) {
  if (!poly || poly.length < 3 || amount <= 0) return poly;
  const n = poly.length;
  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += poly[i][0] * poly[j][1] - poly[j][0] * poly[i][1];
  }
  const wind = signedArea > 0 ? -1 : 1;

  const edges = [];
  for (let i = 0; i < n; i++) {
    const p1 = poly[i], p2 = poly[(i + 1) % n];
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const nx = wind * dy / len, ny = wind * -dx / len;
    edges.push({
      p1: [p1[0] + nx * amount, p1[1] + ny * amount],
      p2: [p2[0] + nx * amount, p2[1] + ny * amount]
    });
  }
  if (edges.length < 3) return poly;

  const result = [];
  for (let i = 0; i < edges.length; i++) {
    const e1 = edges[i], e2 = edges[(i + 1) % edges.length];
    const d1x = e1.p2[0] - e1.p1[0], d1y = e1.p2[1] - e1.p1[1];
    const d2x = e2.p2[0] - e2.p1[0], d2y = e2.p2[1] - e2.p1[1];
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 0.0001) {
      result.push([(e1.p2[0] + e2.p1[0]) / 2, (e1.p2[1] + e2.p1[1]) / 2]);
    } else {
      const t = ((e2.p1[0] - e1.p1[0]) * d2y - (e2.p1[1] - e1.p1[1]) * d2x) / denom;
      result.push([e1.p1[0] + t * d1x, e1.p1[1] + t * d1y]);
    }
  }

  let resultArea = 0;
  for (let i = 0; i < result.length; i++) {
    const j = (i + 1) % result.length;
    resultArea += result[i][0] * result[j][1] - result[j][0] * result[i][1];
  }
  if (Math.abs(resultArea) < 1 || result.length < 3) return poly;
  return result;
}

function computePowerDiagram(seeds, weights, bounds) {
  const cells = [];

  for (let i = 0; i < seeds.length; i++) {
    let cell = [...bounds];
    const si = seeds[i], wi = weights[i];

    for (let j = 0; j < seeds.length; j++) {
      if (i === j) continue;
      const sj = seeds[j], wj = weights[j];

      const dx = sj[0] - si[0], dy = sj[1] - si[1];
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001) continue;

      const midX = (si[0] + sj[0]) / 2 + (wi - wj) / (2 * dist * dist) * dx;
      const midY = (si[1] + sj[1]) / 2 + (wi - wj) / (2 * dist * dist) * dy;

      const nx = -dx / dist, ny = -dy / dist;

      cell = clipPolygon(cell, midX, midY, nx, ny);
      if (cell.length < 3) break;
    }

    cells.push(cell.length >= 3 ? cell : null);
  }

  return cells;
}

function optimizeWeights(seeds, weights, targets, bounds, totalArea) {
  const cells = computePowerDiagram(seeds, weights, bounds);
  const newWeights = [...weights];

  let maxError = 0;
  for (let i = 0; i < seeds.length; i++) {
    if (!cells[i] || cells[i].length < 3) continue;

    const area = polygonArea(cells[i]);
    const target = targets[i] * totalArea;
    const error = (target - area) / totalArea;
    maxError = Math.max(maxError, Math.abs(error));

    newWeights[i] += error * totalArea * 0.5;
  }

  return { weights: newWeights, cells, maxError };
}

function lloydStep(seeds, cells, catCenters, data) {
  return seeds.map((s, i) => {
    if (!cells[i] || cells[i].length < 3) return s;
    const c = polygonCentroid(cells[i]);
    const cat = data[i].cat;
    const center = catCenters[cat];

    // Move toward cell centroid
    let nx = s[0] + (c[0] - s[0]) * 0.3;
    let ny = s[1] + (c[1] - s[1]) * 0.3;

    // Also pull toward category center (clustering)
    nx += (center[0] - nx) * 0.08;
    ny += (center[1] - ny) * 0.08;

    return [nx, ny];
  });
}

// Initialize seeds clustered by category
function initSeeds(data, w, h, pad) {
  const cats = Object.keys(CATEGORIES);
  const catPositions = {};

  // Arrange category centers - larger categories toward center
  const catTotals = {};
  data.forEach(d => {
    catTotals[d.cat] = (catTotals[d.cat] || 0) + d.n;
  });

  const sortedCats = Object.keys(CATEGORIES).sort((a, b) => catTotals[b] - catTotals[a]);

  const cx = w / 2, cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.3;

  // Place larger categories near center, smaller toward edges
  sortedCats.forEach((cat, i) => {
    const t = i / (sortedCats.length - 1 || 1);
    const radius = t * maxRadius; // 0 for largest, maxRadius for smallest
    const angle = i * 2.4; // golden angle spread
    catPositions[cat] = [
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius
    ];
  });

  // Place seeds near their category center
  const seeds = data.map((d, i) => {
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

function drawRoundedPath(ctx, pts, r) {
  if (!pts || pts.length < 3) return;

  const n = pts.length;
  ctx.beginPath();

  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const d1 = Math.hypot(prev[0] - curr[0], prev[1] - curr[1]);
    const d2 = Math.hypot(next[0] - curr[0], next[1] - curr[1]);
    const maxR = Math.min(d1, d2) * 0.4;
    const radius = Math.min(r, maxR);

    if (radius < 1) {
      if (i === 0) ctx.moveTo(curr[0], curr[1]);
      else ctx.lineTo(curr[0], curr[1]);
    } else {
      const v1x = (prev[0] - curr[0]) / d1, v1y = (prev[1] - curr[1]) / d1;
      const v2x = (next[0] - curr[0]) / d2, v2y = (next[1] - curr[1]) / d2;

      const start = [curr[0] + v1x * radius, curr[1] + v1y * radius];

      if (i === 0) ctx.moveTo(start[0], start[1]);
      else ctx.lineTo(start[0], start[1]);

      ctx.arcTo(curr[0], curr[1], curr[0] + v2x * radius, curr[1] + v2y * radius, radius);
    }
  }
  ctx.closePath();
}

// Lighten/darken color
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Convert hex to HSL, shift hue, convert back
function adjustHue(hex, hueShift) {
  if (hueShift === 0) return hex;

  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) / 255;
  let g = ((num >> 8) & 0xff) / 255;
  let b = (num & 0xff) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Shift hue
  h = (h + hueShift / 360 + 1) % 1;

  // HSL to RGB
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function VoronoiPrint() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [cells, setCells] = useState([]);
  const [cellData, setCellData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [isLandscape, setIsLandscape] = useState(true);

  // Stroke parameters
  const [innerStrokeWidth, setInnerStrokeWidth] = useState(6);
  const [innerStrokeOpacity, setInnerStrokeOpacity] = useState(1.0);
  const [outerStrokeWidth, setOuterStrokeWidth] = useState(2);

  // Inner gradient parameters
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientSize, setGradientSize] = useState(0.3); // relative to cell size
  const [gradientOpacity, setGradientOpacity] = useState(0.5);
  const [gradientHueShift, setGradientHueShift] = useState(0); // -180 to 180 degrees
  const [gradientBlendMode, setGradientBlendMode] = useState('soft-light'); // multiply, overlay, soft-light

  // Label customization: { index: { customLabel: string, visibility: 'force' | 'normal' | 'hidden' } }
  const [labelOverrides, setLabelOverrides] = useState({});
  const [showLabelEditor, setShowLabelEditor] = useState(false);

  const W = isLandscape ? 1200 : 850;
  const H = isLandscape ? 850 : 1200;

  // Get effective label and visibility for a data index
  const getLabelSettings = (index) => {
    const override = labelOverrides[index] || {};
    const originalLabel = DATA[index].displayLabel || DATA[index].label;
    return {
      label: override.customLabel !== undefined && override.customLabel !== ''
        ? override.customLabel
        : originalLabel,
      visibility: override.visibility || 'normal'
    };
  };

  // Update a label override
  const updateLabelOverride = (index, field, value) => {
    setLabelOverrides(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  // Point in polygon test
  const pointInPolygon = (x, y, poly) => {
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
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < cells.length; i++) {
      if (cells[i] && pointInPolygon(x, y, cells[i])) {
        const d = cellData[i];
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          label: d.label,
          pct: d.pct,
          cat: CATEGORIES[d.cat].label
        });
        return;
      }
    }
    setTooltip(null);
  };

  const handleMouseLeave = () => setTooltip(null);

  const generate = useCallback(() => {
    setStatus('Generating...');

    const total = DATA.reduce((s, d) => s + d.n, 0);
    const targets = DATA.map(d => d.n / total);
    const bounds = [[PAD, PAD], [W - PAD, PAD], [W - PAD, H - PAD], [PAD, H - PAD]];
    const totalArea = (W - 2 * PAD) * (H - 2 * PAD);

    let { seeds, catCenters } = initSeeds(DATA, W, H, PAD);
    let weights = DATA.map(() => 0);

    const maxIter = 350;
    let iter = 0;
    let bestCells = null;
    let bestError = Infinity;

    const step = () => {
      const result = optimizeWeights(seeds, weights, targets, bounds, totalArea);
      weights = result.weights;

      if (iter % 4 === 0) {
        seeds = lloydStep(seeds, result.cells, catCenters, DATA);
      }

      if (result.maxError < bestError) {
        bestError = result.maxError;
        bestCells = result.cells;
      }

      iter++;
      setStatus(`Optimizing... ${iter}/${maxIter} (error: ${(bestError * 100).toFixed(1)}%)`);

      if (iter < maxIter && bestError > 0.005) {
        requestAnimationFrame(step);
      } else {
        const finalCells = bestCells.map(c => c ? insetPolygon(c, GAP / 2) : null);
        setCells(finalCells);

        // Assign colors with variation within category
        const catCounts = {};
        setCellData(DATA.map((d, i) => {
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
      }
    };

    requestAnimationFrame(step);
  }, [isLandscape]);

  useEffect(() => {
    generate();
  }, [generate, isLandscape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f8f6';
    ctx.fillRect(0, 0, W, H);

    const totalArea = (W - 2 * PAD) * (H - 2 * PAD);

    cells.forEach((cell, i) => {
      if (!cell || cell.length < 3) return;
      const d = cellData[i];

      const area = polygonArea(cell);
      const relSize = area / totalArea;
      const centroid = polygonCentroid(cell);

      // Adjust corner radius for small cells to avoid concave issues
      const adjustedRadius = relSize < 0.004 ? Math.min(CORNER_RADIUS, 6) :
                            relSize < 0.01 ? Math.min(CORNER_RADIUS, 10) :
                            CORNER_RADIUS;

      // Calculate cell bounding box early for gradient
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of cell) {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      }
      const cellWidth = maxX - minX;
      const cellHeight = maxY - minY;

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.restore();

      // Inner gradient effect (radial darkening from edges)
      if (gradientEnabled && gradientOpacity > 0) {
        ctx.save();
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.clip();

        const gradientRadius = Math.max(cellWidth, cellHeight) * (1 - gradientSize * 0.5);

        // Create radial gradient from center (transparent) to edges (color with hue shift)
        const gradient = ctx.createRadialGradient(
          centroid[0], centroid[1], gradientRadius * 0.2,
          centroid[0], centroid[1], gradientRadius
        );
        const gradientColor = adjustHue(d.color, gradientHueShift);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, gradientColor);

        ctx.globalCompositeOperation = gradientBlendMode;
        ctx.globalAlpha = gradientOpacity;
        ctx.fillStyle = gradient;
        ctx.fillRect(minX, minY, cellWidth, cellHeight);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // Inner stroke with multiply blend (darkens the fill color at edges)
      if (innerStrokeWidth > 0 && innerStrokeOpacity > 0) {
        ctx.save();
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.clip();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = innerStrokeOpacity;
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = innerStrokeWidth;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // Outer stroke
      if (outerStrokeWidth > 0) {
        ctx.save();
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.strokeStyle = '#f8f8f6';
        ctx.lineWidth = outerStrokeWidth;
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = d.textColor || d.color;
      ctx.textAlign = 'center';

      // Get label settings (custom label and visibility)
      const labelSettings = getLabelSettings(i);
      const labelText = labelSettings.label;
      const visibility = labelSettings.visibility;

      // Skip if hidden
      if (visibility === 'hidden') {
        ctx.globalCompositeOperation = 'source-over';
        return;
      }

      const labelLines = labelText.split('\n');
      const shouldForce = visibility === 'force';

      // Tier 1: Large cells (>5%) or forced
      if (relSize > 0.05 || shouldForce) {
        // For forced small cells, use smaller font
        const fontSize = shouldForce && relSize <= 0.02 ? 11 : (relSize > 0.05 ? 26 : 13);
        const lineHeight = shouldForce && relSize <= 0.02 ? 13 : (relSize > 0.05 ? 30 : 15);
        const pctSize = shouldForce && relSize <= 0.02 ? 9 : (relSize > 0.05 ? 18 : 10);

        ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - (pctSize * 0.5);
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + fontSize * 0.6);
        }
      }
      // Tier 2: Medium cells (2-5%)
      else if (relSize > 0.02) {
        ctx.font = `600 13px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const lineHeight = 15;
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - 6;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 10px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 10px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 9);
        }
      }
      // Tier 3: Small cells (<2%) - label priority, percentage if fits
      else if (relSize > 0.005) {
        ctx.font = `500 11px system-ui, sans-serif`;

        if (labelLines.length > 1) {
          // Multi-line label with percentage below
          const lineHeight = 12;
          const totalHeight = labelLines.length * lineHeight;
          const pctOffset = 4;
          ctx.textBaseline = 'middle';
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - pctOffset;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 9px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + pctOffset);
        } else {
          const labelWidth = ctx.measureText(labelText).width;

          if (labelWidth < cellWidth - 8) {
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, centroid[0], centroid[1] - 4);
            ctx.font = `400 9px system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 6);
          } else {
            ctx.font = `500 9px system-ui, sans-serif`;
            const smallLabelWidth = ctx.measureText(labelText).width;
            if (smallLabelWidth < cellWidth - 4) {
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, centroid[0], centroid[1]);
            } else {
              ctx.textBaseline = 'middle';
              let truncated = labelText;
              while (truncated.length > 1 && ctx.measureText(truncated + '…').width >= cellWidth - 4) {
                truncated = truncated.slice(0, -1);
              }
              if (truncated.length > 1) {
                ctx.fillText(truncated + '…', centroid[0], centroid[1]);
              }
            }
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    });


  }, [cells, cellData, innerStrokeWidth, innerStrokeOpacity, outerStrokeWidth, gradientEnabled, gradientSize, gradientOpacity, gradientHueShift, gradientBlendMode, labelOverrides]);

  const toggleOrientation = () => {
    setIsLandscape(!isLandscape);
  };

  const handleExport = () => {
    const scale = 3;
    const exp = document.createElement('canvas');
    exp.width = W * scale;
    exp.height = H * scale;
    const ctx = exp.getContext('2d');
    ctx.scale(scale, scale);

    // Transparent background - don't fill

    const totalArea = (W - 2 * PAD) * (H - 2 * PAD);

    cells.forEach((cell, i) => {
      if (!cell || cell.length < 3) return;
      const d = cellData[i];

      const area = polygonArea(cell);
      const relSize = area / totalArea;
      const centroid = polygonCentroid(cell);

      // Adjust corner radius for small cells to avoid concave issues
      const adjustedRadius = relSize < 0.004 ? Math.min(CORNER_RADIUS, 6) :
                            relSize < 0.01 ? Math.min(CORNER_RADIUS, 10) :
                            CORNER_RADIUS;

      // Calculate cell bounding box for width checks
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of cell) {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      }
      const cellWidth = maxX - minX;
      const cellHeight = maxY - minY;

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.restore();

      // Inner gradient effect (radial darkening from edges)
      if (gradientEnabled && gradientOpacity > 0) {
        ctx.save();
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.clip();

        const gradientRadius = Math.max(cellWidth, cellHeight) * (1 - gradientSize * 0.5);

        // Create radial gradient from center (transparent) to edges (color with hue shift)
        const gradient = ctx.createRadialGradient(
          centroid[0], centroid[1], gradientRadius * 0.2,
          centroid[0], centroid[1], gradientRadius
        );
        const gradientColor = adjustHue(d.color, gradientHueShift);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, gradientColor);

        ctx.globalCompositeOperation = gradientBlendMode;
        ctx.globalAlpha = gradientOpacity;
        ctx.fillStyle = gradient;
        ctx.fillRect(minX, minY, cellWidth, cellHeight);
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // Inner stroke with multiply blend (darkens the fill color at edges)
      if (innerStrokeWidth > 0 && innerStrokeOpacity > 0) {
        ctx.save();
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.clip();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = innerStrokeOpacity;
        drawRoundedPath(ctx, cell, adjustedRadius);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = innerStrokeWidth;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.restore();
      }

      // Skip outer stroke for transparent export (it's meant for white background)

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = d.textColor || d.color;
      ctx.textAlign = 'center';

      // Get label settings (custom label and visibility)
      const labelSettings = getLabelSettings(i);
      const labelText = labelSettings.label;
      const visibility = labelSettings.visibility;

      // Skip if hidden
      if (visibility === 'hidden') {
        ctx.globalCompositeOperation = 'source-over';
        return;
      }

      const labelLines = labelText.split('\n');
      const shouldForce = visibility === 'force';

      // Tier 1: Large cells (>5%) or forced
      if (relSize > 0.05 || shouldForce) {
        const fontSize = shouldForce && relSize <= 0.02 ? 11 : (relSize > 0.05 ? 26 : 13);
        const lineHeight = shouldForce && relSize <= 0.02 ? 13 : (relSize > 0.05 ? 30 : 15);
        const pctSize = shouldForce && relSize <= 0.02 ? 9 : (relSize > 0.05 ? 18 : 10);

        ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - (pctSize * 0.5);
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 ${pctSize}px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + fontSize * 0.6);
        }
      }
      // Tier 2: Medium cells (2-5%)
      else if (relSize > 0.02) {
        ctx.font = `600 13px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const lineHeight = 15;
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - 6;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 10px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 10px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 9);
        }
      }
      // Tier 3: Small cells (<2%) - label priority, percentage if fits
      else if (relSize > 0.005) {
        ctx.font = `500 11px system-ui, sans-serif`;

        if (labelLines.length > 1) {
          const lineHeight = 12;
          const totalHeight = labelLines.length * lineHeight;
          const pctOffset = 4;
          ctx.textBaseline = 'middle';
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - pctOffset;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 9px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + pctOffset);
        } else {
          const labelWidth = ctx.measureText(labelText).width;

          if (labelWidth < cellWidth - 8) {
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, centroid[0], centroid[1] - 4);
            ctx.font = `400 9px system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 6);
          } else {
            ctx.font = `500 9px system-ui, sans-serif`;
            const smallLabelWidth = ctx.measureText(labelText).width;
            if (smallLabelWidth < cellWidth - 4) {
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, centroid[0], centroid[1]);
            } else {
              ctx.textBaseline = 'middle';
              let truncated = labelText;
              while (truncated.length > 1 && ctx.measureText(truncated + '…').width >= cellWidth - 4) {
                truncated = truncated.slice(0, -1);
              }
              if (truncated.length > 1) {
                ctx.fillText(truncated + '…', centroid[0], centroid[1]);
              }
            }
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    });

    const link = document.createElement('a');
    link.download = 'voronoi-chart.png';
    link.href = exp.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ border: '1px solid #ddd', maxWidth: '100%', height: 'auto', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 15,
            top: tooltip.y - 10,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}>
            <div style={{ fontWeight: 600 }}>{tooltip.label}</div>
            <div style={{ opacity: 0.8, fontSize: 11 }}>{tooltip.pct}% · {tooltip.cat}</div>
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 900,
        padding: '16px 20px',
        background: '#f5f5f5',
        borderRadius: 8,
        fontSize: 13
      }}>
        {/* Stroke Controls */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#333' }}>Stroke</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Inner width</span>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={innerStrokeWidth}
                onChange={(e) => setInnerStrokeWidth(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{innerStrokeWidth}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Inner opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={innerStrokeOpacity}
                onChange={(e) => setInnerStrokeOpacity(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(innerStrokeOpacity * 100).toFixed(0)}%</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Outer width</span>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={outerStrokeWidth}
                onChange={(e) => setOuterStrokeWidth(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{outerStrokeWidth}</span>
            </label>
          </div>
        </div>

        {/* Gradient Controls */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontWeight: 600, color: '#333' }}>Inner Gradient</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={gradientEnabled}
                onChange={(e) => setGradientEnabled(e.target.checked)}
              />
              <span style={{ color: '#555' }}>{gradientEnabled ? 'On' : 'Off'}</span>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: gradientEnabled ? 1 : 0.4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Size</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gradientSize}
                onChange={(e) => setGradientSize(Number(e.target.value))}
                disabled={!gradientEnabled}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(gradientSize * 100).toFixed(0)}%</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Opacity</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gradientOpacity}
                onChange={(e) => setGradientOpacity(Number(e.target.value))}
                disabled={!gradientEnabled}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(gradientOpacity * 100).toFixed(0)}%</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Hue shift</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={gradientHueShift}
                onChange={(e) => setGradientHueShift(Number(e.target.value))}
                disabled={!gradientEnabled}
                style={{ flex: 1 }}
              />
              <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{gradientHueShift}°</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ minWidth: 100, color: '#555' }}>Blend mode</span>
              <select
                value={gradientBlendMode}
                onChange={(e) => setGradientBlendMode(e.target.value)}
                disabled={!gradientEnabled}
                style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
              >
                <option value="soft-light">Soft Light</option>
                <option value="overlay">Overlay</option>
                <option value="multiply">Multiply</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Label Editor Toggle */}
      <button
        onClick={() => setShowLabelEditor(!showLabelEditor)}
        style={{
          padding: '8px 16px',
          cursor: 'pointer',
          background: showLabelEditor ? '#333' : '#fff',
          color: showLabelEditor ? '#fff' : '#333',
          border: '1px solid #333',
          borderRadius: 4
        }}
      >
        {showLabelEditor ? 'Hide Label Editor' : 'Edit Labels'}
      </button>

      {/* Label Editor Panel */}
      {showLabelEditor && (
        <div style={{
          width: '100%',
          maxWidth: 900,
          padding: '16px 20px',
          background: '#f5f5f5',
          borderRadius: 8,
          fontSize: 13,
          maxHeight: 400,
          overflowY: 'auto'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#333' }}>Label Overrides</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DATA.map((item, index) => {
              const override = labelOverrides[index] || {};
              const currentVisibility = override.visibility || 'normal';
              return (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px',
                  gap: 10,
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: '#fff',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: CATEGORIES[item.cat].color,
                      flexShrink: 0
                    }} />
                    <input
                      type="text"
                      placeholder={item.displayLabel || item.label}
                      value={override.customLabel || ''}
                      onChange={(e) => updateLabelOverride(index, 'customLabel', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: '1px solid #ddd',
                        borderRadius: 3,
                        fontSize: 12
                      }}
                    />
                    <span style={{ color: '#888', fontSize: 11, minWidth: 35 }}>{cellData[index]?.pct || ''}%</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['force', 'normal', 'hidden'].map((vis) => (
                      <button
                        key={vis}
                        onClick={() => updateLabelOverride(index, 'visibility', vis)}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          fontSize: 10,
                          cursor: 'pointer',
                          background: currentVisibility === vis ? '#333' : '#f0f0f0',
                          color: currentVisibility === vis ? '#fff' : '#555',
                          border: 'none',
                          borderRadius: 3,
                          textTransform: 'capitalize'
                        }}
                      >
                        {vis === 'force' ? 'Show' : vis === 'hidden' ? 'Hide' : 'Auto'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: '#666' }}>{status}</span>
        <button onClick={toggleOrientation} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {isLandscape ? '↔ Landscape' : '↕ Portrait'}
        </button>
        <button onClick={generate} style={{ padding: '8px 16px', cursor: 'pointer' }}>Regenerate</button>
        <button onClick={handleExport} style={{ padding: '8px 16px', cursor: 'pointer' }}>Export 3x PNG</button>
      </div>
    </div>
  );
}
