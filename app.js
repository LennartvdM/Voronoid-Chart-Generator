// Pastel color palette - 12 tasteful options
const PASTEL_COLORS = [
    '#FFB3BA', // Light Pink
    '#FFDFBA', // Light Peach
    '#FFFFBA', // Light Yellow
    '#BAFFC9', // Light Mint
    '#BAE1FF', // Light Blue
    '#E0BBE4', // Light Lavender
    '#FEC8D8', // Rose Pink
    '#D4A5A5', // Dusty Rose
    '#A8D8EA', // Sky Blue
    '#AA96DA', // Soft Purple
    '#FCBAD3', // Blush Pink
    '#C9E4DE', // Seafoam
];

// Application State
const state = {
    dataPoints: [],
    subcategories: [
        { id: 1, name: 'Category A', color: PASTEL_COLORS[4] },
        { id: 2, name: 'Category B', color: PASTEL_COLORS[0] },
    ],
    nextDataPointId: 1,
    nextSubcategoryId: 3,
    currentColorTarget: null,
};

// DOM Elements
const dataInputsContainer = document.getElementById('data-inputs');
const subcategoryListContainer = document.getElementById('subcategory-list');
const addPointBtn = document.getElementById('add-point');
const addSubcategoryBtn = document.getElementById('add-subcategory');
const generateChartBtn = document.getElementById('generate-chart');
const exportSvgBtn = document.getElementById('export-svg');
const colorModal = document.getElementById('color-modal');
const colorPalette = document.getElementById('color-palette');
const legendContainer = document.getElementById('legend');
const voronoiChart = document.getElementById('voronoi-chart');

// Initialize
function init() {
    renderColorPalette();
    renderSubcategories();
    addDataPoint(); // Start with one empty data point
    addDataPoint(); // Add a second one

    // Event Listeners
    addPointBtn.addEventListener('click', addDataPoint);
    addSubcategoryBtn.addEventListener('click', addSubcategory);
    generateChartBtn.addEventListener('click', generateChart);
    exportSvgBtn.addEventListener('click', exportSVG);

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', closeColorModal);
    colorModal.addEventListener('click', (e) => {
        if (e.target === colorModal) closeColorModal();
    });

    renderEmptyState();
}

// Render color palette in modal
function renderColorPalette() {
    colorPalette.innerHTML = PASTEL_COLORS.map((color, index) => `
        <button class="palette-color" style="background-color: ${color}" data-color="${color}" data-index="${index}"></button>
    `).join('');

    colorPalette.addEventListener('click', (e) => {
        const btn = e.target.closest('.palette-color');
        if (!btn) return;
        selectColor(btn.dataset.color);
    });
}

// Data Point Management
function addDataPoint() {
    const id = state.nextDataPointId++;
    state.dataPoints.push({
        id,
        name: '',
        percentage: '',
        subcategoryId: state.subcategories[0]?.id || null,
    });
    renderDataPoints();
}

function removeDataPoint(id) {
    state.dataPoints = state.dataPoints.filter(dp => dp.id !== id);
    renderDataPoints();
}

function updateDataPoint(id, field, value) {
    const dp = state.dataPoints.find(d => d.id === id);
    if (dp) {
        if (field === 'percentage') {
            value = Math.max(0, Math.min(100, parseFloat(value) || 0));
        }
        if (field === 'subcategoryId') {
            value = parseInt(value, 10);
        }
        dp[field] = value;
    }
}

function renderDataPoints() {
    dataInputsContainer.innerHTML = state.dataPoints.map((dp, index) => `
        <div class="data-point" data-id="${dp.id}">
            <div class="data-point-header">
                <span class="data-point-number">#${index + 1}</span>
                <button class="btn-remove" onclick="removeDataPoint(${dp.id})">&times;</button>
            </div>
            <div class="data-point-fields">
                <div class="field-row">
                    <div class="input-group">
                        <label>Name</label>
                        <input type="text" placeholder="e.g., Germany" value="${dp.name}"
                               onchange="updateDataPoint(${dp.id}, 'name', this.value)">
                    </div>
                    <div class="input-group" style="max-width: 80px;">
                        <label>Percent</label>
                        <input type="number" placeholder="%" min="0" max="100" step="0.1" value="${dp.percentage}"
                               onchange="updateDataPoint(${dp.id}, 'percentage', this.value)">
                    </div>
                </div>
                <div class="input-group">
                    <label>Subcategory</label>
                    <select onchange="updateDataPoint(${dp.id}, 'subcategoryId', this.value)">
                        ${state.subcategories.map(sub => `
                            <option value="${sub.id}" ${dp.subcategoryId === sub.id ? 'selected' : ''}>
                                ${sub.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            </div>
        </div>
    `).join('');
}

// Subcategory Management
function addSubcategory() {
    const id = state.nextSubcategoryId++;
    const colorIndex = (state.subcategories.length) % PASTEL_COLORS.length;
    state.subcategories.push({
        id,
        name: `Category ${String.fromCharCode(65 + state.subcategories.length)}`,
        color: PASTEL_COLORS[colorIndex],
    });
    renderSubcategories();
    renderDataPoints(); // Update dropdowns
}

function removeSubcategory(id) {
    if (state.subcategories.length <= 1) return; // Keep at least one
    state.subcategories = state.subcategories.filter(s => s.id !== id);
    // Reassign orphaned data points
    state.dataPoints.forEach(dp => {
        if (!state.subcategories.find(s => s.id === dp.subcategoryId)) {
            dp.subcategoryId = state.subcategories[0].id;
        }
    });
    renderSubcategories();
    renderDataPoints();
}

function updateSubcategoryName(id, name) {
    const sub = state.subcategories.find(s => s.id === id);
    if (sub) sub.name = name;
    renderDataPoints(); // Update dropdowns
}

function openColorPicker(subcategoryId) {
    state.currentColorTarget = subcategoryId;
    colorModal.classList.remove('hidden');
}

function closeColorModal() {
    colorModal.classList.add('hidden');
    state.currentColorTarget = null;
}

function selectColor(color) {
    if (state.currentColorTarget !== null) {
        const sub = state.subcategories.find(s => s.id === state.currentColorTarget);
        if (sub) {
            sub.color = color;
            renderSubcategories();
        }
    }
    closeColorModal();
}

function renderSubcategories() {
    subcategoryListContainer.innerHTML = state.subcategories.map(sub => `
        <div class="subcategory-item" data-id="${sub.id}">
            <button class="color-picker-btn" style="background-color: ${sub.color}"
                    onclick="openColorPicker(${sub.id})"></button>
            <input type="text" value="${sub.name}"
                   onchange="updateSubcategoryName(${sub.id}, this.value)">
            ${state.subcategories.length > 1 ?
                `<button class="btn-remove" onclick="removeSubcategory(${sub.id})">&times;</button>` : ''}
        </div>
    `).join('');
}

// Make functions globally accessible for inline handlers
window.removeDataPoint = removeDataPoint;
window.updateDataPoint = updateDataPoint;
window.removeSubcategory = removeSubcategory;
window.updateSubcategoryName = updateSubcategoryName;
window.openColorPicker = openColorPicker;

// Empty State
function renderEmptyState() {
    voronoiChart.innerHTML = `
        <foreignObject x="0" y="0" width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" class="empty-state">
                <div class="empty-state-icon">&#9724;</div>
                <p>Add data points and click "Generate Chart"</p>
            </div>
        </foreignObject>
    `;
}

// Weighted Voronoi Generation using Lloyd's relaxation with weighted centroids
function generateChart() {
    // Validate and prepare data
    const validPoints = state.dataPoints.filter(dp => dp.name && dp.percentage > 0);

    if (validPoints.length < 2) {
        alert('Please add at least 2 data points with names and percentages.');
        return;
    }

    // Normalize percentages
    const totalPercentage = validPoints.reduce((sum, dp) => sum + parseFloat(dp.percentage), 0);
    const normalizedData = validPoints.map(dp => ({
        ...dp,
        weight: parseFloat(dp.percentage) / totalPercentage,
        subcategory: state.subcategories.find(s => s.id === dp.subcategoryId),
    }));

    // Get SVG dimensions
    const container = document.getElementById('voronoi-container');
    const width = container.clientWidth - 40;
    const height = container.clientHeight - 40;

    // Generate weighted Voronoi
    const cells = computeWeightedVoronoi(normalizedData, width, height);

    // Render
    renderVoronoiChart(cells, width, height);
    renderLegend();
}

// Compute weighted Voronoi using iterative relaxation
function computeWeightedVoronoi(data, width, height) {
    const n = data.length;
    const padding = 20;
    const innerWidth = width - 2 * padding;
    const innerHeight = height - 2 * padding;
    const totalArea = innerWidth * innerHeight;

    // Initialize points with random positions
    let points = data.map((d, i) => ({
        ...d,
        x: padding + Math.random() * innerWidth,
        y: padding + Math.random() * innerHeight,
        targetArea: d.weight * totalArea,
    }));

    // Lloyd's relaxation with weighted centroids
    const iterations = 100;

    for (let iter = 0; iter < iterations; iter++) {
        // Compute Voronoi diagram
        const delaunay = createDelaunay(points);
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        // Calculate centroids and adjust positions
        for (let i = 0; i < n; i++) {
            const cell = voronoi.cellPolygon(i);
            if (!cell) continue;

            const cellArea = polygonArea(cell);
            const centroid = polygonCentroid(cell);

            if (centroid && cellArea > 0) {
                // Calculate area ratio for adjustment
                const areaRatio = points[i].targetArea / cellArea;
                const adjustmentStrength = 0.3;

                // Move toward centroid with weight-based adjustment
                const dx = centroid[0] - points[i].x;
                const dy = centroid[1] - points[i].y;

                // Larger weights push outward, smaller pull inward
                const factor = adjustmentStrength * (areaRatio > 1 ? 0.8 : 1.2);

                points[i].x += dx * factor;
                points[i].y += dy * factor;

                // Keep within bounds
                points[i].x = Math.max(padding, Math.min(width - padding, points[i].x));
                points[i].y = Math.max(padding, Math.min(height - padding, points[i].y));
            }
        }
    }

    // Final Voronoi computation
    const delaunay = createDelaunay(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    // Extract cell polygons
    return points.map((point, i) => {
        const cell = voronoi.cellPolygon(i);
        return {
            ...point,
            polygon: cell || [],
            area: cell ? polygonArea(cell) : 0,
        };
    });
}

// Simple Delaunay triangulation implementation
function createDelaunay(points) {
    const coords = new Float64Array(points.length * 2);
    for (let i = 0; i < points.length; i++) {
        coords[i * 2] = points[i].x;
        coords[i * 2 + 1] = points[i].y;
    }

    return new Delaunay(coords);
}

// Delaunay triangulation class (simplified implementation)
class Delaunay {
    constructor(coords) {
        this.coords = coords;
        this.n = coords.length / 2;
        this._triangulate();
    }

    _triangulate() {
        const n = this.n;
        if (n < 3) {
            this.triangles = [];
            this.halfedges = [];
            return;
        }

        // Find bounding box center
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < n; i++) {
            const x = this.coords[i * 2];
            const y = this.coords[i * 2 + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        // Sort points by distance from center
        const indices = new Uint32Array(n);
        const dists = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            indices[i] = i;
            const dx = this.coords[i * 2] - cx;
            const dy = this.coords[i * 2 + 1] - cy;
            dists[i] = dx * dx + dy * dy;
        }

        // Simple incremental triangulation
        this.triangles = [];
        this.halfedges = [];

        // Use a simple algorithm for small point sets
        if (n <= 10) {
            this._simpleTriangulate();
        } else {
            this._incrementalTriangulate(indices, dists, cx, cy);
        }
    }

    _simpleTriangulate() {
        const n = this.n;
        const triangles = [];

        // Convex hull based triangulation for small sets
        const hull = this._convexHull();
        if (hull.length < 3) return;

        // Fan triangulation from first hull point
        for (let i = 1; i < hull.length - 1; i++) {
            triangles.push(hull[0], hull[i], hull[i + 1]);
        }

        this.triangles = new Uint32Array(triangles);
    }

    _incrementalTriangulate(indices, dists, cx, cy) {
        // Sort by distance
        for (let i = 0; i < indices.length - 1; i++) {
            for (let j = i + 1; j < indices.length; j++) {
                if (dists[indices[j]] < dists[indices[i]]) {
                    const tmp = indices[i];
                    indices[i] = indices[j];
                    indices[j] = tmp;
                }
            }
        }

        // Start with convex hull
        const hull = this._convexHull();
        const triangles = [];

        // Fan triangulation
        for (let i = 1; i < hull.length - 1; i++) {
            triangles.push(hull[0], hull[i], hull[i + 1]);
        }

        this.triangles = new Uint32Array(triangles);
    }

    _convexHull() {
        const n = this.n;
        if (n < 3) return Array.from({ length: n }, (_, i) => i);

        const points = [];
        for (let i = 0; i < n; i++) {
            points.push({ x: this.coords[i * 2], y: this.coords[i * 2 + 1], i });
        }

        // Sort by x, then by y
        points.sort((a, b) => a.x - b.x || a.y - b.y);

        const cross = (o, a, b) =>
            (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

        const lower = [];
        for (const p of points) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
                lower.pop();
            }
            lower.push(p);
        }

        const upper = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
                upper.pop();
            }
            upper.push(p);
        }

        lower.pop();
        upper.pop();

        return [...lower, ...upper].map(p => p.i);
    }

    voronoi(bounds) {
        return new Voronoi(this, bounds);
    }
}

// Voronoi diagram class
class Voronoi {
    constructor(delaunay, bounds) {
        this.delaunay = delaunay;
        this.bounds = bounds;
        this.circumcenters = this._computeCircumcenters();
    }

    _computeCircumcenters() {
        const { coords, triangles } = this.delaunay;
        const centers = [];

        for (let i = 0; i < triangles.length; i += 3) {
            const i0 = triangles[i];
            const i1 = triangles[i + 1];
            const i2 = triangles[i + 2];

            const x0 = coords[i0 * 2], y0 = coords[i0 * 2 + 1];
            const x1 = coords[i1 * 2], y1 = coords[i1 * 2 + 1];
            const x2 = coords[i2 * 2], y2 = coords[i2 * 2 + 1];

            const center = this._circumcenter(x0, y0, x1, y1, x2, y2);
            centers.push(center);
        }

        return centers;
    }

    _circumcenter(ax, ay, bx, by, cx, cy) {
        const dx = bx - ax;
        const dy = by - ay;
        const ex = cx - ax;
        const ey = cy - ay;

        const bl = dx * dx + dy * dy;
        const cl = ex * ex + ey * ey;
        const d = 2 * (dx * ey - dy * ex);

        if (Math.abs(d) < 1e-10) {
            return [(ax + bx + cx) / 3, (ay + by + cy) / 3];
        }

        const x = ax + (ey * bl - dy * cl) / d;
        const y = ay + (dx * cl - ex * bl) / d;

        return [x, y];
    }

    cellPolygon(i) {
        const { coords } = this.delaunay;
        const n = this.delaunay.n;
        const [xmin, ymin, xmax, ymax] = this.bounds;

        const x = coords[i * 2];
        const y = coords[i * 2 + 1];

        // Calculate angles to all other points
        const angles = [];
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const ox = coords[j * 2];
            const oy = coords[j * 2 + 1];
            const angle = Math.atan2(oy - y, ox - x);
            angles.push({ j, angle, ox, oy });
        }

        // Sort by angle
        angles.sort((a, b) => a.angle - b.angle);

        // Calculate perpendicular bisectors and their intersections
        const vertices = [];
        const bisectors = angles.map(({ ox, oy }) => {
            const mx = (x + ox) / 2;
            const my = (y + oy) / 2;
            const dx = oy - y;
            const dy = x - ox;
            const len = Math.sqrt(dx * dx + dy * dy);
            return { mx, my, dx: dx / len, dy: dy / len };
        });

        // Calculate cell vertices from bisector intersections
        for (let j = 0; j < bisectors.length; j++) {
            const b1 = bisectors[j];
            const b2 = bisectors[(j + 1) % bisectors.length];

            const intersection = this._lineIntersection(
                b1.mx, b1.my, b1.mx + b1.dx * 1000, b1.my + b1.dy * 1000,
                b2.mx, b2.my, b2.mx + b2.dx * 1000, b2.my + b2.dy * 1000
            );

            if (intersection) {
                vertices.push(intersection);
            }
        }

        if (vertices.length < 3) {
            // Fallback: create a polygon based on bounds
            return this._clipToBounds(x, y, bisectors);
        }

        // Clip to bounds
        return this._clipPolygonToBounds(vertices);
    }

    _lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

        return [
            x1 + t * (x2 - x1),
            y1 + t * (y2 - y1)
        ];
    }

    _clipToBounds(px, py, bisectors) {
        const [xmin, ymin, xmax, ymax] = this.bounds;
        const vertices = [];

        // Create a large initial polygon (rectangle)
        let polygon = [
            [xmin, ymin],
            [xmax, ymin],
            [xmax, ymax],
            [xmin, ymax]
        ];

        // Clip by each bisector
        for (const b of bisectors) {
            polygon = this._clipPolygonByLine(polygon, b.mx, b.my, b.dx, b.dy, px, py);
            if (polygon.length < 3) break;
        }

        return polygon.length >= 3 ? polygon : null;
    }

    _clipPolygonByLine(polygon, lx, ly, ldx, ldy, keepX, keepY) {
        // Determine which side of the line to keep
        const keepSide = (keepX - lx) * (-ldy) + (keepY - ly) * ldx;

        const result = [];
        for (let i = 0; i < polygon.length; i++) {
            const curr = polygon[i];
            const next = polygon[(i + 1) % polygon.length];

            const currSide = (curr[0] - lx) * (-ldy) + (curr[1] - ly) * ldx;
            const nextSide = (next[0] - lx) * (-ldy) + (next[1] - ly) * ldx;

            const currInside = currSide * keepSide >= 0;
            const nextInside = nextSide * keepSide >= 0;

            if (currInside) {
                result.push(curr);
            }

            if (currInside !== nextInside) {
                // Add intersection point
                const t = currSide / (currSide - nextSide);
                result.push([
                    curr[0] + t * (next[0] - curr[0]),
                    curr[1] + t * (next[1] - curr[1])
                ]);
            }
        }

        return result;
    }

    _clipPolygonToBounds(vertices) {
        const [xmin, ymin, xmax, ymax] = this.bounds;

        let polygon = vertices;

        // Clip by each bound
        const bounds = [
            { lx: xmin, ly: 0, dx: 0, dy: 1, keepX: xmax, keepY: 0 }, // left
            { lx: xmax, ly: 0, dx: 0, dy: 1, keepX: xmin, keepY: 0 }, // right
            { lx: 0, ly: ymin, dx: 1, dy: 0, keepX: 0, keepY: ymax }, // top
            { lx: 0, ly: ymax, dx: 1, dy: 0, keepX: 0, keepY: ymin }, // bottom
        ];

        for (const b of bounds) {
            if (polygon.length < 3) break;
            polygon = this._clipPolygonByLine(polygon, b.lx, b.ly, b.dx, b.dy, b.keepX, b.keepY);
        }

        return polygon.length >= 3 ? polygon : null;
    }
}

// Geometry utilities
function polygonArea(polygon) {
    if (!polygon || polygon.length < 3) return 0;

    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        area += (polygon[j][0] + polygon[i][0]) * (polygon[j][1] - polygon[i][1]);
    }
    return Math.abs(area / 2);
}

function polygonCentroid(polygon) {
    if (!polygon || polygon.length < 3) return null;

    let cx = 0, cy = 0, area = 0;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const cross = polygon[j][0] * polygon[i][1] - polygon[i][0] * polygon[j][1];
        cx += (polygon[j][0] + polygon[i][0]) * cross;
        cy += (polygon[j][1] + polygon[i][1]) * cross;
        area += cross;
    }

    area /= 2;
    if (Math.abs(area) < 1e-10) return null;

    cx /= (6 * area);
    cy /= (6 * area);

    return [cx, cy];
}

// Render the Voronoi chart
function renderVoronoiChart(cells, width, height) {
    voronoiChart.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const cellsHTML = cells.map((cell, i) => {
        if (!cell.polygon || cell.polygon.length < 3) return '';

        const pathD = `M ${cell.polygon.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`;
        const color = cell.subcategory?.color || PASTEL_COLORS[0];
        const centroid = polygonCentroid(cell.polygon);

        // Determine if we have enough space for labels
        const area = polygonArea(cell.polygon);
        const showLabel = area > 2000;
        const showPercentage = area > 1000;

        let labelHTML = '';
        if (centroid && showLabel) {
            labelHTML = `
                <text class="cell-label" x="${centroid[0]}" y="${centroid[1] - 6}">${cell.name}</text>
                ${showPercentage ? `<text class="cell-percentage" x="${centroid[0]}" y="${centroid[1] + 10}">${(cell.weight * 100).toFixed(1)}%</text>` : ''}
            `;
        }

        return `
            <g class="cell-group">
                <path class="voronoi-cell" d="${pathD}" fill="${color}" data-name="${cell.name}" data-percentage="${(cell.weight * 100).toFixed(1)}"/>
                ${labelHTML}
            </g>
        `;
    }).join('');

    voronoiChart.innerHTML = cellsHTML;
}

// Render legend
function renderLegend() {
    const usedSubcategories = new Set(
        state.dataPoints
            .filter(dp => dp.name && dp.percentage > 0)
            .map(dp => dp.subcategoryId)
    );

    legendContainer.innerHTML = state.subcategories
        .filter(sub => usedSubcategories.has(sub.id))
        .map(sub => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${sub.color}"></div>
                <span class="legend-label">${sub.name}</span>
            </div>
        `).join('');
}

// Export SVG
function exportSVG() {
    const svgContent = voronoiChart.outerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'voronoi-chart.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
