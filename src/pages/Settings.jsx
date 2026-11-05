import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import '../styles/Settings.css';

function Settings() {
  const { currentUser, updateUserSettings } = useTicketContext();

  const [name, setName] = useState(currentUser.name || 'Bruce Wayne');
  const [role, setRole] = useState(
    currentUser.role || 'Senior Support Lead'
  );
  const [email, setEmail] = useState(
    currentUser.email || 'bruce.wayne@applensolutions.com'
  );
  const [phone, setPhone] = useState(
    currentUser.phone || '+1 (555) 234-5678'
  );
  const [department, setDepartment] = useState(
    currentUser.department || 'Customer Support Operations'
  );

  // Display, Theme & Table Preferences
  const [defaultRecordsPerPage, setDefaultRecordsPerPage] = useState(
    currentUser.preferences?.defaultRecordsPerPage || 10
  );
  const [compactTables, setCompactTables] = useState(
    currentUser.preferences?.compactTables ?? false
  );
  const [theme, setTheme] = useState(
    currentUser.preferences?.theme || 'light'
  );

  // Notification Preferences
  const [notifyOnNewTicket, setNotifyOnNewTicket] = useState(
    currentUser.preferences?.notifyOnNewTicket ?? true
  );
  const [notifyOnAssignment, setNotifyOnAssignment] = useState(
    currentUser.preferences?.notifyOnAssignment ?? true
  );
  const [notifyOnStatusChange, setNotifyOnStatusChange] = useState(
    currentUser.preferences?.notifyOnStatusChange ?? true
  );
  const [notifyOnPriorityChange, setNotifyOnPriorityChange] = useState(
    currentUser.preferences?.notifyOnPriorityChange ?? true
  );
  const [emailAlerts, setEmailAlerts] = useState(
    currentUser.preferences?.emailAlerts ?? true
  );

  function handleSaveSettings(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    updateUserSettings({
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      preferences: {
        ...currentUser.preferences,
        defaultRecordsPerPage: Number(defaultRecordsPerPage),
        compactTables: Boolean(compactTables),
        theme,
        notifyOnNewTicket,
        notifyOnAssignment,
        notifyOnStatusChange,
        notifyOnPriorityChange,
        emailAlerts
      }
    });
  }

  return (
    <form className="settings-page" onSubmit={handleSaveSettings}>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Workspace Settings</h1>
          <p className="page-subtitle">
            Configure your user profile, table display density, persistent theme
            selection, and notification preferences
          </p>
        </div>

        <button type="submit" className="btn btn-primary">
          <Save size={15} />
          <span>Save Workspace Settings</span>
        </button>
      </div>

      {/* 1. Profile Settings */}
      <div className="settings-card">
        <h2 className="settings-section-title">Profile Settings (Demo User)</h2>

        <div className="settings-profile-top">
          <img
            src={currentUser.avatar}
            alt={name}
            className="settings-avatar-large"
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              {department} • {role}
            </div>
          </div>
        </div>

        <div className="settings-grid-two">
          <div className="settings-field">
            <label htmlFor="set-name">Full Name</label>
            <input
              id="set-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="set-role">Display Role</label>
            <input
              id="set-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="settings-field">
            <label htmlFor="set-email">Email Address</label>
            <input
              id="set-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="settings-field">
            <label htmlFor="set-phone">Phone Number</label>
            <input
              id="set-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Display, Theme & Table Display Preferences */}
      <div className="settings-card">
        <h2 className="settings-section-title">
          Display, Theme & Table Preferences
        </h2>

        <div className="settings-grid-two" style={{ marginBottom: '16px' }}>
          <div className="settings-field">
            <label htmlFor="set-theme">
              Theme Selection (Persistent in Browser)
            </label>
            <select
              id="set-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light Theme (Enterprise Blue/White)</option>
              <option value="dark">Dark Theme (Midnight Slate)</option>
            </select>
          </div>

          <div className="settings-field">
            <label htmlFor="set-per-page">
              Default Pagination Rows Per Page
            </label>
            <select
              id="set-per-page"
              value={defaultRecordsPerPage}
              onChange={(e) => setDefaultRecordsPerPage(Number(e.target.value))}
            >
              <option value={5}>5 tickets per page</option>
              <option value={10}>10 tickets per page</option>
              <option value={20}>20 tickets per page</option>
            </select>
          </div>
        </div>

        <div className="toggle-list">
          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">
                Compact Table Density Mode
              </div>
              <div className="toggle-info-desc">
                Reduce vertical row padding in ticket and agent tables to fit
                more records on screen
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={compactTables}
              onChange={(e) => setCompactTables(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {/* 3. Notification Preferences */}
      <div className="settings-card">
        <h2 className="settings-section-title">Notification Preferences</h2>

        <div className="toggle-list">
          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">New Ticket Created</div>
              <div className="toggle-info-desc">
                Receive an in-app notification when a customer submits a new
                ticket
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={notifyOnNewTicket}
              onChange={(e) => setNotifyOnNewTicket(e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">Ticket Assigned</div>
              <div className="toggle-info-desc">
                Notify when a ticket is assigned or reassigned to a support
                agent
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={notifyOnAssignment}
              onChange={(e) => setNotifyOnAssignment(e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">Ticket Status Changes</div>
              <div className="toggle-info-desc">
                Notify whenever a ticket transitions between Open, In Progress,
                Resolved, or Closed
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={notifyOnStatusChange}
              onChange={(e) => setNotifyOnStatusChange(e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">Priority Escalation Alerts</div>
              <div className="toggle-info-desc">
                Notify whenever a ticket priority level is updated
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={notifyOnPriorityChange}
              onChange={(e) => setNotifyOnPriorityChange(e.target.checked)}
            />
          </label>

          <label className="toggle-row">
            <div>
              <div className="toggle-info-title">Email Digest Alerts</div>
              <div className="toggle-info-desc">
                Send daily summary of overdue and urgent tickets to your email
              </div>
            </div>
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
            />
          </label>
        </div>
      </div>
    </form>
  );
}

export default Settings;
