import React from 'react'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react'

const CRM_DATABASE = {
  'CRM-101': {
    id: 'CRM-101',
    title: 'Enterprise Q4 Contract Renewal - Apex Global',
    description: 'Finalize SLA addendum and pricing terms for 450 enterprise seats before quarter end.',
    customer: 'Apex Global Logistics',
    dealValue: '$120,000',
    contactPerson: 'Marcus Vance (VP of Operations)',
    email: 'm.vance@apexlogistics.example',
    phone: '+1 (555) 349-2810',
    employee: { name: 'Sarah Connor', role: 'Account Executive', email: 'sarah.connor@taskflow.dev' },
    status: 'Pending',
    stage: 'Contract Negotiation (Stage 4)',
    urgency: 'Urgent',
    deadline: 'Tomorrow, 5:00 PM',
    created: '5 days ago',
  },
  'CRM-102': {
    id: 'CRM-102',
    title: 'Onboarding Kickoff Meeting - Nimbus Cloud',
    description: 'Conduct architecture handoff and technical onboarding sync with CTO & engineering leads.',
    customer: 'Nimbus Cloud Systems',
    dealValue: '$48,000',
    contactPerson: 'Elena Rostova (CTO)',
    email: 'elena@nimbuscloud.example',
    phone: '+1 (555) 782-9012',
    employee: { name: 'Alex Rivera', role: 'Customer Success Manager', email: 'alex.rivera@taskflow.dev' },
    status: 'In Progress',
    stage: 'Implementation Kickoff (Stage 5)',
    urgency: 'High',
    deadline: 'Today, 6:00 PM',
    created: '3 days ago',
  },
  'CRM-103': {
    id: 'CRM-103',
    title: 'Follow-up on Stalled Pilot - BlueWave Health',
    description: 'Reach out to decision maker regarding pilot feedback and security compliance signoff.',
    customer: 'BlueWave Health Tech',
    dealValue: '$65,000',
    contactPerson: 'Dr. Arthur Pendelton',
    email: 'a.pendelton@bluewavehealth.example',
    phone: '+1 (555) 234-5678',
    employee: { name: 'David Chen', role: 'Sales Representative', email: 'david.chen@taskflow.dev' },
    status: 'Pending',
    stage: 'Pilot Evaluation (Stage 3)',
    urgency: 'High',
    deadline: 'In 2 days',
    created: '2 days ago',
  },
  'CRM-104': {
    id: 'CRM-104',
    title: 'Annual Account Health Review - Quantum Dynamics',
    description: 'Evaluate feature adoption metrics, NPS feedback, and prepare expansion proposal.',
    customer: 'Quantum Dynamics Inc',
    dealValue: '$90,000',
    contactPerson: 'Rachel Zane (Director of Tech)',
    email: 'rzane@quantumdynamics.example',
    phone: '+1 (555) 890-1234',
    employee: { name: 'Sarah Connor', role: 'Account Executive', email: 'sarah.connor@taskflow.dev' },
    status: 'In Progress',
    stage: 'Expansion Opportunity',
    urgency: 'Medium',
    deadline: 'In 3 days',
    created: '4 days ago',
  },
  'CRM-105': {
    id: 'CRM-105',
    title: 'Inbound Lead Qualification - Lumina Media',
    description: 'Review RFP submission from marketing director and schedule discovery call.',
    customer: 'Lumina Media Group',
    dealValue: '$32,000',
    contactPerson: 'Carlos Mendez (Marketing VP)',
    email: 'cmendez@luminamedia.example',
    phone: '+1 (555) 456-7890',
    employee: { name: 'Emily Watson', role: 'Sales Development Rep', email: 'emily.watson@taskflow.dev' },
    status: 'Completed',
    stage: 'Qualified Lead',
    urgency: 'Low',
    deadline: 'Next week',
    created: '6 days ago',
  },
  'CRM-106': {
    id: 'CRM-106',
    title: 'Security Questionnaire Review - FinSecure Corp',
    description: 'Collaborate with InfoSec team to complete SOC-2 vendor evaluation form.',
    customer: 'FinSecure Corp',
    dealValue: '$150,000',
    contactPerson: 'Samantha Sterling (CISO)',
    email: 's.sterling@finsecure.example',
    phone: '+1 (555) 678-9012',
    employee: { name: 'David Chen', role: 'Sales Representative', email: 'david.chen@taskflow.dev' },
    status: 'Pending',
    stage: 'Security Review',
    urgency: 'Urgent',
    deadline: 'Today, 8:00 PM',
    created: '1 day ago',
  },
}

export default function MockCrmPortal({ taskId }) {
  const record = CRM_DATABASE[taskId] || {
    id: taskId || 'CRM-RECORD',
    title: 'Enterprise Opportunity Record',
    description: 'Live CRM source record synchronized with TaskFlow Aggregator.',
    customer: 'Enterprise Client',
    dealValue: '$75,000',
    contactPerson: 'Lead Contact',
    email: 'contact@client.example',
    phone: '+1 (555) 000-0000',
    employee: { name: 'Sarah Connor', role: 'Account Executive' },
    status: 'Pending',
    stage: 'Proposal Shared',
    urgency: 'High',
    deadline: 'Pending schedule',
  }

  return (
    <div className="source-app-standalone-container">
      {/* Top Navbar */}
      <header className="source-app-header">
        <div className="source-app-brand">
          <div className="source-app-logo crm-logo">
            <Building2 size={20} />
          </div>
          <div>
            <h1>Apex CRM Enterprise</h1>
            <span>Sales & Accounts Pipeline · Mock Source Application</span>
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
        <div className="source-app-banner crm-banner">
          <div>
            <span className="source-tag">Live CRM Source Record</span>
            <h3>Opportunity: {record.id}</h3>
            <p>
              This is the external CRM source application linked directly from TaskFlow. All changes are synchronized with the TaskFlow Aggregator.
            </p>
          </div>
          <a href="/" className="source-banner-action">
            Open in TaskFlow Dashboard
          </a>
        </div>

        {/* Record Overview Card */}
        <div className="source-record-card">
          <div className="record-card-head">
            <div>
              <span className="record-badge badge-crm-id">{record.id}</span>
              <h2>{record.title}</h2>
              <p className="record-desc">{record.description}</p>
            </div>
            <div className="record-status-chip status-chip-active">
              {record.status}
            </div>
          </div>

          {/* Deal Stage Pipeline */}
          <div className="deal-pipeline-tracker">
            <div className="stage-step stage-done">1. Inbound Lead <CheckCircle2 size={12} /></div>
            <div className="stage-step stage-done">2. Discovery Call <CheckCircle2 size={12} /></div>
            <div className="stage-step stage-current">3. Negotiation & Pricing <Clock size={12} /></div>
            <div className="stage-step">4. Executive Review</div>
            <div className="stage-step">5. Contract Closed</div>
          </div>

          {/* Key Deal Properties Grid */}
          <div className="source-props-grid">
            <div className="prop-card">
              <span className="prop-name">
                <Building2 size={14} /> Client / Organization
              </span>
              <strong>{record.customer}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <DollarSign size={14} /> Deal Valuation
              </span>
              <strong className="text-emerald">{record.dealValue}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <User size={14} /> Assigned Account Executive
              </span>
              <strong>{record.employee?.name}</strong>
              <small>{record.employee?.role}</small>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <Flame size={14} /> Urgency Level
              </span>
              <strong className={record.urgency === 'Urgent' ? 'text-red' : ''}>{record.urgency}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <Calendar size={14} /> Contract Target Deadline
              </span>
              <strong>{record.deadline}</strong>
            </div>

            <div className="prop-card">
              <span className="prop-name">
                <TrendingUp size={14} /> Current Pipeline Stage
              </span>
              <strong>{record.stage}</strong>
            </div>
          </div>

          {/* Client Contact Info */}
          <div className="source-contact-section">
            <h4>Primary Client Contact</h4>
            <div className="contact-details-row">
              <div>
                <strong>{record.contactPerson}</strong>
              </div>
              <div className="contact-meta">
                <span><Mail size={13} /> {record.email}</span>
                <span><Phone size={13} /> {record.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
