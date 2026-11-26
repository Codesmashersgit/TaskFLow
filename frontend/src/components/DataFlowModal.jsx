import React, { useState } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  LifeBuoy,
  RefreshCw,
  Server,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'

export default function DataFlowModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('pipeline') // 'pipeline' | 'crm' | 'helpdesk' | 'prioritization'

  return (
    <div className="task-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dataflow-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dataflow-header">
          <div className="dataflow-title-wrap">
            <span className="dataflow-icon-mark">
              <Layers size={18} />
            </span>
            <div>
              <h2>Data Architecture & Live Feed Flow</h2>
              <p>Yeh UI par data kahan se aa raha hai aur kaise aggregate ho raha hai:</p>
            </div>
          </div>
          <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="dataflow-tabs">
          <button
            className={`dataflow-tab ${activeTab === 'pipeline' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <Server size={14} /> 1. End-to-End Pipeline
          </button>
          <button
            className={`dataflow-tab ${activeTab === 'crm' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('crm')}
          >
            <Building2 size={14} /> 2. Mock CRM REST API
          </button>
          <button
            className={`dataflow-tab ${activeTab === 'helpdesk' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('helpdesk')}
          >
            <LifeBuoy size={14} /> 3. Mock Helpdesk REST API
          </button>
          <button
            className={`dataflow-tab ${activeTab === 'prioritization' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('prioritization')}
          >
            <Zap size={14} /> 4. Prioritization Engine
          </button>
        </div>

        {/* Tab Content */}
        <div className="dataflow-body">
          {activeTab === 'pipeline' && (
            <div className="pipeline-view">
              <div className="pipeline-flow-diagram">
                {/* Source 1 */}
                <div className="pipeline-box source-box crm-glow">
                  <div className="box-badge badge-crm">REST API 1</div>
                  <h4>
                    <Building2 size={16} /> Mock CRM API
                  </h4>
                  <code>GET /api/crm/tasks</code>
                  <p>Enterprise deals, renewals, leads & client onboarding tasks</p>
                  <span className="source-record-count">6 Live Records</span>
                </div>

                <div className="pipeline-arrow">
                  <span>+</span>
                </div>

                {/* Source 2 */}
                <div className="pipeline-box source-box helpdesk-glow">
                  <div className="box-badge badge-helpdesk">REST API 2</div>
                  <h4>
                    <LifeBuoy size={16} /> Mock Helpdesk API
                  </h4>
                  <code>GET /api/helpdesk/tickets</code>
                  <p>Production outages, latency bugs & infrastructure tickets</p>
                  <span className="source-record-count">6 Live Records</span>
                </div>

                <div className="pipeline-arrow">
                  <ArrowRight size={20} />
                </div>

                {/* Aggregator */}
                <div className="pipeline-box aggregator-box">
                  <div className="box-badge badge-aggregator">Backend Engine</div>
                  <h4>
                    <Zap size={16} /> Dashboard Aggregator
                  </h4>
                  <code>GET /api/dashboard/tasks</code>
                  <p>Merges both APIs, calculates Smart Priority Score, applies filters</p>
                  <span className="source-record-count">12 Total Unified Tasks</span>
                </div>

                <div className="pipeline-arrow">
                  <ArrowRight size={20} />
                </div>

                {/* Frontend UI */}
                <div className="pipeline-box frontend-box">
                  <div className="box-badge badge-frontend">React UI</div>
                  <h4>
                    <Sparkles size={16} /> Interactive Dashboard
                  </h4>
                  <code>React 19 + Tailwind</code>
                  <p>Kanban Board, List Table, Priority Matrix & Clickable Links</p>
                  <span className="source-record-count">Live Responsive UI</span>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="dataflow-info-grid">
                <div className="info-card">
                  <span className="info-step-number">Step 1</span>
                  <h5>Data Sources (Mock REST APIs)</h5>
                  <p>
                    Backend mein do independent microservice endpoints hain: <code>/api/crm/tasks</code> aur{' '}
                    <code>/api/helpdesk/tickets</code>. Yeh real companies ke CRM (Salesforce/HubSpot) aur Helpdesk (Jira/Zendesk) jaisa data simulate karte hain.
                  </p>
                </div>
                <div className="info-card">
                  <span className="info-step-number">Step 2</span>
                  <h5>Dynamic Relative Deadlines</h5>
                  <p>
                    Data hardcoded purani dates ka nahi hai! Yeh <code>new Date()</code> ke hisaab se dynamically create hota hai taaki hamesha <strong>Overdue (1 day ago)</strong>, <strong>Due Today</strong>, aur <strong>Upcoming</strong> tasks live dikhein.
                  </p>
                </div>
                <div className="info-card">
                  <span className="info-step-number">Step 3</span>
                  <h5>Clickable External Links</h5>
                  <p>
                    Har task par <code>sourceUrl</code> attached hai. Jab user card ya <code>Open in CRM / Helpdesk ↗</code> link par click karta hai toh woh source application link par le jata hai.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm' && (
            <div className="code-inspector-view">
              <div className="code-header">
                <div>
                  <strong>Endpoint: <code>GET /api/crm/tasks</code></strong>
                  <p>Simulating CRM sales deals and customer lifecycle tasks</p>
                </div>
                <span className="status-indicator-tag status-ok">Status: 200 OK</span>
              </div>
              <pre className="code-block">
{`// Sample Output from Mock CRM REST API:
{
  "success": true,
  "source": "CRM Mock REST API",
  "count": 6,
  "tasks": [
    {
      "id": "CRM-101",
      "title": "Enterprise Q4 Contract Renewal - Apex Global",
      "description": "Finalize SLA addendum and pricing terms for 450 enterprise seats.",
      "source": "CRM",
      "sourceUrl": "https://crm.workplace.example/deals/CRM-101",
      "customer": "Apex Global Logistics",
      "dealValue": "$120,000",
      "employee": { "id": "emp-1", "name": "Sarah Connor", "role": "Account Executive" },
      "status": "Pending",
      "urgency": "Urgent",
      "deadline": "2026-11-25T15:00:00.000Z" // Dynamically Overdue by 1 day
    },
    {
      "id": "CRM-102",
      "title": "Onboarding Kickoff Meeting - Nimbus Cloud",
      "customer": "Nimbus Cloud Systems",
      "dealValue": "$48,000",
      "employee": { "id": "emp-2", "name": "Alex Rivera", "role": "Customer Success Manager" },
      "status": "In Progress",
      "urgency": "High",
      "deadline": "2026-11-26T18:00:00.000Z" // Dynamically Due Today
    }
  ]
}`}
              </pre>
            </div>
          )}

          {activeTab === 'helpdesk' && (
            <div className="code-inspector-view">
              <div className="code-header">
                <div>
                  <strong>Endpoint: <code>GET /api/helpdesk/tickets</code></strong>
                  <p>Simulating IT Helpdesk support tickets and production incident tracking</p>
                </div>
                <span className="status-indicator-tag status-ok">Status: 200 OK</span>
              </div>
              <pre className="code-block">
{`// Sample Output from Mock Helpdesk REST API:
{
  "success": true,
  "source": "Helpdesk Mock REST API",
  "count": 6,
  "tickets": [
    {
      "id": "HD-201",
      "title": "Production Database Read Replica Latency Spike",
      "description": "PostgreSQL read replica lag exceeded 450s during peak traffic.",
      "source": "Helpdesk",
      "sourceUrl": "https://helpdesk.workplace.example/tickets/HD-201",
      "category": "Infrastructure Incident",
      "requester": "Site Reliability Engineering",
      "employee": { "id": "emp-2", "name": "Alex Rivera", "role": "Support Engineer" },
      "status": "Open",
      "urgency": "Urgent",
      "deadline": "2026-11-25T12:00:00.000Z" // Dynamically Overdue by 1 day
    },
    {
      "id": "HD-202",
      "title": "SSO Login Failure for Azure AD SAML Integration",
      "category": "Identity & Access",
      "requester": "IT Operations",
      "employee": { "id": "emp-4", "name": "Emily Watson", "role": "Tier 2 Support" },
      "status": "In Progress",
      "urgency": "Urgent",
      "deadline": "2026-11-26T17:30:00.000Z" // Dynamically Due Today
    }
  ]
}`}
              </pre>
            </div>
          )}

          {activeTab === 'prioritization' && (
            <div className="prioritization-explainer-view">
              <h4>Smart Prioritization Engine (Deadlines + Urgency)</h4>
              <p>
                Backend algorithm dono factors ko combine karke mathematical <strong>Priority Score</strong> generate karta hai:
              </p>

              <div className="math-formula-card">
                <code>Priority Score = Urgency Weight + Deadline Proximity Weight</code>
              </div>

              <div className="weights-comparison-grid">
                <div className="weight-col">
                  <h5>1. Urgency Weight</h5>
                  <ul>
                    <li><span className="badge-critical">Urgent / Critical</span> <strong>100 pts</strong></li>
                    <li><span className="badge-high">High</span> <strong>70 pts</strong></li>
                    <li><span className="badge-medium">Medium</span> <strong>40 pts</strong></li>
                    <li><span className="badge-low">Low</span> <strong>15 pts</strong></li>
                  </ul>
                </div>

                <div className="weight-col">
                  <h5>2. Deadline Proximity Weight</h5>
                  <ul>
                    <li><span className="badge-critical">Overdue (Past due)</span> <strong>+120 pts</strong></li>
                    <li><span className="badge-high">Due Today (&le; 24h)</span> <strong>+85 pts</strong></li>
                    <li><span className="badge-medium">Due in 48h</span> <strong>+60 pts</strong></li>
                    <li><span className="badge-low">Due within 7 days</span> <strong>+30 pts</strong></li>
                  </ul>
                </div>

                <div className="weight-col">
                  <h5>3. Computed Priority Level</h5>
                  <ul>
                    <li><span className="badge-critical">P1 - Critical</span> <strong>Score &ge; 170</strong></li>
                    <li><span className="badge-high">P2 - High</span> <strong>Score 120 - 169</strong></li>
                    <li><span className="badge-medium">P3 - Medium</span> <strong>Score 60 - 119</strong></li>
                    <li><span className="badge-low">P4 - Low</span> <strong>Score &lt; 60</strong></li>
                  </ul>
                </div>
              </div>

              <div className="sample-calc-box">
                <CheckCircle2 size={16} />
                <span>
                  <strong>Real Example:</strong> <code>CRM-101</code> has Urgency: Urgent (100 pts) + Overdue (120 pts) = <strong>Score: 220 pts &rarr; Ranked #1 P1 Critical</strong>!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dataflow-footer">
          <div className="api-quick-links">
            <span>Direct API Links:</span>
            <a href="/api/crm/tasks" target="_blank" rel="noreferrer">/api/crm/tasks <ExternalLink size={11} /></a>
            <a href="/api/helpdesk/tickets" target="_blank" rel="noreferrer">/api/helpdesk/tickets <ExternalLink size={11} /></a>
            <a href="/api/dashboard/tasks" target="_blank" rel="noreferrer">/api/dashboard/tasks <ExternalLink size={11} /></a>
          </div>
          <button className="button button-primary" onClick={onClose}>
            Got it, Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
