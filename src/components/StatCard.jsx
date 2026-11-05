import React from 'react';
import '../styles/StatCard.css';

function StatCard({
  title,
  value,
  subtitle = 'Total',
  trend = '',
  trendDirection = 'up',
  theme = 'pastel-blue',
  onClick
}) {
  return (
    <div
      className={`stat-card theme-${theme}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-footer">
        <span className="stat-card-subtitle">{subtitle}</span>
        {trend && (
          <span className={`stat-card-trend ${trendDirection}`}>
            <span className={`trend-arrow ${trendDirection}`}>
              {trendDirection === 'up' ? '▲' : '▼'}
            </span>
            <span>{trend}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
