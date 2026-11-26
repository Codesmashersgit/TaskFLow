import React from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  LifeBuoy,
  Tag,
  User,
  X,
  Zap,
} from 'lucide-react'

export default function UnifiedTaskDetails({ task, onClose, onStatusChange }) {
  if (!task) return null

  const isCrm = task.source === 'CRM'
  const isHelpdesk = task.source === 'Helpdesk'

  function getPriorityColor(tone) {
    if (tone === 'critical') return 'priority-badge-critical'
    if (tone === 'high') return 'priority-badge-high'
    if (tone === 'medium') return 'priority-badge-medium'
    return 'priority-badge-low'
  }

  function getUrgencyBadge(urgency) {
    const u = String(urgency).toLowerCase()
    if (u === 'urgent') return 'urgency-urgent'
    if (u === 'high') return 'urgency-high'
    if (u === 'medium') return 'urgency-medium'
    return 'urgency-low'
  }

  return (
    <div className="task-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="task-modal-header">
          <div className="task-modal-badges">
            {/* Source Application Badge & Link */}
            <span className={`source-pill ${isCrm ? 'source-pill-crm' : 'source-pill-helpdesk'}`}>
              {isCrm ? <Building2 size={13} /> : <LifeBuoy size={13} />}
              {task.source} Application
            </span>

            {/* Priority Level */}
            <span className={`priority-badge ${getPriorityColor(task.priority?.tone)}`}>
              {task.priority?.tone === 'critical' ? <Flame size={13} /> : <Zap size={13} />}
              {task.priority?.level || 'Normal'}
            </span>

            {/* Urgency */}
            <span className={`urgency-pill ${getUrgencyBadge(task.urgency)}`}>
              Urgency: {task.urgency}
            </span>

            {/* Overdue/Due tag */}
            {task.priority?.isOverdue && (
              <span className="deadline-pill deadline-overdue">
                <AlertTriangle size={13} /> Overdue
              </span>
            )}
            {task.priority?.isDueToday && (
              <span className="deadline-pill deadline-today">
                <Clock size={13} /> Due Today
              </span>
            )}
          </div>

          <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Task Title & ID */}
        <div className="task-modal-title-row">
          <span className="task-modal-id">{task.id}</span>
          <h2 className="task-modal-title">{task.title}</h2>
        </div>

        {/* Clickable Source Application Action Banner (Requirement 4) */}
        <div className={`source-action-banner ${isCrm ? 'banner-crm' : 'banner-helpdesk'}`}>
          <div className="source-action-info">
            <strong>Source Application: {task.source}</strong>
            <p>
              This task was fetched live from the mock {task.source} REST API. You can open its source record in {task.source}.
            </p>
          </div>
          <a
            href={task.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button button-source-link"
          >
            Open in {task.source} <ExternalLink size={14} />
          </a>
        </div>

        {/* Main Details Body */}
        <div className="task-modal-body">
          <div className="task-description-box">
            <h4>Description</h4>
            <p>{task.description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="task-metadata-grid">
            <div className="metadata-card">
              <span className="meta-label">
                <User size={14} /> Assigned Employee
              </span>
              <div className="meta-employee-info">
                <span className="avatar avatar-small">{task.employee?.avatar || 'EM'}</span>
                <div>
                  <strong>{task.employee?.name}</strong>
                  <small>{task.employee?.role || task.employee?.email}</small>
                </div>
              </div>
            </div>

            <div className="metadata-card">
              <span className="meta-label">
                <Calendar size={14} /> Deadline
              </span>
              <strong className={task.priority?.isOverdue ? 'text-danger' : ''}>
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(task.deadline))}
              </strong>
              <small className="meta-subtext">{task.priority?.deadlineLabel}</small>
            </div>

            <div className="metadata-card">
              <span className="meta-label">
                <Tag size={14} /> {task.metadataLabel || (isCrm ? 'Customer / Deal' : 'Requester / Category')}
              </span>
              <strong>{task.customerOrRequester}</strong>
              <small className="meta-subtext">{task.dealOrCategory}</small>
            </div>

            <div className="metadata-card">
              <span className="meta-label">
                <Zap size={14} /> Priority Score Breakdown
              </span>
              <div className="score-breakdown">
                <span className="score-total">Score: {task.priority?.score} pts</span>
                <small className="meta-subtext">
                  Urgency: +{task.priority?.urgencyWeight} | Deadline: +{task.priority?.deadlineWeight}
                </small>
              </div>
            </div>
          </div>

          {/* Workflow Status Quick Switcher */}
          <div className="workflow-status-card">
            <span className="meta-label">Update Task Status</span>
            <div className="workflow-status-buttons">
              {['Pending', 'In Progress', 'Completed'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-btn ${task.status === s ? 'status-btn-active' : ''}`}
                  onClick={() => onStatusChange(task, s)}
                >
                  {s === 'Completed' && <CheckCircle2 size={14} />}
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="task-modal-footer">
          <span className="task-modal-footer-note">
            Record ID: <code>{task.id}</code> · Synced from {task.source} REST API
          </span>
          <button type="button" className="button button-quiet" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
