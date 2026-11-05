import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Mail, ExternalLink } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import {
  calculateCustomersFromTickets,
  formatDate,
  formatTimeAgo,
  isTicketOverdue
} from '../utils/helpers';
import '../styles/Customers.css';

function Customers() {
  const { tickets, loading, error, fetchAllData } = useTicketContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const navigate = useNavigate();

  if (loading) {
    return <Loader message="Loading customer directory and ticket history..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Customers Directory Unavailable"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // Dynamically aggregate unique customers from live ticket records
  const allCustomers = calculateCustomersFromTickets(tickets);

  const filteredCustomers = allCustomers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  });

  const activeCustomer =
    filteredCustomers.find((c) => c.id === selectedCustomerId) ||
    filteredCustomers[0] ||
    null;

  const totalCustomers = allCustomers.length;
  const customersWithOpen = allCustomers.filter(
    (c) => c.openTickets + c.inProgressTickets > 0
  ).length;
  const repeatCustomers = allCustomers.filter((c) => c.totalTickets > 1).length;
  const totalCustomerResolved = allCustomers.reduce(
    (acc, c) => acc + c.resolvedTickets,
    0
  );

  return (
    <div className="customers-page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">
            Unified customer account directory and complete support ticket
            history calculated from live records
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/tickets/new')}
        >
          <Plus size={16} />
          <span>Create New Ticket</span>
        </button>
      </div>

      {/* Customer Summary KPIs */}
      <div className="customers-kpi-grid">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          subtitle="Unique accounts"
          trend="Live"
          trendDirection="up"
          theme="solid-blue"
        />
        <StatCard
          title="Active Support Accounts"
          value={customersWithOpen}
          subtitle="With open/in-progress tickets"
          trend="Active"
          trendDirection="up"
          theme="pastel-blue"
        />
        <StatCard
          title="Repeat Customers"
          value={repeatCustomers}
          subtitle="Multiple tickets logged"
          trend="Multi-ticket"
          trendDirection="up"
          theme="pastel-indigo"
        />
        <StatCard
          title="Resolved Requests"
          value={totalCustomerResolved}
          subtitle="Across all customers"
          trend="Completed"
          trendDirection="up"
          theme="pastel-green"
        />
      </div>

      {/* Main Two-Column Customer List + Customer Details Panel */}
      <div className="customers-main-layout">
        {/* Left: Customer List Table */}
        <div className="customers-list-card">
          <div className="customers-toolbar">
            <h2 className="dash-card-title" style={{ fontSize: '16px' }}>
              Customer Directory ({filteredCustomers.length})
            </h2>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search customers by name or email..."
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <EmptyState
              title="No Customers Found"
              description="No customers match your current search filter."
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <div className="customers-table-wrap">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Total Tickets</th>
                    <th>Open / Active</th>
                    <th>Resolved</th>
                    <th>Latest Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const isSelected =
                      activeCustomer && activeCustomer.id === customer.id;
                    const activeOpenCount =
                      customer.openTickets + customer.inProgressTickets;

                    return (
                      <tr
                        key={customer.id}
                        className={
                          isSelected ? 'active-customer-row' : undefined
                        }
                        onClick={() => setSelectedCustomerId(customer.id)}
                      >
                        <td>
                          <div className="customer-identity-cell">
                            <span className="customer-initial-avatar">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                            <strong>{customer.name}</strong>
                          </div>
                        </td>
                        <td>{customer.email}</td>
                        <td>
                          <strong>{customer.totalTickets}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                activeOpenCount > 0 ? '#2563eb' : 'inherit'
                            }}
                          >
                            {activeOpenCount}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>
                            {customer.resolvedTickets}
                          </span>
                        </td>
                        <td>{formatTimeAgo(customer.latestActivityDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Customer Details Panel & Customer Ticket History */}
        <div className="customer-details-panel">
          {!activeCustomer ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
              Select a customer from the directory to inspect their details and
              ticket history.
            </p>
          ) : (
            <>
              <div className="customer-panel-header">
                <div className="customer-panel-avatar">
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: 'var(--text-dark)'
                    }}
                  >
                    {activeCustomer.name}
                  </h3>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--text-muted)',
                      fontSize: '12.5px',
                      marginTop: '2px'
                    }}
                  >
                    <Mail size={13} />
                    <span>{activeCustomer.email}</span>
                  </div>
                </div>
              </div>

              {/* Customer Statistics Summary */}
              <div className="customer-stats-mini-grid">
                <div className="customer-stat-mini-box">
                  <div className="customer-stat-mini-val">
                    {activeCustomer.totalTickets}
                  </div>
                  <div className="customer-stat-mini-label">Total Tickets</div>
                </div>
                <div className="customer-stat-mini-box">
                  <div
                    className="customer-stat-mini-val"
                    style={{ color: '#2563eb' }}
                  >
                    {activeCustomer.openTickets +
                      activeCustomer.inProgressTickets}
                  </div>
                  <div className="customer-stat-mini-label">Open / Active</div>
                </div>
                <div className="customer-stat-mini-box">
                  <div
                    className="customer-stat-mini-val"
                    style={{ color: '#16a34a' }}
                  >
                    {activeCustomer.resolvedTickets}
                  </div>
                  <div className="customer-stat-mini-label">Resolved</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <h4 className="dash-card-title">
                  Customer Ticket History ({activeCustomer.tickets.length})
                </h4>
              </div>

              <div className="customer-history-list">
                {activeCustomer.tickets.map((t) => {
                  const overdue = isTicketOverdue(t);
                  return (
                    <div key={t.id} className="customer-history-item">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px'
                        }}
                      >
                        <Link
                          to={`/tickets/${t.id}`}
                          className="ticket-no-link"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <span>{t.ticketNumber}</span>
                          <ExternalLink size={12} />
                        </Link>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <PriorityBadge priority={t.priority} />
                          <StatusBadge status={t.status} isOverdue={overdue} />
                        </div>
                      </div>

                      <Link
                        to={`/tickets/${t.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: '13.5px',
                          color: 'var(--text-dark)',
                          display: 'block',
                          marginBottom: '6px'
                        }}
                      >
                        {t.subject}
                      </Link>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '11.5px',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <span>Agent: {t.assignedAgent || 'Unassigned'}</span>
                        <span>Due: {formatDate(t.dueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Customers;
