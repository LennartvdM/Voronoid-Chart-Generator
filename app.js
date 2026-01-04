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
    colorModal.addEventListener('click', function(e) {
        if (e.target === colorModal) closeColorModal();
    });

    renderEmptyState();
}

// Render color palette in modal
function renderColorPalette() {
    colorPalette.innerHTML = PASTEL_COLORS.map(function(color, index) {
        return '<button class="palette-color" style="background-color: ' + color + '" data-color="' + color + '" data-index="' + index + '"></button>';
    }).join('');

    colorPalette.addEventListener('click', function(e) {
        var btn = e.target.closest('.palette-color');
        if (!btn) return;
        selectColor(btn.dataset.color);
    });
}

// Data Point Management
function addDataPoint() {
    var id = state.nextDataPointId++;
    state.dataPoints.push({
        id: id,
        name: '',
        percentage: '',
        subcategoryId: state.subcategories[0] ? state.subcategories[0].id : null,
    });
    renderDataPoints();
}

function removeDataPoint(id) {
    state.dataPoints = state.dataPoints.filter(function(dp) { return dp.id !== id; });
    renderDataPoints();
}

function updateDataPoint(id, field, value) {
    var dp = state.dataPoints.find(function(d) { return d.id === id; });
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
    dataInputsContainer.innerHTML = state.dataPoints.map(function(dp, index) {
        var subcatOptions = state.subcategories.map(function(sub) {
            var selected = dp.subcategoryId === sub.id ? 'selected' : '';
            return '<option value="' + sub.id + '" ' + selected + '>' + sub.name + '</option>';
        }).join('');

        return '<div class="data-point" data-id="' + dp.id + '">' +
            '<div class="data-point-header">' +
                '<span class="data-point-number">#' + (index + 1) + '</span>' +
                '<button class="btn-remove" onclick="removeDataPoint(' + dp.id + ')">&times;</button>' +
            '</div>' +
            '<div class="data-point-fields">' +
                '<div class="field-row">' +
                    '<div class="input-group">' +
                        '<label>Name</label>' +
                        '<input type="text" placeholder="e.g., Germany" value="' + dp.name + '" onchange="updateDataPoint(' + dp.id + ', \'name\', this.value)">' +
                    '</div>' +
                    '<div class="input-group" style="max-width: 80px;">' +
                        '<label>Percent</label>' +
                        '<input type="number" placeholder="%" min="0" max="100" step="0.1" value="' + dp.percentage + '" onchange="updateDataPoint(' + dp.id + ', \'percentage\', this.value)">' +
                    '</div>' +
                '</div>' +
                '<div class="input-group">' +
                    '<label>Subcategory</label>' +
                    '<select onchange="updateDataPoint(' + dp.id + ', \'subcategoryId\', this.value)">' + subcatOptions + '</select>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// Subcategory Management
function addSubcategory() {
    var id = state.nextSubcategoryId++;
    var colorIndex = state.subcategories.length % PASTEL_COLORS.length;
    state.subcategories.push({
        id: id,
        name: 'Category ' + String.fromCharCode(65 + state.subcategories.length),
        color: PASTEL_COLORS[colorIndex],
    });
    renderSubcategories();
    renderDataPoints();
}

function removeSubcategory(id) {
    if (state.subcategories.length <= 1) return;
    state.subcategories = state.subcategories.filter(function(s) { return s.id !== id; });
    state.dataPoints.forEach(function(dp) {
        if (!state.subcategories.find(function(s) { return s.id === dp.subcategoryId; })) {
            dp.subcategoryId = state.subcategories[0].id;
        }
    });
    renderSubcategories();
    renderDataPoints();
}

function updateSubcategoryName(id, name) {
    var sub = state.subcategories.find(function(s) { return s.id === id; });
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
        var sub = state.subcategories.find(function(s) { return s.id === state.currentColorTarget; });
        if (sub) {
            sub.color = color;
            renderSubcategories();
        }
    }
    closeColorModal();
}

function renderSubcategories() {
    subcategoryListContainer.innerHTML = state.subcategories.map(function(sub) {
        var removeBtn = state.subcategories.length > 1
            ? '<button class="btn-remove" onclick="removeSubcategory(' + sub.id + ')">&times;</button>'
            : '';
        return '<div class="subcategory-item" data-id="' + sub.id + '">' +
            '<button class="color-picker-btn" style="background-color: ' + sub.color + '" onclick="openColorPicker(' + sub.id + ')"></button>' +
            '<input type="text" value="' + sub.name + '" onchange="updateSubcategoryName(' + sub.id + ', this.value)">' +
            removeBtn +
        '</div>';
    }).join('');
}

// Make functions globally accessible
window.removeDataPoint = removeDataPoint;
window.updateDataPoint = updateDataPoint;
window.removeSubcategory = removeSubcategory;
window.updateSubcategoryName = updateSubcategoryName;
window.openColorPicker = openColorPicker;

// Empty State
function renderEmptyState() {
    voronoiChart.innerHTML = '<foreignObject x="0" y="0" width="100%" height="100%">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" class="empty-state">' +
            '<div class="empty-state-icon">&#9724;</div>' +
            '<p>Add data points and click "Generate Chart"</p>' +
        '</div>' +
    '</foreignObject>';
}

// Generate Chart
function generateChart() {
    var validPoints = state.dataPoints.filter(function(dp) {
        return dp.name && dp.percentage > 0;
    });

    if (validPoints.length < 1) {
        alert('Please add at least 1 data point with a name and percentage.');
        return;
    }

    var totalPercentage = validPoints.reduce(function(sum, dp) {
        return sum + parseFloat(dp.percentage);
    }, 0);

    var chartData = validPoints.map(function(dp) {
        return {
            name: dp.name,
            weight: parseFloat(dp.percentage) / totalPercentage,
            originalPercentage: parseFloat(dp.percentage),
            subcategory: state.subcategories.find(function(s) { return s.id === dp.subcategoryId; }),
        };
    });

    var container = document.getElementById('voronoi-container');
    var width = container.clientWidth - 40;
    var height = container.clientHeight - 40;

    computeAndRenderVoronoi(chartData, width, height);
    renderLegend();
}

// Compute Voronoi using d3-voronoi-map
function computeAndRenderVoronoi(data, width, height) {
    // Create the clipping polygon (rectangle)
    var clippingPolygon = [
        [0, 0],
        [0, height],
        [width, height],
        [width, 0]
    ];

    // Create the voronoi map simulation
    var simulation = d3.voronoiMapSimulation(data)
        .weight(function(d) { return d.weight; })
        .clip(clippingPolygon)
        .stop();

    // Run simulation until converged
    var maxIterations = 200;
    for (var i = 0; i < maxIterations; i++) {
        simulation.tick();
        if (simulation.state().ended) break;
    }

    // Get the resulting polygons
    var polygons = simulation.state().polygons;

    // Render the chart
    renderVoronoiChart(polygons, width, height);
}

// Render the Voronoi chart
function renderVoronoiChart(polygons, width, height) {
    voronoiChart.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    var cellsHTML = polygons.map(function(polygon) {
        if (!polygon || polygon.length < 3) return '';

        var data = polygon.site.originalObject.data.originalData;
        var pathPoints = polygon.map(function(p) {
            return p[0].toFixed(2) + ',' + p[1].toFixed(2);
        });
        var pathD = 'M ' + pathPoints.join(' L ') + ' Z';
        var color = data.subcategory ? data.subcategory.color : PASTEL_COLORS[0];
        var centroid = polygonCentroid(polygon);
        var area = polygonArea(polygon);

        var cellSize = Math.sqrt(area);
        var showLabel = cellSize > 50;
        var showPercentage = cellSize > 35;

        var labelHTML = '';
        if (centroid && showLabel) {
            var fontSize = Math.min(14, Math.max(9, cellSize / 8));
            labelHTML = '<text class="cell-label" x="' + centroid[0] + '" y="' + (centroid[1] - fontSize/2) + '" style="font-size: ' + fontSize + 'px">' + data.name + '</text>';
            if (showPercentage) {
                labelHTML += '<text class="cell-percentage" x="' + centroid[0] + '" y="' + (centroid[1] + fontSize) + '" style="font-size: ' + (fontSize * 0.8) + 'px">' + (data.weight * 100).toFixed(1) + '%</text>';
            }
        }

        return '<g class="cell-group">' +
            '<path class="voronoi-cell" d="' + pathD + '" fill="' + color + '" data-name="' + data.name + '" data-percentage="' + (data.weight * 100).toFixed(1) + '"/>' +
            labelHTML +
        '</g>';
    }).join('');

    voronoiChart.innerHTML = cellsHTML;
}

// Geometry utilities
function polygonArea(polygon) {
    if (!polygon || polygon.length < 3) return 0;
    var area = 0;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        area += (polygon[j][0] + polygon[i][0]) * (polygon[j][1] - polygon[i][1]);
    }
    return Math.abs(area / 2);
}

function polygonCentroid(polygon) {
    if (!polygon || polygon.length < 3) return null;
    var cx = 0, cy = 0, area = 0;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var cross = polygon[j][0] * polygon[i][1] - polygon[i][0] * polygon[j][1];
        cx += (polygon[j][0] + polygon[i][0]) * cross;
        cy += (polygon[j][1] + polygon[i][1]) * cross;
        area += cross;
    }
    area /= 2;
    if (Math.abs(area) < 1e-10) return null;
    return [cx / (6 * area), cy / (6 * area)];
}

// Render legend
function renderLegend() {
    var usedSubcategoryIds = {};
    state.dataPoints.forEach(function(dp) {
        if (dp.name && dp.percentage > 0) {
            usedSubcategoryIds[dp.subcategoryId] = true;
        }
    });

    legendContainer.innerHTML = state.subcategories
        .filter(function(sub) { return usedSubcategoryIds[sub.id]; })
        .map(function(sub) {
            return '<div class="legend-item">' +
                '<div class="legend-color" style="background-color: ' + sub.color + '"></div>' +
                '<span class="legend-label">' + sub.name + '</span>' +
            '</div>';
        }).join('');
}

// Export SVG
function exportSVG() {
    var svgContent = voronoiChart.outerHTML;
    var blob = new Blob([svgContent], { type: 'image/svg+xml' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'voronoi-chart.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', init);
