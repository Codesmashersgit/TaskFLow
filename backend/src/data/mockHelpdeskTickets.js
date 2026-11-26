/**
 * Mock Helpdesk REST API Data Source
 * Represents support tickets, technical incidents, infrastructure alerts, and bug reports.
 */

function relativeDate(offsetDays, hour = 17, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const initialHelpdeskTickets = [
  {
    id: 'HD-201',
    title: 'Production Database Read Replica Latency Spike',
    description: 'PostgreSQL read replica lag exceeded 450s during peak traffic. Queries failing over to primary.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-201',
    category: 'Infrastructure Incident',
    requester: 'Site Reliability Engineering',
    employee: {
      id: 'emp-2',
      name: 'Alex Rivera',
      email: 'alex.rivera@taskflow.dev',
      avatar: 'AR',
      role: 'Support Engineer',
    },
    status: 'Open',
    urgency: 'Urgent',
    deadline: relativeDate(-1, 12, 0), // Overdue by 1 day
    createdAt: relativeDate(-2, 10, 15),
  },
  {
    id: 'HD-202',
    title: 'SSO Login Failure for Azure AD SAML Integration',
    description: 'Employees encountering 400 Bad Request error on Single Sign-On redirect after certificate rotation.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-202',
    category: 'Identity & Access',
    requester: 'IT Operations',
    employee: {
      id: 'emp-4',
      name: 'Emily Watson',
      email: 'emily.watson@taskflow.dev',
      avatar: 'EW',
      role: 'Tier 2 Support Specialist',
    },
    status: 'In Progress',
    urgency: 'Urgent',
    deadline: relativeDate(0, 17, 30), // Due Today
    createdAt: relativeDate(-1, 14, 0),
  },
  {
    id: 'HD-203',
    title: 'Stripe Webhook Delivery Failing with 500 Status',
    description: 'Payment successful events failing webhook signature validation in European region billing service.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-203',
    category: 'Billing & Payments',
    requester: 'Finance Operations',
    employee: {
      id: 'emp-3',
      name: 'David Chen',
      email: 'david.chen@taskflow.dev',
      avatar: 'DC',
      role: 'Backend Support Engineer',
    },
    status: 'In Progress',
    urgency: 'High',
    deadline: relativeDate(1, 14, 0), // Due Tomorrow
    createdAt: relativeDate(-2, 16, 45),
  },
  {
    id: 'HD-204',
    title: 'PDF Export Timeout for Reports Over 10,000 Rows',
    description: 'Exporting large analytical CSV/PDF exports crashes Chromium headless container due to OOM.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-204',
    category: 'Bug Report',
    requester: 'Business Analytics Team',
    employee: {
      id: 'emp-1',
      name: 'Sarah Connor',
      email: 'sarah.connor@taskflow.dev',
      avatar: 'SC',
      role: 'Technical Lead',
    },
    status: 'Open',
    urgency: 'Medium',
    deadline: relativeDate(2, 18, 0), // Due in 2 days
    createdAt: relativeDate(-3, 11, 20),
  },
  {
    id: 'HD-205',
    title: 'New Employee Laptop & VPN Access Provisioning',
    description: 'Set up MDM profile, YubiKey hardware token, and VPN credentials for 3 incoming engineers.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-205',
    category: 'Internal IT Service',
    requester: 'People Operations',
    employee: {
      id: 'emp-4',
      name: 'Emily Watson',
      email: 'emily.watson@taskflow.dev',
      avatar: 'EW',
      role: 'Tier 2 Support Specialist',
    },
    status: 'Resolved',
    urgency: 'Low',
    deadline: relativeDate(4, 15, 0),
    createdAt: relativeDate(-5, 9, 0),
  },
  {
    id: 'HD-206',
    title: 'Email Delivery Delay via SendGrid Secondary IP',
    description: 'Transactional password reset emails experiencing 8-12 minute delivery delays on warm IP pool.',
    source: 'Helpdesk',
    sourceUrl: '/mock-apps/helpdesk/HD-206',
    category: 'Email Services',
    requester: 'Security Response',
    employee: {
      id: 'emp-2',
      name: 'Alex Rivera',
      email: 'alex.rivera@taskflow.dev',
      avatar: 'AR',
      role: 'Support Engineer',
    },
    status: 'Open',
    urgency: 'High',
    deadline: relativeDate(0, 19, 0), // Due Today
    createdAt: relativeDate(-1, 13, 0),
  },
]

let helpdeskTickets = JSON.parse(JSON.stringify(initialHelpdeskTickets))

function getHelpdeskTickets() {
  return helpdeskTickets
}

function updateHelpdeskTicketStatus(id, newStatus) {
  const ticket = helpdeskTickets.find((t) => t.id === id)
  if (ticket) {
    ticket.status = newStatus
    ticket.updatedAt = new Date().toISOString()
    return ticket
  }
  return null
}

function resetHelpdeskTickets() {
  helpdeskTickets = JSON.parse(JSON.stringify(initialHelpdeskTickets))
  return helpdeskTickets
}

module.exports = {
  getHelpdeskTickets,
  updateHelpdeskTicketStatus,
  resetHelpdeskTickets,
}
