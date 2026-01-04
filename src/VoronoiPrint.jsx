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

export default function VoronoiPrint() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Initializing...');
  const [cells, setCells] = useState([]);
  const [cellData, setCellData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [isLandscape, setIsLandscape] = useState(true);

  const W = isLandscape ? 1200 : 850;
  const H = isLandscape ? 850 : 1200;

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

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.strokeStyle = '#f8f8f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = d.textColor || d.color;
      ctx.textAlign = 'center';

      // Calculate cell bounding box
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of cell) {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
        minY = Math.min(minY, p[1]);
        maxY = Math.max(maxY, p[1]);
      }
      const cellWidth = maxX - minX;
      const cellHeight = maxY - minY;

      // Tier 1: Large cells (>5%)
      if (relSize > 0.05) {
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');
        ctx.font = `600 26px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const lineHeight = 30;
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - 10;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 18px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 18px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 16);
        }
      }
      // Tier 2: Medium cells (2-5%)
      else if (relSize > 0.02) {
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');
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
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');

        ctx.font = `500 11px system-ui, sans-serif`;

        if (labelLines.length > 1) {
          // Multi-line label with percentage below
          const lineHeight = 12;
          const totalHeight = labelLines.length * lineHeight;
          const pctOffset = 4; // Space between last label line and percentage
          ctx.textBaseline = 'middle';
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - pctOffset;
            ctx.fillText(line, centroid[0], y);
          });
          // Add percentage below multi-line label
          ctx.font = `400 9px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + pctOffset);
        } else {
          const labelWidth = ctx.measureText(labelText).width;

          if (labelWidth < cellWidth - 8) {
            // Label fits - show label centered, percentage below (no width check needed)
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, centroid[0], centroid[1] - 4);

            ctx.font = `400 9px system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 6);
          } else {
            // Label doesn't fit at normal size - try smaller font for name
            ctx.font = `500 9px system-ui, sans-serif`;
            const smallLabelWidth = ctx.measureText(labelText).width;
            if (smallLabelWidth < cellWidth - 4) {
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, centroid[0], centroid[1]);
            } else {
              // Still doesn't fit - show truncated name
              ctx.textBaseline = 'middle';
              let truncated = labelText;
              while (truncated.length > 1 && ctx.measureText(truncated + '…').width >= cellWidth - 4) {
                truncated = truncated.slice(0, -1);
              }
              if (truncated.length > 1) {
                ctx.fillText(truncated + '…', centroid[0], centroid[1]);
              }
              // Only if name is too short to show anything meaningful, skip it
            }
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalCompositeOperation = 'source-over';
    });


  }, [cells, cellData]);

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

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.fillStyle = d.color;
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedPath(ctx, cell, adjustedRadius);
      ctx.strokeStyle = '#f8f8f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = d.textColor || d.color;
      ctx.textAlign = 'center';

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

      // Use same thresholds as preview for consistency
      // Tier 1: Large cells (>5%)
      if (relSize > 0.05) {
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');
        ctx.font = `600 26px system-ui, sans-serif`;
        ctx.textBaseline = 'middle';

        if (labelLines.length > 1) {
          const lineHeight = 30;
          const totalHeight = labelLines.length * lineHeight;
          labelLines.forEach((line, idx) => {
            const y = centroid[1] - totalHeight / 2 + lineHeight / 2 + idx * lineHeight - 10;
            ctx.fillText(line, centroid[0], y);
          });
          ctx.font = `400 18px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2);
        } else {
          ctx.fillText(labelText, centroid[0], centroid[1]);
          ctx.font = `400 18px system-ui, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 16);
        }
      }
      // Tier 2: Medium cells (2-5%)
      else if (relSize > 0.02) {
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');
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
        const labelText = d.displayLabel || d.label;
        const labelLines = labelText.split('\n');

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
          // Add percentage below multi-line label
          ctx.font = `400 9px system-ui, sans-serif`;
          ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + totalHeight / 2 + pctOffset);
        } else {
          const labelWidth = ctx.measureText(labelText).width;

          if (labelWidth < cellWidth - 8) {
            // Label fits - show label centered, percentage below
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, centroid[0], centroid[1] - 4);

            ctx.font = `400 9px system-ui, sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(`${d.pct}%`, centroid[0], centroid[1] + 6);
          } else {
            // Label doesn't fit at normal size - try smaller font for name
            ctx.font = `500 9px system-ui, sans-serif`;
            const smallLabelWidth = ctx.measureText(labelText).width;
            if (smallLabelWidth < cellWidth - 4) {
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, centroid[0], centroid[1]);
            } else {
              // Still doesn't fit - show truncated name
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
