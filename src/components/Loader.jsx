import React from 'react';
import '../styles/Loader.css';

function Loader({ message = 'Loading workspace data...' }) {
  return (
    <div className="loader-wrapper" role="status" aria-live="polite">
      <div className="loader-header-bar">
        <div className="loader-spinner" />
        <span>{message}</span>
      </div>

      <div className="skeleton-kpi-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>

      <div className="skeleton-table-box" />
    </div>
  );
}

export default Loader;
