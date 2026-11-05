import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getTickets,
  getAgents,
  updateAgentPatch,
  getComments,
  getActivities,
  getNotifications,
  createTicket,
  updateTicketPut,
  updateTicketPatch,
  deleteTicketAndRelated,
  createComment,
  createActivity,
  createNotification,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  clearAllNotificationsApi
} from '../services/ticketApi';
import { generateTicketId } from '../utils/helpers';

const TicketContext = createContext();

const SETTINGS_STORAGE_KEY = 'applen_helpdesk_admin_ashik_panchal_v2';

const DEFAULT_USER_SETTINGS = {
  name: 'Ashik Panchal',
  role: 'Admin',
  title: 'Admin',
  email: 'ashik.panchal@applensolutions.com',
  phone: '+1 (555) 234-5678',
  department: 'Customer Support Operations',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  preferences: {
    emailAlerts: true,
    desktopNotifications: true,
    notifyOnNewTicket: true,
    notifyOnAssignment: true,
    notifyOnStatusChange: true,
    notifyOnPriorityChange: true,
    compactTables: false,
    defaultRecordsPerPage: 10,
    theme: 'light'
  }
};

function loadInitialUserSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        preferences: {
          ...DEFAULT_USER_SETTINGS.preferences,
          ...(parsed.preferences || {})
        }
      };
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_USER_SETTINGS;
}

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global search term from top header
  const [headerSearch, setHeaderSearch] = useState('');

  // Global toast notifications queue
  const [toasts, setToasts] = useState([]);

  // Current logged-in user profile & preferences (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(loadInitialUserSettings);

  // Apply theme & table density classes on startup and when preferences change
  useEffect(() => {
    const theme = currentUser?.preferences?.theme || 'light';
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    if (currentUser?.preferences?.compactTables) {
      document.body.classList.add('compact-tables');
    } else {
      document.body.classList.remove('compact-tables');
    }
  }, [currentUser]);

  function removeToast(id) {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 240);
  }

  function addToast(message, type = 'success', title = '') {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setToasts((prev) => {
      // Avoid duplicate toast notifications for a single action
      const isDuplicate = prev.some(
        (existing) =>
          existing.message === message &&
          existing.type === type &&
          !existing.isLeaving
      );
      if (isDuplicate) return prev;
      return [...prev, { id, message, type, title, isLeaving: false }];
    });

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isLeaving: true } : t))
      );
    }, 3300);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3550);
  }

  // Load all data from JSON Server on startup
  async function fetchAllData() {
    setLoading(true);
    setError(null);
    try {
      const [
        ticketsData,
        agentsData,
        commentsData,
        activitiesData,
        notificationsData
      ] = await Promise.all([
        getTickets(),
        getAgents(),
        getComments(),
        getActivities(),
        getNotifications()
      ]);

      setTickets(ticketsData);
      setAgents(agentsData);
      setComments(commentsData);
      setActivities(
        [...activitiesData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
      setNotifications(
        [...notificationsData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to load application data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  // Active agents helper (only active agents can be assigned tickets)
  const activeAgents = agents.filter(
    (a) => String(a.status).toLowerCase() === 'active'
  );

  // Helper to record a new activity in JSON Server and update state
  async function logActivity({
    ticketId,
    title,
    description,
    actor,
    type,
    avatar
  }) {
    const newActivity = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: String(ticketId),
      title,
      description,
      actor: actor || currentUser.name,
      type,
      avatar: avatar || '',
      timeAgo: 'Just now',
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await createActivity(newActivity);
      setActivities((prev) => [saved, ...prev]);
    } catch {
      setActivities((prev) => [newActivity, ...prev]);
    }
  }

  // Helper to record a new notification in JSON Server and update state
  async function pushNotification({ ticketId, title, message, type }) {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: String(ticketId),
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await createNotification(newNotif);
      setNotifications((prev) => [saved, ...prev]);
    } catch {
      setNotifications((prev) => [newNotif, ...prev]);
    }
  }

  // 1. Create a new ticket
  async function addNewTicket(formValues) {
    const newId = generateTicketId(tickets);
    let assigned =
      formValues.assignedAgent && formValues.assignedAgent.trim() !== ''
        ? formValues.assignedAgent
        : 'Unassigned';

    // Ensure only active agents can be assigned
    if (assigned !== 'Unassigned') {
      const targetAgent = agents.find((a) => a.name === assigned);
      if (targetAgent && targetAgent.status !== 'Active') {
        throw new Error(
          `Cannot assign ticket to ${assigned} because the agent is currently Inactive.`
        );
      }
    }

    const nowIso = new Date().toISOString();

    const newTicketObj = {
      id: newId,
      ticketNumber: `#${newId}`,
      customerName: formValues.customerName.trim(),
      email: formValues.email.trim(),
      subject: formValues.subject.trim(),
      description: formValues.description.trim(),
      category: formValues.category,
      priority: formValues.priority,
      assignedAgent: assigned,
      status: 'Open',
      createdAt: nowIso,
      updatedAt: nowIso,
      dueDate: formValues.dueDate
    };

    const created = await createTicket(newTicketObj);
    setTickets((prev) => [created, ...prev]);

    await logActivity({
      ticketId: created.id,
      title: 'New Ticket',
      description: `Ticket ${created.ticketNumber} (${created.subject}) created for ${created.customerName}`,
      actor: created.customerName,
      type: 'ticket_created',
      avatar: ''
    });

    await pushNotification({
      ticketId: created.id,
      title: 'New Ticket Created',
      message: `Ticket ${created.ticketNumber}: "${created.subject}" was submitted by ${created.customerName}.`,
      type: 'ticket_created'
    });

    if (assigned !== 'Unassigned') {
      const agentObj = agents.find((a) => a.name === assigned);
      await logActivity({
        ticketId: created.id,
        title: assigned,
        description: `Ticket ${created.ticketNumber} assigned to ${assigned}`,
        actor: currentUser.name,
        type: 'ticket_assigned',
        avatar: agentObj ? agentObj.avatar : ''
      });

      await pushNotification({
        ticketId: created.id,
        title: 'Ticket Assigned',
        message: `Ticket ${created.ticketNumber} has been assigned to ${assigned}.`,
        type: 'ticket_assigned'
      });
    }

    addToast(
      `Support ticket ${created.ticketNumber} has been created for ${created.customerName}.`,
      'success',
      'New Ticket Created'
    );
    return created;
  }

  // 2. Full Ticket Update (PUT /tickets/:id)
  async function editTicket(id, updatedFields) {
    const existing = tickets.find((t) => String(t.id) === String(id));
    if (!existing) {
      throw new Error(`Ticket #${id} not found.`);
    }

    const assigned =
      updatedFields.assignedAgent && updatedFields.assignedAgent.trim() !== ''
        ? updatedFields.assignedAgent
        : 'Unassigned';

    // Validate active agent rule if assignment is changing
    if (assigned !== 'Unassigned' && assigned !== existing.assignedAgent) {
      const targetAgent = agents.find((a) => a.name === assigned);
      if (targetAgent && targetAgent.status !== 'Active') {
        throw new Error(
          `Cannot assign ticket to ${assigned} because the agent is Inactive.`
        );
      }
    }

    const updatedTicketObj = {
      ...existing,
      ...updatedFields,
      assignedAgent: assigned,
      updatedAt: new Date().toISOString()
    };

    const saved = await updateTicketPut(id, updatedTicketObj);
    setTickets((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? saved : t))
    );

    if (existing.status !== saved.status) {
      await logActivity({
        ticketId: id,
        title: currentUser.name,
        description: `Status changed from ${existing.status} to ${saved.status}`,
        actor: currentUser.name,
        type: 'status_changed',
        avatar: currentUser.avatar
      });

      await pushNotification({
        ticketId: id,
        title: 'Ticket Status Changed',
        message: `Ticket ${saved.ticketNumber} status updated to ${saved.status}.`,
        type: 'status_changed'
      });
    }

    if (existing.assignedAgent !== saved.assignedAgent) {
      const agentObj = agents.find((a) => a.name === saved.assignedAgent);
      await logActivity({
        ticketId: id,
        title: saved.assignedAgent,
        description: `Ticket ${saved.ticketNumber} assigned to ${saved.assignedAgent}`,
        actor: currentUser.name,
        type: 'ticket_assigned',
        avatar: agentObj ? agentObj.avatar : currentUser.avatar
      });

      await pushNotification({
        ticketId: id,
        title: 'Ticket Assignment Updated',
        message: `Ticket ${saved.ticketNumber} assigned to ${saved.assignedAgent}.`,
        type: 'ticket_assigned'
      });
    }

    if (existing.priority !== saved.priority) {
      await logActivity({
        ticketId: id,
        title: currentUser.name,
        description: `Priority changed from ${existing.priority} to ${saved.priority}`,
        actor: currentUser.name,
        type: 'priority_changed',
        avatar: currentUser.avatar
      });

      await pushNotification({
        ticketId: id,
        title: 'Ticket Priority Updated',
        message: `Ticket ${saved.ticketNumber} priority changed from ${existing.priority} to ${saved.priority}.`,
        type: 'priority_changed'
      });
    }

    if (
      existing.status === saved.status &&
      existing.assignedAgent === saved.assignedAgent &&
      existing.priority === saved.priority
    ) {
      await logActivity({
        ticketId: id,
        title: currentUser.name,
        description: `Updated details on ticket ${saved.ticketNumber}`,
        actor: currentUser.name,
        type: 'ticket_updated',
        avatar: currentUser.avatar
      });
    }

    addToast(
      `Details for ticket ${saved.ticketNumber} have been saved.`,
      'success',
      'Ticket Details Updated'
    );
    return saved;
  }

  // 3. Change Ticket Status (PATCH /tickets/:id)
  async function changeTicketStatus(id, newStatus) {
    const existing = tickets.find((t) => String(t.id) === String(id));
    if (!existing) throw new Error(`Ticket #${id} not found.`);
    if (existing.status === newStatus) return existing;

    const wasClosedOrResolved =
      existing.status === 'Resolved' || existing.status === 'Closed';
    const isReopening =
      wasClosedOrResolved &&
      (newStatus === 'Open' || newStatus === 'In Progress');

    const saved = await updateTicketPatch(id, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    setTickets((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? saved : t))
    );

    const actionDescription = isReopening
      ? `Reopened ticket ${saved.ticketNumber} (changed from ${existing.status} to ${newStatus})`
      : `Status changed from ${existing.status} to ${newStatus} on ${saved.ticketNumber}`;

    await logActivity({
      ticketId: id,
      title: currentUser.name,
      description: actionDescription,
      actor: currentUser.name,
      type: 'status_changed',
      avatar: currentUser.avatar
    });

    await pushNotification({
      ticketId: id,
      title: isReopening ? 'Ticket Reopened' : 'Ticket Status Updated',
      message: `Ticket ${saved.ticketNumber} status changed from ${existing.status} to ${newStatus}.`,
      type: 'status_changed'
    });

    addToast(
      `Status for ticket ${saved.ticketNumber} was updated to ${newStatus}.`,
      'success',
      isReopening ? 'Support Ticket Reopened' : 'Ticket Status Updated'
    );
    return saved;
  }

  // 4. Assign or Reassign Agent (PATCH /tickets/:id) - Only Active agents allowed
  async function assignTicketAgent(id, agentName) {
    const existing = tickets.find((t) => String(t.id) === String(id));
    if (!existing) throw new Error(`Ticket #${id} not found.`);

    const finalAgent =
      agentName && agentName.trim() !== '' ? agentName : 'Unassigned';
    if (existing.assignedAgent === finalAgent) return existing;

    if (finalAgent !== 'Unassigned') {
      const targetAgent = agents.find((a) => a.name === finalAgent);
      if (targetAgent && targetAgent.status !== 'Active') {
        throw new Error(
          `Cannot assign ticket to ${finalAgent} because the agent is Inactive.`
        );
      }
    }

    const saved = await updateTicketPatch(id, {
      assignedAgent: finalAgent,
      updatedAt: new Date().toISOString()
    });
    setTickets((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? saved : t))
    );

    const agentObj = agents.find((a) => a.name === finalAgent);

    await logActivity({
      ticketId: id,
      title: finalAgent === 'Unassigned' ? currentUser.name : finalAgent,
      description:
        finalAgent === 'Unassigned'
          ? `Ticket ${saved.ticketNumber} marked as Unassigned (previously ${existing.assignedAgent})`
          : `Ticket ${saved.ticketNumber} assigned to ${finalAgent} (previously ${existing.assignedAgent})`,
      actor: currentUser.name,
      type: 'ticket_assigned',
      avatar: agentObj ? agentObj.avatar : currentUser.avatar
    });

    await pushNotification({
      ticketId: id,
      title: 'Ticket Assignment Updated',
      message:
        finalAgent === 'Unassigned'
          ? `Ticket ${saved.ticketNumber} is now Unassigned.`
          : `Ticket ${saved.ticketNumber} has been assigned to ${finalAgent}.`,
      type: 'ticket_assigned'
    });

    addToast(
      finalAgent === 'Unassigned'
        ? `Ticket ${saved.ticketNumber} is now marked as unassigned.`
        : `Ticket ${saved.ticketNumber} has been assigned to ${finalAgent}.`,
      finalAgent === 'Unassigned' ? 'info' : 'success',
      'Ticket Assignment Updated'
    );
    return saved;
  }

  // 5. Change Ticket Priority (PATCH /tickets/:id) - Generates activity & notification
  async function changeTicketPriority(id, newPriority) {
    const existing = tickets.find((t) => String(t.id) === String(id));
    if (!existing) throw new Error(`Ticket #${id} not found.`);
    if (existing.priority === newPriority) return existing;

    const saved = await updateTicketPatch(id, {
      priority: newPriority,
      updatedAt: new Date().toISOString()
    });
    setTickets((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? saved : t))
    );

    await logActivity({
      ticketId: id,
      title: currentUser.name,
      description: `Ticket ${saved.ticketNumber} priority changed from ${existing.priority} to ${newPriority}`,
      actor: currentUser.name,
      type: 'priority_changed',
      avatar: currentUser.avatar
    });

    await pushNotification({
      ticketId: id,
      title: 'Ticket Priority Changed',
      message: `Ticket ${saved.ticketNumber} priority updated from ${existing.priority} to ${newPriority}.`,
      type: 'priority_changed'
    });

    addToast(
      `Priority for ticket ${saved.ticketNumber} was updated to ${newPriority}.`,
      newPriority === 'Urgent' ? 'warning' : 'success',
      'Ticket Priority Updated'
    );
    return saved;
  }

  // 6. Bulk Ticket Updates (Status, Priority, or Agent Assignment)
  async function bulkUpdateTickets(ticketIds = [], partialFields = {}) {
    if (!ticketIds.length) return;

    if (
      partialFields.assignedAgent &&
      partialFields.assignedAgent !== 'Unassigned'
    ) {
      const targetAgent = agents.find(
        (a) => a.name === partialFields.assignedAgent
      );
      if (targetAgent && targetAgent.status !== 'Active') {
        throw new Error(
          `Cannot assign tickets to ${partialFields.assignedAgent} because the agent is Inactive.`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const payload = { ...partialFields, updatedAt: nowIso };

    const updatedResults = await Promise.all(
      ticketIds.map((id) => updateTicketPatch(id, payload))
    );

    const updatedMap = new Map(
      updatedResults.map((item) => [String(item.id), item])
    );

    setTickets((prev) =>
      prev.map((t) =>
        updatedMap.has(String(t.id)) ? updatedMap.get(String(t.id)) : t
      )
    );

    const summaryText = Object.entries(partialFields)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    await logActivity({
      ticketId: ticketIds[0],
      title: currentUser.name,
      description: `Bulk updated ${ticketIds.length} ticket(s) (${summaryText})`,
      actor: currentUser.name,
      type: partialFields.status
        ? 'status_changed'
        : partialFields.priority
        ? 'priority_changed'
        : 'ticket_assigned',
      avatar: currentUser.avatar
    });

    await pushNotification({
      ticketId: ticketIds[0],
      title: `Bulk Update (${ticketIds.length} Tickets)`,
      message: `${ticketIds.length} ticket(s) updated (${summaryText}) by ${currentUser.name}.`,
      type: partialFields.status
        ? 'status_changed'
        : partialFields.priority
        ? 'priority_changed'
        : 'ticket_assigned'
    });

    addToast(
      `Updated ${ticketIds.length} selected support ticket(s) (${summaryText}).`,
      'success',
      'Bulk Ticket Update Completed'
    );
  }

  // 7. Delete Ticket and clean up related comments, activities, notifications
  async function removeTicket(id) {
    const target = tickets.find((t) => String(t.id) === String(id));
    await deleteTicketAndRelated(id);
    setTickets((prev) => prev.filter((t) => String(t.id) !== String(id)));
    setComments((prev) => prev.filter((c) => String(c.ticketId) !== String(id)));
    setActivities((prev) =>
      prev.filter((a) => String(a.ticketId) !== String(id))
    );
    setNotifications((prev) =>
      prev.filter((n) => String(n.ticketId) !== String(id))
    );
    addToast(
      `Ticket ${target?.ticketNumber || `#${id}`} and all associated records were permanently deleted.`,
      'info',
      'Support Ticket Deleted'
    );
  }

  // 8. Add Comment or Internal Note
  async function addTicketComment(ticketId, messageText, isInternal = false) {
    const trimmed = messageText ? messageText.trim() : '';
    if (!trimmed) {
      throw new Error('Comment cannot be empty or contain only whitespace.');
    }

    const newCommentObj = {
      id: `comment-${Date.now()}`,
      ticketId: String(ticketId),
      author: currentUser.name,
      authorRole: currentUser.title || 'Support Agent',
      isInternal: Boolean(isInternal),
      message: trimmed,
      createdAt: new Date().toISOString()
    };

    const saved = await createComment(newCommentObj);
    setComments((prev) => [...prev, saved]);

    // Also update ticket's updatedAt timestamp
    const nowIso = new Date().toISOString();
    try {
      const updatedTicket = await updateTicketPatch(ticketId, {
        updatedAt: nowIso
      });
      setTickets((prev) =>
        prev.map((t) => (String(t.id) === String(ticketId) ? updatedTicket : t))
      );
    } catch {
      // Ignore minor timestamp sync issues
    }

    await logActivity({
      ticketId: String(ticketId),
      title: isInternal ? 'Internal Note' : currentUser.name,
      description: isInternal
        ? `Internal note added by ${currentUser.name}`
        : `Customer support reply posted by ${currentUser.name}`,
      actor: currentUser.name,
      type: 'comment_added',
      avatar: currentUser.avatar
    });

    addToast(
      isInternal
        ? 'Your internal agent note has been saved to this ticket.'
        : 'Your customer support reply has been posted to the conversation.',
      'success',
      isInternal ? 'Internal Note Saved' : 'Customer Reply Sent'
    );
    return saved;
  }

  // 9. Toggle Support Agent Active/Inactive status
  async function toggleAgentStatus(agentId) {
    const existing = agents.find((a) => String(a.id) === String(agentId));
    if (!existing) return;
    const nextStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
    const saved = await updateAgentPatch(agentId, { status: nextStatus });
    setAgents((prev) =>
      prev.map((a) => (String(a.id) === String(agentId) ? saved : a))
    );
    addToast(
      `${existing.name} is now marked as ${nextStatus}.`,
      nextStatus === 'Active' ? 'success' : 'warning',
      'Agent Availability Updated'
    );
    return saved;
  }

  // 10. Notification Center handlers
  async function markNotificationAsRead(id) {
    await markNotificationReadApi(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllNotificationsAsRead() {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    await markAllNotificationsReadApi(unread);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    addToast(
      'All unread notifications have been marked as read.',
      'info',
      'Notifications Updated'
    );
  }

  async function deleteNotification(id) {
    await deleteNotificationApi(id);
    setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    addToast(
      'The selected notification was removed from your feed.',
      'info',
      'Notification Removed'
    );
  }

  async function clearAllNotifications() {
    if (notifications.length === 0) return;
    await clearAllNotificationsApi(notifications);
    setNotifications([]);
    addToast(
      'All notifications have been cleared from the notification center.',
      'info',
      'Notifications Cleared'
    );
  }

  // 11. Update user settings & persist in localStorage
  function updateUserSettings(updatedUser) {
    setCurrentUser((prev) => {
      const next = {
        ...prev,
        ...updatedUser,
        preferences: {
          ...(prev.preferences || {}),
          ...(updatedUser.preferences || {})
        }
      };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota errors
      }
      return next;
    });
    addToast(
      'Your workspace profile and display preferences have been saved.',
      'success',
      'Workspace Preferences Saved'
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const value = {
    tickets,
    agents,
    activeAgents,
    comments,
    activities,
    notifications,
    unreadCount,
    loading,
    error,
    headerSearch,
    setHeaderSearch,
    currentUser,
    updateUserSettings,
    toasts,
    addToast,
    removeToast,
    fetchAllData,
    addNewTicket,
    editTicket,
    changeTicketStatus,
    assignTicketAgent,
    changeTicketPriority,
    bulkUpdateTickets,
    removeTicket,
    addTicketComment,
    toggleAgentStatus,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications
  };

  return (
    <TicketContext.Provider value={value}>{children}</TicketContext.Provider>
  );
}

export function useTicketContext() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used inside a TicketProvider');
  }
  return context;
}
