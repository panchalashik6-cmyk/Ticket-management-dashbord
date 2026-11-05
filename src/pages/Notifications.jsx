import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Ticket,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatDateTime, formatTimeAgo } from '../utils/helpers';
import '../styles/Notifications.css';

function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchAllData,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications
  } = useTicketContext();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'created' | 'assigned' | 'updates'
  const [showClearModal, setShowClearModal] = useState(false);

  if (loading) {
    return <Loader message="Loading notification center..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Notifications Unavailable"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'created') return n.type === 'ticket_created';
    if (activeTab === 'assigned') return n.type === 'ticket_assigned';
    if (activeTab === 'updates') {
      return n.type === 'status_changed' || n.type === 'priority_changed';
    }
    return true;
  });

  function renderTypeIcon(type) {
    if (type === 'ticket_assigned') return <UserCheck size={18} />;
    if (type === 'status_changed') return <RefreshCw size={18} />;
    if (type === 'priority_changed') return <AlertTriangle size={18} />;
    return <Ticket size={18} />;
  }

  return (
    <div className="notifications-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">
            Real-time alerts for ticket creations, agent assignments, status
            transitions, and priority escalations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={markAllNotificationsAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={15} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>

          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => setShowClearModal(true)}
            disabled={notifications.length === 0}
          >
            <Trash2 size={15} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notifications-toolbar-card">
        <div className="queue-tabs">
          <button
            type="button"
            className={`queue-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({notifications.length})
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              activeTab === 'unread' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              activeTab === 'created' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('created')}
          >
            New Tickets
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              activeTab === 'assigned' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('assigned')}
          >
            Assignments
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              activeTab === 'updates' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('updates')}
          >
            Status & Priority
          </button>
        </div>
      </div>

      {/* Notifications Feed or Empty State */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          title="No Notifications in This View"
          description={
            notifications.length === 0
              ? 'Your notification center is completely clear. New ticket events will appear here automatically.'
              : 'No notifications match the selected category filter.'
          }
          actionLabel={activeTab !== 'all' ? 'Show All Notifications' : undefined}
          onAction={activeTab !== 'all' ? () => setActiveTab('all') : undefined}
        />
      ) : (
        <div className="notifications-feed-card">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-page-row ${
                !notif.isRead ? 'unread' : ''
              }`}
            >
              <div className="notif-row-left">
                <div className={`notif-type-icon type-${notif.type}`}>
                  {renderTypeIcon(notif.type)}
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}
                  >
                    {!notif.isRead && <span className="notif-unread-dot" />}
                    <strong
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-dark)'
                      }}
                    >
                      {notif.title}
                    </strong>
                  </div>

                  <p
                    style={{
                      fontSize: '13.5px',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}
                  >
                    {notif.message}
                  </p>

                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {formatTimeAgo(notif.createdAt)} •{' '}
                    {formatDateTime(notif.createdAt)}
                  </div>
                </div>
              </div>

              <div className="notif-row-actions">
                {notif.ticketId && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      if (!notif.isRead) markNotificationAsRead(notif.id);
                      navigate(`/tickets/${notif.ticketId}`);
                    }}
                  >
                    <span>Open #{notif.ticketId}</span>
                    <ExternalLink size={12} />
                  </button>
                )}

                {!notif.isRead && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => markNotificationAsRead(notif.id)}
                  >
                    Mark Read
                  </button>
                )}

                <button
                  type="button"
                  className="icon-action-btn delete"
                  onClick={() => deleteNotification(notif.id)}
                  title="Delete Notification"
                  aria-label="Delete Notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Notifications Confirmation Modal */}
      <Modal
        isOpen={showClearModal}
        title="Clear All Notifications"
        onClose={() => setShowClearModal(false)}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.5
          }}
        >
          Are you sure you want to permanently clear all{' '}
          <strong>{notifications.length}</strong> notifications from your
          notification center?
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowClearModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              clearAllNotifications();
              setShowClearModal(false);
            }}
          >
            Clear All Notifications
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Notifications;
