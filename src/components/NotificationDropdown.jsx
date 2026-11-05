import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { formatTimeAgo } from '../utils/helpers';
import '../styles/NotificationDropdown.css';

function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkOneRead,
  onMarkAllRead,
  onDeleteOne,
  onClearAll,
  onClose
}) {
  const navigate = useNavigate();

  function handleSelectNotification(notification) {
    if (!notification.isRead) {
      onMarkOneRead(notification.id);
    }
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
    }
    if (onClose) {
      onClose();
    }
  }

  return (
    <div className="notif-dropdown" role="region" aria-label="Notifications">
      <div className="notif-dropdown-header">
        <div className="notif-dropdown-title">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="notif-unread-pill">{unreadCount} new</span>
          )}
        </div>

        <div className="notif-header-actions">
          <button
            type="button"
            className="notif-mark-all-btn"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            title="Mark all notifications as read"
          >
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <CheckCheck size={14} />
              Mark all read
            </span>
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty-state">
            <BellOff
              size={28}
              style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }}
            />
            <p>No notifications right now.</p>
          </div>
        ) : (
          notifications.slice(0, 8).map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
            >
              <div
                className="notif-item-body"
                onClick={() => handleSelectNotification(notif)}
              >
                <div className="notif-item-title">
                  {!notif.isRead && <span className="notif-unread-dot" />}
                  <span>{notif.title}</span>
                </div>
                <p className="notif-item-message">{notif.message}</p>
                <span className="notif-item-time">
                  {formatTimeAgo(notif.createdAt)}
                </span>
              </div>

              <div className="notif-item-actions">
                {!notif.isRead && (
                  <button
                    type="button"
                    className="notif-mark-one-btn"
                    onClick={() => onMarkOneRead(notif.id)}
                    title="Mark as read"
                  >
                    Read
                  </button>
                )}

                {onDeleteOne && (
                  <button
                    type="button"
                    className="notif-delete-btn"
                    onClick={() => onDeleteOne(notif.id)}
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notif-dropdown-footer">
        <button
          type="button"
          className="notif-view-all-link"
          onClick={() => {
            if (onClose) onClose();
            navigate('/notifications');
          }}
        >
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            View Notification Center
            <ArrowRight size={13} />
          </span>
        </button>

        {notifications.length > 0 && onClearAll && (
          <button
            type="button"
            className="notif-mark-all-btn"
            style={{ color: '#dc2626' }}
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
