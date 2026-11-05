import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MyTickets from './pages/MyTickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import TeamPerformance from './pages/TeamPerformance';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Customers from './pages/Customers';
import Notifications from './pages/Notifications';
import EmptyState from './components/EmptyState';
import ToastNotification from './components/ToastNotification';
import { ErrorBoundary } from './components/ErrorMessage';
import { useTicketContext } from './context/TicketContext';
import './styles/global.css';
import './styles/Responsive.css';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toasts, removeToast } = useTicketContext();
  const navigate = useNavigate();

  function handleToggleSidebar() {
    setIsSidebarCollapsed((prev) => !prev);
  }

  return (
    <div className="app-layout">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className={`main-area ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="page-container">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/tickets"
                element={<MyTickets filterMode="all" />}
              />
              <Route
                path="/my-tickets"
                element={<MyTickets filterMode="mine" />}
              />
              <Route
                path="/unassigned-tickets"
                element={<MyTickets filterMode="unassigned" />}
              />
              <Route path="/tickets/new" element={<CreateTicket />} />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/agents" element={<TeamPerformance />} />
              <Route path="/team-performance" element={<TeamPerformance />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Requested Page Not Found"
                    description="The page you requested does not exist or may have been moved. Return to the main dashboard to continue."
                    actionLabel="Return to Dashboard"
                    onAction={() => navigate('/')}
                  />
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* Unified Reusable Top-Right Toast Notification System */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
