import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// Components
import Tooltip from './components/Tooltip';
import { StrokeControls, GradientControls, LabelEditor } from './components/Controls';
import DataImport from './components/DataImport';

// Hooks
import { useVoronoi } from './hooks/useVoronoi';
import { useDebounce } from './hooks/useDebounce';

// Utilities
import { pointInPolygon } from './utils/geometry';
import { renderAllCells, generateSVG } from './utils/canvas';

// Constants
import {
  CATEGORIES,
  DEFAULT_DATA,
  LANDSCAPE_WIDTH,
  LANDSCAPE_HEIGHT,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  EXPORT_SCALE,
  DEFAULT_INNER_STROKE_WIDTH,
  DEFAULT_INNER_STROKE_OPACITY,
  DEFAULT_OUTER_STROKE_WIDTH,
  DEFAULT_GRADIENT_SIZE,
  DEFAULT_GRADIENT_OPACITY,
  DEFAULT_GRADIENT_HUE_SHIFT,
  DEFAULT_GRADIENT_BLEND_MODE,
  DEFAULT_TEXT_BLEND_MODE
} from './constants';

/**
 * VoronoiPrint - Interactive Voronoi diagram generator
 *
 * Creates weighted Voronoi diagrams (power diagrams) from categorical data,
 * with customizable styling, label editing, and export capabilities.
 */
export default function VoronoiPrint() {
  const canvasRef = useRef(null);

  // Data state
  const [data, setData] = useState(DEFAULT_DATA);
  const [showDataImport, setShowDataImport] = useState(false);

  // Layout
  const [isLandscape, setIsLandscape] = useState(true);
  const W = isLandscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH;
  const H = isLandscape ? LANDSCAPE_HEIGHT : PORTRAIT_HEIGHT;

  // Tooltip state
  const [tooltip, setTooltip] = useState(null);

  // Stroke parameters
  const [innerStrokeWidth, setInnerStrokeWidth] = useState(DEFAULT_INNER_STROKE_WIDTH);
  const [innerStrokeOpacity, setInnerStrokeOpacity] = useState(DEFAULT_INNER_STROKE_OPACITY);
  const [outerStrokeWidth, setOuterStrokeWidth] = useState(DEFAULT_OUTER_STROKE_WIDTH);
  const [textBlendMode, setTextBlendMode] = useState(DEFAULT_TEXT_BLEND_MODE);

  // Gradient parameters
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientSize, setGradientSize] = useState(DEFAULT_GRADIENT_SIZE);
  const [gradientOpacity, setGradientOpacity] = useState(DEFAULT_GRADIENT_OPACITY);
  const [gradientHueShift, setGradientHueShift] = useState(DEFAULT_GRADIENT_HUE_SHIFT);
  const [gradientBlendMode, setGradientBlendMode] = useState(DEFAULT_GRADIENT_BLEND_MODE);

  // Label customization
  const [labelOverrides, setLabelOverrides] = useState({});
  const [showLabelEditor, setShowLabelEditor] = useState(false);

  // Save/Load state
  const [saveStatus, setSaveStatus] = useState('');

  // Generate Voronoi diagram
  const { status, cells, cellData, generate } = useVoronoi(data, W, H);

  // Debounce render-triggering values for performance
  const debouncedInnerStrokeWidth = useDebounce(innerStrokeWidth, 50);
  const debouncedInnerStrokeOpacity = useDebounce(innerStrokeOpacity, 50);
  const debouncedOuterStrokeWidth = useDebounce(outerStrokeWidth, 50);
  const debouncedGradientSize = useDebounce(gradientSize, 50);
  const debouncedGradientOpacity = useDebounce(gradientOpacity, 50);
  const debouncedGradientHueShift = useDebounce(gradientHueShift, 50);

  /**
   * Get label settings for a cell index
   */
  const getLabelSettings = useCallback((index) => {
    const override = labelOverrides[index] || {};
    const originalLabel = data[index]?.displayLabel || data[index]?.label || '';
    return {
      label: override.customLabel !== undefined && override.customLabel !== ''
        ? override.customLabel
        : originalLabel,
      visibility: override.visibility || 'normal',
      textColor: override.textColor || null
    };
  }, [labelOverrides, data]);

  /**
   * Update a label override
   */
  const updateLabelOverride = useCallback((index, field, value) => {
    setLabelOverrides(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  }, []);

  /**
   * Handle mouse move for tooltip
   */
  const handleMouseMove = useCallback((e) => {
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
  }, [cells, cellData, W, H]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            generate();
          }
          break;
        case 'e':
        case 'E':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleExport();
          }
          break;
        case 'o':
        case 'O':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setIsLandscape(prev => !prev);
          }
          break;
        case 'l':
        case 'L':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowLabelEditor(prev => !prev);
          }
          break;
        case 'i':
        case 'I':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowDataImport(true);
          }
          break;
        case 'Escape':
          setShowDataImport(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generate]);

  // Regenerate when orientation or data changes
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLandscape, data]);

  // Render params for canvas
  const renderParams = useMemo(() => ({
    innerStrokeWidth: debouncedInnerStrokeWidth,
    innerStrokeOpacity: debouncedInnerStrokeOpacity,
    outerStrokeWidth: debouncedOuterStrokeWidth,
    gradientEnabled,
    gradientSize: debouncedGradientSize,
    gradientOpacity: debouncedGradientOpacity,
    gradientHueShift: debouncedGradientHueShift,
    gradientBlendMode,
    textBlendMode,
    labelOverrides,
    getLabelSettings
  }), [
    debouncedInnerStrokeWidth, debouncedInnerStrokeOpacity, debouncedOuterStrokeWidth,
    gradientEnabled, debouncedGradientSize, debouncedGradientOpacity,
    debouncedGradientHueShift, gradientBlendMode, textBlendMode,
    labelOverrides, getLabelSettings
  ]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8f8f6';
    ctx.fillRect(0, 0, W, H);

    renderAllCells(ctx, cells, cellData, W, H, renderParams, false);
  }, [cells, cellData, W, H, renderParams]);

  /**
   * Export as PNG
   */
  const handleExport = useCallback(() => {
    const exp = document.createElement('canvas');
    exp.width = W * EXPORT_SCALE;
    exp.height = H * EXPORT_SCALE;
    const ctx = exp.getContext('2d');
    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

    // Transparent background for export
    renderAllCells(ctx, cells, cellData, W, H, renderParams, true);

    const link = document.createElement('a');
    link.download = 'voronoi-chart.png';
    link.href = exp.toDataURL('image/png');
    link.click();
  }, [cells, cellData, W, H, renderParams]);

  /**
   * Export as SVG
   */
  const handleExportSVG = useCallback(() => {
    const svg = generateSVG(cells, cellData, W, H, renderParams);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'voronoi-chart.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [cells, cellData, W, H, renderParams]);

  /**
   * Save configuration to server
   */
  const handleSaveConfig = async () => {
    setSaveStatus('Saving...');
    try {
      const config = {
        innerStrokeWidth,
        innerStrokeOpacity,
        outerStrokeWidth,
        gradientEnabled,
        gradientSize,
        gradientOpacity,
        gradientHueShift,
        gradientBlendMode,
        labelOverrides,
        textBlendMode,
        isLandscape
      };
      const response = await fetch('/.netlify/functions/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await response.json();
      if (result.success) {
        setSaveStatus('Saved!');
      } else {
        setSaveStatus('Save failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('Save failed - check connection');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  /**
   * Load configuration from server
   */
  const handleLoadConfig = async () => {
    setSaveStatus('Loading...');
    try {
      const response = await fetch('/.netlify/functions/load-config');
      const result = await response.json();
      if (result.success && result.config) {
        const c = result.config;
        if (c.innerStrokeWidth !== undefined) setInnerStrokeWidth(c.innerStrokeWidth);
        if (c.innerStrokeOpacity !== undefined) setInnerStrokeOpacity(c.innerStrokeOpacity);
        if (c.outerStrokeWidth !== undefined) setOuterStrokeWidth(c.outerStrokeWidth);
        if (c.gradientEnabled !== undefined) setGradientEnabled(c.gradientEnabled);
        if (c.gradientSize !== undefined) setGradientSize(c.gradientSize);
        if (c.gradientOpacity !== undefined) setGradientOpacity(c.gradientOpacity);
        if (c.gradientHueShift !== undefined) setGradientHueShift(c.gradientHueShift);
        if (c.gradientBlendMode !== undefined) setGradientBlendMode(c.gradientBlendMode);
        if (c.labelOverrides !== undefined) setLabelOverrides(c.labelOverrides);
        if (c.textBlendMode !== undefined) setTextBlendMode(c.textBlendMode);
        if (c.isLandscape !== undefined) setIsLandscape(c.isLandscape);
        setSaveStatus('Loaded!');
      } else {
        setSaveStatus('No saved config');
      }
    } catch (error) {
      console.error('Load error:', error);
      setSaveStatus('Load failed - check connection');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  /**
   * Handle data import
   */
  const handleDataImport = useCallback((newData) => {
    setData(newData);
    setLabelOverrides({});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 20 }}>
      {/* Canvas */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{ border: '1px solid #ddd', maxWidth: '100%', height: 'auto', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-label="Voronoi diagram visualization"
          role="img"
        />
        {tooltip && (
          <Tooltip
            x={tooltip.x}
            y={tooltip.y}
            label={tooltip.label}
            pct={tooltip.pct}
            cat={tooltip.cat}
          />
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
        <StrokeControls
          innerStrokeWidth={innerStrokeWidth}
          setInnerStrokeWidth={setInnerStrokeWidth}
          innerStrokeOpacity={innerStrokeOpacity}
          setInnerStrokeOpacity={setInnerStrokeOpacity}
          outerStrokeWidth={outerStrokeWidth}
          setOuterStrokeWidth={setOuterStrokeWidth}
          textBlendMode={textBlendMode}
          setTextBlendMode={setTextBlendMode}
        />
        <GradientControls
          gradientEnabled={gradientEnabled}
          setGradientEnabled={setGradientEnabled}
          gradientSize={gradientSize}
          setGradientSize={setGradientSize}
          gradientOpacity={gradientOpacity}
          setGradientOpacity={setGradientOpacity}
          gradientHueShift={gradientHueShift}
          setGradientHueShift={setGradientHueShift}
          gradientBlendMode={gradientBlendMode}
          setGradientBlendMode={setGradientBlendMode}
        />
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
        aria-expanded={showLabelEditor}
        aria-controls="label-editor-panel"
      >
        {showLabelEditor ? 'Hide Label Editor' : 'Edit Labels'} <kbd style={{ opacity: 0.6, fontSize: 10 }}>L</kbd>
      </button>

      {/* Label Editor Panel */}
      {showLabelEditor && (
        <div id="label-editor-panel">
          <LabelEditor
            data={data}
            cellData={cellData}
            labelOverrides={labelOverrides}
            updateLabelOverride={updateLabelOverride}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: '#666' }}>{status}</span>

        <button onClick={() => setIsLandscape(!isLandscape)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {isLandscape ? '↔ Landscape' : '↕ Portrait'} <kbd style={{ opacity: 0.6, fontSize: 10 }}>O</kbd>
        </button>
        <button onClick={generate} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Regenerate <kbd style={{ opacity: 0.6, fontSize: 10 }}>R</kbd>
        </button>
        <button onClick={handleExport} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Export PNG <kbd style={{ opacity: 0.6, fontSize: 10 }}>E</kbd>
        </button>
        <button onClick={handleExportSVG} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Export SVG
        </button>

        <div style={{ borderLeft: '1px solid #ccc', height: 24, margin: '0 4px' }} />

        <button
          onClick={() => setShowDataImport(true)}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#e09f3e',
            color: '#fff',
            border: 'none',
            borderRadius: 4
          }}
        >
          Import Data <kbd style={{ opacity: 0.6, fontSize: 10 }}>I</kbd>
        </button>

        <button
          onClick={handleSaveConfig}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#2d6a4f',
            color: '#fff',
            border: 'none',
            borderRadius: 4
          }}
        >
          Save Config
        </button>
        <button
          onClick={handleLoadConfig}
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
            background: '#457b9d',
            color: '#fff',
            border: 'none',
            borderRadius: 4
          }}
        >
          Load Config
        </button>

        {saveStatus && (
          <span style={{
            fontSize: 13,
            color: saveStatus.includes('fail') ? '#c44536' : '#2d6a4f',
            fontWeight: 500
          }}>
            {saveStatus}
          </span>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8 }}>
        Keyboard shortcuts: <kbd>R</kbd> Regenerate · <kbd>E</kbd> Export PNG · <kbd>O</kbd> Toggle orientation · <kbd>L</kbd> Label editor · <kbd>I</kbd> Import data
      </div>

      {/* Data Import Modal */}
      {showDataImport && (
        <DataImport
          onImport={handleDataImport}
          onClose={() => setShowDataImport(false)}
        />
      )}
    </div>
  );
}
