# TaskFlow — Employee Task Dashboard

A modern, responsive unified web application developed for the **Practical Assignment – Employee Task Dashboard**. The application aggregates employee tasks from **two mock REST APIs (CRM and Helpdesk)**, intelligently prioritizes work based on **deadlines and urgency**, provides granular **employee and status filters**, features **clickable links opening working mock source applications**, and includes **resilient API error handling**.

Built using **React (Vite)** on the frontend and **Node.js (Express)** on the backend.

---

## 🌟 Key Assignment Requirements & Implementation

| # | Assignment Requirement | Implementation Details |
|---|------------------------|------------------------|
| **1** | **Multi-Source Task Aggregation** | Live tasks fetched from two distinct mock REST APIs: `CRM` (`/api/crm/tasks`) and `Helpdesk` (`/api/helpdesk/tickets`). Tasks display distinct source badges with source metadata (e.g., Client & Deal Value for CRM; Requester & Incident Category for Helpdesk). |
| **2** | **Task Prioritization (Deadlines + Urgency)** | Intelligent dynamic scoring algorithm combining deadline proximity (overdue, due today, due soon) with urgency severity (Critical, High, Medium, Low). Visual priority levels (`P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`) with numerical score breakdown. |
| **3** | **Employee & Status Filters** | Dropdown filters to view tasks by specific employee or entire team, filter by task status (`Pending / Open`, `In Progress`, `Completed / Resolved`), filter by source API (`CRM` / `Helpdesk`), urgency level, and instant text search. |
| **4** | **Clickable Source Application Links** | Direct `Open in CRM ↗` and `Open in Helpdesk ↗` external link buttons opening real working mock source application portals (`/mock-apps/crm/:id` and `/mock-apps/helpdesk/:id`) in a new tab (`target="_blank" rel="noopener noreferrer"`), plus an in-app live preview frame in the Task Modal! |
| **5** | **Basic API Error Handling & Clean UI** | Resilient fault tolerance: partial failure degradation (if Helpdesk fails, CRM tasks still display with warning banner), full failure recovery states, and an **interactive "Test API Error" selector** for reviewers. Clean, responsive UI with Kanban Board, Table List, and Priority Matrix views. |

---

## 📐 Task Prioritization Algorithm

Tasks are prioritized using a weighted scoring formula:

$$\text{Priority Score} = \text{Urgency Weight} + \text{Deadline Weight}$$

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
- **P1 - Critical**: Score $\ge 170$ (Red badge)
- **P2 - High**: Score $120\text{--}169$ (Orange badge)
- **P3 - Medium**: Score $60\text{--}119$ (Blue badge)
- **P4 - Low**: Score $< 60$ (Gray badge)

---

## 📡 Mock REST API Endpoints & Working Source Portals

### 1. CRM Mock REST API & Source Portal
- `GET /api/crm/tasks` — List CRM tasks (sales renewals, prospect follow-ups, client onboarding)
- `GET /api/crm/tasks/:id` — Retrieve a single CRM task
- `GET /mock-apps/crm/:id` — **Live Apex CRM Source Portal web page** opened when clicking `Open in CRM ↗`

### 2. Helpdesk Mock REST API & Source Portal
- `GET /api/helpdesk/tickets` — List Helpdesk tickets (incident response, infrastructure lag, bug reports)
- `GET /api/helpdesk/tickets/:id` — Retrieve a single ticket
- `GET /mock-apps/helpdesk/:id` — **Live Pulse Helpdesk Source Portal web page** opened when clicking `Open in Helpdesk ↗`

### 3. Unified Aggregator Endpoint
- `GET /api/dashboard/tasks` — Fetches from both APIs, normalizes statuses, calculates priority scores, and applies active filters.
  - Query params: `employee`, `status`, `source`, `urgency`, `sortBy`, `search`, `simulateError`
- `PATCH /api/dashboard/tasks/:id/status` — Updates status in the appropriate source store
- `POST /api/dashboard/reset` — Resets mock data back to defaults

---

## 🚀 Quick Setup & Local Run

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

### 2. Run the Application

Open two terminal windows:

**Terminal 1 (Backend API on port 5001):**
```bash
cd backend
npm start
```
*(Runs with in-memory Mock REST API mode out of the box — zero database setup needed!)*

**Terminal 2 (Frontend on port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🧪 Testing API Error Handling (Requirement 5)

An interactive **"Test API Error"** dropdown is placed directly in the top navigation bar:
- **Normal**: Both CRM and Helpdesk mock APIs healthy (200 OK).
- **Simulate CRM Failure (503)**: CRM service goes offline. The dashboard displays a warning banner and gracefully continues rendering Helpdesk tasks.
- **Simulate Helpdesk Timeout (504)**: Helpdesk service times out. The dashboard gracefully continues rendering CRM tasks.
- **Simulate Both Down (502)**: Both upstream services fail. The dashboard displays a full error state with a **"Retry / Restore Mock APIs"** button.

---

## 📋 Running Automated Tests

To run the full backend test suite:
```bash
cd backend
npm test
```
*(11 tests passing 100%).*
