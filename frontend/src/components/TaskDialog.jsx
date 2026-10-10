import { useEffect, useState } from 'react'
import { CalendarDays, Check, Circle, Flag, Tag, X } from 'lucide-react'

const TASK_STATUSES = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done']
const PRIORITIES = ['Low', 'Medium', 'High']

function toDateInput(date) {
  return date ? String(date).slice(0, 10) : ''
}

export default function TaskDialog({ task, members, parentTask, defaultStatus, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState(task?.status || defaultStatus || 'Todo')
  const [priority, setPriority] = useState(task?.priority || 'Medium')
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate))
  const [assignee, setAssignee] = useState(task?.assignee?._id || task?.assignee || '')
  const [labels, setLabels] = useState((task?.labels || []).join(', '))
  const [checklist, setChecklist] = useState((task?.checklist || []).map((item) => item.text).join('\n'))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(event) { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate || null,
        assignee: assignee || null,
        parentTask: parentTask?._id || task?.parentTask || null,
        labels: [...new Set(labels.split(',').map((value) => value.trim()).filter(Boolean))].slice(0, 10),
        checklist: checklist.split('\n').map((text) => text.trim()).filter(Boolean).slice(0, 30)
          .map((text, index) => ({ text, done: task?.checklist?.[index]?.done || false })),
      })
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
        <header className="dialog-heading"><div><span className="dialog-icon"><Circle size={17} /></span><span className="eyebrow eyebrow-light">{task ? 'TASK DETAILS' : parentTask ? 'SUBTASK' : 'NEW TASK'}</span></div><button className="icon-button" type="button" aria-label="Close task dialog" disabled={saving} onClick={onClose}><X size={18} /></button></header>
        <h2 id="task-dialog-title">{task ? 'Edit task' : parentTask ? 'Add a subtask' : 'Create a task'}</h2>
        <p className="dialog-lead">Give the next step enough context to move forward.</p>
        <form onSubmit={submit} className="task-form">
          {error && <div className="form-error" role="alert">{error}</div>}
          <label className="form-field"><span>Task title</span><input required maxLength="120" autoFocus placeholder="What needs to get done?" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="form-field"><span>Description <small>Optional</small></span><textarea maxLength="2000" rows="3" placeholder="Add context, links, or acceptance criteria…" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <div className="form-row">
            <label className="form-field"><span><Flag size={14} /> Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)}>{PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="form-field"><span><CalendarDays size={14} /> Due date</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
          </div>
          <div className="form-row">
            <label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{TASK_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="form-field"><span>Assignee</span><select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">Unassigned</option>{members.map((member) => <option key={member.user._id || member.user.id} value={member.user._id || member.user.id}>{member.user.name}</option>)}</select></label>
          </div>
          <label className="form-field"><span><Tag size={14} /> Labels <small>Separate with commas</small></span><input placeholder="Design, Q3 launch" value={labels} onChange={(event) => setLabels(event.target.value)} /></label>
          <label className="form-field"><span>Checklist <small>One item per line</small></span><textarea rows="3" placeholder={'Draft outline\nReview with team'} value={checklist} onChange={(event) => setChecklist(event.target.value)} /></label>
          <footer className="dialog-actions"><button type="button" className="button button-quiet" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || !title.trim()}>{saving ? <span className="spinner" /> : <Check size={15} />}{task ? 'Save changes' : 'Create task'}</button></footer>
        </form>
      </section>
    </div>
  )
}
