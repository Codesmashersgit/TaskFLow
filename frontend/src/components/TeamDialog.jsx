import { useState } from 'react'
import { ShieldCheck, UserPlus, Users, X } from 'lucide-react'

export default function TeamDialog({ team, onClose, onCreateEmployee, onUpdateMember }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onCreateEmployee({ name, email, password })
      setName('')
      setEmail('')
      setPassword('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="team-dialog" role="dialog" aria-modal="true" aria-labelledby="team-dialog-title">
        <header className="dialog-heading">
          <div><span className="dialog-icon"><ShieldCheck size={17} /></span><span className="eyebrow eyebrow-light">ADMIN WORKSPACE</span></div>
          <button className="icon-button" aria-label="Close team management" onClick={onClose}><X size={18} /></button>
        </header>
        <h2 id="team-dialog-title">Team management</h2>
        <p className="dialog-lead">Create employees and control workspace access.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="team-create-form" onSubmit={submit}>
          <label className="form-field"><span>Employee name</span><input required maxLength="80" placeholder="Aarav Sharma" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="form-field"><span>Work email</span><input required type="email" placeholder="employee@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="form-field"><span>Temporary password</span><input required minLength="8" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="button button-primary" type="submit" disabled={saving || !name.trim() || !email.trim() || password.length < 8}>
            {saving ? <span className="spinner" /> : <UserPlus size={15} />}Create employee
          </button>
        </form>
        <div className="team-list-heading"><span><Users size={15} /> Team members</span><small>{team.length} people</small></div>
        <div className="team-list">
          {team.map((member) => (
            <article className="team-member" key={member.id}>
              <span className="avatar">{member.name.charAt(0).toUpperCase()}</span>
              <span className="team-member-info"><b>{member.name}</b><small>{member.email}</small></span>
              <span className="team-member-stats"><b>{member.stats.open}</b><small>Open</small></span>
              <select aria-label={`Role for ${member.name}`} value={member.role} onChange={(event) => onUpdateMember(member.id, { role: event.target.value })}>
                <option value="employee">Employee</option><option value="admin">Admin</option>
              </select>
              <select aria-label={`Status for ${member.name}`} value={member.status} onChange={(event) => onUpdateMember(member.id, { status: event.target.value })}>
                <option value="active">Active</option><option value="disabled">Disabled</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
