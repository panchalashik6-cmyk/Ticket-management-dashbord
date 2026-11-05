// Helper functions for formatting dates, calculating dynamic statistics, and customer/agent aggregations.

// Check if a ticket is overdue (due date is before today and status is not Resolved or Closed)
export function isTicketOverdue(ticket) {
  if (!ticket || !ticket.dueDate) return false;
  if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(ticket.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

// Calculate how many days overdue a ticket is
export function getDaysOverdue(ticket) {
  if (!isTicketOverdue(ticket)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(ticket.dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = today - due;
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

// Numeric weight for sorting by priority
export function getPriorityWeight(priority) {
  const map = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1
  };
  return map[priority] || 0;
}

// Format ISO date or YYYY-MM-DD into a clean readable string (e.g. "Nov 10, 2026")
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format ISO date with time (e.g. "Nov 5, 2026, 2:30 PM")
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Convert a timestamp into a relative time string (e.g. "2 hrs ago", "Just now")
export function formatTimeAgo(dateString, fallbackTimeAgo) {
  if (fallbackTimeAgo && !dateString) return fallbackTimeAgo;
  if (!dateString) return 'Just now';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return fallbackTimeAgo || 'Recently';

  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(dateString);
}

// Generate a unique 4-digit ticket ID and number (e.g. id: "1992", ticketNumber: "#1992")
export function generateTicketId(tickets = []) {
  const existingNumbers = tickets
    .map((t) => parseInt(String(t.id).replace(/\D/g, ''), 10))
    .filter((num) => !isNaN(num));

  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 1800;
  const nextNumber = maxNumber + Math.floor(Math.random() * 9) + 1;
  return String(nextNumber);
}

// Find agent details by name, with safe fallback if agent was deleted or unassigned
export function getAgentByName(agentName, agents = []) {
  if (!agentName || agentName === 'Unassigned') {
    return {
      name: 'Unassigned',
      email: '—',
      role: 'No Agent Assigned',
      status: 'Unassigned',
      avatar: ''
    };
  }

  const found = agents.find(
    (a) => a.name.toLowerCase() === String(agentName).toLowerCase()
  );

  if (found) {
    return found;
  }

  return {
    name: `${agentName} (Inactive)`,
    email: 'inactive@applensolutions.com',
    role: 'Former Agent',
    status: 'Inactive',
    avatar: ''
  };
}

// Calculate all dynamic ticket KPI statistics from live API ticket records
export function calculateTicketStats(tickets = []) {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'Open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'In Progress').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved').length;
  const closedTickets = tickets.filter((t) => t.status === 'Closed').length;
  const overdueTickets = tickets.filter((t) => isTicketOverdue(t)).length;
  const unassignedTickets = tickets.filter(
    (t) => !t.assignedAgent || t.assignedAgent === 'Unassigned'
  ).length;

  // Priority counts
  const lowCount = tickets.filter((t) => t.priority === 'Low').length;
  const mediumCount = tickets.filter((t) => t.priority === 'Medium').length;
  const highCount = tickets.filter((t) => t.priority === 'High').length;
  const urgentCount = tickets.filter((t) => t.priority === 'Urgent').length;

  // Category counts
  const technicalCount = tickets.filter((t) => t.category === 'Technical').length;
  const billingCount = tickets.filter((t) => t.category === 'Billing').length;
  const generalCount = tickets.filter((t) => t.category === 'General').length;

  // Resolution rate = (Resolved + Closed) / Total Tickets
  const completedCount = resolvedTickets + closedTickets;
  const resolutionRate =
    totalTickets > 0 ? Math.round((completedCount / totalTickets) * 100) : 0;

  // Dynamic percentage comparisons based on recent 7-day vs earlier ticket cohorts
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCreated = tickets.filter(
    (t) => new Date(t.createdAt) >= sevenDaysAgo
  ).length;
  const recentTrendPct =
    totalTickets > 0 ? Math.round((recentCreated / totalTickets) * 100) : 0;

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    overdueTickets,
    unassignedTickets,
    lowCount,
    mediumCount,
    highCount,
    urgentCount,
    technicalCount,
    billingCount,
    generalCount,
    resolutionRate,
    recentTrendPct
  };
}

// Calculate dynamic performance metrics for each agent based on assigned tickets
export function calculateAgentPerformance(agents = [], tickets = []) {
  return agents.map((agent) => {
    const agentTickets = tickets.filter(
      (t) =>
        t.assignedAgent &&
        t.assignedAgent.toLowerCase() === agent.name.toLowerCase()
    );

    const assignedCount = agentTickets.length;
    const openCount = agentTickets.filter((t) => t.status === 'Open').length;
    const inProgressCount = agentTickets.filter(
      (t) => t.status === 'In Progress'
    ).length;
    const resolvedCount = agentTickets.filter(
      (t) => t.status === 'Resolved' || t.status === 'Closed'
    ).length;
    const overdueCount = agentTickets.filter((t) => isTicketOverdue(t)).length;
    const pendingCount = openCount + inProgressCount;

    const calculatedRate =
      assignedCount > 0
        ? Math.round((resolvedCount / assignedCount) * 100)
        : agent.baseResolutionRate || 85;

    return {
      ...agent,
      assignedTickets: assignedCount,
      openTickets: openCount,
      inProgressTickets: inProgressCount,
      resolvedTickets: resolvedCount,
      overdueTickets: overdueCount,
      pendingTickets: pendingCount,
      resolutionRate: calculatedRate
    };
  });
}

// Dynamically aggregate unique customers from ticket records (no duplicate customer records)
export function calculateCustomersFromTickets(tickets = []) {
  const customerMap = new Map();

  tickets.forEach((ticket) => {
    const emailKey = (ticket.email || '').trim().toLowerCase();
    const key = emailKey || (ticket.customerName || 'unknown').trim().toLowerCase();

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: key,
        name: ticket.customerName || 'Unknown Customer',
        email: ticket.email || '—',
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        overdueTickets: 0,
        latestActivityDate: ticket.updatedAt || ticket.createdAt,
        tickets: []
      });
    }

    const entry = customerMap.get(key);
    entry.totalTickets += 1;
    if (ticket.status === 'Open') entry.openTickets += 1;
    if (ticket.status === 'In Progress') entry.inProgressTickets += 1;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      entry.resolvedTickets += 1;
    }
    if (isTicketOverdue(ticket)) {
      entry.overdueTickets += 1;
    }

    const ticketDate = new Date(ticket.updatedAt || ticket.createdAt);
    const currentLatest = new Date(entry.latestActivityDate);
    if (ticketDate > currentLatest) {
      entry.latestActivityDate = ticket.updatedAt || ticket.createdAt;
    }

    entry.tickets.push(ticket);
  });

  return Array.from(customerMap.values()).sort(
    (a, b) => b.totalTickets - a.totalTickets
  );
}

// Calculate dynamic weekly ticket creation & resolution trends from actual ticket records
export function calculateWeeklyTrends(tickets = []) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const buckets = dayNames.map((day) => ({
    day,
    Created: 0,
    Resolved: 0,
    InProgress: 0
  }));

  tickets.forEach((ticket) => {
    const createdDate = new Date(ticket.createdAt);
    if (!isNaN(createdDate.getTime())) {
      const dayIndex = createdDate.getDay();
      buckets[dayIndex].Created += 1;
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        buckets[dayIndex].Resolved += 1;
      } else if (ticket.status === 'In Progress') {
        buckets[dayIndex].InProgress += 1;
      }
    }
  });

  // Order Mon -> Sun for enterprise SaaS readability
  return [...buckets.slice(1), buckets[0]];
}

// Calculate dynamic monthly ticket trends from actual ticket records
export function calculateMonthlyTrends(tickets = []) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const map = new Map();

  tickets.forEach((ticket) => {
    const d = new Date(ticket.createdAt);
    if (isNaN(d.getTime())) return;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!map.has(label)) {
      map.set(label, {
        month: label,
        sortKey: d.getFullYear() * 100 + d.getMonth(),
        Created: 0,
        Resolved: 0,
        Open: 0
      });
    }
    const item = map.get(label);
    item.Created += 1;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      item.Resolved += 1;
    } else {
      item.Open += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
}
