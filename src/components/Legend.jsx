import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CATEGORIES } from '../constants';

/**
 * Legend component displaying category colors and aggregate statistics
 */
export default function Legend({ data, cellData }) {
  // Calculate category totals
  const categoryStats = useMemo(() => {
    const stats = {};

    // Initialize all categories
    Object.keys(CATEGORIES).forEach(cat => {
      stats[cat] = { count: 0, totalN: 0, totalPct: 0 };
    });

    // Aggregate data by category
    data.forEach((item, index) => {
      const cat = item.cat;
      if (stats[cat]) {
        stats[cat].count += 1;
        stats[cat].totalN += item.n;
        if (cellData[index]) {
          stats[cat].totalPct += parseFloat(cellData[index].pct) || 0;
        }
      }
    });

    // Convert to array and filter out empty categories
    return Object.entries(stats)
      .filter(([, stat]) => stat.count > 0)
      .map(([cat, stat]) => ({
        key: cat,
        label: CATEGORIES[cat].label,
        color: CATEGORIES[cat].color,
        count: stat.count,
        totalPct: stat.totalPct.toFixed(1)
      }))
      .sort((a, b) => parseFloat(b.totalPct) - parseFloat(a.totalPct));
  }, [data, cellData]);

  if (categoryStats.length === 0) {
    return null;
  }

  return (
    <div className="legend" role="list" aria-label="Category legend">
      {categoryStats.map(({ key, label, color, count, totalPct }) => (
        <div key={key} className="legend-item" role="listitem">
          <span
            className="legend-color"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="legend-label">{label}</span>
          <span className="legend-value" title={`${count} item${count !== 1 ? 's' : ''}`}>
            {totalPct}%
          </span>
        </div>
      ))}
    </div>
  );
}

Legend.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    cat: PropTypes.string.isRequired,
    n: PropTypes.number.isRequired
  })).isRequired,
  cellData: PropTypes.array.isRequired
};
