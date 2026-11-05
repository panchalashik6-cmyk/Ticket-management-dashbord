import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTicketContext } from '../context/TicketContext';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import {
  calculateTicketStats,
  calculateAgentPerformance
} from '../utils/helpers';
import '../styles/Analytics.css';

function Analytics() {
  const { tickets, agents, loading, error, fetchAllData } = useTicketContext();

  if (loading) {
    return <Loader message="Loading analytics and historical trends..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Analytics Unavailable"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // Live API ticket calculations
  const stats = calculateTicketStats(tickets);
  const agentStats = calculateAgentPerformance(agents, tickets);

  // Live Priority Analysis (calculated from live API tickets)
  const priorityAnalysisData = [
    {
      priority: 'Low',
      Total: stats.lowCount,
      Resolved: tickets.filter(
        (t) =>
          t.priority === 'Low' &&
          (t.status === 'Resolved' || t.status === 'Closed')
      ).length
    },
    {
      priority: 'Medium',
      Total: stats.mediumCount,
      Resolved: tickets.filter(
        (t) =>
          t.priority === 'Medium' &&
          (t.status === 'Resolved' || t.status === 'Closed')
      ).length
    },
    {
      priority: 'High',
      Total: stats.highCount,
      Resolved: tickets.filter(
        (t) =>
          t.priority === 'High' &&
          (t.status === 'Resolved' || t.status === 'Closed')
      ).length
    },
    {
      priority: 'Urgent',
      Total: stats.urgentCount,
      Resolved: tickets.filter(
        (t) =>
          t.priority === 'Urgent' &&
          (t.status === 'Resolved' || t.status === 'Closed')
      ).length
    }
  ];

  // Live Agent Workload Comparison (calculated from live API tickets)
  const agentComparisonData = agentStats.map((a) => ({
    agent: a.name,
    Assigned: a.assignedTickets,
    Resolved: a.resolvedTickets,
    Pending: a.pendingTickets,
    ResolutionRate: a.resolutionRate
  }));

  // Sample Historical Data: 6-Month Monthly Ticket Overview (with current month synced to live count)
  const monthlyOverviewData = [
    { month: 'Jun', Created: 42, Resolved: 39 },
    { month: 'Jul', Created: 51, Resolved: 47 },
    { month: 'Aug', Created: 48, Resolved: 45 },
    { month: 'Sep', Created: 63, Resolved: 59 },
    { month: 'Oct', Created: 55, Resolved: 52 },
    {
      month: 'Nov (Live)',
      Created: stats.totalTickets,
      Resolved: stats.resolvedTickets + stats.closedTickets
    }
  ];

  // Sample Historical Data: Weekly Ticket Trends & Resolution Speed
  const weeklyTrendData = [
    { day: 'Mon', Incoming: 14, Resolved: 12 },
    { day: 'Tue', Incoming: 19, Resolved: 17 },
    { day: 'Wed', Incoming: 15, Resolved: 16 },
    { day: 'Thu', Incoming: 22, Resolved: 20 },
    { day: 'Fri', Incoming: 18, Resolved: 19 },
    { day: 'Sat', Incoming: 9, Resolved: 10 },
    { day: 'Sun', Incoming: 7, Resolved: 8 }
  ];

  return (
    <div className="analytics-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">
            In-depth support ticket trends, resolution velocity, priority
            breakdown, and historical benchmarks
          </p>
        </div>
      </div>

      {/* Live Resolution Statistics KPIs */}
      <div className="analytics-summary-grid">
        <StatCard
          title="Live Resolution Rate"
          value={`${stats.resolutionRate}%`}
          subtitle="Live API calculation"
          trend="3.5%"
          trendDirection="up"
          theme="solid-blue"
        />

        <StatCard
          title="Active Open Queue"
          value={stats.openTickets + stats.inProgressTickets}
          subtitle={`${stats.openTickets} Open • ${stats.inProgressTickets} In Progress`}
          trend="Live"
          trendDirection="up"
          theme="pastel-blue"
        />

        <StatCard
          title="High & Urgent Load"
          value={stats.highCount + stats.urgentCount}
          subtitle="Critical priority tickets"
          trend={stats.urgentCount > 0 ? `${stats.urgentCount} Urgent` : 'Clear'}
          trendDirection={stats.urgentCount > 0 ? 'down' : 'up'}
          theme="pastel-red"
        />

        <StatCard
          title="Completed Tickets"
          value={stats.resolvedTickets + stats.closedTickets}
          subtitle="Resolved & Closed"
          trend="Live"
          trendDirection="up"
          theme="pastel-green"
        />
      </div>

      <div className="analytics-charts-grid">
        {/* 1. Priority Analysis (Live API Calculation) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2 className="report-card-title">Priority Analysis (Total vs Resolved)</h2>
              <p className="report-card-subtitle">
                Calculated directly from current mock API tickets
              </p>
            </div>
            <span className="data-source-badge live">LIVE API DATA</span>
          </div>

          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityAnalysisData}
                margin={{ top: 10, right: 18, left: -12, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="priority" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total" fill="#4785f5" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Resolved" fill="#22c55e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Agent Workload Comparison (Live API Calculation) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2 className="report-card-title">Agent Workload Comparison</h2>
              <p className="report-card-subtitle">
                Live assigned vs. pending tickets per support specialist
              </p>
            </div>
            <span className="data-source-badge live">LIVE API DATA</span>
          </div>

          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentComparisonData}
                margin={{ top: 10, right: 18, left: -12, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="agent" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Assigned" fill="#6366f1" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Pending" fill="#f97316" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Ticket Trends (Sample Historical Data) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2 className="report-card-title">Weekly Ticket Trends</h2>
              <p className="report-card-subtitle">
                Historical daily incoming vs. resolved ticket velocity
              </p>
            </div>
            <span className="data-source-badge historical">
              SAMPLE HISTORICAL DATA
            </span>
          </div>

          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyTrendData}
                margin={{ top: 10, right: 18, left: -12, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Incoming"
                  stroke="#4785f5"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Monthly Ticket Overview (Sample Historical + Live Current Month) */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <h2 className="report-card-title">Monthly Ticket Overview</h2>
              <p className="report-card-subtitle">
                6-month historical volume compared with live November records
              </p>
            </div>
            <span className="data-source-badge historical">
              HISTORICAL + LIVE NOV
            </span>
          </div>

          <div className="analytics-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyOverviewData}
                margin={{ top: 10, right: 18, left: -12, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Created"
                  stroke="#4785f5"
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
      </div>
    </div>
  );
}

export default Analytics;
