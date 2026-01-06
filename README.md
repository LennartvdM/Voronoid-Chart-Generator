# Voronoid Chart Generator

A web-based visualization tool that creates interactive **Voronoi diagrams** (power diagrams) for proportional data visualization. Perfect for displaying hierarchical or categorical data where relative sizes matter.

## Features

### Core Visualization
- **Power Diagram Algorithm** - Creates weighted Voronoi cells where each region's area is proportional to its data value
- **Category Clustering** - Groups related items together using Lloyd's relaxation algorithm
- **Responsive Canvas** - High-quality canvas rendering with smooth rounded corners

### Customization
- **Stroke Controls** - Adjust inner stroke width/opacity and outer stroke for visual depth
- **Inner Gradient** - Add radial gradient effects with customizable size, opacity, hue shift, and blend modes
- **Text Blend Modes** - Choose between Multiply and Screen blend modes for labels
- **Label Editor** - Override label text, visibility (Show/Auto/Hide), and text colors for each cell

### Data Import/Export
- **CSV/JSON Import** - Import custom data from CSV or JSON format
- **PNG Export** - High-resolution 3x export with transparent background
- **SVG Export** - Vector export for scalable graphics
- **Config Persistence** - Save and load your styling configuration via Netlify Blobs

### Accessibility
- **Keyboard Shortcuts**
  - `R` - Regenerate diagram
  - `E` - Export PNG
  - `O` - Toggle orientation (Landscape/Portrait)
  - `L` - Toggle label editor
  - `I` - Open data import dialog
  - `Esc` - Close dialogs
- **ARIA Labels** - Screen reader support for interactive elements
- **Tooltips** - Hover over cells to see label, percentage, and category

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Voronoid-Chart-Generator.git
cd Voronoid-Chart-Generator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
npm run preview  # Preview the production build
```

### Deployment

The app is configured for Netlify deployment. Push to your repository and connect to Netlify, or deploy manually:

```bash
netlify deploy --prod
```

## Usage

### Default Data

The app comes pre-loaded with sample medical mortality data by category:
- **Oncologie** (Cancer) - Red tones
- **Ouderdom & degeneratief** (Aging & degenerative) - Purple tones
- **Spijsvertering & organen** (Digestion & organs) - Green tones
- **Trauma & extern** (Trauma & external) - Orange/Gold tones
- **Infectie & immuun** (Infection & immune) - Blue tones
- **Voortplanting & hormonaal** (Reproduction & hormonal) - Tan tones
- **Overig** (Other) - Gray tones

### Importing Custom Data

Click "Import Data" or press `I` to open the import dialog. Supported formats:

#### CSV Format
```csv
label,value,category
Cancer,587,oncologie
Heart Disease,122,degeneratief
Infection,28,infectie
```

#### JSON Format
```json
[
  {"label": "Cancer", "n": 587, "cat": "oncologie"},
  {"label": "Heart Disease", "n": 122, "cat": "degeneratief"},
  {"label": "Infection", "n": 28, "cat": "infectie"}
]
```

**Required columns:**
- `label` or `name` - Item name
- `value`, `n`, or `count` - Numeric value
- `category` or `cat` (optional) - Category key (defaults to "overig")

## Project Structure

```
src/
├── components/
│   ├── Controls/
│   │   ├── StrokeControls.jsx    # Stroke parameter sliders
│   │   ├── GradientControls.jsx  # Gradient effect controls
│   │   ├── LabelEditor.jsx       # Per-cell label customization
│   │   └── index.js
│   ├── Tooltip.jsx               # Hover tooltip component
│   └── DataImport.jsx            # CSV/JSON import modal
├── constants/
│   └── index.js                  # All configuration constants
├── hooks/
│   ├── useVoronoi.js             # Voronoi generation hook
│   ├── useDebounce.js            # Performance debouncing
│   └── index.js
├── utils/
│   ├── geometry.js               # Polygon math (area, centroid, clipping)
│   ├── color.js                  # Color manipulation (RGB/HSL)
│   ├── voronoi.js                # Power diagram algorithms
│   └── canvas.js                 # Canvas rendering utilities
├── VoronoiPrint.jsx              # Main application component
├── App.jsx                       # Root component
└── main.jsx                      # Entry point

netlify/functions/
├── save-config.js                # Save config to Netlify Blobs
└── load-config.js                # Load config from Netlify Blobs
```

## Algorithm Details

### Power Diagram (Weighted Voronoi)

The visualization uses a **power diagram** algorithm, which is a generalization of Voronoi diagrams where each cell's boundary is determined by both distance and a weight value. This allows control over relative cell sizes to match the data proportions.

Key steps:
1. **Seed Initialization** - Place initial seeds clustered by category
2. **Weight Optimization** - Iteratively adjust weights to match target areas
3. **Lloyd Relaxation** - Move seeds toward cell centroids for regular shapes
4. **Category Clustering** - Pull seeds toward category centers for grouping

### Polygon Operations

- **Clipping** - Sutherland-Hodgman algorithm for clipping polygons against half-planes
- **Inset** - Shrink polygons to create visual gaps between cells
- **Rounded Corners** - Arc-based corner rounding with adaptive radius

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Canvas API** - Rendering engine
- **Netlify Functions** - Serverless backend
- **Netlify Blobs** - Configuration persistence

## Configuration

Key constants can be adjusted in `src/constants/index.js`:

| Constant | Default | Description |
|----------|---------|-------------|
| `MAX_ITERATIONS` | 350 | Maximum optimization iterations |
| `ERROR_THRESHOLD` | 0.005 | Target error for convergence (0.5%) |
| `CORNER_RADIUS` | 14 | Cell corner radius in pixels |
| `GAP` | 10 | Gap between cells in pixels |
| `EXPORT_SCALE` | 3 | PNG export resolution multiplier |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- Voronoi diagram algorithms inspired by computational geometry literature
- Color palette designed for medical data visualization accessibility
