import React from 'react';
import { Inbox } from 'lucide-react';
import '../styles/EmptyState.css';

function EmptyState({
  title = 'No Records Found',
  description = 'No tickets found. Create a new support ticket to get started.',
  actionLabel,
  onAction
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        <Inbox size={24} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
