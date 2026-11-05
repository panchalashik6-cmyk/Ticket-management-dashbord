import React from 'react';
import '../styles/StatusBadge.css';

function StatusBadge({ status = 'Open', isOverdue = false, variant = 'pill' }) {
  const normalized = String(status).toLowerCase().replace(/\s+/g, '-');

  if (variant === 'plain') {
    return (
      <span
        className={`status-text-only ${
          isOverdue || normalized === 'escalated' ? 'overdue' : ''
        }`}
      >
        {status}
      </span>
    );
  }

  return (
    <span className={`status-badge status-${normalized}`}>
      <span>{status}</span>
    </span>
  );
}

export default StatusBadge;
