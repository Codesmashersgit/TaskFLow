import { useState } from 'react'
import { Archive, CalendarDays, Check, Settings2, Trash2, UserPlus, X } from 'lucide-react'

const COLORS = ['violet', 'blue', 'green', 'orange']

export default function ProjectDialog({ project, currentUserId, onClose, onSave, onArchive, onRestore, onAddMember, onRemoveMember }) {
  const isOwner = !project || String(project.owner?._id || project.owner) === String(currentUserId)
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [priority, setPriority] = useState(project?.priority || 'Medium')
  const [dueDate, setDueDate] = useState(project?.dueDate ? String(project.dueDate).slice(0, 10) : '')
  const [color, setColor] = useState(project?.color || 'violet')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onSave({ name, description, priority, dueDate: dueDate || null, color })
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  async function addMember(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onAddMember(email)
      setEmail('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title">
        <header className="dialog-heading"><div><span className="dialog-icon"><Settings2 size={17} /></span><span className="eyebrow eyebrow-light">{project ? 'PROJECT SETTINGS' : 'NEW PROJECT'}</span></div><button className="icon-button" aria-label="Close project dialog" onClick={onClose}><X size={18} /></button></header>
        <h2 id="project-dialog-title">{project ? 'Project settings' : 'Create a project'}</h2>
        <p className="dialog-lead">Give your team a shared space to move the work forward.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={save} className="task-form">
          <label className="form-field"><span>Project name</span><input required autoFocus maxLength="80" placeholder="Website refresh" value={name} disabled={!isOwner} onChange={(event) => setName(event.target.value)} /></label>
          <label className="form-field"><span>Description <small>Optional</small></span><textarea rows="3" maxLength="1000" placeholder="What is this team working toward?" value={description} disabled={!isOwner} onChange={(event) => setDescription(event.target.value)} /></label>
          <div className="form-row"><label className="form-field"><span>Priority</span><select value={priority} disabled={!isOwner} onChange={(event) => setPriority(event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="form-field"><span><CalendarDays size={14} /> Target date</span><input type="date" value={dueDate} disabled={!isOwner} onChange={(event) => setDueDate(event.target.value)} /></label></div>
          <fieldset className="color-field"><legend>Project color</legend><div>{COLORS.map((value) => <button key={value} type="button" disabled={!isOwner} aria-label={`${value} project color`} aria-pressed={color === value} className={`color-choice color-${value} ${color === value ? 'color-selected' : ''}`} onClick={() => setColor(value)} />)}</div></fieldset>
          {project && <section className="project-members"><div className="member-section-title"><b>Project members</b><span>{project.members?.length || 0} people</span></div><div className="member-list">{project.members?.map((entry) => <div className="member-row" key={entry.user._id || entry.user.id}><span className="avatar avatar-small">{entry.user.name.charAt(0).toUpperCase()}</span><span><b>{entry.user.name}</b><small>{entry.user.email}</small></span><span className="member-role">{entry.role}</span>{isOwner && entry.role !== 'owner' && <button className="icon-button danger-icon" title={`Remove ${entry.user.name}`} onClick={() => onRemoveMember(entry.user._id || entry.user.id)}><Trash2 size={14} /></button>}</div>)}</div>{isOwner && <form className="invite-row" onSubmit={addMember}><input type="email" required placeholder="Add existing member by email" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" className="button button-outline" disabled={busy}><UserPlus size={14} /> Invite</button><small>They need a TaskFlow account to join.</small></form>}</section>}
          <footer className="dialog-actions project-dialog-actions">{project?.status === 'active' && isOwner && <button type="button" className="button button-quiet archive-button" disabled={busy} onClick={onArchive}><Archive size={15} /> Archive project</button>}{project?.status === 'archived' && isOwner && <button type="button" className="button button-outline" disabled={busy} onClick={onRestore}>Restore project</button>}<span className="actions-spacer" /><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>{isOwner && project?.status !== 'archived' && <button type="submit" className="button button-primary" disabled={busy || !name.trim()}>{busy ? <span className="spinner" /> : <Check size={15} />}{project ? 'Save changes' : 'Create project'}</button>}</footer>
        </form>
      </section>
    </div>
  )
}
