import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Filter,
  Eye,
  Edit3,
  Trash2,
  UserX,
  Copy,
  Check
} from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import {
  formatDate,
  formatTimeAgo,
  getAgentByName,
  isTicketOverdue,
  getDaysOverdue
} from '../utils/helpers';
import '../styles/TicketTable.css';

function TicketTable({
  tickets = [],
  agents = [],
  activeAgents = [],
  viewMode = 'table',
  showSubject = false,
  showExtendedColumns = false,
  showActions = false,
  enableQuickActions = false,
  enableSelection = false,
  selectedIds = [],
  onToggleSelectOne,
  onToggleSelectAll,
  onQuickStatusChange,
  onQuickAgentChange,
  statusVariant = 'pill',
  onEditTicket,
  onDeleteTicket,
  onCopyTicketId
}) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);

  function handleCopyId(ticketNumber, id) {
    const text = ticketNumber || `#${id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    if (onCopyTicketId) {
      onCopyTicketId(text);
    }
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  }

  const allSelectedOnPage =
    tickets.length > 0 &&
    tickets.every((t) => selectedIds.includes(String(t.id)));

  // ==================== GRID / CARD VIEW ====================
  if (viewMode === 'grid') {
    return (
      <div className="tickets-card-grid">
        {tickets.map((ticket) => {
          const overdue = isTicketOverdue(ticket);
          const daysOver = getDaysOverdue(ticket);
          const isSelected = selectedIds.includes(String(ticket.id));
          const catClass = `cat-${String(ticket.category || 'general').toLowerCase()}`;

          return (
            <div
              key={ticket.id}
              className={`ticket-grid-card ${
                isSelected ? 'selected-card' : ''
              }`}
            >
              <div>
                <div className="ticket-card-top">
                  <div className="ticket-id-group">
                    {enableSelection && (
                      <input
                        type="checkbox"
                        className="row-checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectOne(String(ticket.id))}
                        aria-label={`Select ticket ${ticket.ticketNumber}`}
                      />
                    )}
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="ticket-no-link"
                    >
                      {ticket.ticketNumber || `#${ticket.id}`}
                    </Link>
                    <button
                      type="button"
                      className={`copy-id-btn ${
                        copiedId === ticket.id ? 'copied' : ''
                      }`}
                      onClick={() =>
                        handleCopyId(ticket.ticketNumber, ticket.id)
                      }
                      title="Copy Ticket ID"
                    >
                      {copiedId === ticket.id ? (
                        <Check size={13} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`category-badge ${catClass}`}>
                      {ticket.category}
                    </span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>

                <Link
                  to={`/tickets/${ticket.id}`}
                  className="ticket-card-subject"
                >
                  {ticket.subject}
                </Link>

                <div style={{ marginTop: '6px' }}>
                  <div className="ticket-customer-name">
                    {ticket.customerName}
                  </div>
                  <div className="ticket-customer-email">{ticket.email}</div>
                </div>
              </div>

              {enableQuickActions ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '6px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginBottom: '3px'
                      }}
                    >
                      Status
                    </div>
                    <select
                      className="inline-quick-select"
                      style={{ width: '100%', maxWidth: 'none' }}
                      value={ticket.status}
                      onChange={(e) =>
                        onQuickStatusChange(ticket.id, e.target.value)
                      }
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginBottom: '3px'
                      }}
                    >
                      Assigned Agent (Active)
                    </div>
                    <select
                      className="inline-quick-select"
                      style={{ width: '100%', maxWidth: 'none' }}
                      value={ticket.assignedAgent || 'Unassigned'}
                      onChange={(e) =>
                        onQuickAgentChange(ticket.id, e.target.value)
                      }
                    >
                      <option value="Unassigned">Unassigned</option>
                      {activeAgents.map((a) => (
                        <option key={a.id} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <StatusBadge status={ticket.status} isOverdue={overdue} />
                  <span>{ticket.assignedAgent || 'Unassigned'}</span>
                </div>
              )}

              <div className="ticket-card-meta-row">
                <div>
                  <span
                    className={`due-date-cell ${overdue ? 'overdue' : ''}`}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <span>Due: {formatDate(ticket.dueDate)}</span>
                    {overdue && (
                      <span className="overdue-tag">{daysOver}d overdue</span>
                    )}
                  </span>
                  <div style={{ fontSize: '11px', marginTop: '2px' }}>
                    Updated {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                  </div>
                </div>

                {showActions && (
                  <div className="table-actions-cell">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      title="View Ticket Details"
                    >
                      <Eye size={14} />
                    </button>
                    {onEditTicket && (
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => onEditTicket(ticket)}
                        title="Edit Ticket Details"
                        aria-label={`Edit Ticket Details ${ticket.ticketNumber}`}
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {onDeleteTicket && (
                      <button
                        type="button"
                        className="icon-action-btn delete"
                        onClick={() => onDeleteTicket(ticket)}
                        title="Delete Ticket"
                        aria-label={`Delete Ticket ${ticket.ticketNumber}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ==================== TABLE VIEW ====================
  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            {enableSelection && (
              <th style={{ width: '38px' }}>
                <input
                  type="checkbox"
                  className="row-checkbox"
                  checked={allSelectedOnPage}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  aria-label="Select all tickets on this page"
                />
              </th>
            )}
            <th>
              <span className="th-content">
                <span>Ticket Number</span>
                <span className="th-icon">
                  <ArrowUpDown size={13} />
                </span>
              </span>
            </th>
            <th>
              <span className="th-content">
                <span>Customer & Subject</span>
                <span className="th-icon">
                  <ArrowUpDown size={13} />
                </span>
              </span>
            </th>
            {showExtendedColumns && <th>Issue Category</th>}
            <th>
              <span className="th-content">
                <span>Priority Level</span>
                <span className="th-icon">
                  <Filter size={13} />
                </span>
              </span>
            </th>
            <th>
              <span className="th-content">
                <span>Assigned Support Agent</span>
                <span className="th-icon">
                  <Filter size={13} />
                </span>
              </span>
            </th>
            <th>
              <span className="th-content">
                <span>Ticket Status</span>
                <span className="th-icon">
                  <Filter size={13} />
                </span>
              </span>
            </th>
            <th>
              <span className="th-content">
                <span>SLA Due Date</span>
                <span className="th-icon">
                  <ArrowUpDown size={13} />
                </span>
              </span>
            </th>
            {showExtendedColumns && <th>Created & Last Updated</th>}
            {showActions && <th>Ticket Actions</th>}
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => {
            const agentInfo = getAgentByName(ticket.assignedAgent, agents);
            const overdue = isTicketOverdue(ticket);
            const daysOver = getDaysOverdue(ticket);
            const isUnassigned =
              !ticket.assignedAgent || ticket.assignedAgent === 'Unassigned';
            const isSelected = selectedIds.includes(String(ticket.id));
            const catClass = `cat-${String(
              ticket.category || 'general'
            ).toLowerCase()}`;

            return (
              <tr
                key={ticket.id}
                className={isSelected ? 'selected-row' : undefined}
              >
                {enableSelection && (
                  <td>
                    <input
                      type="checkbox"
                      className="row-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectOne(String(ticket.id))}
                      aria-label={`Select ticket ${ticket.ticketNumber}`}
                    />
                  </td>
                )}

                <td>
                  <div className="ticket-id-group">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="ticket-no-link"
                    >
                      {ticket.ticketNumber || `#${ticket.id}`}
                    </Link>
                    <button
                      type="button"
                      className={`copy-id-btn ${
                        copiedId === ticket.id ? 'copied' : ''
                      }`}
                      onClick={() =>
                        handleCopyId(ticket.ticketNumber, ticket.id)
                      }
                      title="Copy Ticket ID to clipboard"
                      aria-label={`Copy ${ticket.ticketNumber}`}
                    >
                      {copiedId === ticket.id ? (
                        <Check size={13} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </td>

                <td>
                  <div className="ticket-customer-cell">
                    <span className="ticket-customer-name">
                      {ticket.customerName}
                    </span>
                    {showExtendedColumns && (
                      <span className="ticket-customer-email">
                        {ticket.email}
                      </span>
                    )}
                    {showSubject && (
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="ticket-subject-sub"
                        title={ticket.subject}
                      >
                        {ticket.subject}
                      </Link>
                    )}
                  </div>
                </td>

                {showExtendedColumns && (
                  <td>
                    <span className={`category-badge ${catClass}`}>
                      {ticket.category}
                    </span>
                  </td>
                )}

                <td>
                  <PriorityBadge priority={ticket.priority} />
                </td>

                <td>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    {isUnassigned ? (
                      <span className="unassigned-label">
                        <UserX size={13} />
                        <span>Unassigned</span>
                      </span>
                    ) : (
                      <div className="assigned-agent-cell">
                        {agentInfo.avatar ? (
                          <img
                            src={agentInfo.avatar}
                            alt={agentInfo.name}
                            className="assigned-agent-avatar"
                          />
                        ) : (
                          <span className="avatar-circle">
                            {agentInfo.name.charAt(0)}
                          </span>
                        )}
                        <span>{agentInfo.name}</span>
                      </div>
                    )}

                    {enableQuickActions && onQuickAgentChange && (
                      <select
                        className="inline-quick-select"
                        value={ticket.assignedAgent || 'Unassigned'}
                        onChange={(e) =>
                          onQuickAgentChange(ticket.id, e.target.value)
                        }
                        title="Quick Assign Active Agent"
                        aria-label={`Assign agent for ${ticket.ticketNumber}`}
                      >
                        <option value="Unassigned">Assign: Unassigned</option>
                        {activeAgents.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>

                <td>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}
                  >
                    <StatusBadge
                      status={ticket.status}
                      isOverdue={overdue}
                      variant={statusVariant}
                    />

                    {enableQuickActions && onQuickStatusChange && (
                      <select
                        className="inline-quick-select"
                        value={ticket.status}
                        onChange={(e) =>
                          onQuickStatusChange(ticket.id, e.target.value)
                        }
                        title="Quick Status Update"
                        aria-label={`Change status for ${ticket.ticketNumber}`}
                      >
                        <option value="Open">Status: Open</option>
                        <option value="In Progress">Status: In Progress</option>
                        <option value="Resolved">Status: Resolved</option>
                        <option value="Closed">Status: Closed</option>
                      </select>
                    )}
                  </div>
                </td>

                <td>
                  <span
                    className={`due-date-cell ${overdue ? 'overdue' : ''}`}
                  >
                    <span>{formatDate(ticket.dueDate)}</span>
                    {overdue && (
                      <span className="overdue-tag">
                        {daysOver}d Overdue
                      </span>
                    )}
                  </span>
                </td>

                {showExtendedColumns && (
                  <td>
                    <div className="date-meta-stack">
                      <span>Created: {formatDate(ticket.createdAt)}</span>
                      <span>
                        Updated:{' '}
                        {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                      </span>
                    </div>
                  </td>
                )}

                {showActions && (
                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        title="View Ticket Details"
                        aria-label={`View Ticket Details ${ticket.ticketNumber}`}
                      >
                        <Eye size={15} />
                      </button>

                      {onEditTicket && (
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => onEditTicket(ticket)}
                          title="Edit Ticket Details"
                          aria-label={`Edit Ticket Details ${ticket.ticketNumber}`}
                        >
                          <Edit3 size={15} />
                        </button>
                      )}

                      {onDeleteTicket && (
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => onDeleteTicket(ticket)}
                          title="Delete Ticket"
                          aria-label={`Delete Ticket ${ticket.ticketNumber}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TicketTable;
