import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  CheckSquare
} from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import SearchBar from '../components/SearchBar';
import TicketTable from '../components/TicketTable';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import { isTicketOverdue, getPriorityWeight } from '../utils/helpers';
import '../styles/MyTickets.css';

function MyTickets({ filterMode = 'all' }) {
  const {
    tickets,
    agents,
    activeAgents,
    loading,
    error,
    fetchAllData,
    editTicket,
    changeTicketStatus,
    assignTicketAgent,
    bulkUpdateTickets,
    removeTicket,
    headerSearch,
    setHeaderSearch,
    currentUser,
    addToast
  } = useTicketContext();

  const navigate = useNavigate();

  // View mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState('table');

  // Filter & Sort states
  const [searchTerm, setSearchTerm] = useState(headerSearch || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkAgent, setBulkAgent] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Pagination states (5, 10, or 20 records per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(
    currentUser?.preferences?.defaultRecordsPerPage || 10
  );

  // Edit Ticket Modal State
  const [editingTicket, setEditingTicket] = useState(null);
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

  // Delete Confirmation Modal State
  const [deletingTicket, setDeletingTicket] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync top header search bar with local search
  useEffect(() => {
    setSearchTerm(headerSearch || '');
  }, [headerSearch]);

  // Pre-configure agent filter when route mode changes ('all', 'mine', 'unassigned')
  useEffect(() => {
    setSelectedIds([]);
    if (filterMode === 'mine') {
      setAgentFilter(currentUser.name);
    } else if (filterMode === 'unassigned') {
      setAgentFilter('Unassigned');
    } else {
      setAgentFilter('All');
    }
    setCurrentPage(1);
  }, [filterMode, currentUser.name]);

  // Reset pagination to page 1 whenever filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    categoryFilter,
    agentFilter,
    dateFrom,
    dateTo,
    sortBy,
    itemsPerPage
  ]);

  function handleClearFilters() {
    setSearchTerm('');
    setHeaderSearch('');
    setStatusFilter('All');
    setPriorityFilter('All');
    setCategoryFilter('All');
    setAgentFilter(
      filterMode === 'mine'
        ? currentUser.name
        : filterMode === 'unassigned'
        ? 'Unassigned'
        : 'All'
    );
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
    setCurrentPage(1);
  }

  if (loading) {
    return <Loader message="Loading support tickets queue..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        title="Unable to Load Tickets"
        message={error}
        onRetry={fetchAllData}
      />
    );
  }

  // 1. Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Search by ticket ID, customer name, email, or subject
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        String(ticket.id).toLowerCase().includes(q) ||
        String(ticket.ticketNumber).toLowerCase().includes(q) ||
        String(ticket.customerName).toLowerCase().includes(q) ||
        String(ticket.email).toLowerCase().includes(q) ||
        String(ticket.subject).toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Filter by status (including Overdue quick filter)
    if (statusFilter !== 'All') {
      if (statusFilter === 'Overdue') {
        if (!isTicketOverdue(ticket)) return false;
      } else if (ticket.status !== statusFilter) {
        return false;
      }
    }

    // Filter by priority
    if (priorityFilter !== 'All' && ticket.priority !== priorityFilter) {
      return false;
    }

    // Filter by category
    if (categoryFilter !== 'All' && ticket.category !== categoryFilter) {
      return false;
    }

    // Filter by assigned agent
    if (agentFilter !== 'All') {
      const ticketAgent = ticket.assignedAgent || 'Unassigned';
      if (ticketAgent.toLowerCase() !== agentFilter.toLowerCase()) return false;
    }

    // Filter by Date Range (createdAt)
    if (dateFrom) {
      const createdDate = new Date(ticket.createdAt);
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (createdDate < fromDate) return false;
    }

    if (dateTo) {
      const createdDate = new Date(ticket.createdAt);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (createdDate > toDate) return false;
    }

    return true;
  });

  // 2. Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'priorityDesc') {
      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    }
    if (sortBy === 'priorityAsc') {
      return getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
    }
    if (sortBy === 'dueDateAsc') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === 'dueDateDesc') {
      return new Date(b.dueDate) - new Date(a.dueDate);
    }
    return 0;
  });

  // 3. Paginate tickets
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTickets = sortedTickets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Bulk selection handlers
  function handleToggleSelectOne(idStr) {
    setSelectedIds((prev) =>
      prev.includes(idStr)
        ? prev.filter((item) => item !== idStr)
        : [...prev, idStr]
    );
  }

  function handleToggleSelectAll(checked) {
    const pageIds = paginatedTickets.map((t) => String(t.id));
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  }

  async function handleApplyBulkStatus(newStatus) {
    if (!newStatus || selectedIds.length === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateTickets(selectedIds, { status: newStatus });
      setBulkStatus('');
      setSelectedIds([]);
    } catch (err) {
      addToast(err.message || 'Bulk status update failed.', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function handleApplyBulkPriority(newPriority) {
    if (!newPriority || selectedIds.length === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateTickets(selectedIds, { priority: newPriority });
      setBulkPriority('');
      setSelectedIds([]);
    } catch (err) {
      addToast(err.message || 'Bulk priority update failed.', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function handleApplyBulkAgent(newAgent) {
    if (!newAgent || selectedIds.length === 0 || isBulkUpdating) return;
    setIsBulkUpdating(true);
    try {
      await bulkUpdateTickets(selectedIds, { assignedAgent: newAgent });
      setBulkAgent('');
      setSelectedIds([]);
    } catch (err) {
      addToast(err.message || 'Bulk agent assignment failed.', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  }

  // Quick inline status & agent handlers
  async function handleQuickStatusChange(ticketId, newStatus) {
    try {
      await changeTicketStatus(ticketId, newStatus);
    } catch (err) {
      addToast(err.message || 'Failed to update status.', 'error');
    }
  }

  async function handleQuickAgentChange(ticketId, newAgent) {
    try {
      await assignTicketAgent(ticketId, newAgent);
    } catch (err) {
      addToast(err.message || 'Failed to assign agent.', 'error');
    }
  }

  // Open Edit Modal
  function handleOpenEdit(ticket) {
    setEditingTicket(ticket);
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
  }

  // Validate and Save Edited Ticket
  async function handleSaveEdit(e) {
    e.preventDefault();
    if (isSavingEdit || !editingTicket) return;

    const newErrors = {};
    if (!editForm.customerName || editForm.customerName.trim().length < 3) {
      newErrors.customerName = 'Customer name must be at least 3 characters.';
    }
    if (
      !editForm.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())
    ) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (
      !editForm.subject ||
      editForm.subject.trim().length < 5 ||
      editForm.subject.trim().length > 100
    ) {
      newErrors.subject = 'Subject must be between 5 and 100 characters.';
    }
    if (!editForm.description || editForm.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }
    if (!editForm.dueDate) {
      newErrors.dueDate = 'Due date is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }

    setIsSavingEdit(true);
    try {
      await editTicket(editingTicket.id, editForm);
      setEditingTicket(null);
    } catch (err) {
      addToast(err.message || 'Failed to update ticket.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Confirm Ticket Deletion
  async function handleConfirmDelete() {
    if (!deletingTicket || isDeleting) return;
    setIsDeleting(true);
    try {
      await removeTicket(deletingTicket.id);
      setSelectedIds((prev) =>
        prev.filter((id) => id !== String(deletingTicket.id))
      );
      setDeletingTicket(null);
    } catch (err) {
      addToast(err.message || 'Failed to delete ticket.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  const pageHeading =
    filterMode === 'mine'
      ? 'My Assigned Support Tickets'
      : filterMode === 'unassigned'
      ? 'Unassigned Support Tickets'
      : 'Support Ticket Management';

  const pageSubtitle =
    filterMode === 'mine'
      ? `Manage and resolve customer support tickets currently assigned to ${currentUser.name}`
      : filterMode === 'unassigned'
      ? 'Review and assign incoming unassigned customer support requests to active support specialists'
      : 'Manage, filter, and update customer support tickets with inline workflow controls and bulk actions';

  return (
    <div className="my-tickets-page">
      {/* Page Title & Create Button */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{pageHeading}</h1>
          <p className="page-subtitle">{pageSubtitle}</p>
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

      {/* Queue View Tabs + Table/Grid View Toggle */}
      <div className="tickets-view-toolbar">
        <div className="queue-tabs">
          <button
            type="button"
            className={`queue-tab-btn ${
              filterMode === 'all' && statusFilter !== 'Overdue' ? 'active' : ''
            }`}
            onClick={() => {
              setStatusFilter('All');
              navigate('/tickets');
            }}
          >
            <span>All Tickets ({tickets.length})</span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              filterMode === 'mine' ? 'active' : ''
            }`}
            onClick={() => navigate('/my-tickets')}
          >
            <span>
              My Tickets (
              {
                tickets.filter(
                  (t) =>
                    t.assignedAgent &&
                    t.assignedAgent.toLowerCase() ===
                      currentUser.name.toLowerCase()
                ).length
              }
              )
            </span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              filterMode === 'unassigned' ? 'active' : ''
            }`}
            onClick={() => navigate('/unassigned-tickets')}
          >
            <span>
              Unassigned (
              {
                tickets.filter(
                  (t) => !t.assignedAgent || t.assignedAgent === 'Unassigned'
                ).length
              }
              )
            </span>
          </button>

          <button
            type="button"
            className={`queue-tab-btn ${
              statusFilter === 'Overdue' ? 'active' : ''
            }`}
            onClick={() =>
              setStatusFilter((prev) =>
                prev === 'Overdue' ? 'All' : 'Overdue'
              )
            }
          >
            <span>
              Overdue ({tickets.filter((t) => isTicketOverdue(t)).length})
            </span>
          </button>
        </div>

        {/* Table / Grid Card View Toggle */}
        <div className="view-mode-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <LayoutList size={15} />
            <span>Table View</span>
          </button>

          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={15} />
            <span>Grid Cards</span>
          </button>
        </div>
      </div>

      {/* Search, Advanced Filters & Date Range Bar */}
      <div className="filters-card">
        <div className="filters-top-row">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setHeaderSearch(val);
            }}
            placeholder="Search by Ticket ID (#1832), customer name, email, or subject..."
          />

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleClearFilters}
          >
            <RotateCcw size={14} />
            <span>Clear All Filters</span>
          </button>
        </div>

        <div className="filters-controls-row">
          {/* 1. Status */}
          <div className="filter-field">
            <label htmlFor="status-filter" className="filter-label">
              Status
            </label>
            <select
              id="status-filter"
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue Only</option>
            </select>
          </div>

          {/* 2. Priority */}
          <div className="filter-field">
            <label htmlFor="priority-filter" className="filter-label">
              Priority
            </label>
            <select
              id="priority-filter"
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* 3. Category */}
          <div className="filter-field">
            <label htmlFor="category-filter" className="filter-label">
              Category
            </label>
            <select
              id="category-filter"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* 4. Assigned Agent */}
          <div className="filter-field">
            <label htmlFor="agent-filter" className="filter-label">
              Assigned Agent
            </label>
            <select
              id="agent-filter"
              className="filter-select"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="All">All Agents</option>
              <option value="Unassigned">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.name}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Date From */}
          <div className="filter-field">
            <label htmlFor="date-from" className="filter-label">
              Created From
            </label>
            <input
              id="date-from"
              type="date"
              className="filter-date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* 6. Date To */}
          <div className="filter-field">
            <label htmlFor="date-to" className="filter-label">
              Created To
            </label>
            <input
              id="date-to"
              type="date"
              className="filter-date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* 7. Sort By */}
          <div className="filter-field">
            <label htmlFor="sort-select" className="filter-label">
              Sort By
            </label>
            <select
              id="sort-select"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest Created</option>
              <option value="oldest">Oldest Created</option>
              <option value="priorityDesc">Priority (Urgent → Low)</option>
              <option value="priorityAsc">Priority (Low → Urgent)</option>
              <option value="dueDateAsc">Due Date (Soonest)</option>
              <option value="dueDateDesc">Due Date (Latest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Ticket Operations Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar" role="region" aria-label="Bulk actions">
          <div className="bulk-left">
            <CheckSquare size={18} />
            <span className="bulk-count-badge">
              {selectedIds.length} selected
            </span>
            <span>Bulk Actions:</span>
          </div>

          <div className="bulk-controls">
            {/* Bulk Status Update */}
            <select
              className="bulk-select"
              value={bulkStatus}
              disabled={isBulkUpdating}
              onChange={(e) => handleApplyBulkStatus(e.target.value)}
              aria-label="Bulk status update"
            >
              <option value="">Set Status...</option>
              <option value="Open">Mark Open</option>
              <option value="In Progress">Mark In Progress</option>
              <option value="Resolved">Mark Resolved</option>
              <option value="Closed">Mark Closed</option>
            </select>

            {/* Bulk Priority Update */}
            <select
              className="bulk-select"
              value={bulkPriority}
              disabled={isBulkUpdating}
              onChange={(e) => handleApplyBulkPriority(e.target.value)}
              aria-label="Bulk priority update"
            >
              <option value="">Set Priority...</option>
              <option value="Low">Priority: Low</option>
              <option value="Medium">Priority: Medium</option>
              <option value="High">Priority: High</option>
              <option value="Urgent">Priority: Urgent</option>
            </select>

            {/* Bulk Agent Assignment (Active Agents Only) */}
            <select
              className="bulk-select"
              value={bulkAgent}
              disabled={isBulkUpdating}
              onChange={(e) => handleApplyBulkAgent(e.target.value)}
              aria-label="Bulk agent assignment"
            >
              <option value="">Assign Active Agent...</option>
              <option value="Unassigned">Unassign Selected</option>
              {activeAgents.map((agent) => (
                <option key={agent.id} value={agent.name}>
                  Assign to {agent.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                borderColor: '#64748b'
              }}
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table / Grid or Empty State */}
      {tickets.length === 0 ? (
        <EmptyState
          title="No Support Tickets Found"
          description="No tickets found. Create a new support ticket to get started."
          actionLabel="Create New Ticket"
          onAction={() => navigate('/tickets/new')}
        />
      ) : sortedTickets.length === 0 ? (
        <EmptyState
          title="No Matching Support Tickets"
          description="No tickets found matching your current search or filter criteria. Clear your active filters to view all tickets."
          actionLabel="Clear All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="tickets-table-card">
          <TicketTable
            tickets={paginatedTickets}
            agents={agents}
            activeAgents={activeAgents}
            viewMode={viewMode}
            showSubject={true}
            showExtendedColumns={true}
            showActions={true}
            enableQuickActions={true}
            enableSelection={true}
            selectedIds={selectedIds}
            onToggleSelectOne={handleToggleSelectOne}
            onToggleSelectAll={handleToggleSelectAll}
            onQuickStatusChange={handleQuickStatusChange}
            onQuickAgentChange={handleQuickAgentChange}
            statusVariant="pill"
            onEditTicket={handleOpenEdit}
            onDeleteTicket={(ticket) => setDeletingTicket(ticket)}
            onCopyTicketId={(code) =>
              addToast(
                `Ticket number ${code} has been copied to your clipboard.`,
                'info',
                'Ticket ID Copied'
              )
            }
          />

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={sortedTickets.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* Edit Ticket Modal (Only Active Agents Allowed in Assignment) */}
      <Modal
        isOpen={Boolean(editingTicket)}
        title={
          editingTicket
            ? `Edit Ticket Details — ${editingTicket.ticketNumber}`
            : 'Edit Ticket Details'
        }
        onClose={() => setEditingTicket(null)}
      >
        <form onSubmit={handleSaveEdit} className="modal-form-grid" noValidate>
          <div className="modal-form-row">
            <div className="modal-form-group">
              <label htmlFor="edit-customer">Customer Name *</label>
              <input
                id="edit-customer"
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
              <label htmlFor="edit-email">Email *</label>
              <input
                id="edit-email"
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
            <label htmlFor="edit-subject">Subject *</label>
            <input
              id="edit-subject"
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
            <label htmlFor="edit-description">Description *</label>
            <textarea
              id="edit-description"
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
              <label htmlFor="edit-category">Category</label>
              <select
                id="edit-category"
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
              <label htmlFor="edit-priority">Priority</label>
              <select
                id="edit-priority"
                value={editForm.priority}
                onChange={(e) =>
                  setEditForm({ ...editForm, priority: e.target.value })
                }
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="modal-form-row">
            <div className="modal-form-group">
              <label htmlFor="edit-agent">Assigned Agent (Active Only)</label>
              <select
                id="edit-agent"
                value={editForm.assignedAgent}
                onChange={(e) =>
                  setEditForm({ ...editForm, assignedAgent: e.target.value })
                }
              >
                <option value="Unassigned">Unassigned</option>
                {activeAgents.map((agent) => (
                  <option key={agent.id} value={agent.name}>
                    {agent.name} — {agent.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-form-group">
              <label htmlFor="edit-status">Status</label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="modal-form-group">
            <label htmlFor="edit-duedate">Due Date *</label>
            <input
              id="edit-duedate"
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
              marginTop: '6px'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditingTicket(null)}
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
        isOpen={Boolean(deletingTicket)}
        title="Confirm Ticket Deletion"
        onClose={() => setDeletingTicket(null)}
      >
        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '16px',
            lineHeight: 1.5
          }}
        >
          Are you sure you want to permanently delete ticket{' '}
          <strong>{deletingTicket?.ticketNumber}</strong> (
          <em>{deletingTicket?.subject}</em>)? This action will also remove its
          associated comments, notifications, and activity logs and cannot be
          undone.
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
            onClick={() => setDeletingTicket(null)}
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
            {isDeleting ? 'Deleting...' : 'Delete Ticket'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default MyTickets;
