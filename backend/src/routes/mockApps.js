const express = require('express')
const { getCrmTasks } = require('../data/mockCrmTasks')
const { getHelpdeskTickets } = require('../data/mockHelpdeskTickets')

function createMockAppsRouter() {
  const router = express.Router()

  // GET /mock-apps/crm/:id - Renders a standalone mock CRM portal page
  router.get('/crm/:id', (req, res) => {
    const task = getCrmTasks().find((t) => t.id === req.params.id) || {
      id: req.params.id,
      title: 'Enterprise Client Lead',
      description: 'Record details synchronized from TaskFlow Aggregator.',
      customer: 'Acme Corporation',
      dealValue: '$75,000',
      employee: { name: 'Sarah Connor', role: 'Account Executive' },
      status: 'Pending',
      urgency: 'High',
      deadline: new Date().toISOString(),
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex CRM — ${task.id} (${task.customer})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --card: #1f2937;
      --border: #374151;
      --primary: #4f46e5;
      --primary-light: #818cf8;
      --emerald: #10b981;
      --text: #f9fafb;
      --muted: #9ca3af;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 18px;
    }
    .brand h1 {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .brand span {
      font-size: 11px;
      color: var(--muted);
      display: block;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .back-btn {
      background: #1f2937;
      border: 1px solid #374151;
      color: #e5e7eb;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .back-btn:hover {
      background: #374151;
      color: #fff;
    }
    main {
      max-width: 960px;
      width: 100%;
      margin: 32px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .banner {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      border: 1px solid #4338ca;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .banner-tag {
      background: #4f46e5;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .deal-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #1f2937;
      border: 1px solid #374151;
      color: #818cf8;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .deal-title {
      font-size: 20px;
      font-weight: 800;
      margin-top: 8px;
      color: #ffffff;
    }
    .grid-props {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-top: 10px;
    }
    .prop-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
    }
    .prop-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .prop-val {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 4px;
    }
    .val-emerald {
      color: #10b981;
    }
    .pipeline-stage {
      display: flex;
      gap: 8px;
      margin: 16px 0;
      flex-wrap: wrap;
    }
    .stage-step {
      flex: 1;
      min-width: 120px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
    }
    .stage-active {
      background: #1e1b4b;
      border-color: #6366f1;
      color: #818cf8;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo">⚡</div>
      <div>
        <h1>Apex CRM Enterprise</h1>
        <span>Sales & Accounts Management System (Mock Source App)</span>
      </div>
    </div>
    <div class="nav-actions">
      <a href="http://localhost:5173" class="back-btn">← Back to TaskFlow Dashboard</a>
    </div>
  </header>

  <main>
    <div class="banner">
      <div>
        <span class="banner-tag">Live Source Application</span>
        <strong style="margin-left: 8px;">Record ID: ${task.id}</strong>
        <p style="font-size: 12px; color: #c7d2fe; margin-top: 4px;">
          This record was fetched live by TaskFlow Aggregator from the Mock CRM REST API.
        </p>
      </div>
      <a href="http://localhost:5173" class="back-btn">Return to TaskFlow</a>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <span class="deal-id">${task.id}</span>
          <h2 class="deal-title">${task.title}</h2>
          <p style="color: var(--muted); font-size: 13px; margin-top: 6px;">${task.description}</p>
        </div>
      </div>

      <div class="pipeline-stage">
        <div class="stage-step">1. Lead Inbound</div>
        <div class="stage-step stage-active">2. Discovery & Pricing</div>
        <div class="stage-step">3. Security Signoff</div>
        <div class="stage-step">4. Contract Closed</div>
      </div>

      <div class="grid-props">
        <div class="prop-box">
          <div class="prop-label">Client / Organization</div>
          <div class="prop-val">${task.customer}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Deal Valuation</div>
          <div class="prop-val val-emerald">${task.dealValue}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Account Executive</div>
          <div class="prop-val">${task.employee?.name || 'Sarah Connor'}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Workflow Status</div>
          <div class="prop-val">${task.status}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Urgency Level</div>
          <div class="prop-val">${task.urgency}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Scheduled Target</div>
          <div class="prop-val">${new Date(task.deadline).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`

    res.send(html)
  })

  // GET /mock-apps/helpdesk/:id - Renders a standalone mock Helpdesk portal page
  router.get('/helpdesk/:id', (req, res) => {
    const ticket = getHelpdeskTickets().find((t) => t.id === req.params.id) || {
      id: req.params.id,
      title: 'IT Support Request Ticket',
      description: 'Incident ticket details synchronized from TaskFlow Aggregator.',
      category: 'Infrastructure Alert',
      requester: 'DevOps Monitoring',
      employee: { name: 'Alex Rivera', role: 'Support Engineer' },
      status: 'Open',
      urgency: 'Urgent',
      deadline: new Date().toISOString(),
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulse Helpdesk — ${ticket.id} (${ticket.category})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0c0a09;
      --surface: #1c1917;
      --card: #292524;
      --border: #44403c;
      --amber: #f59e0b;
      --red: #ef4444;
      --text: #fafaf9;
      --muted: #a8a29e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(28, 25, 23, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #d97706, #f59e0b);
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 18px;
      color: #000;
    }
    .brand h1 {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .brand span {
      font-size: 11px;
      color: var(--muted);
      display: block;
    }
    .back-btn {
      background: #292524;
      border: 1px solid #44403c;
      color: #e7e5e4;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .back-btn:hover {
      background: #44403c;
      color: #fff;
    }
    main {
      max-width: 960px;
      width: 100%;
      margin: 32px auto;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .banner {
      background: linear-gradient(135deg, #451a03, #78350f);
      border: 1px solid #b45309;
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .banner-tag {
      background: #f59e0b;
      color: #000;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ticket-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #292524;
      border: 1px solid #44403c;
      color: #fbbf24;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .ticket-title {
      font-size: 20px;
      font-weight: 800;
      margin-top: 8px;
      color: #ffffff;
    }
    .grid-props {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-top: 10px;
    }
    .prop-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
    }
    .prop-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .prop-val {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 4px;
    }
    .val-red {
      color: #ef4444;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo">🎧</div>
      <div>
        <h1>Pulse Helpdesk Cloud</h1>
        <span>IT Incident & Ticketing Service (Mock Source App)</span>
      </div>
    </div>
    <div class="nav-actions">
      <a href="http://localhost:5173" class="back-btn">← Back to TaskFlow Dashboard</a>
    </div>
  </header>

  <main>
    <div class="banner">
      <div>
        <span class="banner-tag">Live Source Application</span>
        <strong style="margin-left: 8px;">Ticket ID: ${ticket.id}</strong>
        <p style="font-size: 12px; color: #fed7aa; margin-top: 4px;">
          This incident ticket was fetched live by TaskFlow Aggregator from the Mock Helpdesk REST API.
        </p>
      </div>
      <a href="http://localhost:5173" class="back-btn">Return to TaskFlow</a>
    </div>

    <div class="card">
      <div>
        <span class="ticket-id">${ticket.id}</span>
        <h2 class="ticket-title">${ticket.title}</h2>
        <p style="color: var(--muted); font-size: 13px; margin-top: 6px;">${ticket.description}</p>
      </div>

      <div class="grid-props">
        <div class="prop-box">
          <div class="prop-label">Incident Category</div>
          <div class="prop-val">${ticket.category}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Severity Level</div>
          <div class="prop-val val-red">${ticket.urgency}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Reporting Team</div>
          <div class="prop-val">${ticket.requester}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Assigned Engineer</div>
          <div class="prop-val">${ticket.employee?.name || 'Alex Rivera'}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Current Status</div>
          <div class="prop-val">${ticket.status}</div>
        </div>
        <div class="prop-box">
          <div class="prop-label">Target Resolution SLA</div>
          <div class="prop-val">${new Date(ticket.deadline).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  </main>
</body>
</html>`

    res.send(html)
  })

  return router
}

module.exports = createMockAppsRouter
