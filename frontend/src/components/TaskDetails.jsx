import { useState } from 'react'
import { Activity, CalendarDays, Check, Copy, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Trash2, X } from 'lucide-react'

function formatDate(value) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function TaskDetails({ task, project, onClose, onEdit, onDelete, onDuplicate, onComment, onToggleCheck, onAddSubtask, onOpenTask }) {
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onComment(task, comment.trim())
      setComment('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const subtaskItems = task.subtasks || []
  const checklist = task.checklist || []
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <header className="drawer-header"><span className="eyebrow eyebrow-light">{project?.name || 'TASK'} / TASK DETAILS</span><div className="drawer-actions"><button className="icon-button" title="Edit task" onClick={() => onEdit(task)}><Pencil size={16} /></button><button className="icon-button" title="Duplicate task" onClick={() => onDuplicate(task)}><Copy size={16} /></button><button className="icon-button" title="Delete task" onClick={() => onDelete(task)}><Trash2 size={16} /></button><button className="icon-button" aria-label="Close task details" onClick={onClose}><X size={18} /></button></div></header>
        <div className="drawer-body">
          <div className="detail-overline"><span className={`priority-dot priority-${task.priority.toLowerCase()}`} />{task.priority} priority <span>·</span>{task.status}</div>
          <h2 id="detail-title">{task.title}</h2>
          <p className="detail-description">{task.description || 'No description has been added yet.'}</p>
          <div className="detail-properties">
            <div><span>Assignee</span><b>{task.assignee?.name || 'Unassigned'}</b></div>
            <div><span>Due date</span><b><CalendarDays size={14} /> {formatDate(task.dueDate)}</b></div>
            <div><span>Project</span><b>{project?.name || 'Personal task'}</b></div>
          </div>
          {task.labels?.length > 0 && <div className="detail-labels">{task.labels.map((label) => <span className="task-label" key={label}>{label}</span>)}</div>}
          <section className="detail-section">
            <div className="detail-section-title"><span><Check size={16} /> Checklist</span><small>{checklist.filter((item) => item.done).length}/{checklist.length}</small></div>
            {checklist.length ? <div className="checklist-items">{checklist.map((item, index) => <label key={item._id || index} className={`checklist-item ${item.done ? 'checklist-done' : ''}`}><input type="checkbox" checked={item.done} onChange={() => onToggleCheck(task, index)} /><span>{item.text}</span></label>)}</div> : <p className="muted-copy">No checklist items. Edit the task to add some.</p>}
          </section>
          <section className="detail-section">
            <div className="detail-section-title"><span><Activity size={16} /> Subtasks</span><button className="text-action" onClick={() => onAddSubtask(task)}><Plus size={14} /> Add subtask</button></div>
            {subtaskItems.length ? <div className="subtask-list">{subtaskItems.map((item) => <button key={item._id} className="subtask-link" onClick={() => onOpenTask(item)}><span className={`subtask-status status-${item.status.toLowerCase().replace(' ', '-')}`} />{item.title}<small>{item.status}</small></button>)}</div> : <p className="muted-copy">Break this work into smaller steps when helpful.</p>}
          </section>
          <section className="detail-section">
            <div className="detail-section-title"><span><MessageCircle size={16} /> Discussion</span><small>{task.comments?.length || 0}</small></div>
            <div className="comments-list">{task.comments?.map((item) => <article className="comment-item" key={item._id}><span className="avatar avatar-small">{item.authorName?.charAt(0).toUpperCase()}</span><div><div className="comment-meta"><b>{item.authorName}</b><time>{formatDate(item.createdAt)}</time></div><p>{item.body}</p></div></article>)}</div>
            {error && <div className="form-error" role="alert">{error}</div>}<form className="comment-form" onSubmit={submitComment}><textarea aria-label="Write a comment" rows="2" maxLength="2000" placeholder="Write a comment…" value={comment} onChange={(event) => setComment(event.target.value)} /><button className="button button-primary" type="submit" disabled={!comment.trim() || submitting} aria-label="Send comment"><Send size={15} /></button></form>
          </section>
          <section className="detail-section activity-section">
            <div className="detail-section-title"><span><MoreHorizontal size={16} /> Activity</span></div>
            <div className="activity-list">{[...(task.activity || [])].reverse().map((event) => <div className="activity-item" key={event._id}><span className="activity-mark" /><p><b>{event.actorName}</b> {event.action}{event.detail ? ` · ${event.detail}` : ''}<small>{formatDate(event.createdAt)}</small></p></div>)}</div>
          </section>
        </div>
      </aside>
    </div>
  )
}
