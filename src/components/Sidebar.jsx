import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Ticket,
  PlusCircle,
  ShieldCheck,
  Users,
  BarChart3,
  LineChart,
  Bell,
  LogOut,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import Modal from './Modal';
import '../styles/Sidebar.css';

function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) {
  const { tickets, unreadCount, currentUser, addToast } = useTicketContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const allTicketsCount = tickets.length;

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutGrid,
      exact: true
    },
    {
      label: 'My Tickets',
      path: '/tickets',
      icon: Ticket,
      badge: allTicketsCount
    },
    {
      label: 'Create Ticket',
      path: '/tickets/new',
      icon: PlusCircle,
      exact: true
    },
    {
      label: 'Team Performance',
      path: '/agents',
      icon: ShieldCheck
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
      exact: true
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: BarChart3,
      exact: true
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: LineChart,
      exact: true
    },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      alertBadge: unreadCount > 0,
      exact: true
    }
  ];

  function isNavActive(item) {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (item.path === '/tickets') {
      return (
        location.pathname === '/tickets' ||
        location.pathname === '/my-tickets' ||
        location.pathname === '/unassigned-tickets' ||
        (location.pathname.startsWith('/tickets/') &&
          location.pathname !== '/tickets/new')
      );
    }
    if (
      item.path === '/agents' &&
      (location.pathname === '/agents' ||
        location.pathname === '/team-performance')
    ) {
      return true;
    }
    return location.pathname.startsWith(item.path);
  }

  function handleNavClick() {
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }

  function handleConfirmLogout() {
    setShowLogoutModal(false);
    addToast(
      'Your demo session has been refreshed and returned to the dashboard.',
      'info',
      'Session Refreshed'
    );
    navigate('/');
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Top Brand and Collapse Toggle */}
        <div className="sidebar-top-bar">
          {!isCollapsed && (
            <NavLink
              to="/"
              className="sidebar-brand-group"
              onClick={handleNavClick}
            >
              <div className="brand-mark">A</div>
              <div className="brand-text-col">
                <div className="sidebar-logo">
                  <span className="logo-help">Help</span>
                  <span className="logo-desk">Desk</span>
                </div>
                <span className="brand-company-sub">APPLEN SOLUTIONS</span>
              </div>
            </NavLink>
          )}

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight size={19} strokeWidth={2.2} />
            ) : (
              <ChevronsLeft size={19} strokeWidth={2.2} />
            )}
          </button>
        </div>

        {/* Clean Single-List Navigation (No Extra Section Text or Scroll Clutter) */}
        <div className="sidebar-scroll-area">
          <nav className="sidebar-nav" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const active = isNavActive(item);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                  data-tooltip={item.label}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="sidebar-link-left">
                    <span className="sidebar-link-icon">
                      <IconComponent size={18} strokeWidth={2} />
                    </span>
                    {!isCollapsed && (
                      <span className="sidebar-link-label">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed &&
                    item.badge !== undefined &&
                    item.badge !== null && (
                      <span
                        className={`sidebar-count-pill ${
                          item.alertBadge ? 'alert' : ''
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logged-in Admin Profile & Logout Button */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-left">
              <div className="sidebar-avatar-wrap">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name || 'Ashik Panchal'}
                  className="sidebar-user-avatar"
                />
                <span className="online-status-dot" />
              </div>

              {!isCollapsed && (
                <div className="sidebar-user-meta">
                  <span className="sidebar-user-name">
                    {currentUser.name || 'Ashik Panchal'}
                  </span>
                  <span className="sidebar-user-role">
                    {currentUser.role || 'Admin'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                className="sidebar-logout-icon-btn"
                onClick={() => setShowLogoutModal(true)}
                title="Sign Out of HelpDesk"
                aria-label="Sign Out of HelpDesk"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        title="Sign Out of APPLEN SOLUTIONS HelpDesk"
        onClose={() => setShowLogoutModal(false)}
      >
        <p style={{ marginBottom: '18px', color: 'var(--text-secondary)' }}>
          Are you sure you want to end your current demo session as{' '}
          <strong>{currentUser.name}</strong>?
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
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmLogout}
          >
            Sign Out
          </button>
        </div>
      </Modal>
    </>
  );
}

export default Sidebar;
