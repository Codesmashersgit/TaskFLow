import React, { useState, useEffect } from 'react'
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
import { api } from '../lib/api'

export default function MockHelpdeskPortal({ ticketId }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    // Fetch live record dynamically from Mock Helpdesk REST API
    api(`/helpdesk/tickets/${encodeURIComponent(ticketId)}`)
      .then((data) => {
        if (active) {
          setTicket(data.ticket)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Could not load record from Helpdesk REST API')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [ticketId])

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
            <span>IT Incident & Ticketing Service · Live REST Data Feed</span>
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
            <p className="mt-3 text-sm">Fetching live Helpdesk incident ticket from <code>/api/helpdesk/tickets/{ticketId}</code>…</p>
          </div>
        ) : error && !ticket ? (
          <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-8 text-center text-rose-200">
            <h3 className="text-base font-bold text-rose-400">Ticket Not Found in Helpdesk API</h3>
            <p className="text-xs text-rose-300 mt-1">{error}</p>
            <a href="/" className="inline-block mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold">
              Return to Dashboard
            </a>
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className="source-app-banner helpdesk-banner">
              <div>
                <span className="source-tag tag-hd">Live Incident Ticket</span>
                <h3>Ticket: {ticket.id}</h3>
                <p>
                  Fetched live from <code>/api/helpdesk/tickets/{ticket.id}</code>. Status updates sync automatically to the TaskFlow Aggregator.
                </p>
              </div>
              <a href="/" className="source-banner-action">
                ← Back to TaskFlow Dashboard
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
                  <strong className="text-red">{ticket.urgency}</strong>
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
                    <Clock size={14} /> Target Resolution SLA
                  </span>
                  <strong>{ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : 'Active'}</strong>
                </div>

                <div className="prop-card">
                  <span className="prop-name">
                    <CheckCircle2 size={14} /> Endpoint Source
                  </span>
                  <strong className="text-amber-400">/api/helpdesk/tickets/{ticket.id}</strong>
                </div>
              </div>

              {/* Diagnostic Box */}
              <div className="source-contact-section">
                <h4><Terminal size={14} /> Incident Overview</h4>
                <div className="diagnostic-log-box">
                  <code>Requester: {ticket.requester} | Category: {ticket.category} | Priority: {ticket.urgency}</code>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
