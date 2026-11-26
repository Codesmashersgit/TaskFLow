/**
 * Mock CRM REST API Data Source
 * Represents sales leads, account reviews, client renewals, and prospect follow-ups.
 */

function relativeDate(offsetDays, hour = 17, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const initialCrmTasks = [
  {
    id: 'CRM-101',
    title: 'Enterprise Q4 Contract Renewal - Apex Global',
    description: 'Finalize SLA addendum and pricing terms for 450 enterprise seats before quarter end.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-101',
    customer: 'Apex Global Logistics',
    dealValue: '$120,000',
    employee: {
      id: 'emp-1',
      name: 'Sarah Connor',
      email: 'sarah.connor@taskflow.dev',
      avatar: 'SC',
      role: 'Account Executive',
    },
    status: 'Pending',
    urgency: 'Urgent',
    deadline: relativeDate(-1, 15, 0), // Overdue by 1 day
    createdAt: relativeDate(-5, 9, 30),
  },
  {
    id: 'CRM-102',
    title: 'Onboarding Kickoff Meeting - Nimbus Cloud',
    description: 'Conduct architecture handoff and technical onboarding sync with CTO & engineering leads.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-102',
    customer: 'Nimbus Cloud Systems',
    dealValue: '$48,000',
    employee: {
      id: 'emp-2',
      name: 'Alex Rivera',
      email: 'alex.rivera@taskflow.dev',
      avatar: 'AR',
      role: 'Customer Success Manager',
    },
    status: 'In Progress',
    urgency: 'High',
    deadline: relativeDate(0, 18, 0), // Due Today
    createdAt: relativeDate(-3, 11, 0),
  },
  {
    id: 'CRM-103',
    title: 'Follow-up on Stalled Pilot - BlueWave Health',
    description: 'Reach out to decision maker regarding pilot feedback and security compliance signoff.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-103',
    customer: 'BlueWave Health Tech',
    dealValue: '$65,000',
    employee: {
      id: 'emp-3',
      name: 'David Chen',
      email: 'david.chen@taskflow.dev',
      avatar: 'DC',
      role: 'Sales Representative',
    },
    status: 'Pending',
    urgency: 'High',
    deadline: relativeDate(1, 16, 30), // Due Tomorrow
    createdAt: relativeDate(-2, 14, 15),
  },
  {
    id: 'CRM-104',
    title: 'Annual Account Health Review - Quantum Dynamics',
    description: 'Evaluate feature adoption metrics, NPS feedback, and prepare expansion proposal.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-104',
    customer: 'Quantum Dynamics Inc',
    dealValue: '$90,000',
    employee: {
      id: 'emp-1',
      name: 'Sarah Connor',
      email: 'sarah.connor@taskflow.dev',
      avatar: 'SC',
      role: 'Account Executive',
    },
    status: 'In Progress',
    urgency: 'Medium',
    deadline: relativeDate(3, 17, 0), // Due in 3 days
    createdAt: relativeDate(-4, 10, 0),
  },
  {
    id: 'CRM-105',
    title: 'Inbound Lead Qualification - Lumina Media',
    description: 'Review RFP submission from marketing director and schedule discovery call.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-105',
    customer: 'Lumina Media Group',
    dealValue: '$32,000',
    employee: {
      id: 'emp-4',
      name: 'Emily Watson',
      email: 'emily.watson@taskflow.dev',
      avatar: 'EW',
      role: 'Sales Development Rep',
    },
    status: 'Completed',
    urgency: 'Low',
    deadline: relativeDate(5, 12, 0),
    createdAt: relativeDate(-6, 9, 0),
  },
  {
    id: 'CRM-106',
    title: 'Security Questionnaire Review - FinSecure Corp',
    description: 'Collaborate with InfoSec team to complete SOC-2 vendor evaluation form.',
    source: 'CRM',
    sourceUrl: '/mock-apps/crm/CRM-106',
    customer: 'FinSecure Corp',
    dealValue: '$150,000',
    employee: {
      id: 'emp-3',
      name: 'David Chen',
      email: 'david.chen@taskflow.dev',
      avatar: 'DC',
      role: 'Sales Representative',
    },
    status: 'Pending',
    urgency: 'Urgent',
    deadline: relativeDate(0, 20, 0), // Due Today
    createdAt: relativeDate(-1, 8, 30),
  },
]

let crmTasks = JSON.parse(JSON.stringify(initialCrmTasks))

function getCrmTasks() {
  return crmTasks
}

function updateCrmTaskStatus(id, newStatus) {
  const task = crmTasks.find((t) => t.id === id)
  if (task) {
    task.status = newStatus
    task.updatedAt = new Date().toISOString()
    return task
  }
  return null
}

function resetCrmTasks() {
  crmTasks = JSON.parse(JSON.stringify(initialCrmTasks))
  return crmTasks
}

module.exports = {
  getCrmTasks,
  updateCrmTaskStatus,
  resetCrmTasks,
}
