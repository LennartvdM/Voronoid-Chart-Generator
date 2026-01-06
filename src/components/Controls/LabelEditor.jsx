import React from 'react';
import PropTypes from 'prop-types';
import { CATEGORIES, TEXT_COLORS, CELL_COLORS } from '../../constants';

/**
 * Label customization editor panel
 */
export default function LabelEditor({
  data,
  cellData,
  labelOverrides,
  updateLabelOverride
}) {
  return (
    <div className="label-editor">
      <div className="label-editor-title">Label Overrides</div>
      <div className="label-editor-list">
        {data.map((item, index) => {
          const override = labelOverrides[index] || {};
          const currentVisibility = override.visibility || 'normal';
          const currentTextColor = override.textColor || null;
          const currentCellColor = override.cellColor || null;
          const originalLabel = item.displayLabel || item.label;
          const defaultColor = item.textColor || CATEGORIES[item.cat].color;
          const defaultCellColor = cellData[index]?.color || CATEGORIES[item.cat].color;

          return (
            <div key={index} className="label-editor-item">
              {/* Original label with category color */}
              <div className="label-info">
                <span
                  className="label-color-dot"
                  style={{ backgroundColor: currentCellColor || defaultCellColor }}
                  aria-hidden="true"
                />
                <span className="label-name" title={originalLabel}>
                  {originalLabel.replace('\n', ' ')}
                </span>
                <span className="label-pct">
                  {cellData[index]?.pct || ''}%
                </span>
              </div>

              {/* Custom label input */}
              <input
                type="text"
                className={`label-input ${override.customLabel ? 'modified' : ''}`}
                placeholder="Custom label (use \n for newline)"
                value={override.customLabel || ''}
                onChange={(e) => updateLabelOverride(index, 'customLabel', e.target.value)}
                aria-label={`Custom label for ${item.label}`}
              />

              {/* Cell color picker */}
              <div className="color-picker-section">
                <span className="color-picker-label">Cell</span>
                <div className="color-picker-grid">
                  {CELL_COLORS.map((color, ci) => (
                    <button
                      key={ci}
                      onClick={() => updateLabelOverride(index, 'cellColor', color)}
                      title={color || 'Default'}
                      aria-label={color ? `Set cell color to ${color}` : 'Reset to default cell color'}
                      className={`color-picker-btn ${(currentCellColor === color || (!currentCellColor && !color)) ? 'selected' : ''}`}
                      style={{
                        background: color || `linear-gradient(135deg, ${defaultCellColor} 50%, #fff 50%)`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Text color picker */}
              <div className="color-picker-section">
                <span className="color-picker-label">Text</span>
                <div className="color-picker-grid">
                  {TEXT_COLORS.map((color, ci) => (
                    <button
                      key={ci}
                      onClick={() => updateLabelOverride(index, 'textColor', color)}
                      title={color || 'Default'}
                      aria-label={color ? `Set text color to ${color}` : 'Reset to default text color'}
                      className={`color-picker-btn ${(currentTextColor === color || (!currentTextColor && !color)) ? 'selected' : ''}`}
                      style={{
                        background: color || `linear-gradient(135deg, ${defaultColor} 50%, #fff 50%)`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Visibility toggle */}
              <div className="visibility-toggle" role="group" aria-label="Label visibility">
                {['force', 'normal', 'hidden'].map((vis) => (
                  <button
                    key={vis}
                    onClick={() => updateLabelOverride(index, 'visibility', vis)}
                    aria-pressed={currentVisibility === vis}
                    className={`visibility-btn ${currentVisibility === vis ? 'active' : ''}`}
                  >
                    {vis === 'force' ? 'Show' : vis === 'hidden' ? 'Hide' : 'Auto'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

LabelEditor.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    displayLabel: PropTypes.string,
    cat: PropTypes.string.isRequired,
    textColor: PropTypes.string
  })).isRequired,
  cellData: PropTypes.arrayOf(PropTypes.shape({
    pct: PropTypes.string
  })).isRequired,
  labelOverrides: PropTypes.object.isRequired,
  updateLabelOverride: PropTypes.func.isRequired
};
