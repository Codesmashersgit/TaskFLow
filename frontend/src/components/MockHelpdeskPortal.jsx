import React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  LifeBuoy,
  MessageSquare,
  Server,
  ShieldAlert,
  Terminal,
  User,
  Zap,
} from 'lucide-react'

const HELPDESK_DATABASE = {
  'HD-201': {
    id: 'HD-201',
    title: 'Production Database Read Replica Latency Spike',
    description: 'PostgreSQL read replica lag exceeded 450s during peak traffic. Queries failing over to primary.',
    category: 'Infrastructure Incident',
    severity: 'P1 - Critical',
    requester: 'Site Reliability Engineering',
    reportedBy: 'DevOps Alerting Service (PagerDuty)',
    employee: { name: 'Alex Rivera', role: 'Support Engineer', email: 'alex.rivera@taskflow.dev' },
    status: 'Open',
    urgency: 'Urgent',
    deadline: 'Overdue by 1 day (SLA Breached)',
    slaTarget: '2 hours resolution target',
    created: '2 days ago',
    diagnostics: 'Query lag peaked at 482s on read-replica-us-east-1b. Auto-scaling pool initialized.',
  },
  'HD-202': {
    id: 'HD-202',
    title: 'SSO Login Failure for Azure AD SAML Integration',
    description: 'Employees encountering 400 Bad Request error on Single Sign-On redirect after certificate rotation.',
    category: 'Identity & Access',
    severity: 'P1 - Critical',
    requester: 'IT Operations',
    reportedBy: 'Corpo Security Team',
    employee: { name: 'Emily Watson', role: 'Tier 2 Support Specialist', email: 'emily.watson@taskflow.dev' },
    status: 'In Progress',
    urgency: 'Urgent',
    deadline: 'Today, 5:30 PM',
    slaTarget: '4 hours resolution target',
    created: 'Yesterday',
    diagnostics: 'IdP metadata certificate expired at 00:00 UTC. Thumbprint mismatch on token verification.',
  },
  'HD-203': {
    id: 'HD-203',
    title: 'Stripe Webhook Delivery Failing with 500 Status',
    description: 'Payment successful events failing webhook signature validation in European region billing service.',
    category: 'Billing & Payments',
    severity: 'P2 - High',
    requester: 'Finance Operations',
    reportedBy: 'Automated Webhook Monitor',
    employee: { name: 'David Chen', role: 'Backend Support Engineer', email: 'david.chen@taskflow.dev' },
    status: 'In Progress',
    urgency: 'High',
    deadline: 'Tomorrow, 2:00 PM',
    slaTarget: '8 hours resolution target',
    created: '2 days ago',
    diagnostics: 'HMAC-SHA256 signature mismatch on v2 webhook endpoint. Raw payload serialization issue.',
  },
  'HD-204': {
    id: 'HD-204',
    title: 'PDF Export Timeout for Reports Over 10,000 Rows',
    description: 'Exporting large analytical CSV/PDF exports crashes Chromium headless container due to OOM.',
    category: 'Bug Report',
    severity: 'P3 - Medium',
    requester: 'Business Analytics Team',
    reportedBy: 'Kendra Adams (Lead Analyst)',
    employee: { name: 'Sarah Connor', role: 'Technical Lead', email: 'sarah.connor@taskflow.dev' },
    status: 'Open',
    urgency: 'Medium',
    deadline: 'In 2 days',
    slaTarget: '24 hours resolution target',
    created: '3 days ago',
    diagnostics: 'Container memory limit capped at 512MB. Memory heap spike during PDF generation reaches 620MB.',
  },
  'HD-205': {
    id: 'HD-205',
    title: 'New Employee Laptop & VPN Access Provisioning',
    description: 'Set up MDM profile, YubiKey hardware token, and VPN credentials for 3 incoming engineers.',
    category: 'Internal IT Service',
    severity: 'P4 - Low',
    requester: 'People Operations',
    reportedBy: 'HR Onboarding Portal',
    employee: { name: 'Emily Watson', role: 'Tier 2 Support Specialist', email: 'emily.watson@taskflow.dev' },
    status: 'Resolved',
    urgency: 'Low',
    deadline: 'Resolved',
    slaTarget: '48 hours resolution target',
    created: '5 days ago',
    diagnostics: 'YubiKeys provisioned, MDM profiles distributed via Jamf Pro. Ticket closed.',
  },
  'HD-206': {
    id: 'HD-206',
    title: 'Email Delivery Delay via SendGrid Secondary IP',
    description: 'Transactional password reset emails experiencing 8-12 minute delivery delays on warm IP pool.',
    category: 'Email Services',
    severity: 'P2 - High',
    requester: 'Security Response',
    reportedBy: 'Auth Health Monitor',
    employee: { name: 'Alex Rivera', role: 'Support Engineer', email: 'alex.rivera@taskflow.dev' },
    status: 'Open',
    urgency: 'High',
    deadline: 'Today, 7:00 PM',
    slaTarget: '6 hours resolution target',
    created: 'Yesterday',
    diagnostics: 'Secondary IP pool rate-limited by Outlook MX servers. Rerouting traffic to dedicated pool 2.',
  },
}

export default function MockHelpdeskPortal({ ticketId }) {
  const ticket = HELPDESK_DATABASE[ticketId] || {
    id: ticketId || 'HD-TICKET',
    title: 'IT Support Request Ticket',
    description: 'Incident ticket details synchronized from TaskFlow Aggregator.',
    category: 'Infrastructure Incident',
    severity: 'P1 - High',
    requester: 'Site Reliability Engineering',
    reportedBy: 'System Monitor',
    employee: { name: 'Alex Rivera', role: 'Support Engineer' },
    status: 'Open',
    urgency: 'Urgent',
    deadline: 'Target SLA active',
    slaTarget: '4 hours SLA',
    diagnostics: 'Investigating server diagnostics and log clusters.',
  }

  return (
    <div className="source-app-standalone-container">
      {/* Top Navbar */}
      <header className="source-app-header">
        <div className="source-app-brand">
          <div className="source-app-logo hd-logo">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h1>Pulse Helpdesk Cloud</h1>
            <span>IT Incident & Ticketing Service · Mock Source Application</span>
          </div>
        </div>

        <div className="source-app-header-actions">
          <a href="/" className="return-dashboard-btn">
            <ArrowLeft size={14} /> Back to TaskFlow Dashboard
          </a>
        </div>
      </header>

      {/* Main Body */}
      <main className="source-app-main">
        {/* Banner */}
        <div className="source-app-banner helpdesk-banner">
          <div>
            <span className="source-tag tag-hd">Live Incident Ticket</span>
            <h3>Ticket: {ticket.id}</h3>
            <p>
              This is the external Helpdesk source application linked directly from TaskFlow. All status updates sync to the TaskFlow Aggregator.
            </p>
          </div>
          <a href="/" className="source-banner-action">
            Open in TaskFlow Dashboard
          </a>
        </div>

        {/* Ticket Overview Card */}
        <div className="source-record-card">
          <div className="record-card-head">
            <div>
              <span className="record-badge badge-hd-id">{ticket.id}</span>
              <h2>{ticket.title}</h2>
              <p className="record-desc">{ticket.description}</p>
            </div>
            <div className="record-status-chip status-chip-open">
              {ticket.status}
            </div>
          </div>

          {/* Key Ticket Properties Grid */}
          <div className="source-props-grid">
            <div className="prop-card">
              <span className="prop-name">
                <AlertCircle size={14} /> Incident Category
              </span>
              <strong>{ticket.category}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <Flame size={14} /> Severity / Urgency
              </span>
              <strong className="text-red">{ticket.urgency} ({ticket.severity})</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <User size={14} /> Assigned Support Engineer
              </span>
              <strong>{ticket.employee?.name}</strong>
              <small>{ticket.employee?.role}</small>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <Server size={14} /> Requesting Team
              </span>
              <strong>{ticket.requester}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <Clock size={14} /> Target SLA Window
              </span>
              <strong>{ticket.deadline}</strong>
              <small>{ticket.slaTarget}</small>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <CheckCircle2 size={14} /> Current Status
              </span>
              <strong>{ticket.status}</strong>
            </div>
          </div>

          {/* Diagnostic Log Box */}
          <div className="source-contact-section">
            <h4><Terminal size={14} /> Real-time System Diagnostics</h4>
            <div className="diagnostic-log-box">
              <code>{ticket.diagnostics || 'Diagnostic logs healthy.'}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
