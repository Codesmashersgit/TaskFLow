import { useState } from 'react'
import { Bell, Check, LockKeyhole, X } from 'lucide-react'

export default function SettingsDialog({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name || '')
  const [emailNotifications, setEmailNotifications] = useState(user.preferences?.emailNotifications ?? true)
  const [inAppNotifications, setInAppNotifications] = useState(user.preferences?.inAppNotifications ?? true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({ name, preferences: { emailNotifications, inAppNotifications } })
    } catch (requestError) {
      setError(requestError.message)
      setSaving(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="dialog-heading"><div><span className="dialog-icon"><Bell size={17} /></span><span className="eyebrow eyebrow-light">YOUR ACCOUNT</span></div><button className="icon-button" aria-label="Close settings" onClick={onClose}><X size={18} /></button></header>
        <h2 id="settings-title">Profile & preferences</h2><p className="dialog-lead">Manage your account details and notification preferences.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="task-form" onSubmit={submit}>
          <label className="form-field"><span>Your name</span><input required maxLength="80" value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="form-field"><span>Email address</span><input disabled value={user.email} /><small className="field-hint">Email address changes are not available in this version.</small></label>
          <div className="settings-divider" />
          <p className="settings-label"><Bell size={15} /> Notifications</p>
          <label className="preference-row"><span><b>In-app notifications</b><small>Assignment and project activity updates</small></span><input type="checkbox" checked={inAppNotifications} onChange={(event) => setInAppNotifications(event.target.checked)} /></label>
          <label className="preference-row"><span><b>Email notifications</b><small>Stored preference; delivery requires an email provider.</small></span><input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} /></label>
          <p className="settings-security"><LockKeyhole size={14} /> Passwords are securely hashed and never shown.</p>
          <footer className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={saving || !name.trim()}>{saving ? <span className="spinner" /> : <Check size={15} />}Save preferences</button></footer>
        </form>
      </section>
    </div>
  )
}
