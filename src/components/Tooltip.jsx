import React from 'react';
import PropTypes from 'prop-types';

/**
 * Tooltip displayed on cell hover
 */
export default function Tooltip({ x, y, label, pct, cat }) {
  return (
    <div
      role="tooltip"
      className="tooltip"
      style={{
        left: x + 15,
        top: y - 10
      }}
    >
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-detail">{pct}% · {cat}</div>
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
