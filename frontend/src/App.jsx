import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  List,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { getDashboardTasks, patchTaskStatus, resetMockTasks } from './lib/api'
import UnifiedTaskDetails from './components/UnifiedTaskDetails'
import DataFlowModal from './components/DataFlowModal'
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
  const [apiHealth, setApiHealth] = useState({ crm: { ok: true }, helpdesk: { ok: true } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeEmployee, setActiveEmployee] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [urgencyFilter, setUrgencyFilter] = useState('All')
  const [sortBy, setSortBy] = useState('priority')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' | 'table' | 'matrix'
  const [selectedTask, setSelectedTask] = useState(null)
  const [showDataFlow, setShowDataFlow] = useState(false)
  const [simulateError, setSimulateError] = useState('none')
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
        simulateError,
      })

      setTasks(data.tasks || [])
      setStats(data.stats || null)
      if (data.employees?.length) {
        setEmployees(data.employees)
      }
      if (data.apiHealth) {
        setApiHealth(data.apiHealth)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks from mock APIs')
      if (err.details?.apiHealth) {
        setApiHealth(err.details.apiHealth)
      }
    } finally {
      setLoading(false)
    }
  }, [activeEmployee, statusFilter, sourceFilter, urgencyFilter, sortBy, search, simulateError])

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
      setSimulateError('none')
      setActionNotice('Mock data reset to initial default state.')
      setTimeout(() => setActionNotice(''), 3000)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      alert(`Could not reset data: ${err.message}`)
    }
  }

  return (
    <div className="unified-app-container">
      {/* Top Banner: Navigation, Live REST APIs & Data Flow Inspector */}
      <header className="unified-topbar">
        <div className="topbar-branding">
          <div className="app-logo">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="brand-title-badge-row">
              <h1 className="app-brand-name">TaskFlow</h1>
              <span className="live-pipeline-badge">
                <span className="live-beacon" /> 2 REST APIs Live
              </span>
            </div>
            <p className="app-tagline">
              Unified Multi-Source Task Dashboard (CRM & Helpdesk REST Aggregator)
            </p>
          </div>
        </div>

        {/* Live Mock API Health & Tools */}
        <div className="topbar-actions-cluster">
          {/* How Data Works Button */}
          <button
            className="dataflow-btn"
            onClick={() => setShowDataFlow(true)}
            title="Click to see where data comes from and how APIs are aggregated"
          >
            <Layers size={14} />
            <span>⚡ How Data Works & APIs</span>
          </button>

          {/* API Health Badges */}
          <div className="api-health-bar">
            <div
              className={`health-pill ${apiHealth.crm?.ok ? 'health-ok' : 'health-down'}`}
              title={apiHealth.crm?.error || 'Mock CRM API is operational'}
            >
              <span className="health-dot" />
              <Building2 size={13} />
              CRM: {apiHealth.crm?.ok ? '200 OK' : '503 Fail'}
            </div>

            <div
              className={`health-pill ${apiHealth.helpdesk?.ok ? 'health-ok' : 'health-down'}`}
              title={apiHealth.helpdesk?.error || 'Mock Helpdesk API is operational'}
            >
              <span className="health-dot" />
              <LifeBuoy size={13} />
              Helpdesk: {apiHealth.helpdesk?.ok ? '200 OK' : '504 Timeout'}
            </div>

            {/* Error Simulator */}
            <div className="error-sim-control">
              <SlidersHorizontal size={13} />
              <select
                id="sim-select"
                value={simulateError}
                onChange={(e) => setSimulateError(e.target.value)}
                title="Test Requirement 5: Simulate upstream API errors to verify resilient error handling"
              >
                <option value="none">Test Errors: Normal</option>
                <option value="crm">Simulate CRM Error (503)</option>
                <option value="helpdesk">Simulate Helpdesk Timeout (504)</option>
                <option value="both">Simulate Both Down (502)</option>
              </select>
            </div>

            <button
              className="button button-quiet button-sm"
              onClick={handleResetData}
              title="Reset mock task records"
            >
              <RotateCcw size={13} />
              Reset Data
            </button>
          </div>
        </div>
      </header>

      {/* Partial Outage Notice Banner (Requirement 5) */}
      {(!apiHealth.crm?.ok || !apiHealth.helpdesk?.ok) && (
        <div className="partial-error-banner" role="alert">
          <AlertCircle size={18} />
          <div className="banner-text">
            <strong>Upstream Service Warning:</strong>{' '}
            {!apiHealth.crm?.ok && `Mock CRM REST API returned 503 (${apiHealth.crm?.error}). `}
            {!apiHealth.helpdesk?.ok && `Mock Helpdesk REST API returned 504 (${apiHealth.helpdesk?.error}). `}
            Displaying tasks from surviving operational services with graceful degradation.
          </div>
          <button
            className="banner-retry-btn"
            onClick={() => {
              setSimulateError('none')
              setRefreshTrigger((p) => p + 1)
            }}
          >
            <RefreshCw size={13} /> Restore All Services
          </button>
        </div>
      )}

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="action-toast">
          <CheckCircle2 size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="dashboard-content">
        {/* KPI / Stats Summary Cards with Premium SaaS Glow */}
        <section className="stats-cards-grid">
          <div className="stat-card-box stat-accent-indigo">
            <div className="stat-card-header">
              <span>Total Aggregated Tasks</span>
              <Activity size={18} />
            </div>
            <strong className="stat-card-number">{stats?.total || 0}</strong>
            <p className="stat-card-desc">
              From 2 Mock REST APIs ({stats?.crmCount || 0} CRM · {stats?.helpdeskCount || 0} Helpdesk)
            </p>
          </div>

          <div className="stat-card-box stat-accent-red">
            <div className="stat-card-header">
              <span>P1 Critical & Urgent</span>
              <Flame size={18} />
            </div>
            <strong className="stat-card-number">{stats?.urgentCount || 0}</strong>
            <p className="stat-card-desc">Ranked top by deadline + urgency formula</p>
          </div>

          <div className="stat-card-box stat-accent-amber">
            <div className="stat-card-header">
              <span>Due Today & Overdue</span>
              <Clock size={18} />
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
              <CheckCircle2 size={18} />
            </div>
            <strong className="stat-card-number">{stats?.completedCount || 0}</strong>
            <p className="stat-card-desc">
              {stats?.total ? Math.round(((stats.completedCount || 0) / stats.total) * 100) : 0}% completion rate
            </p>
          </div>
        </section>

        {/* Source Segmented Quick Filter Tabs */}
        <div className="source-segmented-tabs">
          <button
            className={`source-tab-btn ${sourceFilter === 'All' ? 'source-tab-active' : ''}`}
            onClick={() => setSourceFilter('All')}
          >
            All Unified Tasks <span className="tab-pill">{stats?.total || 0}</span>
          </button>
          <button
            className={`source-tab-btn ${sourceFilter === 'CRM' ? 'source-tab-active source-tab-crm' : ''}`}
            onClick={() => setSourceFilter('CRM')}
          >
            <Building2 size={14} /> CRM Sales Deals <span className="tab-pill pill-crm">{stats?.crmCount || 0}</span>
          </button>
          <button
            className={`source-tab-btn ${sourceFilter === 'Helpdesk' ? 'source-tab-active source-tab-hd' : ''}`}
            onClick={() => setSourceFilter('Helpdesk')}
          >
            <LifeBuoy size={14} /> Helpdesk Tickets <span className="tab-pill pill-hd">{stats?.helpdeskCount || 0}</span>
          </button>
        </div>

        {/* Filter Toolbar (Requirement 3: Filters for Employee and Task Status) */}
        <section className="filter-toolbar-card">
          <div className="filter-group">
            {/* Employee Filter */}
            <label className="filter-item">
              <span className="filter-label">
                <Users size={14} /> Employee Filter
              </span>
              <select
                className="filter-select"
                value={activeEmployee}
                onChange={(e) => setActiveEmployee(e.target.value)}
              >
                <option value="All">All Employees ({employees.length})</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.taskCount} tasks)
                  </option>
                ))}
              </select>
            </label>

            {/* Task Status Filter */}
            <label className="filter-item">
              <span className="filter-label">
                <Activity size={14} /> Task Status
              </span>
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
              <span className="filter-label">
                <Flame size={14} /> Urgency Level
              </span>
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

            {/* Sort Control (Requirement 2: Prioritization based on deadlines and urgency) */}
            <label className="filter-item">
              <span className="filter-label">
                <ArrowDownWideNarrow size={14} /> Prioritization & Sort
              </span>
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

          {/* Search Box & View Mode Switcher */}
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
              <button
                className={`view-mode-btn ${viewMode === 'matrix' ? 'view-mode-active' : ''}`}
                onClick={() => setViewMode('matrix')}
                title="Priority Matrix View"
              >
                <Zap size={15} /> Priority Matrix
              </button>
            </div>
          </div>
        </section>

        {/* Content View Area */}
        {loading ? (
          <div className="loading-state-box">
            <span className="spinner spinner-dark" />
            <p>Fetching aggregated tasks from CRM and Helpdesk mock REST APIs…</p>
          </div>
        ) : error && tasks.length === 0 ? (
          <div className="error-state-box" role="alert">
            <AlertTriangle size={36} />
            <h3>Unable to Load Dashboard Tasks</h3>
            <p>{error}</p>
            <p className="error-state-hint">
              This occurred because the simulated error was triggered or upstream mock APIs failed.
            </p>
            <button
              className="button button-primary"
              onClick={() => {
                setSimulateError('none')
                setRefreshTrigger((p) => p + 1)
              }}
            >
              <RefreshCw size={14} /> Retry / Restore Mock APIs
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state-box">
            <Users size={32} />
            <h3>No tasks match your active filters</h3>
            <p>Try resetting your employee, status, or search filters to see all aggregated tasks.</p>
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
        ) : viewMode === 'table' ? (
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
                      {/* Clickable task link opening source application (Requirement 4) */}
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
        ) : (
          /* Priority Matrix View (Grouped by P1, P2, P3, P4) */
          <div className="priority-matrix-container">
            {['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'].map((pLevel) => {
              const matrixTasks = tasks.filter((t) => t.priority?.level === pLevel)
              const toneClass = pLevel.startsWith('P1')
                ? 'matrix-critical'
                : pLevel.startsWith('P2')
                ? 'matrix-high'
                : pLevel.startsWith('P3')
                ? 'matrix-medium'
                : 'matrix-low'

              return (
                <div key={pLevel} className={`priority-matrix-group ${toneClass}`}>
                  <div className="matrix-group-header">
                    <div className="matrix-title-wrap">
                      {pLevel.startsWith('P1') ? <Flame size={16} /> : <Zap size={16} />}
                      <h3>{pLevel}</h3>
                    </div>
                    <span className="matrix-count">{matrixTasks.length} tasks</span>
                  </div>

                  <div className="matrix-cards-grid">
                    {matrixTasks.map((task) => (
                      <KanbanTaskCard
                        key={task.id}
                        task={task}
                        onOpen={setSelectedTask}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                    {matrixTasks.length === 0 && (
                      <p className="matrix-empty">No tasks in {pLevel}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Task Details Modal (Requirement 4: Clickable task links opening source application) */}
      {selectedTask && (
        <UnifiedTaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Data Pipeline Explainer Modal */}
      {showDataFlow && <DataFlowModal onClose={() => setShowDataFlow(false)} />}
    </div>
  )
}
