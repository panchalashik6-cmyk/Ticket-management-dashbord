import axios from 'axios';
import initialDb from '../../db.json';

// Base URL for JSON Server mock REST API
const API_BASE_URL = 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 2500,
  headers: {
    'Content-Type': 'application/json'
  }
});

// LocalStorage fallback keys (used automatically if JSON Server on port 5000 is temporarily unreachable)
const STORAGE_KEYS = {
  tickets: 'helpdesk_fallback_tickets_v2',
  agents: 'helpdesk_fallback_agents_v2',
  comments: 'helpdesk_fallback_comments_v2',
  activities: 'helpdesk_fallback_activities_v2',
  notifications: 'helpdesk_fallback_notifications_v2'
};

function getLocalCollection(key, defaultData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (raw) {
      return JSON.parse(raw);
    }
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(defaultData));
    return [...defaultData];
  } catch {
    return [...defaultData];
  }
}

function saveLocalCollection(key, data) {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function isServerOfflineError(error) {
  return (
    !error.response ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK'
  );
}

function formatApiError(error, fallbackMessage) {
  if (error.response?.status === 404) {
    return 'The requested record was not found on the server.';
  }
  return (
    error.response?.data?.message ||
    fallbackMessage ||
    'An unexpected API error occurred.'
  );
}

// ==================== TICKETS ====================

export async function getTickets() {
  try {
    const response = await apiClient.get('/tickets');
    saveLocalCollection('tickets', response.data);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      return getLocalCollection('tickets', initialDb.tickets || []);
    }
    throw new Error(formatApiError(error, 'Failed to fetch tickets.'));
  }
}

export async function getTicketById(id) {
  try {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('tickets', initialDb.tickets || []);
      const found = list.find((t) => String(t.id) === String(id));
      if (!found) throw new Error(`Ticket #${id} could not be found.`);
      return found;
    }
    throw new Error(formatApiError(error, `Ticket #${id} could not be found.`));
  }
}

export async function createTicket(ticketData) {
  try {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('tickets', initialDb.tickets || []);
      const updated = [ticketData, ...list];
      saveLocalCollection('tickets', updated);
      return ticketData;
    }
    throw new Error(formatApiError(error, 'Failed to create ticket.'));
  }
}

export async function updateTicketPut(id, ticketData) {
  try {
    const response = await apiClient.put(`/tickets/${id}`, ticketData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('tickets', initialDb.tickets || []);
      const updated = list.map((t) =>
        String(t.id) === String(id) ? { ...t, ...ticketData } : t
      );
      saveLocalCollection('tickets', updated);
      return ticketData;
    }
    throw new Error(formatApiError(error, 'Failed to update ticket.'));
  }
}

export async function updateTicketPatch(id, partialData) {
  try {
    const response = await apiClient.patch(`/tickets/${id}`, partialData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('tickets', initialDb.tickets || []);
      let updatedItem = null;
      const updated = list.map((t) => {
        if (String(t.id) === String(id)) {
          updatedItem = { ...t, ...partialData };
          return updatedItem;
        }
        return t;
      });
      if (!updatedItem) throw new Error(`Ticket #${id} not found.`);
      saveLocalCollection('tickets', updated);
      return updatedItem;
    }
    throw new Error(formatApiError(error, 'Failed to update ticket details.'));
  }
}

// Delete a ticket AND remove its related comments, activities, and notifications so no orphaned records remain
export async function deleteTicketAndRelated(id) {
  try {
    const [commentsRes, activitiesRes, notificationsRes] = await Promise.all([
      apiClient.get(`/comments?ticketId=${id}`),
      apiClient.get(`/activities?ticketId=${id}`),
      apiClient.get(`/notifications?ticketId=${id}`)
    ]);

    const deletePromises = [
      ...commentsRes.data.map((c) => apiClient.delete(`/comments/${c.id}`)),
      ...activitiesRes.data.map((a) => apiClient.delete(`/activities/${a.id}`)),
      ...notificationsRes.data.map((n) => apiClient.delete(`/notifications/${n.id}`))
    ];

    await Promise.all(deletePromises);
    await apiClient.delete(`/tickets/${id}`);
    return true;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const tickets = getLocalCollection('tickets', initialDb.tickets || []);
      const comments = getLocalCollection('comments', initialDb.comments || []);
      const activities = getLocalCollection(
        'activities',
        initialDb.activities || []
      );
      const notifications = getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );

      saveLocalCollection(
        'tickets',
        tickets.filter((t) => String(t.id) !== String(id))
      );
      saveLocalCollection(
        'comments',
        comments.filter((c) => String(c.ticketId) !== String(id))
      );
      saveLocalCollection(
        'activities',
        activities.filter((a) => String(a.ticketId) !== String(id))
      );
      saveLocalCollection(
        'notifications',
        notifications.filter((n) => String(n.ticketId) !== String(id))
      );
      return true;
    }
    throw new Error(formatApiError(error, 'Failed to delete ticket.'));
  }
}

// ==================== AGENTS ====================

export async function getAgents() {
  try {
    const response = await apiClient.get('/agents');
    saveLocalCollection('agents', response.data);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      return getLocalCollection('agents', initialDb.agents || []);
    }
    throw new Error(formatApiError(error, 'Failed to fetch agents.'));
  }
}

export async function updateAgentPatch(id, partialData) {
  try {
    const response = await apiClient.patch(`/agents/${id}`, partialData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('agents', initialDb.agents || []);
      let updatedAgent = null;
      const updated = list.map((a) => {
        if (String(a.id) === String(id)) {
          updatedAgent = { ...a, ...partialData };
          return updatedAgent;
        }
        return a;
      });
      saveLocalCollection('agents', updated);
      return updatedAgent;
    }
    throw new Error(formatApiError(error, 'Failed to update agent status.'));
  }
}

// ==================== COMMENTS ====================

export async function getComments() {
  try {
    const response = await apiClient.get('/comments');
    saveLocalCollection('comments', response.data);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      return getLocalCollection('comments', initialDb.comments || []);
    }
    throw new Error(formatApiError(error, 'Failed to fetch comments.'));
  }
}

export async function createComment(commentData) {
  try {
    const response = await apiClient.post('/comments', commentData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('comments', initialDb.comments || []);
      const updated = [...list, commentData];
      saveLocalCollection('comments', updated);
      return commentData;
    }
    throw new Error(formatApiError(error, 'Failed to post comment.'));
  }
}

// ==================== ACTIVITIES ====================

export async function getActivities() {
  try {
    const response = await apiClient.get('/activities');
    saveLocalCollection('activities', response.data);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      return getLocalCollection('activities', initialDb.activities || []);
    }
    throw new Error(formatApiError(error, 'Failed to fetch activities.'));
  }
}

export async function createActivity(activityData) {
  try {
    const response = await apiClient.post('/activities', activityData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection('activities', initialDb.activities || []);
      const updated = [activityData, ...list];
      saveLocalCollection('activities', updated);
      return activityData;
    }
    throw new Error(formatApiError(error, 'Failed to log activity.'));
  }
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications() {
  try {
    const response = await apiClient.get('/notifications');
    saveLocalCollection('notifications', response.data);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      return getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );
    }
    throw new Error(formatApiError(error, 'Failed to fetch notifications.'));
  }
}

export async function createNotification(notificationData) {
  try {
    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );
      const updated = [notificationData, ...list];
      saveLocalCollection('notifications', updated);
      return notificationData;
    }
    throw new Error(formatApiError(error, 'Failed to create notification.'));
  }
}

export async function markNotificationReadApi(id) {
  try {
    const response = await apiClient.patch(`/notifications/${id}`, {
      isRead: true
    });
    return response.data;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );
      const updated = list.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      saveLocalCollection('notifications', updated);
      return { id, isRead: true };
    }
    throw new Error(formatApiError(error, 'Failed to update notification.'));
  }
}

export async function markAllNotificationsReadApi(unreadNotifications = []) {
  try {
    await Promise.all(
      unreadNotifications.map((n) =>
        apiClient.patch(`/notifications/${n.id}`, { isRead: true })
      )
    );
    return true;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );
      const updated = list.map((n) => ({ ...n, isRead: true }));
      saveLocalCollection('notifications', updated);
      return true;
    }
    throw new Error(
      formatApiError(error, 'Failed to mark notifications as read.')
    );
  }
}

export async function deleteNotificationApi(id) {
  try {
    await apiClient.delete(`/notifications/${id}`);
    return true;
  } catch (error) {
    if (isServerOfflineError(error)) {
      const list = getLocalCollection(
        'notifications',
        initialDb.notifications || []
      );
      saveLocalCollection(
        'notifications',
        list.filter((n) => String(n.id) !== String(id))
      );
      return true;
    }
    throw new Error(formatApiError(error, 'Failed to delete notification.'));
  }
}

export async function clearAllNotificationsApi(allNotifications = []) {
  try {
    await Promise.all(
      allNotifications.map((n) => apiClient.delete(`/notifications/${n.id}`))
    );
    return true;
  } catch (error) {
    if (isServerOfflineError(error)) {
      saveLocalCollection('notifications', []);
      return true;
    }
    throw new Error(formatApiError(error, 'Failed to clear notifications.'));
  }
}
