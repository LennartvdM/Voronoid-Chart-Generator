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
let dataInputsContainer, subcategoryListContainer, addPointBtn, addSubcategoryBtn;
let generateChartBtn, exportSvgBtn, colorModal, colorPalette, legendContainer, voronoiChart;

// Initialize
function init() {
    dataInputsContainer = document.getElementById('data-inputs');
    subcategoryListContainer = document.getElementById('subcategory-list');
    addPointBtn = document.getElementById('add-point');
    addSubcategoryBtn = document.getElementById('add-subcategory');
    generateChartBtn = document.getElementById('generate-chart');
    exportSvgBtn = document.getElementById('export-svg');
    colorModal = document.getElementById('color-modal');
    colorPalette = document.getElementById('color-palette');
    legendContainer = document.getElementById('legend');
    voronoiChart = document.getElementById('voronoi-chart');

    renderColorPalette();
    renderSubcategories();
    addDataPoint();
    addDataPoint();

    addPointBtn.addEventListener('click', addDataPoint);
    addSubcategoryBtn.addEventListener('click', addSubcategory);
    generateChartBtn.addEventListener('click', generateChart);
    exportSvgBtn.addEventListener('click', exportSVG);

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
    renderDataPoints();
}

function removeSubcategory(id) {
    if (state.subcategories.length <= 1) return;
    state.subcategories = state.subcategories.filter(s => s.id !== id);
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
    renderDataPoints();
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

// Make functions globally accessible
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

// Generate Chart
function generateChart() {
    const validPoints = state.dataPoints.filter(dp => dp.name && dp.percentage > 0);

    if (validPoints.length < 2) {
        alert('Please add at least 2 data points with names and percentages.');
        return;
    }

    const totalPercentage = validPoints.reduce((sum, dp) => sum + parseFloat(dp.percentage), 0);
    const normalizedData = validPoints.map(dp => ({
        ...dp,
        weight: parseFloat(dp.percentage) / totalPercentage,
        subcategory: state.subcategories.find(s => s.id === dp.subcategoryId),
    }));

    const container = document.getElementById('voronoi-container');
    const width = container.clientWidth - 40;
    const height = container.clientHeight - 40;

    const cells = computeWeightedVoronoi(normalizedData, width, height);
    renderVoronoiChart(cells, width, height);
    renderLegend();
}

// Weighted Voronoi using iterative capacity-constrained relaxation
function computeWeightedVoronoi(data, width, height) {
    const n = data.length;
    const totalArea = width * height;
    const margin = 30;

    // Initialize points with strategic positions based on weight
    let points = initializePoints(data, width, height, margin);

    // Run weighted Lloyd relaxation
    const maxIterations = 150;

    for (let iter = 0; iter < maxIterations; iter++) {
        const delaunay = d3.Delaunay.from(points.map(p => [p.x, p.y]));
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        let maxMove = 0;

        for (let i = 0; i < n; i++) {
            const cell = voronoi.cellPolygon(i);
            if (!cell) continue;

            const currentArea = polygonArea(cell);
            const targetArea = points[i].weight * totalArea;
            const centroid = polygonCentroid(cell);

            if (!centroid || currentArea === 0) continue;

            // Calculate how much we need to adjust
            const areaRatio = targetArea / currentArea;

            // Move toward centroid, with adjustment based on area ratio
            const dx = centroid[0] - points[i].x;
            const dy = centroid[1] - points[i].y;

            // Adaptive step size - larger steps early, smaller later
            const baseStep = 0.5 * (1 - iter / maxIterations) + 0.1;

            // If cell is too small, move away from neighbors (toward edges)
            // If cell is too large, move toward center/neighbors
            let stepMultiplier;
            if (areaRatio > 1.1) {
                // Cell too small - need more space, move toward emptier areas
                stepMultiplier = baseStep * Math.min(areaRatio, 2);
            } else if (areaRatio < 0.9) {
                // Cell too large - need less space, move toward neighbors
                stepMultiplier = baseStep * Math.max(areaRatio, 0.5);
            } else {
                stepMultiplier = baseStep;
            }

            const newX = points[i].x + dx * stepMultiplier;
            const newY = points[i].y + dy * stepMultiplier;

            // Keep within bounds with margin
            points[i].x = Math.max(margin, Math.min(width - margin, newX));
            points[i].y = Math.max(margin, Math.min(height - margin, newY));

            maxMove = Math.max(maxMove, Math.sqrt(dx * dx + dy * dy) * stepMultiplier);
        }

        // Apply repulsion between points that need more space
        applyWeightedRepulsion(points, width, height, totalArea, margin);

        // Early termination if converged
        if (maxMove < 0.5 && iter > 50) break;
    }

    // Final computation
    const delaunay = d3.Delaunay.from(points.map(p => [p.x, p.y]));
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    return points.map((point, i) => {
        const cell = voronoi.cellPolygon(i);
        return {
            ...point,
            polygon: cell || [],
            area: cell ? polygonArea(cell) : 0,
        };
    });
}

// Initialize points with positions roughly proportional to their weights
function initializePoints(data, width, height, margin) {
    const n = data.length;

    // Sort by weight descending
    const sorted = data.map((d, i) => ({ ...d, originalIndex: i }))
                       .sort((a, b) => b.weight - a.weight);

    const points = new Array(n);
    const usableWidth = width - 2 * margin;
    const usableHeight = height - 2 * margin;

    // Place points using a weighted spiral/grid pattern
    if (n <= 4) {
        // For small n, use strategic corners/center placement
        const positions = [
            [0.5, 0.5],  // center
            [0.25, 0.25], [0.75, 0.75], [0.25, 0.75], [0.75, 0.25]
        ];
        sorted.forEach((d, i) => {
            const pos = positions[i] || [Math.random(), Math.random()];
            points[d.originalIndex] = {
                ...d,
                x: margin + pos[0] * usableWidth,
                y: margin + pos[1] * usableHeight,
            };
        });
    } else {
        // For larger n, use golden angle spiral
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        sorted.forEach((d, i) => {
            const r = Math.sqrt((i + 0.5) / n) * Math.min(usableWidth, usableHeight) * 0.45;
            const theta = i * goldenAngle;
            points[d.originalIndex] = {
                ...d,
                x: width / 2 + r * Math.cos(theta),
                y: height / 2 + r * Math.sin(theta),
            };
        });
    }

    return points;
}

// Apply repulsion to help cells reach their target areas
function applyWeightedRepulsion(points, width, height, totalArea, margin) {
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const targetRadius = Math.sqrt(points[i].weight * totalArea / Math.PI);

        for (let j = i + 1; j < n; j++) {
            const dx = points[j].x - points[i].x;
            const dy = points[j].y - points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist === 0) continue;

            const targetRadiusJ = Math.sqrt(points[j].weight * totalArea / Math.PI);
            const idealDist = (targetRadius + targetRadiusJ) * 0.8;

            if (dist < idealDist) {
                const force = (idealDist - dist) / idealDist * 0.1;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                // Weight the push by relative target areas
                const totalWeight = points[i].weight + points[j].weight;
                const ratioI = points[j].weight / totalWeight;
                const ratioJ = points[i].weight / totalWeight;

                points[i].x -= fx * ratioI;
                points[i].y -= fy * ratioI;
                points[j].x += fx * ratioJ;
                points[j].y += fy * ratioJ;

                // Keep in bounds
                points[i].x = Math.max(margin, Math.min(width - margin, points[i].x));
                points[i].y = Math.max(margin, Math.min(height - margin, points[i].y));
                points[j].x = Math.max(margin, Math.min(width - margin, points[j].x));
                points[j].y = Math.max(margin, Math.min(height - margin, points[j].y));
            }
        }
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
    return [cx / (6 * area), cy / (6 * area)];
}

// Render the Voronoi chart
function renderVoronoiChart(cells, width, height) {
    voronoiChart.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const cellsHTML = cells.map((cell, i) => {
        if (!cell.polygon || cell.polygon.length < 3) return '';

        const pathD = `M ${cell.polygon.map(p => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' L ')} Z`;
        const color = cell.subcategory?.color || PASTEL_COLORS[0];
        const centroid = polygonCentroid(cell.polygon);
        const area = polygonArea(cell.polygon);

        // Estimate cell size for label visibility
        const cellSize = Math.sqrt(area);
        const showLabel = cellSize > 60;
        const showPercentage = cellSize > 40;

        let labelHTML = '';
        if (centroid && showLabel) {
            const fontSize = Math.min(14, Math.max(10, cellSize / 8));
            labelHTML = `
                <text class="cell-label" x="${centroid[0]}" y="${centroid[1] - fontSize/2}" style="font-size: ${fontSize}px">${cell.name}</text>
                ${showPercentage ? `<text class="cell-percentage" x="${centroid[0]}" y="${centroid[1] + fontSize}" style="font-size: ${fontSize * 0.8}px">${(cell.weight * 100).toFixed(1)}%</text>` : ''}
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

document.addEventListener('DOMContentLoaded', init);
