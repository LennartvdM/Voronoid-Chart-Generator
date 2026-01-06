import React, { useEffect, useState, useCallback, useMemo } from 'react';

// Components
import CanvasDisplay from './components/CanvasDisplay';
import ActionBar from './components/ActionBar';
import Legend from './components/Legend';
import { StrokeControls, GradientControls, LabelEditor, ColorSchemeControls } from './components/Controls';
import DataImport from './components/DataImport';

// Hooks
import { useVoronoi } from './hooks/useVoronoi';
import { useDebounce } from './hooks/useDebounce';
import { useTheme } from './context/ThemeContext';

// Utilities
import { generateSVG, renderAllCells } from './utils/canvas';
import { applyColorScheme } from './utils/color';

// Constants
import {
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
  DEFAULT_TEXT_BLEND_MODE,
  COLOR_SCHEMES,
  DEFAULT_TIER_CONFIG
} from './constants';

/**
 * VoronoiPrint - Main application component
 * Orchestrates the Voronoi diagram generator with all controls and features
 */
export default function VoronoiPrint() {
  const { theme, toggleTheme } = useTheme();

  // Data state
  const [data, setData] = useState(DEFAULT_DATA);
  const [showDataImport, setShowDataImport] = useState(false);

  // Layout
  const [isLandscape, setIsLandscape] = useState(true);
  const W = isLandscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH;
  const H = isLandscape ? LANDSCAPE_HEIGHT : PORTRAIT_HEIGHT;

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

  // Color scheme settings
  const [colorScheme, setColorScheme] = useState('none');
  const [tierMethod, setTierMethod] = useState('percentage');
  const [tierConfig, setTierConfig] = useState(DEFAULT_TIER_CONFIG.percentage);
  const [useSmoothing, setUseSmoothing] = useState(false);

  // Save/Load state
  const [saveStatus, setSaveStatus] = useState('');

  // Screen reader announcements
  const [announcement, setAnnouncement] = useState('');

  // Generate Voronoi diagram
  const { status, cells, cellData: baseCellData, generate } = useVoronoi(data, W, H);

  // Apply color scheme to cell data
  const cellData = useMemo(() => {
    if (!baseCellData || baseCellData.length === 0) return baseCellData;
    return applyColorScheme(
      data,
      baseCellData,
      COLOR_SCHEMES[colorScheme],
      tierMethod,
      tierConfig,
      useSmoothing
    );
  }, [baseCellData, data, colorScheme, tierMethod, tierConfig, useSmoothing]);

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
   * Announce to screen readers
   */
  const announce = useCallback((message) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

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
            announce('Regenerating diagram');
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
            announce(isLandscape ? 'Switched to portrait' : 'Switched to landscape');
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
        case 't':
        case 'T':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleTheme();
            announce(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
          }
          break;
        case 'Escape':
          setShowDataImport(false);
          setShowLabelEditor(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generate, isLandscape, theme, toggleTheme, announce]);

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

    announce('Exported as PNG');
  }, [cells, cellData, W, H, renderParams, announce]);

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

    announce('Exported as SVG');
  }, [cells, cellData, W, H, renderParams, announce]);

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
        isLandscape,
        colorScheme,
        tierMethod,
        tierConfig,
        useSmoothing
      };
      const response = await fetch('/.netlify/functions/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await response.json();
      if (result.success) {
        setSaveStatus('Saved!');
        announce('Configuration saved');
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
        if (c.colorScheme !== undefined) setColorScheme(c.colorScheme);
        if (c.tierMethod !== undefined) setTierMethod(c.tierMethod);
        if (c.tierConfig !== undefined) setTierConfig(c.tierConfig);
        if (c.useSmoothing !== undefined) setUseSmoothing(c.useSmoothing);
        setSaveStatus('Loaded!');
        announce('Configuration loaded');
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
    announce(`Imported ${newData.length} items`);
  }, [announce]);

  return (
    <div className="app">
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {/* Header with theme toggle */}
      <header className="app-header">
        <h1 className="app-title">Voronoi Chart Generator</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (T)`}
          aria-label={`Current theme: ${theme}. Click to switch.`}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* Canvas Display */}
      <CanvasDisplay
        cells={cells}
        cellData={cellData}
        width={W}
        height={H}
        renderParams={renderParams}
      />

      {/* Legend */}
      <Legend data={data} cellData={cellData} />

      {/* Parameter Controls */}
      <div className="controls-panel">
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
        <ColorSchemeControls
          colorScheme={colorScheme}
          setColorScheme={setColorScheme}
          tierMethod={tierMethod}
          setTierMethod={setTierMethod}
          tierConfig={tierConfig}
          setTierConfig={setTierConfig}
          useSmoothing={useSmoothing}
          setUseSmoothing={setUseSmoothing}
        />
      </div>

      {/* Label Editor Toggle */}
      <button
        className={`btn btn-default ${showLabelEditor ? 'active' : ''}`}
        onClick={() => setShowLabelEditor(!showLabelEditor)}
        aria-expanded={showLabelEditor}
        aria-controls="label-editor-panel"
      >
        {showLabelEditor ? 'Hide Label Editor' : 'Edit Labels'}
        <kbd className="kbd">L</kbd>
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

      {/* Action Bar */}
      <ActionBar
        status={status}
        isLandscape={isLandscape}
        onToggleOrientation={() => setIsLandscape(!isLandscape)}
        onRegenerate={generate}
        onExportPNG={handleExport}
        onExportSVG={handleExportSVG}
        onImportData={() => setShowDataImport(true)}
        onSaveConfig={handleSaveConfig}
        onLoadConfig={handleLoadConfig}
        saveStatus={saveStatus}
      />

      {/* Keyboard Shortcuts Help */}
      <div className="shortcuts-help">
        <kbd className="kbd">R</kbd> Regenerate ·
        <kbd className="kbd">E</kbd> Export PNG ·
        <kbd className="kbd">O</kbd> Orientation ·
        <kbd className="kbd">L</kbd> Labels ·
        <kbd className="kbd">I</kbd> Import ·
        <kbd className="kbd">T</kbd> Theme
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
