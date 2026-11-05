import React from 'react';
import '../styles/PriorityBadge.css';

function PriorityBadge({ priority = 'Medium' }) {
  const normalized = String(priority).toLowerCase();

  return (
    <span className={`priority-badge priority-${normalized}`}>
      {priority}
    </span>
  );
}

export default PriorityBadge;
