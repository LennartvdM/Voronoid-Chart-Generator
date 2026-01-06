import React from 'react';
import PropTypes from 'prop-types';

/**
 * Inner gradient effect controls
 */
export default function GradientControls({
  gradientEnabled,
  setGradientEnabled,
  gradientSize,
  setGradientSize,
  gradientOpacity,
  setGradientOpacity,
  gradientHueShift,
  setGradientHueShift,
  gradientBlendMode,
  setGradientBlendMode
}) {
  return (
    <div className="control-section">
      <div className="control-row" style={{ marginBottom: 'var(--space-2)' }}>
        <span className="control-section-title" style={{ marginBottom: 0 }}>Inner Gradient</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={gradientEnabled}
            onChange={(e) => setGradientEnabled(e.target.checked)}
            aria-label="Enable inner gradient"
          />
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)' }}>
            {gradientEnabled ? 'On' : 'Off'}
          </span>
        </label>
      </div>

      <div style={{ opacity: gradientEnabled ? 1 : 0.4 }}>
        <label className="control-row">
          <span className="control-label">Size</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={gradientSize}
            onChange={(e) => setGradientSize(Number(e.target.value))}
            disabled={!gradientEnabled}
            aria-label="Gradient size"
          />
          <span className="control-value">{(gradientSize * 100).toFixed(0)}%</span>
        </label>

        <label className="control-row">
          <span className="control-label">Opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={gradientOpacity}
            onChange={(e) => setGradientOpacity(Number(e.target.value))}
            disabled={!gradientEnabled}
            aria-label="Gradient opacity"
          />
          <span className="control-value">{(gradientOpacity * 100).toFixed(0)}%</span>
        </label>

        <label className="control-row">
          <span className="control-label">Hue shift</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={gradientHueShift}
            onChange={(e) => setGradientHueShift(Number(e.target.value))}
            disabled={!gradientEnabled}
            aria-label="Gradient hue shift"
          />
          <span className="control-value">{gradientHueShift}°</span>
        </label>

        <label className="control-row">
          <span className="control-label">Blend mode</span>
          <select
            value={gradientBlendMode}
            onChange={(e) => setGradientBlendMode(e.target.value)}
            disabled={!gradientEnabled}
            aria-label="Gradient blend mode"
          >
            <option value="soft-light">Soft Light</option>
            <option value="overlay">Overlay</option>
            <option value="multiply">Multiply</option>
          </select>
        </label>
      </div>
    </div>
  );
}

GradientControls.propTypes = {
  gradientEnabled: PropTypes.bool.isRequired,
  setGradientEnabled: PropTypes.func.isRequired,
  gradientSize: PropTypes.number.isRequired,
  setGradientSize: PropTypes.func.isRequired,
  gradientOpacity: PropTypes.number.isRequired,
  setGradientOpacity: PropTypes.func.isRequired,
  gradientHueShift: PropTypes.number.isRequired,
  setGradientHueShift: PropTypes.func.isRequired,
  gradientBlendMode: PropTypes.string.isRequired,
  setGradientBlendMode: PropTypes.func.isRequired
};
