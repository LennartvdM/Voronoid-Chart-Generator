import React from 'react';
import PropTypes from 'prop-types';

/**
 * Stroke parameter controls for cell borders
 */
export default function StrokeControls({
  innerStrokeWidth,
  setInnerStrokeWidth,
  innerStrokeOpacity,
  setInnerStrokeOpacity,
  outerStrokeWidth,
  setOuterStrokeWidth,
  textBlendMode,
  setTextBlendMode
}) {
  return (
    <div className="control-section">
      <div className="control-section-title">Stroke</div>

      <label className="control-row">
        <span className="control-label">Inner width</span>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={innerStrokeWidth}
          onChange={(e) => setInnerStrokeWidth(Number(e.target.value))}
          aria-label="Inner stroke width"
        />
        <span className="control-value">{innerStrokeWidth}</span>
      </label>

      <label className="control-row">
        <span className="control-label">Inner opacity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={innerStrokeOpacity}
          onChange={(e) => setInnerStrokeOpacity(Number(e.target.value))}
          aria-label="Inner stroke opacity"
        />
        <span className="control-value">{(innerStrokeOpacity * 100).toFixed(0)}%</span>
      </label>

      <label className="control-row">
        <span className="control-label">Outer width</span>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={outerStrokeWidth}
          onChange={(e) => setOuterStrokeWidth(Number(e.target.value))}
          aria-label="Outer stroke width"
        />
        <span className="control-value">{outerStrokeWidth}</span>
      </label>

      <label className="control-row">
        <span className="control-label">Text blend</span>
        <select
          value={textBlendMode}
          onChange={(e) => setTextBlendMode(e.target.value)}
          aria-label="Text blend mode"
        >
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
        </select>
      </label>
    </div>
  );
}

StrokeControls.propTypes = {
  innerStrokeWidth: PropTypes.number.isRequired,
  setInnerStrokeWidth: PropTypes.func.isRequired,
  innerStrokeOpacity: PropTypes.number.isRequired,
  setInnerStrokeOpacity: PropTypes.func.isRequired,
  outerStrokeWidth: PropTypes.number.isRequired,
  setOuterStrokeWidth: PropTypes.func.isRequired,
  textBlendMode: PropTypes.string.isRequired,
  setTextBlendMode: PropTypes.func.isRequired
};
