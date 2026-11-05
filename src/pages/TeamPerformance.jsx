import React, { useState } from 'react';
import { Power, Mail, Clock } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { calculateAgentPerformance } from '../utils/helpers';
import '../styles/TeamPerformance.css';

function TeamPerformance() {
  const {
    agents,
    tickets,
    loading,
    error,
    fetchAllData,
    toggleAgentStatus
  } = useTicketContext();

  const [agentSearch, setAgentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Inactive'

  if (loading) {
    return <Loader message="Loading support agents and workload metrics..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Load Support Agents"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // Calculate dynamic stats per agent from live API tickets
  const agentStats = calculateAgentPerformance(agents, tickets);

  const totalAgents = agents.length;
  const activeAgentsCount = agents.filter(
    (a) => String(a.status).toLowerCase() === 'active'
  ).length;
  const assignedTicketsCount = tickets.filter(
    (t) => t.assignedAgent && t.assignedAgent !== 'Unassigned'
  ).length;
  const resolvedTicketsCount = tickets.filter(
    (t) => t.status === 'Resolved' || t.status === 'Closed'
  ).length;
  const pendingTicketsCount = tickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress'
  ).length;

  const filteredAgents = agentStats.filter((agent) => {
    if (statusFilter !== 'All' && agent.status !== statusFilter) {
      return false;
    }

    if (!agentSearch.trim()) return true;
    const q = agentSearch.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.email.toLowerCase().includes(q) ||
      (agent.role && agent.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="team-performance-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Support Team Overview</h1>
          <p className="page-subtitle">
            Manage support specialist availability, monitor workload
            distribution, and track resolution performance (Only Active agents
            can be assigned tickets)
          </p>
        </div>
      </div>

      {/* 5 Dynamic Team Summary KPI Cards */}
      <div className="team-kpi-grid">
        <StatCard
          title="Total Agents"
          value={totalAgents}
          subtitle={`${totalAgents - activeAgentsCount} inactive`}
          trend="Roster"
          trendDirection="up"
          theme="solid-blue"
        />
        <StatCard
          title="Active Agents"
          value={activeAgentsCount}
          subtitle="Eligible for assignment"
          trend="Online"
          trendDirection="up"
          theme="pastel-blue"
        />
        <StatCard
          title="Assigned Tickets"
          value={assignedTicketsCount}
          subtitle="Across all agents"
          trend="Live"
          trendDirection="up"
          theme="pastel-indigo"
        />
        <StatCard
          title="Resolved Tickets"
          value={resolvedTicketsCount}
          subtitle="Completed tickets"
          trend="Verified"
          trendDirection="up"
          theme="pastel-green"
        />
        <StatCard
          title="Pending Workload"
          value={pendingTicketsCount}
          subtitle="Open & In Progress"
          trend="Active queue"
          trendDirection="down"
          theme="pastel-red"
        />
      </div>

      {/* Search & Active/Inactive Filter Bar */}
      <div className="agents-filter-toolbar">
        <SearchBar
          value={agentSearch}
          onChange={setAgentSearch}
          placeholder="Search agents by name, email, or specialist role..."
        />

        <div className="queue-tabs">
          <button
            type="button"
            className={`queue-tab-btn ${
              statusFilter === 'All' ? 'active' : ''
            }`}
            onClick={() => setStatusFilter('All')}
          >
            All ({totalAgents})
          </button>
          <button
            type="button"
            className={`queue-tab-btn ${
              statusFilter === 'Active' ? 'active' : ''
            }`}
            onClick={() => setStatusFilter('Active')}
          >
            Active ({activeAgentsCount})
          </button>
          <button
            type="button"
            className={`queue-tab-btn ${
              statusFilter === 'Inactive' ? 'active' : ''
            }`}
            onClick={() => setStatusFilter('Inactive')}
          >
            Inactive ({totalAgents - activeAgentsCount})
          </button>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <EmptyState
          title="No Matching Support Agents"
          description="No agents match your search or status filter."
          actionLabel="Reset Filters"
          onAction={() => {
            setAgentSearch('');
            setStatusFilter('All');
          }}
        />
      ) : (
        <>
          {/* Agent Profile Cards Grid */}
          <div className="agent-cards-grid">
            {filteredAgents.map((agent) => {
              const isActive = agent.status === 'Active';
              const maxCapacity = 6;
              const workloadPct = Math.min(
                100,
                Math.round((agent.assignedTickets / maxCapacity) * 100)
              );

              return (
                <div
                  key={agent.id}
                  className={`agent-profile-card ${
                    !isActive ? 'inactive-card' : ''
                  }`}
                >
                  <div>
                    <div className="agent-card-top">
                      <div className="agent-card-identity">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="agent-card-avatar"
                        />
                        <div>
                          <div
                            style={{
                              fontSize: '15.5px',
                              fontWeight: 700,
                              color: 'var(--text-dark)'
                            }}
                          >
                            {agent.name}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {agent.role}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`agent-status-pill ${
                          isActive ? 'active' : 'inactive'
                        }`}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#16a34a' : '#94a3b8'
                          }}
                        />
                        {agent.status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginTop: '12px'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Mail size={13} />
                        {agent.email}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Clock size={13} />
                        {agent.avgResponseTime}
                      </span>
                    </div>
                  </div>

                  {/* Assigned, In-Progress, Resolved Counts */}
                  <div className="agent-metrics-grid">
                    <div className="agent-metric-box">
                      <div className="agent-metric-num">
                        {agent.assignedTickets}
                      </div>
                      <div className="agent-metric-label">Assigned</div>
                    </div>
                    <div className="agent-metric-box">
                      <div
                        className="agent-metric-num"
                        style={{ color: '#d97706' }}
                      >
                        {agent.inProgressTickets}
                      </div>
                      <div className="agent-metric-label">In Progress</div>
                    </div>
                    <div className="agent-metric-box">
                      <div
                        className="agent-metric-num"
                        style={{ color: '#16a34a' }}
                      >
                        {agent.resolvedTickets}
                      </div>
                      <div className="agent-metric-label">Resolved</div>
                    </div>
                  </div>

                  {/* Agent Workload & Resolution Rate */}
                  <div className="agent-workload-section">
                    <div className="workload-header-row">
                      <span>
                        Workload ({agent.pendingTickets} active •{' '}
                        {agent.resolutionRate}% resolved)
                      </span>
                      <span>{workloadPct}% capacity</span>
                    </div>
                    <div className="workload-track">
                      <div
                        className="workload-fill"
                        style={{ width: `${Math.max(workloadPct, 8)}%` }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: isActive ? '#15803d' : '#dc2626',
                        fontWeight: 600
                      }}
                    >
                      {isActive
                        ? '✓ Eligible for ticket assignment'
                        : '✕ Assignment disabled while Inactive'}
                    </span>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => toggleAgentStatus(agent.id)}
                      title={`Set ${agent.name} as ${
                        isActive ? 'Inactive' : 'Active'
                      }`}
                    >
                      <Power size={13} />
                      <span>Set {isActive ? 'Inactive' : 'Active'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agent Performance Directory Table */}
          <div className="team-table-card">
            <div className="team-table-header-bar">
              <h2 className="dash-card-title" style={{ fontSize: '16px' }}>
                Agent Performance Summary Table
              </h2>
            </div>

            <div className="team-table-wrapper">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>Agent Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Assigned</th>
                    <th>Open</th>
                    <th>In Progress</th>
                    <th>Resolved</th>
                    <th>Resolution Rate</th>
                    <th>Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="agent-profile-cell">
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="agent-profile-avatar"
                          />
                          <div>
                            <div className="agent-profile-name">
                              {agent.name}
                            </div>
                            <div className="agent-profile-role">
                              {agent.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{agent.email}</td>
                      <td>
                        <span
                          className={`agent-status-pill ${
                            agent.status === 'Active' ? 'active' : 'inactive'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td>
                        <strong>{agent.assignedTickets}</strong>
                      </td>
                      <td>{agent.openTickets}</td>
                      <td>{agent.inProgressTickets}</td>
                      <td>{agent.resolvedTickets}</td>
                      <td>
                        <div className="rate-progress-wrap">
                          <div className="rate-bar-bg">
                            <div
                              className="rate-bar-fill"
                              style={{ width: `${agent.resolutionRate}%` }}
                            />
                          </div>
                          <strong>{agent.resolutionRate}%</strong>
                        </div>
                      </td>
                      <td>{agent.avgResponseTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TeamPerformance;
