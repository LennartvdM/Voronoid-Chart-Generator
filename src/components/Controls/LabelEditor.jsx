import React from 'react';
import PropTypes from 'prop-types';
import { CATEGORIES, TEXT_COLORS } from '../../constants';

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
    <div style={{
      width: '100%',
      maxWidth: 1000,
      padding: '16px 20px',
      background: '#f5f5f5',
      borderRadius: 8,
      fontSize: 13,
      maxHeight: 450,
      overflowY: 'auto'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 12, color: '#333' }}>Label Overrides</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, index) => {
          const override = labelOverrides[index] || {};
          const currentVisibility = override.visibility || 'normal';
          const currentTextColor = override.textColor || null;
          const originalLabel = item.displayLabel || item.label;
          const defaultColor = item.textColor || CATEGORIES[item.cat].color;

          return (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '130px 1fr auto 140px',
              gap: 10,
              alignItems: 'center',
              padding: '8px 12px',
              background: '#fff',
              borderRadius: 4,
              border: '1px solid #e0e0e0'
            }}>
              {/* Original label with category color */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: CATEGORIES[item.cat].color,
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: 11,
                  color: '#333',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {originalLabel.replace('\n', ' ')}
                </span>
                <span style={{ color: '#999', fontSize: 10 }}>
                  {cellData[index]?.pct || ''}%
                </span>
              </div>

              {/* Custom label input */}
              <input
                type="text"
                placeholder="Custom label (use \n for newline)"
                value={override.customLabel || ''}
                onChange={(e) => updateLabelOverride(index, 'customLabel', e.target.value)}
                style={{
                  padding: '5px 8px',
                  border: '1px solid #ddd',
                  borderRadius: 3,
                  fontSize: 12,
                  background: override.customLabel ? '#fffde7' : '#fff',
                  minWidth: 0
                }}
                aria-label={`Custom label for ${item.label}`}
              />

              {/* Color picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', maxWidth: 180 }}>
                {TEXT_COLORS.map((color, ci) => (
                  <button
                    key={ci}
                    onClick={() => updateLabelOverride(index, 'textColor', color)}
                    title={color || 'Default'}
                    aria-label={color ? `Set text color to ${color}` : 'Reset to default color'}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      border: (currentTextColor === color || (!currentTextColor && !color))
                        ? '2px solid #333'
                        : '1px solid #ccc',
                      background: color || `linear-gradient(135deg, ${defaultColor} 50%, #fff 50%)`,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  />
                ))}
              </div>

              {/* Visibility toggle */}
              <div style={{ display: 'flex', gap: 3 }} role="group" aria-label="Label visibility">
                {['force', 'normal', 'hidden'].map((vis) => (
                  <button
                    key={vis}
                    onClick={() => updateLabelOverride(index, 'visibility', vis)}
                    aria-pressed={currentVisibility === vis}
                    style={{
                      flex: 1,
                      padding: '4px 5px',
                      fontSize: 9,
                      cursor: 'pointer',
                      background: currentVisibility === vis ? '#333' : '#f0f0f0',
                      color: currentVisibility === vis ? '#fff' : '#555',
                      border: 'none',
                      borderRadius: 3
                    }}
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
