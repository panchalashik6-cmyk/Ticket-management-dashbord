# APPLEN SOLUTIONS — Premium Customer Support Ticket Management System (HelpDesk)

An enterprise-grade, responsive **Customer Support Ticket Management SaaS Platform** built with **React.js**, **Vite**, **React Router DOM**, **React Hook Form**, **Zod**, **Axios**, **Recharts**, **Lucide React**, and **JSON Server**.

---

## 1. Enterprise Features Overview

### Advanced Sidebar & Navigation
- Collapsible sidebar with hover tooltips, APPLEN SOLUTIONS branding, live ticket & notification counters, and logged-in demo user profile (**Bruce Wayne**).
- Dedicated routes for:
  - **Dashboard** (`/`)
  - **All Tickets** (`/tickets`)
  - **My Tickets** (`/my-tickets`)
  - **Unassigned Tickets** (`/unassigned-tickets`)
  - **Create Ticket** (`/tickets/new`)
  - **Reports & Analytics** (`/reports`)
  - **Customers** (`/customers`)
  - **Support Agents** (`/agents`)
  - **Notifications** (`/notifications`)
  - **Settings** (`/settings`)

### Dashboard Enhancements
- **6 Dynamic KPI Cards:** Total Tickets, Open Tickets, In Progress, Resolved, Closed, and Overdue Tickets with live share/cohort percentages.
- **Overdue Ticket SLA Alert Banner:** Highlights overdue tickets with one-click triage actions.
- **Top-Performing Agents Leaderboard:** Ranked by resolved ticket counts with resolution rate and response time metrics.
- **4 Dynamic Recharts Visualizations:** Ticket Status Distribution, Priority Distribution, Weekly Ticket Creation Trend, and Agent Workload Overview.

### Advanced Ticket Management
- **Table View & Grid/Card View Toggle.**
- **Copy-to-Clipboard** on every Ticket ID (`#1832`) with toast confirmation.
- **Inline Quick Status Update** & **Inline Quick Agent Assignment** (restricted to Active agents).
- **Bulk Ticket Operations:** Select multiple tickets to apply bulk status updates, bulk priority updates, or bulk agent assignments.
- **Advanced Search & Multi-Criteria Filtering:** Search by Ticket ID, customer name, email, or subject; filter by status, priority, category, assigned agent, and creation date range; sort by newest, oldest, priority, and due date; paginate with **5, 10, or 20** rows per page.

### Advanced Ticket Details
- Left section with full ticket metadata, copyable ID, customer summary strip, and description.
- Right section with workflow selectors (Status, Active Agent Assignment, Priority, Assign-to-Me) and ticket metadata.
- Bottom section with **Conversation History** (Customer Replies vs. visually distinct amber **Internal Notes**), **Comment Composer**, and filterable **Activity & Audit Timeline** (All Events, Status Changes, Assignment History).

### Dedicated Customer & Support Agent Management
- **Customers (`/customers`):** Dynamically aggregates unique customers from ticket records without duplicates, showing total/open/resolved counts and an interactive **Customer Details & Ticket History Panel**.
- **Support Agents (`/agents`):** Agent profile cards and table with Active/Inactive status toggle, assigned/in-progress/resolved counts, workload capacity bars, and active-only assignment enforcement.

### Full Notification Center & Persistent Settings
- **Notifications (`/notifications`):** Filterable feed for ticket creation, assignment, status change, and priority change alerts with Mark Read, Mark All Read, Delete, and Clear All actions persisted in JSON Server.
- **Settings (`/settings`):** Persistent Light/Dark theme switching, Compact Table Density mode, default pagination size, and notification rules stored in `localStorage`.

---

## 2. Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Start the frontend (automatically starts JSON Server on port 5000 if not already running)
npm run dev
```
