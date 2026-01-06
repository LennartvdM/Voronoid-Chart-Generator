import React from 'react';
import PropTypes from 'prop-types';
import { COLOR_SCHEMES, TIER_METHODS } from '../../constants';

/**
 * Color scheme and tier classification controls
 */
export default function ColorSchemeControls({
  colorScheme,
  setColorScheme,
  tierMethod,
  setTierMethod,
  tierConfig,
  setTierConfig,
  useSmoothing,
  setUseSmoothing
}) {
  const scheme = COLOR_SCHEMES[colorScheme];
  const schemeKeys = Object.keys(COLOR_SCHEMES);

  const handleTierConfigChange = (key, value) => {
    setTierConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderTierConfig = () => {
    if (colorScheme === 'none') return null;

    switch (tierMethod) {
      case 'topN':
        return (
          <label className="control-row">
            <span className="control-label">Tier boundaries</span>
            <input
              type="text"
              value={(tierConfig.tiers || [1, 3, 5, 10]).join(', ')}
              onChange={(e) => {
                const tiers = e.target.value
                  .split(',')
                  .map(s => parseInt(s.trim(), 10))
                  .filter(n => !isNaN(n) && n > 0);
                if (tiers.length > 0) {
                  handleTierConfigChange('tiers', tiers.sort((a, b) => a - b));
                }
              }}
              placeholder="1, 3, 5, 10"
              className="tier-input"
              aria-label="Top N tier boundaries"
            />
          </label>
        );

      case 'percentile':
        return (
          <label className="control-row">
            <span className="control-label">Percentiles</span>
            <input
              type="text"
              value={(tierConfig.thresholds || [90, 75, 50, 25]).join(', ')}
              onChange={(e) => {
                const thresholds = e.target.value
                  .split(',')
                  .map(s => parseInt(s.trim(), 10))
                  .filter(n => !isNaN(n) && n >= 0 && n <= 100);
                if (thresholds.length > 0) {
                  handleTierConfigChange('thresholds', thresholds.sort((a, b) => b - a));
                }
              }}
              placeholder="90, 75, 50, 25"
              className="tier-input"
              aria-label="Percentile thresholds"
            />
          </label>
        );

      case 'percentage':
        return (
          <label className="control-row">
            <span className="control-label">% thresholds</span>
            <input
              type="text"
              value={(tierConfig.thresholds || [10, 5, 2, 1]).join(', ')}
              onChange={(e) => {
                const thresholds = e.target.value
                  .split(',')
                  .map(s => parseFloat(s.trim()))
                  .filter(n => !isNaN(n) && n >= 0);
                if (thresholds.length > 0) {
                  handleTierConfigChange('thresholds', thresholds.sort((a, b) => b - a));
                }
              }}
              placeholder="10, 5, 2, 1"
              className="tier-input"
              aria-label="Percentage thresholds"
            />
          </label>
        );

      case 'equalCount':
        return (
          <label className="control-row">
            <span className="control-label">Groups</span>
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={tierConfig.groups || 5}
              onChange={(e) => handleTierConfigChange('groups', Number(e.target.value))}
              aria-label="Number of equal groups"
            />
            <span className="control-value">{tierConfig.groups || 5}</span>
          </label>
        );

      default:
        return null;
    }
  };

  return (
    <div className="control-section color-scheme-controls">
      <div className="control-section-title">Color Scheme</div>

      <label className="control-row">
        <span className="control-label">Scheme</span>
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value)}
          aria-label="Color scheme"
        >
          {schemeKeys.map(key => (
            <option key={key} value={key}>
              {COLOR_SCHEMES[key].name}
            </option>
          ))}
        </select>
      </label>

      {scheme && scheme.description && (
        <div className="control-description">{scheme.description}</div>
      )}

      {/* Color scheme preview */}
      {scheme && scheme.colors && scheme.colors.length > 0 && (
        <div className="scheme-preview" aria-label="Color scheme preview">
          {scheme.colors.map((color, i) => (
            <div
              key={i}
              className="scheme-color"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}

      {colorScheme !== 'none' && (
        <>
          <label className="control-row">
            <span className="control-label">Classification</span>
            <select
              value={tierMethod}
              onChange={(e) => setTierMethod(e.target.value)}
              aria-label="Tier classification method"
            >
              {Object.entries(TIER_METHODS).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <div className="control-description">
            {TIER_METHODS[tierMethod]?.description}
          </div>

          {renderTierConfig()}

          <label className="control-row checkbox-row">
            <input
              type="checkbox"
              checked={useSmoothing}
              onChange={(e) => setUseSmoothing(e.target.checked)}
              aria-label="Use smooth color interpolation"
            />
            <span className="control-label">Smooth gradient</span>
          </label>
        </>
      )}
    </div>
  );
}

ColorSchemeControls.propTypes = {
  colorScheme: PropTypes.string.isRequired,
  setColorScheme: PropTypes.func.isRequired,
  tierMethod: PropTypes.string.isRequired,
  setTierMethod: PropTypes.func.isRequired,
  tierConfig: PropTypes.object.isRequired,
  setTierConfig: PropTypes.func.isRequired,
  useSmoothing: PropTypes.bool.isRequired,
  setUseSmoothing: PropTypes.func.isRequired
};
