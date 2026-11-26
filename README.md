# TaskFlow — Employee Task Dashboard

A modern, responsive web application developed for the **Practical Assignment – Employee Task Dashboard**. The application aggregates employee tasks from **two mock REST APIs (CRM and Helpdesk)**, intelligently prioritizes work based on **deadlines and urgency**, provides granular **employee and status filters**, features **clickable links opening working mock source applications**, and includes **resilient API error handling**.

Built with **React (Vite, Tailwind CSS)** on the frontend and **Node.js (Express)** on the backend.

---

## 🌟 Assignment Requirements & Implementation

| # | Practical Assignment Requirement | Implementation Details in TaskFlow |
|---|----------------------------------|------------------------------------|
| **1** | **Multi-Source Task Aggregation** | Live tasks fetched from two distinct mock REST APIs: `CRM` (`/api/crm/tasks`) and `Helpdesk` (`/api/helpdesk/tickets`). The backend normalizes tasks with distinct visual badges and source metadata (e.g., Client & Deal Value for CRM; Requester & Incident Category for Helpdesk). |
| **2** | **Task Prioritization (Deadlines + Urgency)** | Dynamic scoring algorithm combining deadline proximity (overdue, due today, due soon) with urgency level (Critical, High, Medium, Low). Visual priority levels (`P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`) with numerical score breakdown. |
| **3** | **Employee & Status Filters** | Dropdown filters to view tasks by specific employee or entire team, filter by task status (`Pending / Open`, `In Progress`, `Completed / Resolved`), filter by source API (`CRM` / `Helpdesk`), urgency level, and instant search. |
| **4** | **Clickable Source Application Links** | Direct `Open in CRM ↗` and `Open in Helpdesk ↗` external link buttons opening working mock source application portals in a new tab without 404 errors, plus an in-app live preview frame in the Task Modal! |
| **5** | **Basic API Error Handling & Clean UI** | Resilient fault tolerance: partial failure degradation (if Helpdesk fails, CRM tasks still display with warning banner), full failure recovery states, and clean responsive layout with Kanban Board and Table List views. |

---

## 📐 Task Prioritization Algorithm

Tasks are dynamically ranked using a weighted prioritization formula:

$$\text{Priority Score} = \text{Urgency Weight} + \text{Deadline Proximity Weight}$$

### 1. Urgency Weights
- **Urgent / Critical**: $100\text{ points}$
- **High**: $70\text{ points}$
- **Medium**: $40\text{ points}$
- **Low**: $15\text{ points}$

### 2. Deadline Proximity Weights
- **Overdue**: $+120\text{ points}$ (Highest attention required)
- **Due Today ($\le 24\text{h}$)**: $+85\text{ points}$
- **Due Tomorrow ($24\text{--}48\text{h}$)**: $+60\text{ points}$
- **Due Soon ($\le 7\text{ days}$)**: $+30\text{ points}$
- **Due Later ($> 7\text{ days}$)**: $+10\text{ points}$

### 3. Priority Levels
- **P1 - Critical**: Score $\ge 170$ (Red badge — overdue or urgent items rank here)
- **P2 - High**: Score $120\text{--}169$ (Orange badge)
- **P3 - Medium**: Score $60\text{--}119$ (Blue badge)
- **P4 - Low**: Score $< 60$ (Gray badge)

---

## 📡 Two Distinct Mock REST APIs & Endpoints

### 1. CRM Mock REST API (`/api/crm`)
- `GET /api/crm/tasks` — List all CRM tasks (sales deals, renewals, onboarding accounts)
- `GET /api/crm/tasks/:id` — Retrieve a single CRM task record
- `PATCH /api/crm/tasks/:id/status` — Update task status

### 2. Helpdesk Mock REST API (`/api/helpdesk`)
- `GET /api/helpdesk/tickets` — List all Helpdesk tickets (incident response, infrastructure lag, bug reports)
- `GET /api/helpdesk/tickets/:id` — Retrieve a single ticket record
- `PATCH /api/helpdesk/tickets/:id/status` — Update ticket status

### 3. Unified Aggregator Endpoint (`/api/dashboard`)
- `GET /api/dashboard/tasks` — Aggregates both APIs, applies prioritization score, and filters by employee/status/source
- `PATCH /api/dashboard/tasks/:id/status` — Updates status in the appropriate source store
- `POST /api/dashboard/reset` — Resets all mock data back to default values

---

## 🔗 Clickable Source Portals (No 404s)

When clicking **`Open in CRM ↗`** or **`Open in Helpdesk ↗`**, a live simulated portal opens in a new tab:
- **Apex CRM Enterprise Portal** (`/?source=crm&id=:id`) — Shows opportunity details, client contact, deal value, and sales pipeline stage.
- **Pulse Helpdesk Cloud Portal** (`/?source=helpdesk&id=:id`) — Shows incident category, severity, requester, SLA resolution target, and diagnostic logs.

Both source portals fetch live records directly from `/api/crm/tasks/:id` and `/api/helpdesk/tickets/:id`.

---

## 🚀 Quick Setup & Run Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm

> **Zero Configuration Notice:** The application requires **NO `.env` file** or database configuration to run. Safe internal defaults start the app immediately!

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Codesmashersgit/TaskFLow.git
cd TaskFlow

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Backend & Frontend

Open two terminal windows:

**Terminal 1 (Backend API on port 5001):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend on port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Automated Unit Tests

To run the backend test suite:
```bash
cd backend
npm test
```
All 11 unit tests pass covering configuration, mock API responses, prioritization scoring, and data mutations.

---

## 📁 Repository & Submission Links

- **GitHub Repository**: [https://github.com/Codesmashersgit/TaskFLow.git](https://github.com/Codesmashersgit/TaskFLow.git)
- **Local Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001/api/dashboard/tasks`
