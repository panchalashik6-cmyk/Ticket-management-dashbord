import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Download, RotateCcw, Calendar } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import StatCard from '../components/StatCard';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import {
  calculateTicketStats,
  calculateAgentPerformance,
  calculateWeeklyTrends,
  calculateMonthlyTrends,
  isTicketOverdue,
  getDaysOverdue,
  formatDate
} from '../utils/helpers';
import '../styles/Reports.css';

function Reports() {
  const {
    tickets,
    agents,
    loading,
    error,
    fetchAllData,
    addToast
  } = useTicketContext();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (loading) {
    return <Loader message="Generating live reports and analytics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Load Reports"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // Filter tickets by selected date range
  const filteredTickets = tickets.filter((ticket) => {
    if (dateFrom) {
      const created = new Date(ticket.createdAt);
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (created < from) return false;
    }
    if (dateTo) {
      const created = new Date(ticket.createdAt);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (created > to) return false;
    }
    return true;
  });

  // Dynamically calculate all statistics from the filtered live API tickets
  const stats = calculateTicketStats(filteredTickets);
  const agentWorkload = calculateAgentPerformance(agents, filteredTickets);
  const overdueTicketsList = filteredTickets.filter((t) => isTicketOverdue(t));

  // 1. Tickets by Status
  const statusData = [
    { name: 'Open', count: stats.openTickets, color: '#3b82f6' },
    { name: 'In Progress', count: stats.inProgressTickets, color: '#f59e0b' },
    { name: 'Resolved', count: stats.resolvedTickets, color: '#22c55e' },
    { name: 'Closed', count: stats.closedTickets, color: '#64748b' }
  ];

  // 2. Tickets by Priority
  const priorityData = [
    { name: 'Low', count: stats.lowCount, color: '#4ade80' },
    { name: 'Medium', count: stats.mediumCount, color: '#fbbf24' },
    { name: 'High', count: stats.highCount, color: '#f87171' },
    { name: 'Urgent', count: stats.urgentCount, color: '#dc2626' }
  ];

  // 3. Tickets by Category (Technical, Billing, General)
  const categoryData = [
    { name: 'Technical', count: stats.technicalCount, color: '#3b82f6' },
    { name: 'Billing', count: stats.billingCount, color: '#8b5cf6' },
    { name: 'General', count: stats.generalCount, color: '#10b981' }
  ];

  // 4. Agent Workload & Resolution Performance
  const workloadData = agentWorkload.map((agent) => ({
    name: agent.name,
    Assigned: agent.assignedTickets,
    Resolved: agent.resolvedTickets,
    Pending: agent.pendingTickets,
    ResolutionRate: agent.resolutionRate
  }));

  // 5. Weekly Ticket Trends (Calculated from live API records)
  const weeklyTrends = calculateWeeklyTrends(filteredTickets);

  // 6. Monthly Ticket Trends (Calculated from live API records)
  const monthlyTrends = calculateMonthlyTrends(filteredTickets);

  function handleExportCsv() {
    const headers = [
      'Ticket Number',
      'Customer Name',
      'Customer Email',
      'Subject',
      'Category',
      'Priority',
      'Assigned Agent',
      'Status',
      'Created Date',
      'Due Date',
      'Overdue'
    ];
    const rows = filteredTickets.map((t) => [
      t.ticketNumber,
      `"${t.customerName}"`,
      t.email,
      `"${String(t.subject).replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      `"${t.assignedAgent}"`,
      t.status,
      t.createdAt,
      t.dueDate,
      isTicketOverdue(t) ? 'Yes' : 'No'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'applen_helpdesk_tickets_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(
      `Exported ${filteredTickets.length} support ticket record(s) to CSV file.`,
      'success',
      'CSV Report Exported'
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Support Reports & Analytics</h1>
          <p className="page-subtitle">
            Comprehensive operational intelligence, service-level compliance,
            and support agent resolution metrics calculated from live records
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExportCsv}
          disabled={filteredTickets.length === 0}
        >
          <Download size={15} />
          <span>Export CSV Report ({filteredTickets.length})</span>
        </button>
      </div>

      {/* Date-Range Filter Bar */}
      <div className="reports-filter-bar">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            color: 'var(--text-dark)',
            fontSize: '13.5px'
          }}
        >
          <Calendar size={16} />
          <span>Filter Reports by Creation Date Range:</span>
        </div>

        <div className="reports-date-inputs">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="rep-from"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              From:
            </label>
            <input
              id="rep-from"
              type="date"
              className="filter-date-input"
              style={{ width: '150px' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="rep-to"
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              To:
            </label>
            <input
              id="rep-to"
              type="date"
              className="filter-date-input"
              style={{ width: '150px' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Date Range</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="reports-kpi-grid">
        <StatCard
          title="Total Tickets (In Range)"
          value={stats.totalTickets}
          subtitle={`${stats.unassignedTickets} unassigned`}
          trend="100%"
          trendDirection="up"
          theme="solid-blue"
        />

        <StatCard
          title="Resolved & Closed"
          value={stats.resolvedTickets + stats.closedTickets}
          subtitle={`${stats.resolvedTickets} Resolved • ${stats.closedTickets} Closed`}
          trend={`${stats.resolutionRate}% rate`}
          trendDirection="up"
          theme="pastel-green"
        />

        <StatCard
          title="Active Open Queue"
          value={stats.openTickets + stats.inProgressTickets}
          subtitle={`${stats.openTickets} Open • ${stats.inProgressTickets} In Progress`}
          trend="Active"
          trendDirection="up"
          theme="pastel-blue"
        />

        <StatCard
          title="Overdue Tickets"
          value={stats.overdueTickets}
          subtitle="Past SLA due date"
          trend={stats.overdueTickets > 0 ? 'Attention' : 'On track'}
          trendDirection={stats.overdueTickets > 0 ? 'down' : 'up'}
          theme="pastel-red"
        />
      </div>

      {/* Dynamic Recharts Grid */}
      <div className="reports-charts-grid">
        {/* 1. Tickets by Status */}
        <div className="report-card">
          <h2 className="report-card-title">Tickets by Status</h2>
          <p className="report-card-subtitle">
            Distribution of tickets across Open, In Progress, Resolved, and
            Closed
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  label
                >
                  {statusData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Tickets by Priority */}
        <div className="report-card">
          <h2 className="report-card-title">Tickets by Priority</h2>
          <p className="report-card-subtitle">
            Volume of Low, Medium, High, and Urgent severity tickets
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Tickets by Category */}
        <div className="report-card">
          <h2 className="report-card-title">Tickets by Category</h2>
          <p className="report-card-subtitle">
            Comparison across Technical, Billing, and General support requests
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Ticket Resolution Performance per Agent (%) */}
        <div className="report-card">
          <h2 className="report-card-title">
            Ticket Resolution Performance (%)
          </h2>
          <p className="report-card-subtitle">
            Resolution rate percentage achieved by each support agent
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={workloadData}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip />
                <Bar
                  dataKey="ResolutionRate"
                  name="Resolution Rate (%)"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Weekly Ticket Trends */}
        <div className="report-card">
          <h2 className="report-card-title">Weekly Ticket Trends</h2>
          <p className="report-card-subtitle">
            Day-of-week ticket creation vs. resolution velocity calculated from
            API records
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyTrends}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Created"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Monthly Ticket Trends */}
        <div className="report-card">
          <h2 className="report-card-title">Monthly Ticket Trends</h2>
          <p className="report-card-subtitle">
            Monthly created vs. resolved ticket volume from live API records
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyTrends}
                margin={{ top: 12, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Created"
                  stroke="#3b82f6"
                  fill="#dbeafe"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#16a34a"
                  fill="#dcfce7"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Agent Workload Comparison (Full Span) */}
        <div className="report-card full-span">
          <h2 className="report-card-title">Agent Workload Distribution</h2>
          <p className="report-card-subtitle">
            Assigned, Resolved, and Pending tickets per support specialist
          </p>
          <div className="report-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={workloadData}
                margin={{ top: 12, right: 24, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Assigned"
                  fill="#3b82f6"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="Resolved"
                  fill="#22c55e"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="Pending"
                  fill="#f59e0b"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Overdue Ticket Report Table (Full Span) */}
        <div className="report-card full-span">
          <h2 className="report-card-title">
            Overdue Ticket SLA Report ({overdueTicketsList.length})
          </h2>
          <p className="report-card-subtitle">
            Tickets whose due date has passed and are not yet Resolved or Closed
          </p>

          {overdueTicketsList.length === 0 ? (
            <EmptyState
              title="Zero Overdue Tickets"
              description="All tickets in the selected date range are within their SLA due dates."
            />
          ) : (
            <div className="ticket-table-wrapper">
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Assigned Agent</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueTicketsList.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="ticket-no-link"
                        >
                          {ticket.ticketNumber}
                        </Link>
                      </td>
                      <td>
                        <strong>{ticket.customerName}</strong>
                      </td>
                      <td>{ticket.subject}</td>
                      <td>{ticket.category}</td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>{ticket.assignedAgent || 'Unassigned'}</td>
                      <td>
                        <StatusBadge status={ticket.status} isOverdue={true} />
                      </td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>
                        {formatDate(ticket.dueDate)}
                      </td>
                      <td>
                        <span className="overdue-tag">
                          {getDaysOverdue(ticket)} days overdue
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
