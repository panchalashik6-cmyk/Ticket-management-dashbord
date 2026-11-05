import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  RotateCcw,
  Send,
  Lock,
  MessageSquare,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  getAgentByName,
  isTicketOverdue,
  getDaysOverdue
} from '../utils/helpers';
import '../styles/TicketDetails.css';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    tickets,
    agents,
    activeAgents,
    comments,
    activities,
    currentUser,
    loading,
    error,
    fetchAllData,
    editTicket,
    changeTicketStatus,
    assignTicketAgent,
    changeTicketPriority,
    removeTicket,
    addTicketComment,
    addToast
  } = useTicketContext();

  // Reply / Internal Note states
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [commentFilter, setCommentFilter] = useState('all'); // 'all' | 'public' | 'internal'
  const [timelineFilter, setTimelineFilter] = useState('all'); // 'all' | 'status' | 'assignment'
  const [commentError, setCommentError] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Edit Ticket Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    customerName: '',
    email: '',
    subject: '',
    description: '',
    category: 'Technical',
    priority: 'Medium',
    assignedAgent: 'Unassigned',
    status: 'Open',
    dueDate: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Ticket Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return <Loader message="Loading ticket details and conversation..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Error Loading Ticket"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  const ticket = tickets.find((t) => String(t.id) === String(id));

  if (!ticket) {
    return (
      <EmptyState
        title={`Ticket #${id} Not Found`}
        description="The ticket you are looking for does not exist or may have been deleted."
        actionLabel="Return to All Tickets"
        onAction={() => navigate('/tickets')}
      />
    );
  }

  const overdue = isTicketOverdue(ticket);
  const daysOverdue = getDaysOverdue(ticket);
  const agentInfo = getAgentByName(ticket.assignedAgent, agents);
  const canReopen = ticket.status === 'Resolved' || ticket.status === 'Closed';
  const catClass = `cat-${String(ticket.category || 'general').toLowerCase()}`;

  // Comments for this ticket (chronological oldest -> newest)
  const allTicketComments = comments
    .filter((c) => String(c.ticketId) === String(ticket.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const displayedComments = allTicketComments.filter((c) => {
    if (commentFilter === 'public') return !c.isInternal;
    if (commentFilter === 'internal') return c.isInternal;
    return true;
  });

  // Activity Timeline for this ticket (newest first)
  const allTicketActivities = activities
    .filter((a) => String(a.ticketId) === String(ticket.id))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const displayedActivities = allTicketActivities.filter((a) => {
    if (timelineFilter === 'status') return a.type === 'status_changed';
    if (timelineFilter === 'assignment') return a.type === 'ticket_assigned';
    return true;
  });

  function handleCopyTicketNumber() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ticket.ticketNumber);
    }
    setCopiedId(true);
    addToast(
      `Ticket number ${ticket.ticketNumber} has been copied to your clipboard.`,
      'info',
      'Ticket ID Copied'
    );
    setTimeout(() => setCopiedId(false), 1800);
  }

  // Workflow Action Handlers
  async function handleStatusChange(newStatus) {
    try {
      await changeTicketStatus(ticket.id, newStatus);
    } catch (err) {
      addToast(err.message || 'Failed to update status.', 'error');
    }
  }

  async function handleReopenTicket() {
    try {
      await changeTicketStatus(ticket.id, 'Open');
    } catch (err) {
      addToast(err.message || 'Failed to reopen ticket.', 'error');
    }
  }

  async function handleAgentChange(newAgent) {
    try {
      await assignTicketAgent(ticket.id, newAgent);
    } catch (err) {
      addToast(err.message || 'Failed to assign agent.', 'error');
    }
  }

  async function handlePriorityChange(newPriority) {
    try {
      await changeTicketPriority(ticket.id, newPriority);
    } catch (err) {
      addToast(err.message || 'Failed to change priority.', 'error');
    }
  }

  // Handle adding a reply or internal note
  async function handlePostComment(e) {
    e.preventDefault();
    if (isPostingComment) return;
    setCommentError('');

    if (!replyText || replyText.trim().length < 2) {
      setCommentError(
        'Please enter a message (minimum 2 non-whitespace characters).'
      );
      return;
    }

    setIsPostingComment(true);
    try {
      await addTicketComment(ticket.id, replyText, isInternalNote);
      setReplyText('');
    } catch (err) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  }

  // Open Edit Modal
  function openEditModal() {
    setEditErrors({});
    setEditForm({
      customerName: ticket.customerName || '',
      email: ticket.email || '',
      subject: ticket.subject || '',
      description: ticket.description || '',
      category: ticket.category || 'Technical',
      priority: ticket.priority || 'Medium',
      assignedAgent: ticket.assignedAgent || 'Unassigned',
      status: ticket.status || 'Open',
      dueDate: ticket.dueDate || ''
    });
    setIsEditOpen(true);
  }

  async function handleSaveEditModal(e) {
    e.preventDefault();
    if (isSavingEdit) return;

    const errs = {};
    if (!editForm.customerName || editForm.customerName.trim().length < 3) {
      errs.customerName = 'Customer name must be at least 3 characters.';
    }
    if (
      !editForm.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())
    ) {
      errs.email = 'Please enter a valid email address.';
    }
    if (
      !editForm.subject ||
      editForm.subject.trim().length < 5 ||
      editForm.subject.trim().length > 100
    ) {
      errs.subject = 'Subject must be between 5 and 100 characters.';
    }
    if (!editForm.description || editForm.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }
    if (!editForm.dueDate) {
      errs.dueDate = 'Due date is required.';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setIsSavingEdit(true);
    try {
      await editTicket(ticket.id, editForm);
      setIsEditOpen(false);
    } catch (err) {
      addToast(err.message || 'Failed to update ticket.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Delete Ticket
  async function handleConfirmDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await removeTicket(ticket.id);
      setIsDeleteOpen(false);
      navigate('/tickets');
    } catch (err) {
      setIsDeleting(false);
      addToast(err.message || 'Failed to delete ticket.', 'error');
    }
  }

  return (
    <div className="ticket-details-page">
      {/* Top Action Bar */}
      <div className="details-top-bar">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate('/tickets')}
        >
          <ArrowLeft size={15} />
          <span>Return to Ticket Management</span>
        </button>

        <div className="details-top-actions">
          {canReopen && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReopenTicket}
            >
              <RotateCcw size={15} />
              <span>Reopen Support Ticket</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline"
            onClick={openEditModal}
          >
            <Edit3 size={15} />
            <span>Edit Ticket Details</span>
          </button>

          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 size={15} />
            <span>Delete Ticket</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="details-layout-grid">
        {/* Left Section: Ticket Overview, Customer Info & Conversation */}
        <div className="details-main-col">
          {/* Ticket Overview Card */}
          <div className="details-card">
            <div className="ticket-header-meta">
              <span className="ticket-id-pill">{ticket.ticketNumber}</span>
              <button
                type="button"
                className={`copy-id-btn ${copiedId ? 'copied' : ''}`}
                onClick={handleCopyTicketNumber}
                title="Copy Ticket ID"
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <span className={`category-badge ${catClass}`}>
                {ticket.category}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} isOverdue={overdue} />
              {overdue && (
                <span className="overdue-tag">
                  OVERDUE ({daysOverdue}d)
                </span>
              )}
            </div>

            <h1 className="ticket-subject-heading">{ticket.subject}</h1>

            {/* Customer Summary Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                marginBottom: '14px',
                fontSize: '13px'
              }}
            >
              <div>
                <strong>Customer:</strong> {ticket.customerName} (
                <span style={{ color: 'var(--text-muted)' }}>
                  {ticket.email}
                </span>
                )
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Created: {formatDateTime(ticket.createdAt)} • Due:{' '}
                <strong style={overdue ? { color: '#dc2626' } : undefined}>
                  {formatDate(ticket.dueDate)}
                </strong>
              </div>
            </div>

            <div className="ticket-description-box">{ticket.description}</div>
          </div>

          {/* Bottom Section: Conversation History & Professional Comment Composer */}
          <div className="details-card">
            <div className="conversation-card-title">
              <span>
                Conversation History ({allTicketComments.length})
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    commentFilter === 'all' ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setCommentFilter('all')}
                >
                  All ({allTicketComments.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    commentFilter === 'public' ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setCommentFilter('public')}
                >
                  Customer Replies (
                  {allTicketComments.filter((c) => !c.isInternal).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${
                    commentFilter === 'internal' ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setCommentFilter('internal')}
                >
                  Internal Notes (
                  {allTicketComments.filter((c) => c.isInternal).length})
                </button>
              </div>
            </div>

            {displayedComments.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13.5px',
                  marginBottom: '18px'
                }}
              >
                No messages in this view yet. Use the composer below to add a
                reply or internal note.
              </p>
            ) : (
              <div className="comments-list">
                {displayedComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`comment-item ${
                      comment.isInternal ? 'internal-note' : ''
                    }`}
                  >
                    <div className="comment-header">
                      <div className="comment-author-group">
                        <span className="avatar-circle">
                          {comment.author ? comment.author.charAt(0) : 'U'}
                        </span>
                        <span className="comment-author-name">
                          {comment.author}
                        </span>
                        <span
                          className={`comment-type-badge ${
                            comment.isInternal ? 'internal' : 'public'
                          }`}
                        >
                          {comment.isInternal
                            ? '🔒 Internal Note (Agents Only)'
                            : comment.authorRole || 'Customer Support Reply'}
                        </span>
                      </div>

                      <span className="comment-time">
                        {formatDateTime(comment.createdAt)}
                      </span>
                    </div>

                    <div className="comment-body">{comment.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Professional Comment Composer */}
            <form onSubmit={handlePostComment} noValidate>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '10px'
                }}
              >
                <div className="reply-tabs" style={{ marginBottom: 0 }}>
                  <button
                    type="button"
                    className={`reply-tab-btn ${
                      !isInternalNote ? 'active-public' : ''
                    }`}
                    onClick={() => setIsInternalNote(false)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare size={14} />
                      Customer Reply Mode
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`reply-tab-btn ${
                      isInternalNote ? 'active-internal' : ''
                    }`}
                    onClick={() => setIsInternalNote(true)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Lock size={14} />
                      Internal Note Mode
                    </span>
                  </button>
                </div>

                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Author: <strong>{currentUser.name}</strong> ({currentUser.role})
                </span>
              </div>

              <textarea
                className="reply-textarea"
                style={
                  isInternalNote
                    ? {
                        backgroundColor: '#fffbeb',
                        borderColor: '#f59e0b',
                        color: '#1e293b'
                      }
                    : undefined
                }
                placeholder={
                  isInternalNote
                    ? 'Write a private internal note (highlighted in amber, visible only to support agents)...'
                    : `Write a customer-facing reply to ${ticket.customerName}...`
                }
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  if (commentError) setCommentError('');
                }}
              />

              {commentError && (
                <div
                  style={{
                    color: '#dc2626',
                    fontSize: '12.5px',
                    marginBottom: '8px',
                    fontWeight: 500
                  }}
                >
                  {commentError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {isInternalNote
                    ? 'Internal notes are hidden from the customer portal.'
                    : `Will be logged with timestamp (${formatDateTime(
                        new Date().toISOString()
                      )})`}
                </span>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPostingComment}
                >
                  <Send size={14} />
                  <span>
                    {isPostingComment
                      ? 'Submitting...'
                      : isInternalNote
                      ? 'Post Internal Note'
                      : 'Send Customer Reply'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Section: Status, Assigned Agent, Selectors & Activity Timeline */}
        <div className="details-side-col">
          {/* Workflow Selectors Card */}
          <div className="details-card">
            <h3
              className="dash-card-title"
              style={{ marginBottom: '14px' }}
            >
              Ticket Workflow & Assignment
            </h3>

            <div className="workflow-controls">
              {/* Status Update Selector */}
              <div className="workflow-field">
                <label htmlFor="workflow-status">Status Update Selector</label>
                <select
                  id="workflow-status"
                  className="workflow-select"
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Assignment Dropdown (Active Agents Only) */}
              <div className="workflow-field">
                <label htmlFor="workflow-agent">
                  Assignment Dropdown (Active Agents Only)
                </label>
                <select
                  id="workflow-agent"
                  className="workflow-select"
                  value={ticket.assignedAgent || 'Unassigned'}
                  onChange={(e) => handleAgentChange(e.target.value)}
                >
                  <option value="Unassigned">Unassigned</option>
                  {agents.map((agent) => {
                    const isActive = agent.status === 'Active';
                    return (
                      <option
                        key={agent.id}
                        value={agent.name}
                        disabled={!isActive}
                      >
                        {agent.name} {!isActive ? '(Inactive)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="workflow-field">
                <label htmlFor="workflow-priority">Priority Selector</label>
                <select
                  id="workflow-priority"
                  className="workflow-select"
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Quick Assign to Me Button */}
              {ticket.assignedAgent !== currentUser.name && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleAgentChange(currentUser.name)}
                >
                  <UserCheck size={14} />
                  <span>Assign to Me ({currentUser.name})</span>
                </button>
              )}
            </div>
          </div>

          {/* Customer & Ticket Metadata Card */}
          <div className="details-card">
            <h3
              className="dash-card-title"
              style={{ marginBottom: '14px' }}
            >
              Ticket Metadata
            </h3>

            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Current Status</span>
                <span className="info-value">
                  <StatusBadge status={ticket.status} isOverdue={overdue} />
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Assigned Agent</span>
                <span
                  className="info-value"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {agentInfo.avatar && (
                    <img
                      src={agentInfo.avatar}
                      alt={agentInfo.name}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <span>{agentInfo.name}</span>
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Customer</span>
                <span className="info-value">{ticket.customerName}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{ticket.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Category</span>
                <span className="info-value">{ticket.category}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Created Date</span>
                <span className="info-value">
                  {formatDateTime(ticket.createdAt)}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">
                  {formatDateTime(ticket.updatedAt || ticket.createdAt)}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Due Date</span>
                <span
                  className="info-value"
                  style={overdue ? { color: '#dc2626' } : undefined}
                >
                  {formatDate(ticket.dueDate)}{' '}
                  {overdue ? `(${daysOverdue}d Overdue)` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Timeline, Status Changes & Assignment History Card */}
          <div className="details-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '12px'
              }}
            >
              <h3 className="dash-card-title">Activity & Audit Timeline</h3>
              <select
                className="inline-quick-select"
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                aria-label="Filter timeline events"
              >
                <option value="all">All Events</option>
                <option value="status">Status Changes</option>
                <option value="assignment">Assignment History</option>
              </select>
            </div>

            {displayedActivities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No matching timeline events for this filter.
              </p>
            ) : (
              <div className="timeline-list">
                {displayedActivities.map((act) => (
                  <div key={act.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-title">{act.title}</div>
                      <div className="timeline-desc">{act.description}</div>
                      <div className="timeline-time">
                        {formatTimeAgo(act.createdAt, act.timeAgo)} •{' '}
                        {formatDateTime(act.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={isEditOpen}
        title={`Edit Ticket Details — ${ticket.ticketNumber}`}
        onClose={() => setIsEditOpen(false)}
      >
        <form
          onSubmit={handleSaveEditModal}
          className="modal-form-grid"
          noValidate
        >
          <div className="modal-form-row">
            <div className="modal-form-group">
              <label htmlFor="det-customer">Customer Name *</label>
              <input
                id="det-customer"
                type="text"
                value={editForm.customerName}
                onChange={(e) =>
                  setEditForm({ ...editForm, customerName: e.target.value })
                }
              />
              {editErrors.customerName && (
                <span style={{ color: '#dc2626', fontSize: '12px' }}>
                  {editErrors.customerName}
                </span>
              )}
            </div>

            <div className="modal-form-group">
              <label htmlFor="det-email">Email *</label>
              <input
                id="det-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
              {editErrors.email && (
                <span style={{ color: '#dc2626', fontSize: '12px' }}>
                  {editErrors.email}
                </span>
              )}
            </div>
          </div>

          <div className="modal-form-group">
            <label htmlFor="det-subject">Subject *</label>
            <input
              id="det-subject"
              type="text"
              value={editForm.subject}
              onChange={(e) =>
                setEditForm({ ...editForm, subject: e.target.value })
              }
            />
            {editErrors.subject && (
              <span style={{ color: '#dc2626', fontSize: '12px' }}>
                {editErrors.subject}
              </span>
            )}
          </div>

          <div className="modal-form-group">
            <label htmlFor="det-desc">Description *</label>
            <textarea
              id="det-desc"
              rows={3}
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
            {editErrors.description && (
              <span style={{ color: '#dc2626', fontSize: '12px' }}>
                {editErrors.description}
              </span>
            )}
          </div>

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label htmlFor="det-cat">Category</label>
              <select
                id="det-cat"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="modal-form-group">
              <label htmlFor="det-agent">Assigned Agent (Active Only)</label>
              <select
                id="det-agent"
                value={editForm.assignedAgent}
                onChange={(e) =>
                  setEditForm({ ...editForm, assignedAgent: e.target.value })
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

          <div className="modal-form-group">
            <label htmlFor="det-duedate">Due Date *</label>
            <input
              id="det-duedate"
              type="date"
              value={editForm.dueDate}
              onChange={(e) =>
                setEditForm({ ...editForm, dueDate: e.target.value })
              }
            />
            {editErrors.dueDate && (
              <span style={{ color: '#dc2626', fontSize: '12px' }}>
                {editErrors.dueDate}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '8px'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingEdit}
            >
              {isSavingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        title="Delete Ticket Confirmation"
        onClose={() => setIsDeleteOpen(false)}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.5
          }}
        >
          Are you sure you want to delete ticket{' '}
          <strong>{ticket.ticketNumber}</strong>? All comments, internal notes,
          notifications, and activity logs for this ticket will also be removed.
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
            onClick={() => setIsDeleteOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default TicketDetails;
