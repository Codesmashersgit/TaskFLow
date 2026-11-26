import React, { useState, useEffect } from 'react'
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
import { api } from '../lib/api'

export default function MockCrmPortal({ taskId }) {
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    // Fetch live record dynamically from Mock CRM REST API
    api(`/crm/tasks/${encodeURIComponent(taskId)}`)
      .then((data) => {
        if (active) {
          setRecord(data.task)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load record from CRM REST API')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [taskId])

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
            <span>Sales & Accounts Pipeline · Live REST Data Feed</span>
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
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <span className="spinner spinner-dark" />
            <p className="mt-3 text-sm">Fetching live CRM deal record from <code>/api/crm/tasks/{taskId}</code>…</p>
          </div>
        ) : error && !record ? (
          <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-8 text-center text-rose-200">
            <h3 className="text-base font-bold text-rose-400">Record Not Found in CRM API</h3>
            <p className="text-xs text-rose-300 mt-1">{error}</p>
            <a href="/" className="inline-block mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold">
              Return to Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="source-app-banner crm-banner">
              <div>
                <span className="source-tag">Live CRM REST Record</span>
                <h3>Opportunity: {record.id}</h3>
                <p>
                  Fetched live from <code>/api/crm/tasks/{record.id}</code>. All changes are synchronized with the TaskFlow Aggregator.
                </p>
              </div>
              <a href="/" className="source-banner-action">
                ← Back to TaskFlow Dashboard
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
                    <Calendar size={14} /> Target Deadline
                  </span>
                  <strong>{record.deadline ? new Date(record.deadline).toLocaleDateString() : 'Active'}</strong>
                </div>

                <div className="prop-card">
                  <span className="prop-name">
                    <TrendingUp size={14} /> Endpoint Source
                  </span>
                  <strong className="text-indigo-400">/api/crm/tasks/{record.id}</strong>
                </div>
              </div>

              {/* Primary Contact Details */}
              <div className="source-contact-section">
                <h4>Primary Client Details</h4>
                <div className="contact-details-row">
                  <div>
                    <strong>{record.customer}</strong>
                    <p className="text-xs text-slate-400">Account managed by {record.employee?.name}</p>
                  </div>
                  <div className="contact-meta">
                    <span><Mail size={13} /> {record.employee?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
