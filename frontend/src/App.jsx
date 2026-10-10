import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, Archive, ArrowDownWideNarrow, ArrowRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Clock3, Command, Filter,
  LayoutDashboard, List, LogOut, Menu, MoreHorizontal, Plus, Search, Settings,
  Sparkles, Users, X,
} from 'lucide-react'
import AuthScreen from './components/AuthScreen'
import './App.css'
import ProjectDialog from './components/ProjectDialog'
import SettingsDialog from './components/SettingsDialog'
import TaskDetails from './components/TaskDetails'
import TaskDialog from './components/TaskDialog'
import { api, jsonBody } from './lib/api'

const STATUSES = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done']
const STATUS_LABELS = { Backlog: 'Backlog', Todo: 'To do', 'In Progress': 'In progress', 'In Review': 'In review', Done: 'Done' }
const CALENDAR_BASE = new Date()

function dateLabel(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat(undefined, options).format(new Date(value))
}

function isDueToday(task) {
  return task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
}

function getUpcomingTasks(tasks) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return tasks.filter((task) => {
    if (!task.dueDate || task.status === 'Done') return false
    const due = new Date(task.dueDate)
    return due >= start && due < end
  }).slice(0, 3)
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'Done') return false
  const due = new Date(task.dueDate)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return due < today
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?'
}

function Avatar({ name, size = '' }) {
  return <span className={`avatar ${size ? `avatar-${size}` : ''}`} title={name}>{initials(name)}</span>
}

function TaskCard({ task, project, onOpen, onStatus, onDragStart }) {
  return (
    <article className="task-card" draggable onDragStart={(event) => onDragStart(event, task)}>
      <div className="task-card-top"><span className={`priority-tag priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span><button className="icon-button task-more" aria-label={`Open ${task.title}`} onClick={() => onOpen(task)}><MoreHorizontal size={17} /></button></div>
      <button className="task-card-title" onClick={() => onOpen(task)}>{task.title}</button>
      {task.description && <p className="task-card-description">{task.description}</p>}
      {task.labels?.length > 0 && <div className="task-labels">{task.labels.slice(0, 3).map((label) => <span className="task-label" key={label}>{label}</span>)}</div>}
      <div className="task-card-foot">
        <div className="task-card-meta"><span className={isOverdue(task) ? 'due-overdue' : ''}><CalendarDays size={13} />{task.dueDate ? dateLabel(task.dueDate) : 'No date'}</span>{task.checklist?.length > 0 && <span><CheckCircle2 size={13} />{task.checklist.filter((item) => item.done).length}/{task.checklist.length}</span>}</div>
        <div className="task-card-people">{task.assignee?.name ? <Avatar name={task.assignee.name} size="small" /> : <button className="unassigned-avatar" title="Assign task" onClick={() => onOpen(task)}>+</button>}</div>
      </div>
      <select className="sr-select" aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => onStatus(task, event.target.value)}>
        {STATUSES.map((status) => <option key={status}>{status}</option>)}
      </select>
      <span className="sr-only">{project?.name}</span>
    </article>
  )
}

function ProjectDialogOverlay({ ...props }) {
  return <ProjectDialog {...props} />
}

function TaskTable({ tasks, projectsById, onOpen, onStatus }) {
  return (
    <div className="table-scroll"><table className="task-table"><thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Due date</th><th>Status</th></tr></thead><tbody>
      {tasks.map((task) => <tr key={task._id}><td><button className="table-task-title" onClick={() => onOpen(task)}><span className={`table-check ${task.status === 'Done' ? 'table-checked' : ''}`}>{task.status === 'Done' && <Check size={12} />}</span><span><b>{task.title}</b><small>{task.description || 'No description'}</small></span></button></td><td><span className="table-project"><i className={`project-swatch color-${projectsById[task.project]?.color || 'violet'}`} />{projectsById[task.project]?.name || 'Project'}</span></td><td>{task.assignee ? <span className="table-assignee"><Avatar name={task.assignee.name} size="small" />{task.assignee.name}</span> : <span className="muted-copy">Unassigned</span>}</td><td><span className={`priority-tag priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span></td><td><span className={isOverdue(task) ? 'due-overdue' : 'table-date'}>{dateLabel(task.dueDate)}</span></td><td><select className={`status-select status-${task.status.toLowerCase().replace(' ', '-')}`} value={task.status} onChange={(event) => onStatus(task, event.target.value)} aria-label={`Change status for ${task.title}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}
    </tbody></table></div>
  )
}

function NotificationPopover({ items, onRead, onClose }) {
  return (
    <div className="popover notification-popover"><div className="popover-heading"><div><b>Notifications</b><small>Your recent team activity</small></div><button className="icon-button" aria-label="Close notifications" onClick={onClose}><X size={16} /></button></div>
      {!items.length ? <div className="popover-empty"><Bell size={20} /><p>You’re all caught up.</p></div> : <div className="notification-list">{items.slice(0, 8).map((item) => <div className={`notification-item ${item.readAt ? '' : 'notification-unread'}`} key={item._id}><span className="notification-mark"><Activity size={14} /></span><span><b>{item.message}</b><small>{dateLabel(item.createdAt, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small></span></div>)}</div>}
      {items.some((item) => !item.readAt) && <button className="popover-action" onClick={onRead}>Mark all as read</button>}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0, assigned: 0 })
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [loadedQuery, setLoadedQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [view, setView] = useState('board')
  const [navView, setNavView] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [assigneeFilter, setAssigneeFilter] = useState('All')
  const [dueFilter, setDueFilter] = useState('All')
  const [sort, setSort] = useState('updatedAt')
  const [search, setSearch] = useState('')
  const [taskDialog, setTaskDialog] = useState(undefined)
  const [projectDialog, setProjectDialog] = useState(undefined)
  const [taskDetails, setTaskDetails] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const currentProject = projects.find((project) => project._id === activeProjectId) || null
  const projectsById = useMemo(() => Object.fromEntries(projects.map((project) => [project._id, project])), [projects])
  const taskQueryKey = [activeProjectId, navView, projects.map((project) => `${project._id}:${project.status}`).join(','), search.trim(), statusFilter, priorityFilter, assigneeFilter, sort, refreshKey].join('|')
  const loading = Boolean(user && loadedQuery !== taskQueryKey)

  const reportError = useCallback((requestError) => {
    if (requestError.status === 401) {
      setUser(null)
      return
    }
    setError(requestError.message)
  }, [])

  useEffect(() => {
    let active = true
    api('/auth/me').then(({ user: current }) => { if (active) setUser(current) })
      .catch((requestError) => { if (active && requestError.status !== 401) setError(requestError.message) })
      .finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    async function loadWorkspace() {
      try {
        const [activeResult, archivedResult, noticeResult] = await Promise.all([
          api('/projects'),
          api('/projects?status=archived'),
          api('/auth/notifications'),
        ])
        if (!active) return
        setProjects([...activeResult.projects, ...archivedResult.projects])
        setNotifications(noticeResult.notifications)
        if (activeProjectId && ![...activeResult.projects, ...archivedResult.projects].some((project) => project._id === activeProjectId)) setActiveProjectId('')
      } catch (requestError) {
        if (active) reportError(requestError)
      }
    }
    loadWorkspace()
    const timer = window.setInterval(loadWorkspace, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [user, refreshKey, activeProjectId, reportError])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    const controller = new AbortController()
    const filter = new URLSearchParams()
    filter.set('search', search.trim())
    filter.set('status', statusFilter)
    filter.set('priority', priorityFilter)
    filter.set('assignee', assigneeFilter)
    filter.set('sort', sort)
    filter.set('direction', sort === 'priority' ? 'asc' : 'desc')

    const getTasks = activeProjectId
      ? api(`/projects/${activeProjectId}/tasks?${filter}`, { signal: controller.signal }).then(({ tasks: values }) => values.map((task) => ({ ...task, project: activeProjectId })))
      : Promise.all(projects.filter((project) => navView === 'archived' ? project.status === 'archived' : project.status === 'active').map((project) =>
        api(`/projects/${project._id}/tasks?${filter}`, { signal: controller.signal }).then(({ tasks: values }) => values.map((task) => ({ ...task, project: project._id }))),
      )).then((groups) => groups.flat())
    getTasks.then((values) => { if (active) { setTasks(values); setError('') } })
      .catch((requestError) => { if (active && requestError.name !== 'AbortError') reportError(requestError) })
      .finally(() => { if (active) setLoadedQuery(taskQueryKey) })
    return () => { active = false; controller.abort() }
  }, [user, activeProjectId, projects, navView, search, statusFilter, priorityFilter, assigneeFilter, sort, refreshKey, reportError, taskQueryKey])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    api(activeProjectId ? `/projects/${activeProjectId}` : '/projects/stats')
      .then((result) => { if (active) setStats(result.stats || result) })
      .catch((requestError) => { if (active) reportError(requestError) })
    return () => { active = false }
  }, [user, activeProjectId, refreshKey, reportError])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter((task) => {
      if (dueFilter === 'Overdue') return isOverdue(task)
      if (dueFilter === 'Today') {
        if (!task.dueDate) return false
        const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0)
        return due.getTime() === today.getTime()
      }
      if (dueFilter === 'Upcoming') return task.dueDate && new Date(task.dueDate) >= today && task.status !== 'Done'
      return true
    })
  }, [tasks, dueFilter])

  async function refresh() {
    setRefreshKey((value) => value + 1)
  }

  async function createProject(fields) {
    const { project } = await api('/projects', { method: 'POST', body: jsonBody(fields) })
    setProjectDialog(undefined)
    setActiveProjectId(project._id)
    setNavView('project')
    setToast('Project created. Add tasks and invite your team.')
    await refresh()
  }

  async function updateProject(fields) {
    const { project } = await api(`/projects/${projectDialog._id}`, { method: 'PATCH', body: jsonBody(fields) })
    setProjects((current) => current.map((item) => item._id === project._id ? { ...item, ...project } : item))
    setProjectDialog(undefined)
    setToast('Project settings saved.')
    await refresh()
  }

  async function addProjectMember(email) {
    await api(`/projects/${projectDialog._id}/members`, { method: 'POST', body: jsonBody({ email }) })
    const { project } = await api(`/projects/${projectDialog._id}`)
    setProjects((current) => current.map((item) => item._id === project._id ? { ...item, ...project } : item))
    setProjectDialog(project)
    setToast('Member added to the project.')
  }

  async function removeProjectMember(memberId) {
    if (!window.confirm('Remove this person from the project? Their assignments will be cleared.')) return
    try {
      await api(`/projects/${projectDialog._id}/members/${memberId}`, { method: 'DELETE' })
      const { project } = await api(`/projects/${projectDialog._id}`)
      setProjects((current) => current.map((item) => item._id === project._id ? { ...item, ...project } : item))
      setProjectDialog(project)
      setToast('Project member removed.')
    } catch (requestError) { setError(requestError.message) }
  }

  async function archiveProject() {
    if (!window.confirm(`Archive ${projectDialog.name}? You can still restore the project later.`)) return
    try {
      await api(`/projects/${projectDialog._id}`, { method: 'DELETE' })
      setProjectDialog(undefined)
      setActiveProjectId('')
      setNavView('overview')
      setToast('Project archived.')
      await refresh()
    } catch (requestError) { setError(requestError.message) }
  }

  async function restoreProject() {
    try {
      await api(`/projects/${projectDialog._id}`, { method: 'PATCH', body: jsonBody({ status: 'active' }) })
      const restoredId = projectDialog._id
      setProjectDialog(undefined)
      setActiveProjectId(restoredId)
      setNavView('project')
      setToast('Project restored.')
      await refresh()
    } catch (requestError) { setError(requestError.message) }
  }

  async function saveTask(fields) {
    const projectId = taskDialog.projectId || activeProjectId
    if (!projectId) throw new Error('Choose a project before creating a task.')
    const editing = Boolean(taskDialog.task)
    const endpoint = `/projects/${projectId}/tasks${editing ? `/${taskDialog.task._id}` : ''}`
    const { task } = await api(endpoint, { method: editing ? 'PATCH' : 'POST', body: jsonBody(fields) })
    setTaskDialog(undefined)
    setTaskDetails(null)
    setToast(editing ? 'Task changes saved.' : 'Task created.')
    await refresh()
    return task
  }

  async function changeStatus(task, status) {
    try {
      await api(`/projects/${task.project}/tasks/${task._id}`, { method: 'PATCH', body: jsonBody({ status }) })
      setToast(`Moved to ${STATUS_LABELS[status]}.`)
      await refresh()
      if (taskDetails?._id === task._id) {
        const { task: updated } = await api(`/projects/${task.project}/tasks/${task._id}`)
        setTaskDetails({ ...updated, project: task.project })
      }
    } catch (requestError) { reportError(requestError) }
  }

  async function openTask(task) {
    try {
      const { task: detail } = await api(`/projects/${task.project}/tasks/${task._id}`)
      const children = tasks.filter((item) => String(item.parentTask || '') === task._id)
      setTaskDetails({ ...detail, project: task.project, subtasks: children })
    } catch (requestError) { reportError(requestError) }
  }

  function editTask(task) {
    setTaskDetails(null)
    setTaskDialog({ task, projectId: task.project })
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”? This will also remove its subtasks.`)) return
    try {
      await api(`/projects/${task.project}/tasks/${task._id}`, { method: 'DELETE' })
      setTaskDetails(null)
      setToast('Task deleted.')
      await refresh()
    } catch (requestError) { reportError(requestError) }
  }

  async function duplicateTask(task) {
    try {
      await api(`/projects/${task.project}/tasks/${task._id}/duplicate`, { method: 'POST' })
      setTaskDetails(null)
      setToast('Task duplicated.')
      await refresh()
    } catch (requestError) { reportError(requestError) }
  }

  async function addComment(task, body) {
    try {
      await api(`/projects/${task.project}/tasks/${task._id}/comments`, { method: 'POST', body: jsonBody({ body }) })
      await openTask(task)
      await refresh()
    } catch (requestError) { reportError(requestError); throw requestError }
  }

  async function toggleChecklist(task, index) {
    const checklist = task.checklist.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item)
    try {
      await api(`/projects/${task.project}/tasks/${task._id}`, { method: 'PATCH', body: jsonBody({ checklist }) })
      await openTask(task)
      await refresh()
    } catch (requestError) { reportError(requestError) }
  }

  async function updateProfile(fields) {
    const { user: updated } = await api('/auth/me', { method: 'PATCH', body: jsonBody(fields) })
    setUser(updated)
    setSettingsOpen(false)
    setToast('Your preferences were saved.')
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
      setUser(null)
      setProjects([])
      setTasks([])
    } catch (requestError) { reportError(requestError) }
  }

  async function markNotificationsRead() {
    try {
      await api('/auth/notifications/read', { method: 'PATCH' })
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
    } catch (requestError) { reportError(requestError) }
  }

  function openProject(project) {
    setActiveProjectId(project._id)
    setNavView(project.status === 'archived' ? 'archived' : 'project')
    setStatusFilter('All')
    setPriorityFilter('All')
    setAssigneeFilter('All')
    setDueFilter('All')
    setMobileNavOpen(false)
  }

  function dragStart(event, task) {
    event.dataTransfer.setData('text/plain', task._id)
    event.dataTransfer.effectAllowed = 'move'
  }

  async function dropTask(event, status) {
    event.preventDefault()
    const task = tasks.find((item) => item._id === event.dataTransfer.getData('text/plain'))
    if (task && task.status !== status) await changeStatus(task, status)
  }

  if (checkingSession) return <div className="boot-screen"><span className="brand-mark"><Command size={19} /></span><span className="spinner" /></div>
  if (!user) return <AuthScreen onAuthenticated={setUser} />

  const activeProjects = projects.filter((project) => project.status === 'active')
  const archivedProjects = projects.filter((project) => project.status === 'archived')
  const unreadCount = notifications.filter((item) => !item.readAt).length
  const heading = currentProject?.name || (navView === 'my-tasks' ? 'My tasks' : navView === 'focus' ? 'Today’s focus' : navView === 'archived' ? 'Archived projects' : 'Overview')
  const overviewTasks = navView === 'my-tasks'
    ? visibleTasks.filter((task) => String(task.assignee?._id || task.assignee || '') === String(user.id))
    : navView === 'focus'
      ? visibleTasks.filter(isDueToday)
      : visibleTasks

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><a href="/" className="brand"><span className="brand-mark"><Command size={18} /></span><span>taskflow<span className="brand-period">.</span></span></a><button className="icon-button mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
        <button className="workspace-switcher"><span className="workspace-mark">{initials(user.name)}</span><span><b>{user.name.split(' ')[0]}’s workspace</b><small>Personal workspace</small></span><ChevronDown size={15} /></button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          <button className={`nav-item ${navView === 'overview' && !currentProject ? 'nav-active' : ''}`} onClick={() => { setActiveProjectId(''); setNavView('overview'); setMobileNavOpen(false) }}><LayoutDashboard size={17} />Overview</button>
          <button className={`nav-item ${navView === 'my-tasks' ? 'nav-active' : ''}`} onClick={() => { setActiveProjectId(''); setNavView('my-tasks'); setMobileNavOpen(false) }}><ClipboardList size={17} />My tasks <span className="nav-count">{stats.assigned}</span></button>
          <button className={`nav-item ${navView === 'focus' ? 'nav-active' : ''}`} onClick={() => { setActiveProjectId(''); setNavView('focus'); setMobileNavOpen(false) }}><Sparkles size={17} />Today’s focus</button>
        </nav>
        <div className="nav-caption project-nav-caption"><span>PROJECTS</span><button className="icon-button" aria-label="Create a project" onClick={() => setProjectDialog(null)}><Plus size={16} /></button></div>
        <nav className="sidebar-nav project-nav" aria-label="Projects">
          {activeProjects.map((project) => <button key={project._id} className={`nav-item project-nav-item ${activeProjectId === project._id ? 'nav-active' : ''}`} onClick={() => openProject(project)}><i className={`project-swatch color-${project.color}`} /><span className="project-nav-name">{project.name}</span><span className="project-nav-count">{project.stats?.total || 0}</span></button>)}
          {!activeProjects.length && <p className="sidebar-hint">Create a project to start organizing shared work.</p>}
          <button className="nav-item add-project-nav" onClick={() => setProjectDialog(null)}><Plus size={16} />New project</button>
          {archivedProjects.length > 0 && <button className={`nav-item archived-nav ${navView === 'archived' ? 'nav-active' : ''}`} onClick={() => { setActiveProjectId(''); setNavView('archived'); setMobileNavOpen(false) }}><Archive size={16} />Archived <span className="nav-count">{archivedProjects.length}</span></button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-progress"><div><span>Team progress</span><b>{tasks.length ? Math.round((stats.completed / stats.total) * 100) : 0}%</b></div><div className="progress-track"><span style={{ width: `${tasks.length ? (stats.completed / stats.total) * 100 : 0}%` }} /></div><small>{stats.completed} of {stats.total} tasks completed</small></div>
          <div className="sidebar-profile"><Avatar name={user.name} /><span className="profile-name"><b>{user.name}</b><small>{user.email}</small></span><button className="icon-button" title="Account settings" onClick={() => setSettingsOpen(true)}><Settings size={16} /></button></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-nav-backdrop" aria-label="Close navigation overlay" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button><span className="crumb-muted">Workspace</span><span className="crumb-divider">/</span><b>{heading}</b>{currentProject && <button className="icon-button project-options-button" aria-label="Project settings" onClick={() => setProjectDialog(currentProject)}><MoreHorizontal size={17} /></button>}</div>
          <div className="topbar-right"><label className="global-search"><Search size={15} /><input aria-label="Search tasks" placeholder="Search tasks…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><span className="topbar-separator" /><div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen ? 'icon-active' : ''}`} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} onClick={() => setNotificationsOpen((value) => !value)}><Bell size={18} />{unreadCount > 0 && <i className="notification-badge" />}</button>{notificationsOpen && <NotificationPopover items={notifications} onRead={markNotificationsRead} onClose={() => setNotificationsOpen(false)} />}</div><Avatar name={user.name} size="small" /><span className="topbar-user-name">{user.name.split(' ')[0]}</span><button className="icon-button topbar-logout" title="Sign out" onClick={logout}><LogOut size={16} /></button></div>
        </header>

        <div className="page-content">
          {error && <div className="notice notice-error" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
          {navView === 'archived' && !currentProject ? (
            <section className="page-section"><div className="page-heading"><div><span className="eyebrow eyebrow-light">PROJECT ARCHIVE</span><h1>Archived projects</h1><p>Older workspaces stay here until you need them again.</p></div></div><div className="project-grid">{archivedProjects.map((project) => <article className="project-card" key={project._id}><div className={`project-card-cover color-${project.color}`}><Archive size={19} /></div><div className="project-card-body"><h3>{project.name}</h3><p>{project.description || 'No project description.'}</p><div className="project-card-footer"><span>{project.stats?.total || 0} tasks</span><button className="text-action" onClick={() => { setProjectDialog(project); }}>Manage</button></div></div></article>)}</div>{!archivedProjects.length && <EmptyState title="Nothing archived yet" description="Archived projects will appear here." icon={Archive} />}</section>
          ) : (
            <>
              <section className="page-heading">
                <div><span className="eyebrow eyebrow-light">{currentProject ? <><span className={`project-swatch color-${currentProject.color}`} /> PROJECT SPACE</> : navView === 'my-tasks' ? 'YOUR ASSIGNED WORK' : navView === 'focus' ? 'DUE TODAY' : 'TEAM WORKSPACE'}</span><h1>{currentProject ? currentProject.name : navView === 'overview' ? `Good to see you, ${user.name.split(' ')[0]}.` : heading}</h1><p>{currentProject?.description || (currentProject ? `${currentProject.members?.length || 1} members · Updated ${dateLabel(currentProject.updatedAt)}` : navView === 'overview' ? 'Here’s what’s moving across your projects today.' : navView === 'my-tasks' ? 'A clear view of the work assigned to you.' : 'Your tasks with a deadline today.')}</p></div>
                <div className="page-heading-actions">{currentProject && <div className="member-stack" aria-label={`${currentProject.members?.length || 1} project members`}>{currentProject.members?.slice(0, 4).map((member) => <Avatar key={member.user._id || member.user.id} name={member.user.name} size="small" />)}{currentProject.members?.length > 4 && <span className="avatar avatar-small avatar-overflow">+{currentProject.members.length - 4}</span>}</div>}<button className="button button-primary" onClick={() => currentProject ? setTaskDialog({ task: null, projectId: currentProject._id }) : setProjectDialog(null)}><Plus size={16} />{currentProject ? 'New task' : 'New project'}</button></div>
              </section>

              {navView === 'overview' && !currentProject && <section className="stat-grid" aria-label="Task statistics"><StatCard label="Total tasks" value={stats.total} note={`${activeProjects.length} active projects`} icon={ClipboardList} tone="indigo" /><StatCard label="Assigned to me" value={stats.assigned} note="Across all projects" icon={Users} tone="blue" /><StatCard label="To do" value={stats.pending} note="Ready to be picked up" icon={CheckCircle2} tone="green" /><StatCard label="In progress" value={stats.inProgress} note="Moving forward" icon={Activity} tone="amber" /><StatCard label="Completed" value={stats.completed} note={stats.total ? `${Math.round((stats.completed / stats.total) * 100)}% of total tasks` : 'Ready when you are'} icon={CheckCircle2} tone="green" /><StatCard label="Overdue" value={stats.overdue} note={stats.overdue ? 'Needs attention' : 'All deadlines clear'} icon={Clock3} tone="rose" /></section>}

              {currentProject && <section className="stat-grid project-stat-grid" aria-label="Project task statistics"><StatCard label="Project tasks" value={stats.total} note={`${currentProject.members?.length || 1} project members`} icon={ClipboardList} tone="indigo" /><StatCard label="To do" value={stats.pending} note="Ready to be picked up" icon={CheckCircle2} tone="blue" /><StatCard label="In progress" value={stats.inProgress} note="Moving through the workflow" icon={Activity} tone="amber" /><StatCard label="Completed" value={stats.completed} note={stats.total ? `${Math.round((stats.completed / stats.total) * 100)}% complete` : 'Ready when you are'} icon={CheckCircle2} tone="green" /><StatCard label="Overdue" value={stats.overdue} note={stats.overdue ? 'Needs attention' : 'Deadlines on track'} icon={Clock3} tone="rose" /></section>}

              {navView === 'overview' && !currentProject && <section className="overview-row"><div className="overview-callout"><span className="callout-icon"><Sparkles size={17} /></span><div><b>Small, steady progress adds up.</b><p>Keep your team aligned and make the next step visible.</p></div><button onClick={() => setProjectDialog(null)}>Create a project <ArrowRight size={14} /></button></div><div className="deadline-mini"><div className="section-heading-compact"><div><h3>Upcoming deadlines</h3><p>Next 7 days</p></div><CalendarDays size={17} /></div>{getUpcomingTasks(tasks).map((task) => <button className="deadline-row" key={task._id} onClick={() => openTask(task)}><span className={`deadline-mark color-${projectsById[task.project]?.color || 'violet'}`} /><span><b>{task.title}</b><small>{projectsById[task.project]?.name}</small></span><time>{dateLabel(task.dueDate)}</time></button>)}{!getUpcomingTasks(tasks).length && <p className="deadline-empty">No deadlines in the next week.</p>}</div></section>}

              <section className="work-section">
                <div className="work-section-head"><div><div className="section-title-line"><h2>{currentProject ? 'Project work' : navView === 'focus' ? 'Today’s focus' : navView === 'my-tasks' ? 'Assigned tasks' : 'Recently updated'}</h2><span className="count-pill">{loading ? '…' : overviewTasks.length}</span></div><p>{currentProject ? 'Plan, assign, and move work through your workflow.' : 'A live view of work across your accessible projects.'}</p></div>
                  <div className="view-actions">{currentProject && <><button className={`view-switch ${view === 'board' ? 'view-active' : ''}`} title="Board view" aria-label="Board view" onClick={() => setView('board')}><LayoutDashboard size={16} /></button><button className={`view-switch ${view === 'list' ? 'view-active' : ''}`} title="List view" aria-label="List view" onClick={() => setView('list')}><List size={16} /></button><button className={`view-switch ${view === 'calendar' ? 'view-active' : ''}`} title="Calendar view" aria-label="Calendar view" onClick={() => setView('calendar')}><CalendarDays size={16} /></button><span className="view-divider" /></>}<button className={`filter-button ${filtersOpen ? 'filter-active' : ''}`} onClick={() => setFiltersOpen((value) => !value)}><Filter size={15} />Filters{[statusFilter, priorityFilter, assigneeFilter, dueFilter].filter((value) => value !== 'All').length > 0 && <span className="filter-count">{[statusFilter, priorityFilter, assigneeFilter, dueFilter].filter((value) => value !== 'All').length}</span>}</button><label className="sort-control"><ArrowDownWideNarrow size={14} /><select aria-label="Sort tasks" value={sort} onChange={(event) => setSort(event.target.value)}><option value="updatedAt">Recently updated</option><option value="createdAt">Recently created</option><option value="dueDate">Due date</option><option value="priority">Priority</option></select><ChevronDown size={13} /></label></div>
                </div>
                {filtersOpen && <div className="filter-panel"><label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label><label>Priority<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="All">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label>{currentProject && <label>Assignee<select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="All">Everyone</option><option value="unassigned">Unassigned</option>{currentProject.members?.map((member) => <option value={member.user._id || member.user.id} key={member.user._id || member.user.id}>{member.user.name}</option>)}</select></label>}<label>Deadline<select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}><option>All</option><option>Today</option><option>Upcoming</option><option>Overdue</option></select></label><button className="text-action" onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setAssigneeFilter('All'); setDueFilter('All') }}>Clear filters</button></div>}

                {!activeProjects.length && !currentProject ? <EmptyState title="Start with a shared project" description="Create a project, invite teammates, and organize work in one place." icon={Users} action={() => setProjectDialog(null)} actionLabel="Create your first project" /> : loading ? <div className="loading-state"><span className="spinner spinner-dark" />Loading project work…</div> : !overviewTasks.length ? <EmptyState title={search || statusFilter !== 'All' || priorityFilter !== 'All' ? 'No matching tasks' : 'Nothing on the board yet'} description={search ? 'Try another search or clear your filters.' : 'Create a task to give this project its first next step.'} icon={ClipboardList} action={currentProject ? () => setTaskDialog({ task: null, projectId: currentProject._id }) : undefined} actionLabel="Create task" /> : view === 'board' && currentProject ? <div className="kanban-board">{STATUSES.map((status) => { const columnTasks = overviewTasks.filter((task) => task.status === status); return <section key={status} className="kanban-column" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropTask(event, status)}><header className="column-header"><span className={`column-indicator status-${status.toLowerCase().replace(' ', '-')}`} /><h3>{STATUS_LABELS[status]}</h3><span className="column-count">{columnTasks.length}</span><button className="icon-button" aria-label={`Create task in ${status}`} onClick={() => setTaskDialog({ task: null, projectId: currentProject._id, defaultStatus: status })}><Plus size={15} /></button></header><div className="column-cards">{columnTasks.map((task) => <TaskCard key={task._id} task={task} project={currentProject} onOpen={openTask} onStatus={changeStatus} onDragStart={dragStart} />)}</div></section> })}</div> : view === 'list' || !currentProject ? <TaskTable tasks={overviewTasks} projectsById={projectsById} onOpen={openTask} onStatus={changeStatus} /> : <CalendarView tasks={overviewTasks} onOpen={openTask} />}
              </section>

              {currentProject && <section className="project-footer"><div><Users size={15} /><span>{currentProject.members?.length || 1} project members</span><button className="text-action" onClick={() => setProjectDialog(currentProject)}>Manage members</button></div><button className="project-archive-action" onClick={() => setProjectDialog(currentProject)}><MoreHorizontal size={16} />Project settings</button></section>}
            </>
          )}
          <footer className="page-footer"><span>TaskFlow <i>·</i> Move good work forward.</span><button onClick={() => setSettingsOpen(true)}><CircleHelp size={14} />Help & preferences</button></footer>
        </div>
      </main>

      {taskDialog !== undefined && <TaskDialog task={taskDialog.task} parentTask={taskDialog.parentTask} defaultStatus={taskDialog.defaultStatus} members={currentProject?.members || projectsById[taskDialog.projectId]?.members || []} onClose={() => setTaskDialog(undefined)} onSave={saveTask} />}
      {projectDialog !== undefined && <ProjectDialogOverlay project={projectDialog} currentUserId={user.id} onClose={() => setProjectDialog(undefined)} onSave={projectDialog ? updateProject : createProject} onArchive={archiveProject} onRestore={restoreProject} onAddMember={addProjectMember} onRemoveMember={removeProjectMember} />}
      {taskDetails && <TaskDetails task={taskDetails} project={projectsById[taskDetails.project]} onClose={() => setTaskDetails(null)} onEdit={editTask} onDelete={deleteTask} onDuplicate={duplicateTask} onComment={addComment} onToggleCheck={toggleChecklist} onAddSubtask={(task) => { setTaskDetails(null); setTaskDialog({ task: null, projectId: task.project, parentTask: task }) }} onOpenTask={openTask} />}
      {settingsOpen && <SettingsDialog user={user} onClose={() => setSettingsOpen(false)} onSave={updateProfile} />}
      {toast && <div className="toast" role="status"><Check size={15} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </div>
  )
}

function StatCard({ label, value, note, icon: Icon, tone }) {
  return <article className="stat-card"><div className="stat-card-heading"><span>{label}</span><span className={`stat-icon stat-${tone}`}><Icon size={17} /></span></div><strong>{value}</strong><p>{note}</p></article>
}

function EmptyState({ title, description, icon: Icon, action, actionLabel }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={24} /></span><h3>{title}</h3><p>{description}</p>{action && <button className="button button-primary" onClick={action}><Plus size={15} />{actionLabel}</button>}</div>
}

function CalendarView({ tasks, onOpen }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const monthStart = new Date(CALENDAR_BASE.getFullYear(), CALENDAR_BASE.getMonth() + monthOffset, 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(1 - ((monthStart.getDay() + 6) % 7))
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
  const tasksByDate = new Map()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const key = String(task.dueDate).slice(0, 10)
    tasksByDate.set(key, [...(tasksByDate.get(key) || []), task])
  }
  function keyFor(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  const undated = tasks.filter((task) => !task.dueDate)
  return (
    <div className="calendar-view">
      <div className="calendar-toolbar"><div className="calendar-heading"><CalendarDays size={17} /><div><b>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(monthStart)}</b><small>Task deadlines</small></div></div><div className="calendar-nav"><button className="button button-quiet" onClick={() => setMonthOffset(0)}>Today</button><button className="icon-button" aria-label="Previous month" onClick={() => setMonthOffset((value) => value - 1)}>‹</button><button className="icon-button" aria-label="Next month" onClick={() => setMonthOffset((value) => value + 1)}>›</button></div></div>
      <div className="calendar-grid-wrap"><div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
        {calendarDays.map((day) => {
          const dayTasks = tasksByDate.get(keyFor(day)) || []
          const inMonth = day.getMonth() === monthStart.getMonth()
          const today = day.toDateString() === CALENDAR_BASE.toDateString()
          return <div className={`calendar-cell ${inMonth ? '' : 'calendar-outside'} ${today ? 'calendar-today' : ''}`} key={keyFor(day)}><span className="calendar-day-number">{day.getDate()}</span><div className="calendar-cell-tasks">{dayTasks.slice(0, 3).map((task) => <button className={`calendar-event event-${task.priority.toLowerCase()}`} key={task._id} title={task.title} onClick={() => onOpen(task)}>{task.title}</button>)}{dayTasks.length > 3 && <span className="calendar-more">+{dayTasks.length - 3} more</span>}</div></div>
        })}
      </div></div>
      {undated.length > 0 && <div className="calendar-undated"><h4>Unscheduled · {undated.length}</h4><div>{undated.slice(0, 6).map((task) => <button className="calendar-task" key={task._id} onClick={() => onOpen(task)}><span className="calendar-task-copy"><b>{task.title}</b><small>{task.assignee?.name || 'Unassigned'} · {STATUS_LABELS[task.status]}</small></span><span className={`priority-tag priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span></button>)}</div></div>}
    </div>
  )
}
