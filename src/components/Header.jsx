import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  PlusCircle,
  Ticket,
  Users,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import NotificationDropdown from './NotificationDropdown';
import StatusBadge from './StatusBadge';
import { calculateCustomersFromTickets } from '../utils/helpers';
import '../styles/Header.css';

function Header({ onOpenMobileSidebar }) {
  const {
    tickets,
    agents,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    headerSearch,
    setHeaderSearch,
    currentUser,
    updateUserSettings
  } = useTicketContext();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus global search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setIsSearchFocused(true);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build Breadcrumbs dynamically from current route
  function getBreadcrumbItems() {
    const path = location.pathname;
    if (path === '/') {
      return [{ label: 'Dashboard Overview', path: '/' }];
    }
    if (path === '/tickets') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Support Ticket Management', path: '/tickets' }
      ];
    }
    if (path === '/my-tickets') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'My Assigned Tickets', path: '/my-tickets' }
      ];
    }
    if (path === '/unassigned-tickets') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Unassigned Tickets', path: '/unassigned-tickets' }
      ];
    }
    if (path === '/tickets/new') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Support Ticket Management', path: '/tickets' },
        { label: 'Create New Ticket', path: '/tickets/new' }
      ];
    }
    if (path.startsWith('/tickets/')) {
      const id = path.split('/')[2];
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Support Ticket Management', path: '/tickets' },
        { label: `Ticket Details #${id}`, path }
      ];
    }
    if (path === '/reports' || path === '/analytics') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Reports & Analytics', path }
      ];
    }
    if (path === '/customers') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Customer Directory', path: '/customers' }
      ];
    }
    if (path === '/agents' || path === '/team-performance') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Support Team Overview', path }
      ];
    }
    if (path === '/notifications') {
      return [
        { label: 'Dashboard Overview', path: '/' },
        { label: 'Notification Center', path: '/notifications' }
      ];
    }
    return [{ label: 'Dashboard Overview', path: '/' }];
  }

  const breadcrumbs = getBreadcrumbItems();

  // Global search live results across Tickets, Customers, and Agents
  const query = headerSearch.trim().toLowerCase();
  const matchedTickets = query
    ? tickets
        .filter(
          (t) =>
            String(t.ticketNumber).toLowerCase().includes(query) ||
            String(t.customerName).toLowerCase().includes(query) ||
            String(t.subject).toLowerCase().includes(query)
        )
        .slice(0, 4)
    : [];

  const matchedCustomers = query
    ? calculateCustomersFromTickets(tickets)
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  const matchedAgents = query
    ? agents
        .filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  function handleSearchSubmit(event) {
    event.preventDefault();
    setIsSearchFocused(false);
    if (
      location.pathname !== '/tickets' &&
      location.pathname !== '/my-tickets' &&
      location.pathname !== '/unassigned-tickets'
    ) {
      navigate('/tickets');
    }
  }

  function handleToggleTheme() {
    const nextTheme =
      currentUser?.preferences?.theme === 'dark' ? 'light' : 'dark';
    updateUserSettings({
      preferences: {
        ...currentUser.preferences,
        theme: nextTheme
      }
    });
  }

  const isDark = currentUser?.preferences?.theme === 'dark';

  return (
    <header className="top-header">
      {/* Left Side: Mobile Menu Button + Breadcrumbs + Global Search */}
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="header-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path + idx}>
                {idx > 0 && <ChevronRight size={14} />}
                {isLast ? (
                  <span className="breadcrumb-current">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Global Search Bar with Instant Results Popover */}
        <div className="header-search-wrapper" ref={searchWrapRef}>
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <span className="header-search-icon">
              <Search size={17} strokeWidth={2} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="header-search-input"
              placeholder="Search tickets, customers, or agents..."
              value={headerSearch}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setHeaderSearch(e.target.value);
                setIsSearchFocused(true);
              }}
              aria-label="Global search"
            />
            {!headerSearch ? (
              <span className="header-kbd-hint">Ctrl K</span>
            ) : (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => setHeaderSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>

          {isSearchFocused && query && (
            <div className="global-search-popover">
              {matchedTickets.length === 0 &&
              matchedCustomers.length === 0 &&
              matchedAgents.length === 0 ? (
                <div
                  style={{
                    padding: '14px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12.5px'
                  }}
                >
                  No matching tickets, customers, or agents for "{headerSearch}"
                </div>
              ) : (
                <>
                  {matchedTickets.length > 0 && (
                    <div>
                      <div className="search-group-heading">Tickets</div>
                      {matchedTickets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className="search-result-row"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate(`/tickets/${t.id}`);
                          }}
                        >
                          <div>
                            <div className="search-result-title">
                              {t.ticketNumber} — {t.subject}
                            </div>
                            <div className="search-result-sub">
                              {t.customerName} • {t.category}
                            </div>
                          </div>
                          <StatusBadge status={t.status} />
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedCustomers.length > 0 && (
                    <div>
                      <div className="search-group-heading">Customers</div>
                      {matchedCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="search-result-row"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate('/customers');
                          }}
                        >
                          <div>
                            <div className="search-result-title">{c.name}</div>
                            <div className="search-result-sub">{c.email}</div>
                          </div>
                          <span className="sidebar-count-pill">
                            {c.totalTickets} tickets
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchedAgents.length > 0 && (
                    <div>
                      <div className="search-group-heading">Support Agents</div>
                      {matchedAgents.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="search-result-row"
                          onClick={() => {
                            setIsSearchFocused(false);
                            navigate('/agents');
                          }}
                        >
                          <div>
                            <div className="search-result-title">{a.name}</div>
                            <div className="search-result-sub">{a.role}</div>
                          </div>
                          <span className="sidebar-count-pill">{a.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Quick Create + Theme Toggle + Notification Bell + User Profile */}
      <div className="header-right">
        <button
          type="button"
          className="header-icon-btn"
          onClick={handleToggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Notification Bell & Dropdown */}
        <div className="header-notif-wrapper" ref={notifRef}>
          <button
            type="button"
            className="notif-bell-btn"
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              setIsProfileOpen(false);
            }}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkOneRead={markNotificationAsRead}
              onMarkAllRead={markAllNotificationsAsRead}
              onDeleteOne={deleteNotification}
              onClearAll={clearAllNotifications}
              onClose={() => setIsNotifOpen(false)}
            />
          )}
        </div>

        {/* User Profile & Dropdown */}
        <div className="header-profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="header-user-btn"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsNotifOpen(false);
            }}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="header-user-avatar"
            />
            <div className="header-user-info">
              <span className="header-user-name">
                {currentUser.name || 'Ashik Panchal'}
              </span>
              <span className="header-user-role">
                {currentUser.role || 'Admin'}
              </span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-name">
                  {currentUser.name || 'Ashik Panchal'}
                </div>
                <div className="profile-dropdown-email">
                  {currentUser.email || 'ashik.panchal@applensolutions.com'}
                </div>
              </div>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/tickets/new');
                }}
              >
                <PlusCircle size={15} />
                <span>Create New Ticket</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/my-tickets');
                }}
              >
                <Ticket size={15} />
                <span>My Assigned Tickets</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/customers');
                }}
              >
                <Users size={15} />
                <span>Customer Directory</span>
              </button>

              <button
                type="button"
                className="profile-dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/agents');
                }}
              >
                <ShieldCheck size={15} />
                <span>Support Team Overview</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
