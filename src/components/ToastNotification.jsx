import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import '../styles/ToastNotification.css';

const TOAST_CONFIG = {
  success: {
    defaultTitle: 'Action Completed',
    Icon: CheckCircle2
  },
  error: {
    defaultTitle: 'Action Failed',
    Icon: AlertCircle
  },
  warning: {
    defaultTitle: 'Attention Required',
    Icon: AlertTriangle
  },
  info: {
    defaultTitle: 'System Information',
    Icon: Info
  }
};

function ToastNotification({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-notification-stack"
      role="region"
      aria-live="polite"
      aria-label="System notifications"
    >
      {toasts.map((toast) => {
        const variant = TOAST_CONFIG[toast.type] ? toast.type : 'success';
        const { defaultTitle, Icon } = TOAST_CONFIG[variant];
        const displayTitle = toast.title || defaultTitle;

        return (
          <div
            key={toast.id}
            className={`toast-notification-card toast-${variant} ${
              toast.isLeaving ? 'toast-leaving' : ''
            }`}
            role="status"
          >
            <div className="toast-notification-left">
              <span className={`toast-status-icon ${variant}`}>
                <Icon size={18} strokeWidth={2.2} />
              </span>

              <div className="toast-content-body">
                <span className="toast-title">{displayTitle}</span>
                <span className="toast-message">{toast.message}</span>
              </div>
            </div>

            <button
              type="button"
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              title="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastNotification;
