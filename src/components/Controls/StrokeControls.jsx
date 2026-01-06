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
    <div>
      <div style={{ fontWeight: 600, marginBottom: 12, color: '#333' }}>Stroke</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Inner width</span>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={innerStrokeWidth}
            onChange={(e) => setInnerStrokeWidth(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Inner stroke width"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{innerStrokeWidth}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Inner opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={innerStrokeOpacity}
            onChange={(e) => setInnerStrokeOpacity(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Inner stroke opacity"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(innerStrokeOpacity * 100).toFixed(0)}%</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Outer width</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={outerStrokeWidth}
            onChange={(e) => setOuterStrokeWidth(Number(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Outer stroke width"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{outerStrokeWidth}</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Text blend</span>
          <select
            value={textBlendMode}
            onChange={(e) => setTextBlendMode(e.target.value)}
            style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
            aria-label="Text blend mode"
          >
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
          </select>
        </label>
      </div>
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
