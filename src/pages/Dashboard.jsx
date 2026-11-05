import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ArrowUpDown,
  Activity,
  Plus,
  UserX,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useTicketContext } from '../context/TicketContext';
import StatCard from '../components/StatCard';
import TicketTable from '../components/TicketTable';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import {
  calculateTicketStats,
  calculateAgentPerformance,
  calculateWeeklyTrends,
  formatTimeAgo
} from '../utils/helpers';
import '../styles/Dashboard.css';

function Dashboard() {
  const {
    tickets,
    agents,
    activities,
    loading,
    error,
    fetchAllData,
    headerSearch,
    addToast
  } = useTicketContext();

  const navigate = useNavigate();

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [showAllSixKpis, setShowAllSixKpis] = useState(true);
  const [showChartsSection, setShowChartsSection] = useState(true);

  if (loading) {
    return <Loader message="Loading enterprise dashboard metrics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Dashboard Data Unavailable"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // Filter tickets by headerSearch if the user typed in the top header search input
  const filteredTickets = headerSearch.trim()
    ? tickets.filter((t) => {
        const q = headerSearch.toLowerCase();
        return (
          String(t.ticketNumber).toLowerCase().includes(q) ||
          String(t.customerName).toLowerCase().includes(q) ||
          String(t.subject).toLowerCase().includes(q) ||
          String(t.assignedAgent).toLowerCase().includes(q) ||
          String(t.status).toLowerCase().includes(q)
        );
      })
    : tickets;

  // Dynamic KPI statistics from live API records
  const stats = calculateTicketStats(tickets);

  // Top-performing agents sorted by resolved ticket counts (descending)
  const agentStats = calculateAgentPerformance(agents, tickets).sort(
    (a, b) =>
      b.resolvedTickets - a.resolvedTickets ||
      b.resolutionRate - a.resolutionRate
  );

  const latestActivities = activities.slice(0, 5);
  const recentTickets = filteredTickets.slice(0, 6);

  // Dynamic Recharts data: 1. Ticket Status Distribution
  const statusChartData = [
    { name: 'Open', count: stats.openTickets, color: '#3b82f6' },
    { name: 'In Progress', count: stats.inProgressTickets, color: '#f59e0b' },
    { name: 'Resolved', count: stats.resolvedTickets, color: '#22c55e' },
    { name: 'Closed', count: stats.closedTickets, color: '#64748b' }
  ];

  // Dynamic Recharts data: 2. Priority Distribution
  const priorityChartData = [
    { name: 'Low', count: stats.lowCount, fill: '#4ade80' },
    { name: 'Medium', count: stats.mediumCount, fill: '#fbbf24' },
    { name: 'High', count: stats.highCount, fill: '#f87171' },
    { name: 'Urgent', count: stats.urgentCount, fill: '#dc2626' }
  ];

  // Dynamic Recharts data: 3. Weekly Ticket Creation Trend (from live API tickets)
  const weeklyTrendData = calculateWeeklyTrends(tickets);

  // Dynamic Recharts data: 4. Agent Workload Chart
  const agentWorkloadData = agentStats.map((a) => ({
    name: a.name.split(' ')[0],
    Assigned: a.assignedTickets,
    Resolved: a.resolvedTickets,
    Pending: a.pendingTickets
  }));

  // Segmented bar widths for Resolution Rate card
  const totalForBar = Math.max(stats.totalTickets, 1);
  const highUrgentPct = Math.round(
    ((stats.highCount + stats.urgentCount) / totalForBar) * 100
  );
  const mediumPct = Math.round((stats.mediumCount / totalForBar) * 100);
  const lowPct = Math.max(0, 100 - highUrgentPct - mediumPct);

  // Percentage share calculations from live API records
  const openSharePct =
    stats.totalTickets > 0
      ? Math.round((stats.openTickets / stats.totalTickets) * 100)
      : 0;
  const inProgressSharePct =
    stats.totalTickets > 0
      ? Math.round((stats.inProgressTickets / stats.totalTickets) * 100)
      : 0;
  const resolvedSharePct =
    stats.totalTickets > 0
      ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
      : 0;
  const closedSharePct =
    stats.totalTickets > 0
      ? Math.round((stats.closedTickets / stats.totalTickets) * 100)
      : 0;
  const overdueSharePct =
    stats.totalTickets > 0
      ? Math.round((stats.overdueTickets / stats.totalTickets) * 100)
      : 0;

  const allKpiCards = [
    {
      key: 'total',
      title: 'Total Tickets',
      value: stats.totalTickets,
      subtitle: `${stats.unassignedTickets} unassigned`,
      trend: `${stats.recentTrendPct}% this wk`,
      trendDirection: 'up',
      theme: 'pastel-indigo'
    },
    {
      key: 'open',
      title: 'Open Tickets',
      value: stats.openTickets,
      subtitle: 'Awaiting action',
      trend: `${openSharePct}% share`,
      trendDirection: 'up',
      theme: 'solid-blue'
    },
    {
      key: 'inProgress',
      title: 'In Progress',
      value: stats.inProgressTickets,
      subtitle: 'Active handling',
      trend: `${inProgressSharePct}% share`,
      trendDirection: 'up',
      theme: 'pastel-blue'
    },
    {
      key: 'resolved',
      title: 'Resolved',
      value: stats.resolvedTickets,
      subtitle: 'Verified fix',
      trend: `${resolvedSharePct}% share`,
      trendDirection: 'up',
      theme: 'pastel-green'
    },
    {
      key: 'closed',
      title: 'Closed',
      value: stats.closedTickets,
      subtitle: 'Completed',
      trend: `${closedSharePct}% share`,
      trendDirection: 'up',
      theme: 'pastel-amber'
    },
    {
      key: 'overdue',
      title: 'Overdue Tickets',
      value: stats.overdueTickets,
      subtitle: 'Past SLA due date',
      trend: `${overdueSharePct}% rate`,
      trendDirection: stats.overdueTickets > 0 ? 'down' : 'up',
      theme: 'pastel-red'
    }
  ];

  const displayedKpis = showAllSixKpis ? allKpiCards : allKpiCards.slice(1, 5);

  return (
    <div className="dashboard-page">
      {/* Dashboard Heading + Quick Action Buttons */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-heading">Customer Support Dashboard</h1>
          <p className="page-subtitle">
            Real-time overview of customer support tickets, service-level
            compliance, and support team performance
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/tickets/new')}
          >
            <Plus size={16} />
            <span>Create New Ticket</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/unassigned-tickets')}
          >
            <UserX size={15} />
            <span>Unassigned Tickets ({stats.unassignedTickets})</span>
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/reports')}
          >
            <BarChart3 size={15} />
            <span>Analytics & Reports</span>
          </button>

          <button
            type="button"
            className="customize-btn"
            onClick={() => setIsCustomizeOpen(true)}
          >
            <LayoutGrid size={15} />
            <span>Customize Layout</span>
          </button>
        </div>
      </div>

      {/* Six Dynamic Ticket Status KPI Cards */}
      <section className="ticket-status-section">
        <h2 className="section-subtitle">Support Ticket Status Overview</h2>
        <div className={showAllSixKpis ? 'kpi-grid-six' : 'kpi-grid-four'}>
          {displayedKpis.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              trend={card.trend}
              trendDirection={card.trendDirection}
              theme={card.theme}
              onClick={() => navigate('/tickets')}
            />
          ))}
        </div>
      </section>

      {/* Main Two-Column Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column: Support Team Overview + Recently Created Tickets */}
        <div className="dashboard-left-col">
          {/* Support Team Overview Card (Complete Enterprise Leaderboard & Metrics) */}
          <div className="dash-card support-team-overview-card">
            <div className="dash-card-header team-overview-header">
              <div>
                <h3 className="dash-card-title">Support Team Overview</h3>
                <p className="dash-card-subtitle">
                  Live specialist availability, response speed, and ticket
                  resolution performance
                </p>
              </div>

              <div className="team-overview-header-right">
                <span className="team-active-summary-pill">
                  <span className="team-live-dot" />
                  {
                    agents.filter((a) => a.status === 'Active').length
                  }{' '}
                  Active / {agents.length} Total
                </span>
                <Link to="/agents" className="dash-card-link">
                  View Support Team
                </Link>
              </div>
            </div>

            {/* Quick Team Summary Strip */}
            <div className="team-overview-mini-stats">
              <div className="team-mini-stat-item">
                <span className="team-mini-stat-label">
                  Active Support Specialists
                </span>
                <strong className="team-mini-stat-value">
                  {agents.filter((a) => a.status === 'Active').length} Online
                </strong>
              </div>
              <div className="team-mini-stat-item">
                <span className="team-mini-stat-label">
                  Total Assigned Workload
                </span>
                <strong className="team-mini-stat-value">
                  {tickets.filter(
                    (t) => t.assignedAgent && t.assignedAgent !== 'Unassigned'
                  ).length}{' '}
                  Tickets
                </strong>
              </div>
              <div className="team-mini-stat-item">
                <span className="team-mini-stat-label">
                  Completed By Team
                </span>
                <strong className="team-mini-stat-value text-success">
                  {stats.resolvedTickets + stats.closedTickets} Resolved
                </strong>
              </div>
              <div className="team-mini-stat-item">
                <span className="team-mini-stat-label">
                  Overall Team Efficiency
                </span>
                <strong className="team-mini-stat-value text-primary">
                  {stats.resolutionRate}% Rate
                </strong>
              </div>
            </div>

            <div className="agent-perf-table-wrap">
              <table className="agent-perf-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>
                      <span className="th-content">
                        <span>Support Specialist</span>
                        <ArrowUpDown size={13} />
                      </span>
                    </th>
                    <th>Status</th>
                    <th>
                      <span className="th-content">
                        <span>Workload</span>
                        <ArrowUpDown size={13} />
                      </span>
                    </th>
                    <th>
                      <span className="th-content">
                        <span>Response Time</span>
                        <ArrowUpDown size={13} />
                      </span>
                    </th>
                    <th>
                      <span className="th-content">
                        <span>Resolution Rate</span>
                        <ArrowUpDown size={13} />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((agent, index) => {
                    const isActive = agent.status === 'Active';
                    const rankClass =
                      index === 0
                        ? 'rank-1'
                        : index === 1
                        ? 'rank-2'
                        : index === 2
                        ? 'rank-3'
                        : '';

                    return (
                      <tr
                        key={agent.id}
                        onClick={() => navigate('/agents')}
                        style={{ cursor: 'pointer' }}
                        title={`View ${agent.name} in Support Team Overview`}
                      >
                        <td>
                          <span className={`rank-badge ${rankClass}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td>
                          <div className="agent-cell">
                            <div className="agent-avatar-status-wrap">
                              <img
                                src={agent.avatar}
                                alt={agent.name}
                                className="agent-cell-avatar"
                              />
                              <span
                                className={`agent-mini-dot ${
                                  isActive ? 'online' : 'offline'
                                }`}
                              />
                            </div>
                            <div className="agent-cell-info">
                              <span className="agent-cell-name">
                                {agent.name}
                              </span>
                              <span className="agent-cell-role">
                                {agent.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`dash-agent-status-badge ${
                              isActive ? 'active' : 'inactive'
                            }`}
                          >
                            <span className="status-dot-indicator" />
                            {agent.status}
                          </span>
                        </td>
                        <td>
                          <div className="agent-workload-pills">
                            <span className="workload-pill resolved">
                              {agent.resolvedTickets} Resolved
                            </span>
                            <span className="workload-pill pending">
                              {agent.pendingTickets} Pending
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="response-time-chip">
                            {agent.avgResponseTime}
                          </span>
                        </td>
                        <td>
                          <div className="dash-resolution-cell">
                            <div className="dash-res-bar-track">
                              <div
                                className="dash-res-bar-fill"
                                style={{ width: `${agent.resolutionRate}%` }}
                              />
                            </div>
                            <span className="dash-res-pct">
                              {agent.resolutionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently Created Tickets Table */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Recently Created Tickets</h3>
              <Link to="/tickets" className="dash-card-link">
                View All Tickets ({tickets.length})
              </Link>
            </div>

            {recentTickets.length === 0 ? (
              <EmptyState
                title="No Support Tickets Found"
                description="No tickets found. Create a new support ticket to get started."
                actionLabel="Create New Ticket"
                onAction={() => navigate('/tickets/new')}
              />
            ) : (
              <TicketTable
                tickets={recentTickets}
                agents={agents}
                showSubject={true}
                showActions={false}
                statusVariant="pill"
                onCopyTicketId={(code) =>
                  addToast(
                    `Ticket number ${code} has been copied to your clipboard.`,
                    'info',
                    'Ticket ID Copied'
                  )
                }
              />
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Timeline + Resolution Rate */}
        <div className="dashboard-right-col">
          {/* Recent Activity Timeline */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Recent Activity Timeline</h3>
              <Link to="/notifications" className="dash-card-link">
                View Activity Feed
              </Link>
            </div>

            {latestActivities.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                No recent ticket activity has been recorded yet.
              </p>
            ) : (
              <div className="recent-activity-list">
                {latestActivities.map((act) => (
                  <div key={act.id} className="activity-row">
                    <div className="activity-left">
                      {act.avatar ? (
                        <img
                          src={act.avatar}
                          alt={act.actor || act.title}
                          className="activity-avatar-img"
                        />
                      ) : (
                        <div className="activity-icon-circle">
                          <Activity size={17} strokeWidth={2} />
                        </div>
                      )}

                      <div className="activity-text-group">
                        <span className="activity-title">{act.title}</span>
                        <span
                          className="activity-desc"
                          title={act.description}
                        >
                          {act.description}
                        </span>
                      </div>
                    </div>

                    <span className="activity-time">
                      {formatTimeAgo(act.createdAt, act.timeAgo)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overall Ticket Resolution Rate Card */}
          <div className="dash-card">
            <div className="dash-card-header" style={{ marginBottom: '4px' }}>
              <h3 className="dash-card-title">
                Overall Ticket Resolution Rate
              </h3>
            </div>

            <div className="resolution-rate-value">
              {stats.resolutionRate}%
            </div>

            <div
              className="resolution-segmented-bar"
              title={`High & Urgent Priority: ${highUrgentPct}%, Medium Priority: ${mediumPct}%, Low Priority: ${lowPct}%`}
            >
              <div
                className="seg-high"
                style={{ width: `${Math.max(highUrgentPct, 15)}%` }}
              />
              <div
                className="seg-medium"
                style={{ width: `${Math.max(mediumPct, 15)}%` }}
              />
              <div
                className="seg-low"
                style={{ width: `${Math.max(lowPct, 15)}%` }}
              />
            </div>

            <div className="resolution-legend">
              <span className="legend-item">
                <span className="legend-ring high" />
                <span>
                  High & Urgent ({stats.highCount + stats.urgentCount})
                </span>
              </span>
              <span className="legend-item">
                <span className="legend-ring medium" />
                <span>Medium ({stats.mediumCount})</span>
              </span>
              <span className="legend-item">
                <span className="legend-ring low" />
                <span>Low ({stats.lowCount})</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dynamic Recharts Visualizations (Status, Priority, Weekly Trends, Agent Workload) */}
      {showChartsSection && (
        <div className="dashboard-charts-grid">
          {/* 1. Ticket Status Distribution */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Ticket Status Distribution</h3>
              <Link to="/reports" className="dash-card-link">
                Detailed Status Report
              </Link>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Priority Distribution */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Ticket Priority Distribution</h3>
              <Link to="/reports" className="dash-card-link">
                Priority Breakdown
              </Link>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityChartData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Weekly Ticket Trends */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Weekly Ticket Trends</h3>
              <Link to="/reports" className="dash-card-link">
                View Trend Analysis
              </Link>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyTrendData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
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

          {/* 4. Agent Workload Chart */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Support Agent Workload</h3>
              <Link to="/agents" className="dash-card-link">
                View Support Team
              </Link>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={agentWorkloadData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
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
        </div>
      )}

      {/* Customize Dashboard Modal */}
      <Modal
        isOpen={isCustomizeOpen}
        title="Customize Dashboard Layout"
        onClose={() => setIsCustomizeOpen(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                Display All Six Ticket Status KPI Cards
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Includes Total Tickets, Open, In Progress, Resolved, Closed, and
                Overdue Tickets
              </div>
            </div>
            <input
              type="checkbox"
              checked={showAllSixKpis}
              onChange={(e) => setShowAllSixKpis(e.target.checked)}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>
                Display Dashboard Analytics Charts
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Includes Status Distribution, Priority Distribution, Weekly
                Ticket Trends, and Support Agent Workload
              </div>
            </div>
            <input
              type="checkbox"
              checked={showChartsSection}
              onChange={(e) => setShowChartsSection(e.target.checked)}
            />
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '6px'
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setIsCustomizeOpen(false);
                addToast(
                  'Your dashboard layout preferences have been updated.',
                  'info',
                  'Dashboard Layout Updated'
                );
              }}
            >
              Save Dashboard Layout
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
