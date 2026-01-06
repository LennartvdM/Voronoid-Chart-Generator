import React from 'react';
import PropTypes from 'prop-types';

/**
 * Action bar component with main action buttons
 * Handles regeneration, export, import, and config operations
 */
export default function ActionBar({
  status,
  isLandscape,
  onToggleOrientation,
  onRegenerate,
  onExportPNG,
  onExportSVG,
  onImportData,
  onSaveConfig,
  onLoadConfig,
  saveStatus
}) {
  return (
    <div className="action-bar">
      <span className="status-text">{status}</span>

      <button
        className="btn btn-default"
        onClick={onToggleOrientation}
        title="Toggle canvas orientation"
      >
        {isLandscape ? '↔ Landscape' : '↕ Portrait'}
        <kbd className="kbd">O</kbd>
      </button>

      <button
        className="btn btn-default"
        onClick={onRegenerate}
        title="Regenerate diagram with new layout"
      >
        Regenerate
        <kbd className="kbd">R</kbd>
      </button>

      <button
        className="btn btn-default"
        onClick={onExportPNG}
        title="Export as high-resolution PNG"
      >
        Export PNG
        <kbd className="kbd">E</kbd>
      </button>

      <button
        className="btn btn-default"
        onClick={onExportSVG}
        title="Export as vector SVG"
      >
        Export SVG
      </button>

      <div className="action-bar-divider" aria-hidden="true" />

      <button
        className="btn btn-warning"
        onClick={onImportData}
        title="Import data from CSV or JSON"
      >
        Import Data
        <kbd className="kbd">I</kbd>
      </button>

      <button
        className="btn btn-success"
        onClick={onSaveConfig}
        title="Save current styling configuration"
      >
        Save Config
      </button>

      <button
        className="btn btn-info"
        onClick={onLoadConfig}
        title="Load saved configuration"
      >
        Load Config
      </button>

      {saveStatus && (
        <span
          className={`status-text ${saveStatus.includes('fail') ? 'error' : 'success'}`}
          role="status"
          aria-live="polite"
        >
          {saveStatus}
        </span>
      )}
    </div>
  );
}

ActionBar.propTypes = {
  status: PropTypes.string,
  isLandscape: PropTypes.bool.isRequired,
  onToggleOrientation: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
  onExportPNG: PropTypes.func.isRequired,
  onExportSVG: PropTypes.func.isRequired,
  onImportData: PropTypes.func.isRequired,
  onSaveConfig: PropTypes.func.isRequired,
  onLoadConfig: PropTypes.func.isRequired,
  saveStatus: PropTypes.string
};
