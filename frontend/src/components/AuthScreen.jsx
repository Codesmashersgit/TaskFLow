import { useState } from 'react'
import { ArrowRight, Check, CircleCheck, Layers3, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { api, jsonBody } from '../lib/api'

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const registering = mode === 'register'

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api(`/auth/${registering ? 'register' : 'login'}`, {
        method: 'POST',
        body: jsonBody(form),
      })
      onAuthenticated(result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-story">
        <a className="brand brand-on-dark" href="/" aria-label="TaskFlow home">
          <span className="brand-mark"><Layers3 size={19} /></span><span>taskflow<span className="brand-period">.</span></span>
        </a>
        <div className="story-content">
          <span className="eyebrow"><Sparkles size={14} /> CLARITY FOR EVERY TEAM</span>
          <h1>Make space for the work that matters.</h1>
          <p>Bring projects, people, and priorities into one calm, focused workspace.</p>
          <div className="story-checklist">
            <span><CircleCheck size={17} /> Shared projects with clear ownership</span>
            <span><CircleCheck size={17} /> Flexible boards, lists, and deadlines</span>
            <span><CircleCheck size={17} /> Progress your whole team can trust</span>
          </div>
          <div className="story-note"><span className="story-note-icon"><Check size={15} /></span><span><b>Thoughtful work, together.</b><small>From first idea to done.</small></span><span className="story-note-bars"><i /><i /><i /><i /><i /></span></div>
        </div>
        <p className="story-footer">A clearer way to move work forward.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-topline"><span>{registering ? 'Already have an account?' : 'New to TaskFlow?'}</span><button type="button" onClick={() => { setMode(registering ? 'login' : 'register'); setError('') }}>{registering ? 'Sign in' : 'Create an account'} <ArrowRight size={14} /></button></div>
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-mobile-brand"><span className="brand-mark"><Layers3 size={18} /></span> taskflow<span className="brand-period">.</span></div>
          <span className="eyebrow eyebrow-light">{registering ? 'GET STARTED' : 'WELCOME BACK'}</span>
          <h2>{registering ? 'Create your workspace.' : 'Pick up where you left off.'}</h2>
          <p>{registering ? 'Start organizing your team’s best work.' : 'Sign in to see what your team is moving forward.'}</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          {registering && (
            <label className="form-field"><span>Your name</span><span className="input-wrap"><input required maxLength="80" autoComplete="name" placeholder="Jamie Parker" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></span></label>
          )}
          <label className="form-field"><span>Email address</span><span className="input-wrap"><Mail size={16} /><input required type="email" autoComplete="email" placeholder="you@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></span></label>
          <label className="form-field"><span>Password{registering && <small>At least 8 characters</small>}</span><span className="input-wrap"><LockKeyhole size={16} /><input required minLength="8" type="password" autoComplete={registering ? 'new-password' : 'current-password'} placeholder={registering ? 'Create a password' : 'Enter your password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></span></label>
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : null}{registering ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
          <p className="auth-privacy"><LockKeyhole size={14} /> Your account and projects are private by default.</p>
        </form>
        <div className="auth-bottom"><span>TaskFlow <i>·</i> Make room for what matters.</span><span>Built for teams that care about the work.</span></div>
      </section>
    </main>
  )
}
