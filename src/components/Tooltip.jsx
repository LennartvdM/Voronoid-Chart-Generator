import React from 'react';
import PropTypes from 'prop-types';

/**
 * Tooltip displayed on cell hover
 */
export default function Tooltip({ x, y, label, pct, cat }) {
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left: x + 15,
        top: y - 10,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 13,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ opacity: 0.8, fontSize: 11 }}>{pct}% · {cat}</div>
    </div>
  );
}

Tooltip.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  pct: PropTypes.string.isRequired,
  cat: PropTypes.string.isRequired
};
