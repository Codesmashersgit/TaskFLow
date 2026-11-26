import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownWideNarrow,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  LayoutDashboard,
  LifeBuoy,
  List,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { getDashboardTasks, patchTaskStatus, resetMockTasks } from './lib/api'
import UnifiedTaskDetails from './components/UnifiedTaskDetails'
import './App.css'

const STATUS_COLUMNS = ['Pending', 'In Progress', 'Completed']
const STATUS_LABELS = {
  Pending: 'Pending / Open',
  'In Progress': 'In Progress',
  Completed: 'Completed / Resolved',
}

function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function Avatar({ name, size = '' }) {
  return (
    <span className={`avatar ${size ? `avatar-${size}` : ''}`} title={name}>
      {initials(name)}
    </span>
  )
}

function PriorityPill({ priority }) {
  if (!priority) return null
  const tone = priority.tone || 'low'
  const isCritical = tone === 'critical'
  const isHigh = tone === 'high'
  const isMedium = tone === 'medium'

  let toneClass = 'prio-low'
  if (isCritical) toneClass = 'prio-critical'
  else if (isHigh) toneClass = 'prio-high'
  else if (isMedium) toneClass = 'prio-medium'

  return (
    <span
      className={`priority-pill ${toneClass}`}
      title={`Urgency: ${priority.urgencyWeight}pts + Deadline: ${priority.deadlineWeight}pts = Score: ${priority.score}pts`}
    >
      {isCritical ? <Flame size={12} /> : <Zap size={12} />}
      <span>{priority.level}</span>
      <span className="prio-score-chip">{priority.score}</span>
    </span>
  )
}

function SourceBadge({ source, sourceUrl }) {
  const isCrm = source === 'CRM'
  return (
    <div className="source-badge-wrap">
      <span className={`source-badge ${isCrm ? 'badge-crm' : 'badge-helpdesk'}`}>
        {isCrm ? <Building2 size={12} /> : <LifeBuoy size={12} />}
        {source}
      </span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="source-quick-link"
        title={`Open in ${source} source application (opens in new tab)`}
        onClick={(e) => e.stopPropagation()}
      >
        <span>Open</span>
        <ExternalLink size={11} />
      </a>
    </div>
  )
}

function DeadlineTag({ priority, deadline }) {
  if (!deadline) return <span className="deadline-muted">No deadline</span>

  if (priority?.isOverdue) {
    return (
      <span className="deadline-tag deadline-tag-overdue">
        <AlertTriangle size={12} />
        {priority.deadlineLabel}
      </span>
    )
  }

  if (priority?.isDueToday) {
    return (
      <span className="deadline-tag deadline-tag-today">
        <Clock size={12} />
        Due Today
      </span>
    )
  }

  return (
    <span className="deadline-tag deadline-tag-normal">
      <Calendar size={12} />
      {priority?.deadlineLabel || new Date(deadline).toLocaleDateString()}
    </span>
  )
}

// Kanban Task Card
function KanbanTaskCard({ task, onOpen, onStatusChange }) {
  const isCrm = task.source === 'CRM'

  return (
    <article
      className={`dashboard-task-card ${isCrm ? 'card-border-crm' : 'card-border-helpdesk'}`}
      onClick={() => onOpen(task)}
    >
      {/* Top Bar: Source Badge with Clickable Link + Priority Score */}
      <div className="card-top-bar">
        <SourceBadge source={task.source} sourceUrl={task.sourceUrl} />
        <PriorityPill priority={task.priority} />
      </div>

      {/* Task ID & Urgency Indicator */}
      <div className="card-id-row">
        <span className="card-task-id">{task.id}</span>
        <span className={`card-urgency-tag urgency-${task.urgency?.toLowerCase()}`}>
          Urgency: {task.urgency}
        </span>
      </div>

      {/* Title & Description */}
      <h4 className="card-title">{task.title}</h4>
      <p className="card-description">{task.description}</p>

      {/* Source Meta (Client/Deal or Requester/Category) */}
      <div className="card-meta-line">
        <span className="meta-entity">
          <b>{isCrm ? 'Client:' : 'Requester:'}</b> {task.customerOrRequester}
        </span>
        <span className={`meta-badge ${isCrm ? 'meta-badge-crm' : 'meta-badge-hd'}`}>
          {task.dealOrCategory}
        </span>
      </div>

      {/* Card Footer: Deadline, Assignee, Status Select */}
      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <DeadlineTag priority={task.priority} deadline={task.deadline} />

        <div className="card-footer-right">
          <div className="card-assignee-pill" title={`Assigned to ${task.employee?.name} (${task.employee?.role})`}>
            <Avatar name={task.employee?.name || 'Unassigned'} size="small" />
            <span className="assignee-name-truncate">{task.employee?.name?.split(' ')[0]}</span>
          </div>

          <select
            className="card-status-select"
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value)}
            aria-label={`Update status for ${task.title}`}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEmployee, setActiveEmployee] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [urgencyFilter, setUrgencyFilter] = useState('All')
  const [sortBy, setSortBy] = useState('priority')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table'
  const [selectedTask, setSelectedTask] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [actionNotice, setActionNotice] = useState('')

  // Fetch dashboard data
  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDashboardTasks({
        employee: activeEmployee,
        status: statusFilter,
        source: sourceFilter,
        urgency: urgencyFilter,
        sortBy,
        search,
      })

      setTasks(data.tasks || [])
      setStats(data.stats || null)
      if (data.employees?.length) {
        setEmployees(data.employees)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks from mock APIs')
    } finally {
      setLoading(false)
    }
  }, [activeEmployee, statusFilter, sourceFilter, urgencyFilter, sortBy, search])

  useEffect(() => {
    loadTasks()
  }, [loadTasks, refreshTrigger])

  // Handle task status update
  async function handleStatusChange(task, newStatus) {
    try {
      await patchTaskStatus(task.id, newStatus)
      setActionNotice(`Updated ${task.id} to ${newStatus}`)
      setTimeout(() => setActionNotice(''), 3000)
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: newStatus })
      }
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      alert(`Could not update task status: ${err.message}`)
    }
  }

  // Reset mock tasks
  async function handleResetData() {
    try {
      await resetMockTasks()
      setActionNotice('Mock data reset to initial default state.')
      setTimeout(() => setActionNotice(''), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      alert(`Could not reset data: ${err.message}`)
    }
  }

  return (
    <div className="unified-app-container">
      {/* Clean, Modern Topbar (No Clutter) */}
      <header className="clean-topbar">
        <div className="topbar-branding">
          <div className="app-logo">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="clean-brand-name">TaskFlow</h1>
            <span className="clean-brand-subtitle">Employee Task Dashboard</span>
          </div>
        </div>

        {/* Clean Right Actions */}
        <div className="topbar-clean-right">
          <div className="employee-switch-wrap">
            <span className="switch-label">
              <Users size={14} /> Employee:
            </span>
            <select
              className="clean-employee-select"
              value={activeEmployee}
              onChange={(e) => setActiveEmployee(e.target.value)}
            >
              <option value="All">All Employees ({employees.length || 4})</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="clean-profile-badge">
            <Avatar name={activeEmployee !== 'All' ? activeEmployee : 'Alex Rivera'} size="small" />
            <div className="profile-text">
              <strong>{activeEmployee !== 'All' ? activeEmployee : 'Team Workspace'}</strong>
              <small>Active View</small>
            </div>
          </div>
        </div>
      </header>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="action-toast">
          <CheckCircle2 size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Dashboard Content */}
      <main className="dashboard-content">
        {/* KPI / Stats Summary Cards */}
        <section className="stats-cards-grid">
          <div className="stat-card-box stat-accent-indigo">
            <div className="stat-card-header">
              <span>Total Assigned Tasks</span>
              <Activity size={17} />
            </div>
            <strong className="stat-card-number">{stats?.total || 0}</strong>
            <p className="stat-card-desc">
              Aggregated from CRM ({stats?.crmCount || 0}) & Helpdesk ({stats?.helpdeskCount || 0})
            </p>
          </div>

          <div className="stat-card-box stat-accent-red">
            <div className="stat-card-header">
              <span>P1 Critical & Urgent</span>
              <Flame size={17} />
            </div>
            <strong className="stat-card-number">{stats?.urgentCount || 0}</strong>
            <p className="stat-card-desc">High urgency + imminent deadline</p>
          </div>

          <div className="stat-card-box stat-accent-amber">
            <div className="stat-card-header">
              <span>Due Today & Overdue</span>
              <Clock size={17} />
            </div>
            <strong className="stat-card-number">
              {(stats?.overdueCount || 0) + (stats?.dueTodayCount || 0)}
            </strong>
            <p className="stat-card-desc">
              {stats?.overdueCount || 0} overdue · {stats?.dueTodayCount || 0} due today
            </p>
          </div>

          <div className="stat-card-box stat-accent-emerald">
            <div className="stat-card-header">
              <span>Completed / Resolved</span>
              <CheckCircle2 size={17} />
            </div>
            <strong className="stat-card-number">{stats?.completedCount || 0}</strong>
            <p className="stat-card-desc">
              {stats?.total ? Math.round(((stats.completedCount || 0) / stats.total) * 100) : 0}% completion rate
            </p>
          </div>
        </section>

        {/* Source Segmented Filter Tabs */}
        <div className="source-segmented-tabs">
          <button
            className={`source-tab-btn ${sourceFilter === 'All' ? 'source-tab-active' : ''}`}
            onClick={() => setSourceFilter('All')}
          >
            All Tasks <span className="tab-pill">{stats?.total || 0}</span>
          </button>
          <button
            className={`source-tab-btn ${sourceFilter === 'CRM' ? 'source-tab-active source-tab-crm' : ''}`}
            onClick={() => setSourceFilter('CRM')}
          >
            <Building2 size={14} /> CRM Deals <span className="tab-pill pill-crm">{stats?.crmCount || 0}</span>
          </button>
          <button
            className={`source-tab-btn ${sourceFilter === 'Helpdesk' ? 'source-tab-active source-tab-hd' : ''}`}
            onClick={() => setSourceFilter('Helpdesk')}
          >
            <LifeBuoy size={14} /> Helpdesk Tickets <span className="tab-pill pill-hd">{stats?.helpdeskCount || 0}</span>
          </button>
        </div>

        {/* Filter Toolbar (Clean & Intuitive) */}
        <section className="filter-toolbar-card">
          <div className="filter-group">
            {/* Task Status Filter */}
            <label className="filter-item">
              <span className="filter-label">Status</span>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending / Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed / Resolved</option>
              </select>
            </label>

            {/* Urgency Filter */}
            <label className="filter-item">
              <span className="filter-label">Urgency</span>
              <select
                className="filter-select"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="All">All Urgencies</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>

            {/* Prioritization & Sort */}
            <label className="filter-item">
              <span className="filter-label">Sort Priority</span>
              <select
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="priority">Smart Priority (Deadlines + Urgency)</option>
                <option value="deadline">Earliest Due Date First</option>
                <option value="urgency">Highest Urgency First</option>
                <option value="newest">Recently Created</option>
              </select>
            </label>
          </div>

          {/* Search Box & View Mode Buttons */}
          <div className="filter-actions-row">
            <div className="search-box-wrap">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search tasks, descriptions, IDs, clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="view-mode-buttons">
              <button
                className={`view-mode-btn ${viewMode === 'kanban' ? 'view-mode-active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Kanban Board View"
              >
                <LayoutDashboard size={15} /> Board
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'table' ? 'view-mode-active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table List View"
              >
                <List size={15} /> List
              </button>
            </div>
          </div>
        </section>

        {/* Content View Area */}
        {loading ? (
          <div className="loading-state-box">
            <span className="spinner spinner-dark" />
            <p>Fetching tasks from mock REST APIs…</p>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="error-state-box" role="alert">
            <AlertTriangle size={32} />
            <h3>Unable to Load Dashboard Tasks</h3>
            <p>{error}</p>
            <button
              className="button button-primary"
              onClick={() => setRefreshTrigger((p) => p + 1)}
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state-box">
            <Users size={32} />
            <h3>No tasks match your active filters</h3>
            <p>Try resetting status or search filters to see all aggregated tasks.</p>
            <button
              className="button button-quiet"
              onClick={() => {
                setActiveEmployee('All')
                setStatusFilter('All')
                setSourceFilter('All')
                setUrgencyFilter('All')
                setSearch('')
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className="kanban-columns-container">
            {STATUS_COLUMNS.map((columnStatus) => {
              const columnTasks = tasks.filter((t) => t.status === columnStatus)
              return (
                <div key={columnStatus} className="kanban-column">
                  <div className="kanban-column-header">
                    <div className="column-title-wrap">
                      <span className={`column-dot column-dot-${columnStatus.toLowerCase().replace(/\s+/g, '-')}`} />
                      <h3>{STATUS_LABELS[columnStatus]}</h3>
                    </div>
                    <span className="column-badge-count">{columnTasks.length}</span>
                  </div>

                  <div className="kanban-cards-list">
                    {columnTasks.map((task) => (
                      <KanbanTaskCard
                        key={task.id}
                        task={task}
                        onOpen={setSelectedTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="column-empty-placeholder">No {columnStatus.toLowerCase()} tasks</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table List View */
          <div className="table-wrapper-card">
            <table className="unified-task-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Source App</th>
                  <th>Task Title</th>
                  <th>Assigned Employee</th>
                  <th>Urgency</th>
                  <th>Deadline</th>
                  <th>Priority Rank</th>
                  <th>Status</th>
                  <th>Source Link</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} onClick={() => setSelectedTask(task)}>
                    <td>
                      <code className="table-task-id">{task.id}</code>
                    </td>
                    <td>
                      <span className={`source-pill-compact ${task.source === 'CRM' ? 'pill-crm' : 'pill-helpdesk'}`}>
                        {task.source === 'CRM' ? <Building2 size={11} /> : <LifeBuoy size={11} />}
                        {task.source}
                      </span>
                    </td>
                    <td className="table-title-cell">
                      <strong className="table-task-title">{task.title}</strong>
                      <small className="table-task-sub">
                        {task.customerOrRequester} · {task.dealOrCategory}
                      </small>
                    </td>
                    <td>
                      <div className="table-employee-cell">
                        <Avatar name={task.employee?.name || 'Unassigned'} size="small" />
                        <span>{task.employee?.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`table-urgency-pill urgency-${task.urgency?.toLowerCase()}`}>
                        {task.urgency}
                      </span>
                    </td>
                    <td>
                      <DeadlineTag priority={task.priority} deadline={task.deadline} />
                    </td>
                    <td>
                      <PriorityPill priority={task.priority} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="table-status-select"
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <a
                        href={task.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-source-btn"
                        title={`Open in ${task.source} source application`}
                      >
                        Open <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>TaskFlow Employee Task Dashboard</span>
          <span>·</span>
          <span>Aggregated from Mock CRM & Helpdesk REST APIs</span>
        </div>
        <div className="footer-right">
          <button className="footer-link-btn" onClick={handleResetData}>
            <RotateCcw size={12} /> Reset Sample Tasks
          </button>
        </div>
      </footer>

      {/* Task Details Modal with Live Source App Preview */}
      {selectedTask && (
        <UnifiedTaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
