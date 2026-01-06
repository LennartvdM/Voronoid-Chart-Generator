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
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: '#333' }}>Inner Gradient</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={gradientEnabled}
            onChange={(e) => setGradientEnabled(e.target.checked)}
            aria-label="Enable inner gradient"
          />
          <span style={{ color: '#555' }}>{gradientEnabled ? 'On' : 'Off'}</span>
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: gradientEnabled ? 1 : 0.4 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Size</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={gradientSize}
            onChange={(e) => setGradientSize(Number(e.target.value))}
            disabled={!gradientEnabled}
            style={{ flex: 1 }}
            aria-label="Gradient size"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(gradientSize * 100).toFixed(0)}%</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Opacity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={gradientOpacity}
            onChange={(e) => setGradientOpacity(Number(e.target.value))}
            disabled={!gradientEnabled}
            style={{ flex: 1 }}
            aria-label="Gradient opacity"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{(gradientOpacity * 100).toFixed(0)}%</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Hue shift</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={gradientHueShift}
            onChange={(e) => setGradientHueShift(Number(e.target.value))}
            disabled={!gradientEnabled}
            style={{ flex: 1 }}
            aria-label="Gradient hue shift"
          />
          <span style={{ minWidth: 30, textAlign: 'right', color: '#666' }}>{gradientHueShift}°</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ minWidth: 100, color: '#555' }}>Blend mode</span>
          <select
            value={gradientBlendMode}
            onChange={(e) => setGradientBlendMode(e.target.value)}
            disabled={!gradientEnabled}
            style={{ flex: 1, padding: '4px 8px', fontSize: 13 }}
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
